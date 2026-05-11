/**
 * Crypto module — Zero-knowledge encryption for the password vault.
 *
 * Uses Web Crypto API:
 *  - PBKDF2 (600 000 iterations, SHA-256) for key derivation
 *  - AES-256-GCM for authenticated encryption
 *  - Random 12-byte IV per encryption operation
 *
 * The master password NEVER leaves the browser.
 * Only ciphertext is stored in Firestore.
 */

import type { VaultItem, EncryptedVaultItem } from '@/types/vault'

const PBKDF2_ITERATIONS = 600_000
const KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 16
const VERIFIER_PLAINTEXT = 'vault-key-verification-string-v1'

/** Convert ArrayBuffer to base64 string */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/** Convert base64 string to ArrayBuffer */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/** Generate a cryptographically random salt */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  return bufferToBase64(salt.buffer)
}

/** Derive a vault encryption key from the master password and salt */
export async function deriveVaultKey(
  masterPassword: string,
  salt: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(base64ToBuffer(salt)),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false, // non-extractable for security
    ['encrypt', 'decrypt'],
  )
}

/** Encrypt a plaintext string. Returns "iv:ciphertext" both base64-encoded. */
export async function encryptString(
  plaintext: string,
  key: CryptoKey,
): Promise<string> {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )

  return `${bufferToBase64(iv.buffer)}:${bufferToBase64(ciphertext)}`
}

/** Decrypt a "iv:ciphertext" string back to plaintext */
export async function decryptString(
  encrypted: string,
  key: CryptoKey,
): Promise<string> {
  const [ivB64, ciphertextB64] = encrypted.split(':')
  const iv = new Uint8Array(base64ToBuffer(ivB64))
  const ciphertext = base64ToBuffer(ciphertextB64)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  )

  return new TextDecoder().decode(plaintext)
}

/** Encrypt all sensitive fields of a vault item */
export async function encryptVaultItem(
  item: VaultItem,
  key: CryptoKey,
): Promise<EncryptedVaultItem> {
  const [encryptedTitle, encryptedUrl, encryptedUsername, encryptedPassword, encryptedNotes] =
    await Promise.all([
      encryptString(item.title, key),
      encryptString(item.url || '', key),
      encryptString(item.username, key),
      encryptString(item.password, key),
      encryptString(item.notes || '', key),
    ])

  return {
    categoryId: item.categoryId,
    encryptedTitle,
    encryptedUrl,
    encryptedUsername,
    encryptedPassword,
    encryptedNotes,
    favorite: item.favorite ?? false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

/** Decrypt all sensitive fields of an encrypted vault item */
export async function decryptVaultItem(
  encrypted: EncryptedVaultItem,
  key: CryptoKey,
): Promise<VaultItem> {
  const [title, url, username, password, notes] = await Promise.all([
    decryptString(encrypted.encryptedTitle, key),
    decryptString(encrypted.encryptedUrl, key),
    decryptString(encrypted.encryptedUsername, key),
    decryptString(encrypted.encryptedPassword, key),
    decryptString(encrypted.encryptedNotes, key),
  ])

  return {
    categoryId: encrypted.categoryId,
    title,
    url: url || undefined,
    username,
    password,
    notes: notes || undefined,
    favorite: encrypted.favorite,
    createdAt: encrypted.createdAt,
    updatedAt: encrypted.updatedAt,
  }
}

/** Create a verifier ciphertext to later confirm the master password is correct */
export async function createVerifier(key: CryptoKey): Promise<string> {
  return encryptString(VERIFIER_PLAINTEXT, key)
}

/** Verify a vault key by decrypting the stored verifier */
export async function verifyKey(
  key: CryptoKey,
  encryptedVerifier: string,
): Promise<boolean> {
  try {
    const decrypted = await decryptString(encryptedVerifier, key)
    return decrypted === VERIFIER_PLAINTEXT
  } catch {
    return false
  }
}
