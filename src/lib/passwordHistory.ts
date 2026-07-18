/**
 * Password history — stores previous passwords for vault items.
 * Entries are encrypted with the vault key before ever touching localStorage,
 * so a plaintext password never sits on disk even for a superseded value.
 */

import { encryptString, decryptString } from './crypto'

const STORAGE_KEY = 'sable-pw-history'
const MAX_HISTORY_PER_ITEM = 10

export interface PasswordHistoryEntry {
  password: string
  changedAt: number // timestamp
}

interface StoredHistoryEntry {
  encryptedPassword: string
  changedAt: number
}

type StoredHistoryMap = Record<string, StoredHistoryEntry[]>

function getHistoryMap(): StoredHistoryMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveHistoryMap(map: StoredHistoryMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Record a password change for an item.
 * Call this BEFORE updating the item with the new password.
 */
export async function recordPasswordChange(itemId: string, oldPassword: string, key: CryptoKey): Promise<void> {
  const map = getHistoryMap()
  const history = map[itemId] || []

  const encryptedPassword = await encryptString(oldPassword, key)

  // Don't record duplicates (compare decrypted, since ciphertext differs per encryption)
  if (history.length > 0) {
    const mostRecent = await decryptString(history[0].encryptedPassword, key).catch(() => null)
    if (mostRecent === oldPassword) return
  }

  history.unshift({ encryptedPassword, changedAt: Date.now() })

  map[itemId] = history.slice(0, MAX_HISTORY_PER_ITEM)
  saveHistoryMap(map)
}

/**
 * Get password history for an item, decrypted. Entries that fail to decrypt
 * (e.g. from a previous vault key) are skipped rather than thrown.
 */
export async function getPasswordHistory(itemId: string, key: CryptoKey): Promise<PasswordHistoryEntry[]> {
  const map = getHistoryMap()
  const entries = map[itemId] || []

  const decrypted = await Promise.all(
    entries.map(async (entry) => {
      try {
        const password = await decryptString(entry.encryptedPassword, key)
        return { password, changedAt: entry.changedAt }
      } catch {
        return null
      }
    }),
  )

  return decrypted.filter((e): e is PasswordHistoryEntry => e !== null)
}

/**
 * Clear history for a deleted item.
 */
export function clearPasswordHistory(itemId: string): void {
  const map = getHistoryMap()
  delete map[itemId]
  saveHistoryMap(map)
}

/**
 * Clear all password history (on vault wipe).
 */
export function clearAllPasswordHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Format a timestamp as a relative date string.
 */
export function formatHistoryDate(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}
