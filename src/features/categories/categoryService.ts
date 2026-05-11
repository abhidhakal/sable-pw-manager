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
import type { Category } from '@/types/vault'
import { DEFAULT_CATEGORIES } from '@/types/category'

function categoriesCollection(uid: string) {
  return collection(db, 'users', uid, 'categories')
}

function categoryDoc(uid: string, categoryId: string) {
  return doc(db, 'users', uid, 'categories', categoryId)
}

export async function seedDefaultCategories(uid: string): Promise<void> {
  const batch = writeBatch(db)

  for (const cat of DEFAULT_CATEGORIES) {
    const ref = doc(categoriesCollection(uid))
    batch.set(ref, {
      ...cat,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  await batch.commit()
}

export async function getAllCategories(uid: string): Promise<(Category & { id: string })[]> {
  const snap = await getDocs(categoriesCollection(uid))
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Category),
  }))
}

export async function createCategory(
  uid: string,
  data: { name: string; icon: string; color: string },
): Promise<string> {
  const docRef = await addDoc(categoriesCollection(uid), {
    ...data,
    isDefault: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateCategory(
  uid: string,
  categoryId: string,
  data: Partial<{ name: string; icon: string; color: string }>,
): Promise<void> {
  await updateDoc(categoryDoc(uid, categoryId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCategory(uid: string, categoryId: string): Promise<void> {
  await deleteDoc(categoryDoc(uid, categoryId))
}
