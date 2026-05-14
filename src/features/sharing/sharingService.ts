import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
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

/** Calculate expiration timestamp from a duration option */
function getExpirationTimestamp(expiration: ShareExpiration): Timestamp {
  const now = Date.now()
  const ms: Record<ShareExpiration, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  }
  return Timestamp.fromMillis(now + ms[expiration])
}

/** Create a new shared link document */
export async function createSharedLink(params: {
  creatorUid: string
  encryptedPayload: string
  salt: string
  iv: string
  itemCount: number
  itemTitles: string[]
  expiration: ShareExpiration
  maxViews: number | null
}): Promise<string> {
  const docRef = await addDoc(sharedLinksCollection(), {
    creatorUid: params.creatorUid,
    encryptedPayload: params.encryptedPayload,
    salt: params.salt,
    iv: params.iv,
    itemCount: params.itemCount,
    itemTitles: params.itemTitles,
    createdAt: serverTimestamp(),
    expiresAt: getExpirationTimestamp(params.expiration),
    maxViews: params.maxViews,
    viewCount: 0,
    burned: false,
  })
  return docRef.id
}

/** Fetch a shared link by ID (for the viewer page) */
export async function getSharedLink(linkId: string): Promise<SharedLink | null> {
  const snap = await getDoc(sharedLinkDoc(linkId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as SharedLink
}

/** Increment view count and optionally burn the link */
export async function recordView(linkId: string, maxViews: number | null, currentViewCount: number): Promise<void> {
  const newCount = currentViewCount + 1
  const shouldBurn = maxViews !== null && newCount >= maxViews

  await updateDoc(sharedLinkDoc(linkId), {
    viewCount: newCount,
    ...(shouldBurn ? { burned: true } : {}),
  })
}

/** Get all shared links created by a user */
export async function getUserSharedLinks(uid: string): Promise<SharedLink[]> {
  const q = query(
    sharedLinksCollection(),
    where('creatorUid', '==', uid),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SharedLink))
}

/** Revoke (delete) a shared link */
export async function revokeSharedLink(linkId: string): Promise<void> {
  await deleteDoc(sharedLinkDoc(linkId))
}
