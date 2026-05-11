/**
 * Offline cache using IndexedDB.
 * Stores encrypted vault data locally for offline access.
 * Only ciphertext is cached — never plaintext.
 */

const DB_NAME = 'sable-offline'
const DB_VERSION = 1
const STORE_NAME = 'encrypted-vault'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Cache encrypted vault items for offline access.
 */
export async function cacheEncryptedVault(uid: string, data: {
  items: unknown[]
  meta: unknown
}): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(data, `vault-${uid}`)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Silently fail — offline cache is best-effort
  }
}

/**
 * Retrieve cached encrypted vault data.
 */
export async function getCachedVault(uid: string): Promise<{
  items: unknown[]
  meta: unknown
} | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(`vault-${uid}`)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

/**
 * Clear cached vault data (on logout).
 */
export async function clearCachedVault(uid: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(`vault-${uid}`)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Silently fail
  }
}

/**
 * Check if we're currently offline.
 */
export function isOffline(): boolean {
  return !navigator.onLine
}

/**
 * Listen for online/offline status changes.
 */
export function onConnectivityChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
