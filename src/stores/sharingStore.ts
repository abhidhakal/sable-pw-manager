import { create } from 'zustand'
import type { SharedLink, ShareExpiration, ShareViewLimit } from '@/types/sharing'
import type { ShareableItem } from '@/lib/sharingCrypto'
import { encryptSharePayload } from '@/lib/sharingCrypto'
import * as sharingService from '@/features/sharing/sharingService'
import { toast } from '@/components/ui/Toast'

interface SharingState {
  // User's shared links history
  sharedLinks: SharedLink[]
  loadingLinks: boolean

  // Share creation state
  creating: boolean
  generatedLink: string | null

  // Actions
  createShareLink: (params: {
    uid: string
    items: ShareableItem[]
    expiration: ShareExpiration
    viewLimit: ShareViewLimit
  }) => Promise<string | null>

  loadSharedLinks: (uid: string) => Promise<void>
  revokeLink: (linkId: string) => Promise<void>
  clearGeneratedLink: () => void
}

export const useSharingStore = create<SharingState>((set) => ({
  sharedLinks: [],
  loadingLinks: false,
  creating: false,
  generatedLink: null,

  createShareLink: async ({ uid, items, expiration, viewLimit }) => {
    set({ creating: true, generatedLink: null })
    try {
      // Encrypt the items client-side
      const { encrypted, secret } = await encryptSharePayload(items)

      // Store ciphertext in Firestore
      const linkId = await sharingService.createSharedLink({
        creatorUid: uid,
        encryptedPayload: encrypted.ciphertext,
        salt: encrypted.salt,
        iv: encrypted.iv,
        itemCount: items.length,
        itemTitles: items.map((i) => i.title),
        expiration,
        maxViews: viewLimit === 'once' ? 1 : null,
      })

      // Construct the share URL with secret in fragment
      const baseUrl = window.location.origin
      const shareUrl = `${baseUrl}/share/${linkId}#${secret}`

      set({ generatedLink: shareUrl })
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
      const links = await sharingService.getUserSharedLinks(uid)
      set({ sharedLinks: links })
    } catch {
      toast.error('Failed to load shared links')
    } finally {
      set({ loadingLinks: false })
    }
  },

  revokeLink: async (linkId) => {
    try {
      await sharingService.revokeSharedLink(linkId)
      set((state) => ({
        sharedLinks: state.sharedLinks.filter((l) => l.id !== linkId),
      }))
      toast.success('Share link revoked')
    } catch {
      toast.error('Failed to revoke link')
    }
  },

  clearGeneratedLink: () => set({ generatedLink: null }),
}))
