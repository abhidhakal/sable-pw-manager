import type { Timestamp } from 'firebase/firestore'

export interface VaultItem {
  id?: string
  categoryId: string
  title: string
  url?: string
  username: string
  password: string
  notes?: string
  favorite?: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface EncryptedVaultItem {
  id?: string
  categoryId: string
  encryptedTitle: string
  encryptedUrl: string
  encryptedUsername: string
  encryptedPassword: string
  encryptedNotes: string
  favorite: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface VaultMeta {
  salt: string
  encryptedVerifier: string
  version: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface DecryptedVaultState {
  items: (VaultItem & { id: string })[]
  categories: (Category & { id: string })[]
}

export interface Category {
  id?: string
  name: string
  icon: string
  color: string
  isDefault: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type ImportableField = 'username' | 'password' | 'title' | 'url' | 'notes' | 'categoryId'

export interface ImportMapping {
  [csvHeader: string]: ImportableField | null
}

export interface ImportPreview {
  headers: string[]
  rows: string[][]
  mapping: ImportMapping
  totalRows: number
  validRows: number
  skippedRows: number
}
