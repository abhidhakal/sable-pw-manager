import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { EncryptedVaultItem } from '@/types/vault'

function itemsCollection(uid: string) {
  return collection(db, 'users', uid, 'vaultItems')
}

function itemDoc(uid: string, itemId: string) {
  return doc(db, 'users', uid, 'vaultItems', itemId)
}

export async function createVaultItem(
  uid: string,
  encrypted: EncryptedVaultItem,
): Promise<string> {
  const docRef = await addDoc(itemsCollection(uid), {
    ...encrypted,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateVaultItem(
  uid: string,
  itemId: string,
  encrypted: Partial<EncryptedVaultItem>,
): Promise<void> {
  // Exclude id/createdAt/updatedAt — createdAt must never change, updatedAt is set below,
  // and id is a document path not a field.
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...fields } = encrypted
  await updateDoc(itemDoc(uid, itemId), {
    ...fields,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteVaultItem(uid: string, itemId: string): Promise<void> {
  await deleteDoc(itemDoc(uid, itemId))
}

export async function getAllVaultItems(uid: string): Promise<(EncryptedVaultItem & { id: string })[]> {
  const snap = await getDocs(itemsCollection(uid))
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as EncryptedVaultItem),
  }))
}

const BATCH_SIZE = 500

export async function updateVaultItemsBatch(
  uid: string,
  updates: { itemId: string; encrypted: Partial<EncryptedVaultItem> }[],
): Promise<void> {
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const chunk = updates.slice(i, i + BATCH_SIZE)
    const batch = writeBatch(db)
    for (const { itemId, encrypted } of chunk) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...fields } = encrypted
      batch.update(itemDoc(uid, itemId), { ...fields, updatedAt: serverTimestamp() })
    }
    await batch.commit()
  }
}

export async function deleteVaultItemsBatch(
  uid: string,
  itemIds: string[],
): Promise<void> {
  for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
    const chunk = itemIds.slice(i, i + BATCH_SIZE)
    const batch = writeBatch(db)

    for (const id of chunk) {
      batch.delete(itemDoc(uid, id))
    }

    await batch.commit()
  }
}

export async function createVaultItemsBatch(
  uid: string,
  items: EncryptedVaultItem[],
): Promise<string[]> {
  const allIds: string[] = []

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE)
    const batch = writeBatch(db)

    for (const item of chunk) {
      const ref = doc(itemsCollection(uid))
      batch.set(ref, {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      allIds.push(ref.id)
    }

    await batch.commit()
  }

  return allIds
}
