/**
 * Password history — React Native version using AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'sable-pw-history'
const MAX_HISTORY_PER_ITEM = 10

export interface PasswordHistoryEntry {
  password: string
  changedAt: number
}

type HistoryMap = Record<string, PasswordHistoryEntry[]>

async function getHistoryMap(): Promise<HistoryMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function saveHistoryMap(map: HistoryMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Record a password change for an item.
 */
export function recordPasswordChange(itemId: string, oldPassword: string): void {
  // Fire and forget — async but we don't await in the store
  getHistoryMap().then((map) => {
    const history = map[itemId] || []
    if (history.length > 0 && history[0].password === oldPassword) return
    history.unshift({ password: oldPassword, changedAt: Date.now() })
    map[itemId] = history.slice(0, MAX_HISTORY_PER_ITEM)
    saveHistoryMap(map)
  })
}

/**
 * Get password history for an item.
 */
export function getPasswordHistory(itemId: string): PasswordHistoryEntry[] {
  // Synchronous fallback — return empty, caller should use async version
  return []
}

/**
 * Get password history async (for React Native).
 */
export async function getPasswordHistoryAsync(itemId: string): Promise<PasswordHistoryEntry[]> {
  const map = await getHistoryMap()
  return map[itemId] || []
}

/**
 * Clear history for a deleted item.
 */
export function clearPasswordHistory(itemId: string): void {
  getHistoryMap().then((map) => {
    delete map[itemId]
    saveHistoryMap(map)
  })
}

/**
 * Clear all password history.
 */
export function clearAllPasswordHistory(): void {
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {})
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
