import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { SharedLink, ShareExpiration } from '@/types/sharing'

const SHARED_LINKS_COLLECTION = 'sharedLinks'

function sharedLinksCollection() {
  return collection(db, SHARED_LINKS_COLLECTION)
}

function sharedLinkDoc(linkId: string) {
  return doc(db, SHARED_LINKS_COLLECTION, linkId)
}

function getExpirationTimestamp(expiration: ShareExpiration): Timestamp {
  const now = Date.now()
  const ms: Record<ShareExpiration, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  }
  return Timestamp.fromMillis(now + ms[expiration])
}

export async function createSharedLink(params: {
  creatorUid: string
  encryptedPayload: string
  salt: string
  iv: string
  encryptedSecret: string
  itemCount: number
  expiration: ShareExpiration
  maxViews: number | null
}): Promise<string> {
  const docRef = await addDoc(sharedLinksCollection(), {
    creatorUid: params.creatorUid,
    encryptedPayload: params.encryptedPayload,
    salt: params.salt,
    iv: params.iv,
    encryptedSecret: params.encryptedSecret,
    itemCount: params.itemCount,
    createdAt: serverTimestamp(),
    expiresAt: getExpirationTimestamp(params.expiration),
    maxViews: params.maxViews,
    viewCount: 0,
    burned: false,
  })
  return docRef.id
}

/**
 * Atomically claim a view slot and return the link data.
 * Increments viewCount inside a transaction so concurrent viewers
 * can't both claim the last slot on a one-time link.
 * Returns null if the link doesn't exist, is burned, or has expired.
 */
export async function claimAndGetSharedLink(linkId: string): Promise<SharedLink | null> {
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(sharedLinkDoc(linkId))
    if (!snap.exists()) return null

    const data = snap.data() as Omit<SharedLink, 'id'>

    if (data.burned) return null

    const expiresAtMs = data.expiresAt?.toMillis?.()
    if (expiresAtMs && Date.now() > expiresAtMs) return null

    const newCount = (data.viewCount || 0) + 1
    const shouldBurn = data.maxViews !== null && newCount >= data.maxViews

    transaction.update(sharedLinkDoc(linkId), {
      viewCount: newCount,
      ...(shouldBurn ? { burned: true } : {}),
    })

    return { id: snap.id, ...data }
  })
}

export async function getUserSharedLinks(uid: string): Promise<SharedLink[]> {
  const q = query(
    sharedLinksCollection(),
    where('creatorUid', '==', uid),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SharedLink))
}

export async function revokeSharedLink(linkId: string): Promise<void> {
  await deleteDoc(sharedLinkDoc(linkId))
}

export async function deleteLinks(linkIds: string[]): Promise<void> {
  const BATCH_SIZE = 500
  for (let i = 0; i < linkIds.length; i += BATCH_SIZE) {
    const chunk = linkIds.slice(i, i + BATCH_SIZE)
    const batch = writeBatch(db)
    for (const id of chunk) {
      batch.delete(sharedLinkDoc(id))
    }
    await batch.commit()
  }
}
