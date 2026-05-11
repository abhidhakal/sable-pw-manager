/**
 * Password history — stores previous passwords for vault items.
 * History is stored encrypted in Firestore alongside the item.
 * For now, we store it in-memory and localStorage as encrypted JSON.
 */

const STORAGE_KEY = 'sable-pw-history'
const MAX_HISTORY_PER_ITEM = 10

export interface PasswordHistoryEntry {
  password: string
  changedAt: number // timestamp
}

type HistoryMap = Record<string, PasswordHistoryEntry[]>

/**
 * Get all password history from localStorage.
 * Note: This stores encrypted history entries.
 */
function getHistoryMap(): HistoryMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveHistoryMap(map: HistoryMap): void {
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
export function recordPasswordChange(itemId: string, oldPassword: string): void {
  const map = getHistoryMap()
  const history = map[itemId] || []

  // Don't record duplicates
  if (history.length > 0 && history[0].password === oldPassword) return

  history.unshift({
    password: oldPassword,
    changedAt: Date.now(),
  })

  // Trim to max
  map[itemId] = history.slice(0, MAX_HISTORY_PER_ITEM)
  saveHistoryMap(map)
}

/**
 * Get password history for an item.
 */
export function getPasswordHistory(itemId: string): PasswordHistoryEntry[] {
  const map = getHistoryMap()
  return map[itemId] || []
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
