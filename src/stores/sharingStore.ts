import { create } from 'zustand'
import type { SharedLink, ShareExpiration, ShareViewLimit } from '@/types/sharing'
import type { ShareableItem } from '@/lib/sharingCrypto'
import { encryptSharePayload } from '@/lib/sharingCrypto'
import { encryptString, decryptString } from '@/lib/crypto'
import { useVaultStore } from '@/stores/vaultStore'
import * as sharingService from '@/features/sharing/sharingService'
import { removeShareSecrets } from '@/lib/shareSecrets'
import { toast } from '@/components/ui/Toast'

interface SharingState {
  sharedLinks: SharedLink[]
  loadingLinks: boolean
  // linkId → plaintext secret (decrypted from encryptedSecret, in-memory only)
  linkSecrets: Record<string, string>

  creating: boolean
  generatedLink: string | null

  createShareLink: (params: {
    uid: string
    items: ShareableItem[]
    expiration: ShareExpiration
    viewLimit: ShareViewLimit
  }) => Promise<string | null>

  loadSharedLinks: (uid: string) => Promise<void>
  revokeLink: (linkId: string) => Promise<void>
  deleteLinks: (linkIds: string[]) => Promise<void>
  clearGeneratedLink: () => void
}

export const useSharingStore = create<SharingState>((set) => ({
  sharedLinks: [],
  loadingLinks: false,
  linkSecrets: {},
  creating: false,
  generatedLink: null,

  createShareLink: async ({ uid, items, expiration, viewLimit }) => {
    set({ creating: true, generatedLink: null })
    try {
      const vaultKey = useVaultStore.getState().vaultKey
      if (!vaultKey) throw new Error('Vault is locked')

      const { encrypted, secret } = await encryptSharePayload(items)
      const encryptedSecret = await encryptString(secret, vaultKey)

      const linkId = await sharingService.createSharedLink({
        creatorUid: uid,
        encryptedPayload: encrypted.ciphertext,
        salt: encrypted.salt,
        iv: encrypted.iv,
        encryptedSecret,
        itemCount: items.length,
        expiration,
        maxViews: viewLimit === 'once' ? 1 : null,
      })

      const shareUrl = `${window.location.origin}/share/${linkId}#${secret}`

      set((state) => ({
        generatedLink: shareUrl,
        linkSecrets: { ...state.linkSecrets, [linkId]: secret },
      }))
      toast.success('Share link created')
      return shareUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create share link'
      toast.error(message)
      return null
    } finally {
      set({ creating: false })
    }
  },

  loadSharedLinks: async (uid) => {
    set({ loadingLinks: true })
    try {
      const vaultKey = useVaultStore.getState().vaultKey
      const links = await sharingService.getUserSharedLinks(uid)

      const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
      const now = Date.now()
      const staleIds = links
        .filter((l) => {
          const ms = l.expiresAt?.toMillis?.()
          return ms && now - ms > THREE_DAYS_MS
        })
        .map((l) => l.id!)
        .filter(Boolean)

      const visible = links.filter((l) => !staleIds.includes(l.id!))

      // Decrypt secrets for all visible links that have encryptedSecret
      const linkSecrets: Record<string, string> = {}
      if (vaultKey) {
        await Promise.allSettled(
          visible.map(async (l) => {
            if (l.id && l.encryptedSecret) {
              try {
                linkSecrets[l.id] = await decryptString(l.encryptedSecret, vaultKey)
              } catch {
                // Secret undecryptable — skip silently
              }
            }
          }),
        )
      }

      set({ sharedLinks: visible, linkSecrets })

      if (staleIds.length > 0) {
        removeShareSecrets(staleIds)
        sharingService.deleteLinks(staleIds).catch(() => {})
      }
    } catch {
      toast.error('Failed to load shared links')
    } finally {
      set({ loadingLinks: false })
    }
  },

  revokeLink: async (linkId) => {
    try {
      await sharingService.revokeSharedLink(linkId)
      removeShareSecrets([linkId])
      set((state) => ({
        sharedLinks: state.sharedLinks.filter((l) => l.id !== linkId),
        linkSecrets: Object.fromEntries(
          Object.entries(state.linkSecrets).filter(([id]) => id !== linkId),
        ),
      }))
      toast.success('Share link deleted')
    } catch {
      toast.error('Failed to delete link')
    }
  },

  deleteLinks: async (linkIds) => {
    try {
      await sharingService.deleteLinks(linkIds)
      removeShareSecrets(linkIds)
      set((state) => ({
        sharedLinks: state.sharedLinks.filter((l) => !linkIds.includes(l.id!)),
        linkSecrets: Object.fromEntries(
          Object.entries(state.linkSecrets).filter(([id]) => !linkIds.includes(id)),
        ),
      }))
      toast.success(`${linkIds.length} link${linkIds.length === 1 ? '' : 's'} deleted`)
    } catch {
      toast.error('Failed to delete links')
    }
  },

  clearGeneratedLink: () => set({ generatedLink: null }),
}))
