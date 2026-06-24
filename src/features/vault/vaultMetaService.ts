import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { VaultMeta } from '@/types/vault'

function metaRef(uid: string) {
  return doc(db, 'users', uid, 'vault', 'meta')
}

export async function createVaultMeta(
  uid: string,
  salt: string,
  encryptedVerifier: string,
): Promise<void> {
  await setDoc(metaRef(uid), {
    salt,
    encryptedVerifier,
    version: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getVaultMeta(uid: string): Promise<VaultMeta | null> {
  const snap = await getDoc(metaRef(uid))
  if (!snap.exists()) return null
  return snap.data() as VaultMeta
}

export async function updateVaultMeta(
  uid: string,
  salt: string,
  encryptedVerifier: string,
): Promise<void> {
  await updateDoc(metaRef(uid), {
    salt,
    encryptedVerifier,
    updatedAt: serverTimestamp(),
  })
}

export async function vaultExists(uid: string): Promise<boolean> {
  const snap = await getDoc(metaRef(uid))
  return snap.exists()
}
