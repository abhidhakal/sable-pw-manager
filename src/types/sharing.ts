import type { Timestamp } from 'firebase/firestore'

export interface SharedLink {
  id?: string
  creatorUid: string
  encryptedPayload: string  // base64 ciphertext
  salt: string              // base64 salt for PBKDF2
  iv: string                // base64 IV for AES-GCM
  itemCount: number
  itemTitles: string[]      // encrypted titles for sender's reference (stored encrypted)
  createdAt?: Timestamp
  expiresAt: Timestamp
  maxViews: number | null   // null = unlimited
  viewCount: number
  burned: boolean
}

export type ShareExpiration = '1h' | '24h' | '7d'
export type ShareViewLimit = 'once' | 'unlimited'
