/**
 * Sharing Crypto — Client-side encryption for secure password sharing via public links.
 *
 * Flow:
 *  1. Generate a random 256-bit secret
 *  2. Derive an AES-256-GCM key from the secret using PBKDF2 + random salt
 *  3. Encrypt the payload (JSON of vault items) with the derived key
 *  4. Store ciphertext + salt + iv in Firestore
 *  5. Put the secret in the URL fragment (never sent to server)
 *  6. Viewer derives the same key from fragment secret + stored salt, decrypts client-side
 *
 * The server NEVER sees the plaintext or the decryption secret.
 */

const SHARE_PBKDF2_ITERATIONS = 600_000
const KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 16
const SECRET_LENGTH = 32 // 256 bits

/** Convert ArrayBuffer to base64url string (URL-safe, no padding) */
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Convert base64url string back to ArrayBuffer */
function base64UrlToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

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

/** Generate a cryptographically random 256-bit secret, returned as base64url */
export function generateShareSecret(): string {
  const secret = crypto.getRandomValues(new Uint8Array(SECRET_LENGTH))
  return bufferToBase64Url(secret.buffer)
}

/** Generate a random salt for PBKDF2 key derivation */
export function generateShareSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  return bufferToBase64(salt.buffer)
}

/** Derive an AES-256-GCM key from the share secret and salt */
async function deriveShareKey(secret: string, salt: string): Promise<CryptoKey> {
  const secretBuffer = new Uint8Array(base64UrlToBuffer(secret))
  const saltBuffer = new Uint8Array(base64ToBuffer(salt))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    secretBuffer,
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: SHARE_PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  )
}

export interface ShareableItem {
  title: string
  username: string
  password: string
  url?: string
  notes?: string
}

export interface EncryptedSharePayload {
  ciphertext: string // base64
  salt: string       // base64
  iv: string         // base64
}

/**
 * Encrypt an array of vault items for sharing.
 * Returns the encrypted payload and the secret (to be placed in URL fragment).
 */
export async function encryptSharePayload(
  items: ShareableItem[],
): Promise<{ encrypted: EncryptedSharePayload; secret: string }> {
  const secret = generateShareSecret()
  const salt = generateShareSalt()
  const key = await deriveShareKey(secret, salt)

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const plaintext = new TextEncoder().encode(JSON.stringify(items))

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext,
  )

  return {
    encrypted: {
      ciphertext: bufferToBase64(ciphertextBuffer),
      salt,
      iv: bufferToBase64(iv.buffer),
    },
    secret,
  }
}

/**
 * Decrypt a share payload using the secret from the URL fragment.
 * Returns the array of shared items.
 */
export async function decryptSharePayload(
  encrypted: EncryptedSharePayload,
  secret: string,
): Promise<ShareableItem[]> {
  const key = await deriveShareKey(secret, encrypted.salt)
  const iv = new Uint8Array(base64ToBuffer(encrypted.iv))
  const ciphertext = base64ToBuffer(encrypted.ciphertext)

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  )

  const json = new TextDecoder().decode(plaintextBuffer)
  try {
    return JSON.parse(json) as ShareableItem[]
  } catch {
    throw new Error('Share payload is corrupted or invalid')
  }
}
