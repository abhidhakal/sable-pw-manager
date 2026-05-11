import { create } from 'zustand'
import type { VaultItem, Category } from '@/types/vault'
import { encryptVaultItem, decryptVaultItem, deriveVaultKey, verifyKey, generateSalt, createVerifier } from '@/lib/crypto'
import * as vaultService from '@/features/vault/vaultService'
import * as vaultMetaService from '@/features/vault/vaultMetaService'
import * as categoryService from '@/features/categories/categoryService'
import { toast } from '@/components/ui/Toast'

const AUTO_LOCK_MS = 5 * 60 * 1000 // 5 minutes
const MAX_SESSION_MS = 4 * 60 * 60 * 1000 // 4 hours — hard limit regardless of activity
const MAX_UNLOCK_ATTEMPTS = 5
const BASE_LOCKOUT_MS = 30_000 // 30 seconds base lockout

interface VaultState {
  // Vault state — vaultKey is held in memory only, never persisted
  vaultKey: CryptoKey | null
  locked: boolean
  vaultExists: boolean | null
  loading: boolean
  error: string | null

  // Decrypted data — only exists in memory while unlocked
  items: (VaultItem & { id: string })[]
  categories: (Category & { id: string })[]

  // Filters
  searchQuery: string
  activeCategoryId: string | null

  // Auto-lock
  autoLockTimer: ReturnType<typeof setTimeout> | null
  sessionStart: number | null

  // Rate limiting
  unlockAttempts: number
  lockoutUntil: number | null

  // Actions
  setupVault: (uid: string, masterPassword: string) => Promise<void>
  unlockVault: (uid: string, masterPassword: string) => Promise<void>
  lockVault: () => void
  checkVaultExists: (uid: string) => Promise<boolean>
  getLockoutRemaining: () => number | null

  // CRUD
  addItem: (uid: string, item: VaultItem) => Promise<string>
  addItems: (uid: string, items: VaultItem[]) => Promise<string[]>
  updateItem: (uid: string, itemId: string, item: VaultItem) => Promise<void>
  deleteItem: (uid: string, itemId: string) => Promise<void>
  deleteItems: (uid: string, itemIds: string[]) => Promise<void>
  moveItemToCategory: (uid: string, itemId: string, categoryId: string) => Promise<void>

  // Categories
  loadCategories: (uid: string) => Promise<void>
  addCategory: (uid: string, data: { name: string; icon: string; color: string }) => Promise<string>
  updateCategory: (uid: string, categoryId: string, data: Partial<{ name: string; icon: string; color: string }>) => Promise<void>
  deleteCategory: (uid: string, categoryId: string) => Promise<void>

  // Filters
  setSearchQuery: (query: string) => void
  setActiveCategoryId: (id: string | null) => void

  // Auto-lock
  resetAutoLock: () => void
  clearAutoLock: () => void

  // Cleanup
  clearVault: () => void
}

export const useVaultStore = create<VaultState>((set, get) => ({
  vaultKey: null,
  locked: true,
  vaultExists: null,
  loading: false,
  error: null,
  items: [],
  categories: [],
  searchQuery: '',
  activeCategoryId: null,
  autoLockTimer: null,
  sessionStart: null,
  unlockAttempts: 0,
  lockoutUntil: null,

  getLockoutRemaining: () => {
    const { lockoutUntil } = get()
    if (!lockoutUntil) return null
    const remaining = lockoutUntil - Date.now()
    return remaining > 0 ? remaining : null
  },

  checkVaultExists: async (uid) => {
    const exists = await vaultMetaService.vaultExists(uid)
    set({ vaultExists: exists })
    return exists
  },

  setupVault: async (uid, masterPassword) => {
    set({ loading: true, error: null })
    try {
      const salt = generateSalt()
      const key = await deriveVaultKey(masterPassword, salt)
      const encryptedVerifier = await createVerifier(key)

      await vaultMetaService.createVaultMeta(uid, salt, encryptedVerifier)
      await categoryService.seedDefaultCategories(uid)

      const categories = await categoryService.getAllCategories(uid)

      set({
        vaultKey: key,
        locked: false,
        vaultExists: true,
        categories,
        items: [],
        sessionStart: Date.now(),
        unlockAttempts: 0,
        lockoutUntil: null,
      })

      get().resetAutoLock()
      toast.success('Vault created successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to setup vault'
      set({ error: message })
      toast.error(message)
      throw err
    } finally {
      set({ loading: false })
    }
  },

  unlockVault: async (uid, masterPassword) => {
    // Check lockout first
    const { lockoutUntil } = get()
    if (lockoutUntil && Date.now() < lockoutUntil) {
      throw new Error('Too many failed attempts. Please wait before trying again.')
    }

    set({ loading: true, error: null })
    try {
      const meta = await vaultMetaService.getVaultMeta(uid)
      if (!meta) throw new Error('Vault metadata not found')

      const key = await deriveVaultKey(masterPassword, meta.salt)
      const valid = await verifyKey(key, meta.encryptedVerifier)

      if (!valid) {
        // Rate limit: exponential backoff after MAX_UNLOCK_ATTEMPTS failures
        const { unlockAttempts } = get()
        const newAttempts = unlockAttempts + 1
        let newLockoutUntil: number | null = null

        if (newAttempts >= MAX_UNLOCK_ATTEMPTS) {
          const backoffCount = Math.floor((newAttempts - MAX_UNLOCK_ATTEMPTS) / MAX_UNLOCK_ATTEMPTS) + 1
          const lockoutDuration = BASE_LOCKOUT_MS * Math.pow(2, backoffCount - 1)
          newLockoutUntil = Date.now() + lockoutDuration
        }

        set({
          loading: false,
          unlockAttempts: newAttempts,
          lockoutUntil: newLockoutUntil,
        })
        throw new Error('Invalid master password')
      }

      // Load and decrypt all items
      const encryptedItems = await vaultService.getAllVaultItems(uid)
      const decryptedItems = await Promise.all(
        encryptedItems.map(async (enc) => ({
          ...(await decryptVaultItem(enc, key)),
          id: enc.id,
        })),
      )

      const categories = await categoryService.getAllCategories(uid)

      set({
        vaultKey: key,
        locked: false,
        items: decryptedItems,
        categories,
        sessionStart: Date.now(),
        unlockAttempts: 0,
        lockoutUntil: null,
      })

      get().resetAutoLock()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unlock vault'
      set({ error: message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  lockVault: () => {
    get().clearAutoLock()
    // Wipe all decrypted data from memory
    set({
      vaultKey: null,
      locked: true,
      items: [],
      searchQuery: '',
      activeCategoryId: null,
      sessionStart: null,
    })
  },

  addItem: async (uid, item) => {
    const key = get().vaultKey
    if (!key) throw new Error('Vault is locked')

    set({ loading: true })
    try {
      const encrypted = await encryptVaultItem(item, key)
      const id = await vaultService.createVaultItem(uid, encrypted)
      const newItem = { ...item, id }
      set((state) => ({ items: [...state.items, newItem] }))
      get().resetAutoLock()
      toast.success('Password saved')
      return id
    } catch (err) {
      toast.error('Failed to save password')
      throw err
    } finally {
      set({ loading: false })
    }
  },

  addItems: async (uid, items) => {
    const key = get().vaultKey
    if (!key) throw new Error('Vault is locked')

    set({ loading: true })
    try {
      const encrypted = await Promise.all(items.map((item) => encryptVaultItem(item, key)))
      const ids = await vaultService.createVaultItemsBatch(uid, encrypted)
      const newItems = items.map((item, i) => ({ ...item, id: ids[i] }))
      set((state) => ({ items: [...state.items, ...newItems] }))
      get().resetAutoLock()
      return ids
    } catch (err) {
      toast.error('Failed to import passwords')
      throw err
    } finally {
      set({ loading: false })
    }
  },

  updateItem: async (uid, itemId, item) => {
    const key = get().vaultKey
    if (!key) throw new Error('Vault is locked')

    set({ loading: true })
    try {
      const encrypted = await encryptVaultItem(item, key)
      await vaultService.updateVaultItem(uid, itemId, encrypted)
      set((state) => ({
        items: state.items.map((i) => (i.id === itemId ? { ...item, id: itemId } : i)),
      }))
      get().resetAutoLock()
      toast.success('Password updated')
    } catch (err) {
      toast.error('Failed to update password')
      throw err
    } finally {
      set({ loading: false })
    }
  },

  deleteItem: async (uid, itemId) => {
    const key = get().vaultKey
    if (!key) throw new Error('Vault is locked')

    set({ loading: true })
    try {
      await vaultService.deleteVaultItem(uid, itemId)
      set((state) => ({
        items: state.items.filter((i) => i.id !== itemId),
      }))
      get().resetAutoLock()
      toast.success('Password deleted')
    } catch (err) {
      toast.error('Failed to delete password')
      throw err
    } finally {
      set({ loading: false })
    }
  },

  deleteItems: async (uid, itemIds) => {
    const key = get().vaultKey
    if (!key) throw new Error('Vault is locked')

    set({ loading: true })
    try {
      await vaultService.deleteVaultItemsBatch(uid, itemIds)
      set((state) => ({
        items: state.items.filter((i) => !itemIds.includes(i.id)),
      }))
      get().resetAutoLock()
      toast.success(`${itemIds.length} password${itemIds.length === 1 ? '' : 's'} deleted`)
    } catch (err) {
      toast.error('Failed to delete passwords')
      throw err
    } finally {
      set({ loading: false })
    }
  },

  moveItemToCategory: async (uid, itemId, categoryId) => {
    const key = get().vaultKey
    if (!key) throw new Error('Vault is locked')

    const item = get().items.find((i) => i.id === itemId)
    if (!item) throw new Error('Password not found')

    const updatedItem = { ...item, categoryId }
    const encrypted = await encryptVaultItem(updatedItem, key)
    await vaultService.updateVaultItem(uid, itemId, encrypted)
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...updatedItem, id: itemId } : i)),
    }))
    get().resetAutoLock()
    toast.success('Password moved')
  },

  loadCategories: async (uid) => {
    const categories = await categoryService.getAllCategories(uid)
    set({ categories })
  },

  addCategory: async (uid, data) => {
    const id = await categoryService.createCategory(uid, data)
    set((state) => ({
      categories: [...state.categories, { ...data, id, isDefault: false } as Category & { id: string }],
    }))
    get().resetAutoLock()
    toast.success('Category created')
    return id
  },

  updateCategory: async (uid, categoryId, data) => {
    await categoryService.updateCategory(uid, categoryId, data)
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === categoryId ? { ...c, ...data } : c,
      ),
    }))
    get().resetAutoLock()
    toast.success('Category updated')
  },

  deleteCategory: async (uid, categoryId) => {
    await categoryService.deleteCategory(uid, categoryId)
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== categoryId),
      activeCategoryId: state.activeCategoryId === categoryId ? null : state.activeCategoryId,
    }))
    get().resetAutoLock()
    toast.success('Category deleted')
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveCategoryId: (id) => set({ activeCategoryId: id }),

  resetAutoLock: () => {
    const { autoLockTimer, sessionStart } = get()

    // Enforce max session duration — lock instead of resetting timer
    if (sessionStart && Date.now() - sessionStart > MAX_SESSION_MS) {
      get().lockVault()
      toast.warning('Vault locked — session expired')
      return
    }

    if (autoLockTimer) clearTimeout(autoLockTimer)

    const timer = setTimeout(() => {
      get().lockVault()
      toast.warning('Vault locked due to inactivity')
    }, AUTO_LOCK_MS)

    set({ autoLockTimer: timer })
  },

  clearAutoLock: () => {
    const { autoLockTimer } = get()
    if (autoLockTimer) {
      clearTimeout(autoLockTimer)
      set({ autoLockTimer: null })
    }
  },

  clearVault: () => {
    get().clearAutoLock()
    set({
      vaultKey: null,
      locked: true,
      vaultExists: null,
      items: [],
      categories: [],
      searchQuery: '',
      activeCategoryId: null,
      error: null,
      sessionStart: null,
      unlockAttempts: 0,
      lockoutUntil: null,
    })
  },
}))
