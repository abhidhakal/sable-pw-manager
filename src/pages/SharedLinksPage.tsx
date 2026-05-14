import { useEffect, useState } from 'react'
import { Link2, Trash2, Clock, Eye, AlertTriangle, Copy, Check } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSharingStore } from '@/stores/sharingStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { copyToClipboard } from '@/lib/clipboard'
import { toast } from '@/components/ui/Toast'

function formatExpiry(expiresAt: any): string {
  const ms = expiresAt?.toMillis?.() || expiresAt?.seconds * 1000
  if (!ms) return 'Unknown'
  const diff = ms - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h remaining`
  if (hours > 0) return `${hours}h remaining`
  const minutes = Math.floor(diff / (1000 * 60))
  return `${minutes}m remaining`
}

function isExpired(expiresAt: any): boolean {
  const ms = expiresAt?.toMillis?.() || expiresAt?.seconds * 1000
  return ms ? Date.now() > ms : false
}

export default function SharedLinksPage() {
  const { user } = useAuthStore()
  const { sharedLinks, loadingLinks, loadSharedLinks, revokeLink } = useSharingStore()
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.uid) {
      loadSharedLinks(user.uid)
    }
  }, [user?.uid, loadSharedLinks])

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await revokeLink(revokeTarget)
      setRevokeTarget(null)
    } finally {
      setRevoking(false)
    }
  }

  const handleCopyLink = async (linkId: string) => {
    // We can't reconstruct the secret (it was only shown at creation time)
    // So we just copy the link ID for reference
    const ok = await copyToClipboard(`${window.location.origin}/share/${linkId}`)
    if (ok) {
      setCopiedId(linkId)
      toast.info('Link copied (without decryption key — share the original link)')
      setTimeout(() => setCopiedId(null), 3000)
    }
  }

  const activeLinks = sharedLinks.filter((l) => !l.burned && !isExpired(l.expiresAt))
  const expiredLinks = sharedLinks.filter((l) => l.burned || isExpired(l.expiresAt))

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Shared Links</h2>
        <p className="text-sm text-text-muted mt-0.5">Manage your active and expired share links</p>
      </div>

      {loadingLinks ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      ) : sharedLinks.length === 0 ? (
        <EmptyState
          icon={<Link2 size={48} />}
          title="No shared links"
          description="When you share passwords via link, they'll appear here."
        />
      ) : (
        <>
          {/* Active links */}
          {activeLinks.length > 0 && (
            <div>
              <h3 className="text-xs text-text-muted uppercase tracking-wider mb-2">
                Active ({activeLinks.length})
              </h3>
              <div className="space-y-2">
                {activeLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-4 p-4 bg-surface border border-border rounded-lg"
                  >
                    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Link2 size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {link.itemTitles?.join(', ') || `${link.itemCount} item${link.itemCount === 1 ? '' : 's'}`}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Clock size={10} /> {formatExpiry(link.expiresAt)}
                        </span>
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Eye size={10} /> {link.viewCount} view{link.viewCount === 1 ? '' : 's'}
                          {link.maxViews ? ` / ${link.maxViews} max` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyLink(link.id!)}
                        className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
                        title="Copy link (without key)"
                      >
                        {copiedId === link.id ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => setRevokeTarget(link.id!)}
                        className="p-2 rounded-md text-text-muted hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer"
                        title="Revoke link"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expired links */}
          {expiredLinks.length > 0 && (
            <div>
              <h3 className="text-xs text-text-muted uppercase tracking-wider mb-2">
                Expired / Burned ({expiredLinks.length})
              </h3>
              <div className="space-y-2 opacity-60">
                {expiredLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-4 p-4 bg-surface border border-border rounded-lg"
                  >
                    <div className="w-9 h-9 rounded-md bg-surface-elevated flex items-center justify-center shrink-0">
                      <AlertTriangle size={16} className="text-text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-muted truncate">
                        {link.itemTitles?.join(', ') || `${link.itemCount} item${link.itemCount === 1 ? '' : 's'}`}
                      </p>
                      <span className="text-xs text-text-muted">
                        {link.burned ? 'Burned (viewed)' : 'Expired'}
                      </span>
                    </div>
                    <button
                      onClick={() => setRevokeTarget(link.id!)}
                      className="p-2 rounded-md text-text-muted hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Revoke confirmation */}
      <Modal open={!!revokeTarget} onClose={() => setRevokeTarget(null)} title="Revoke Share Link" size="sm">
        <p className="text-sm text-text-secondary mb-4">
          This will permanently delete the shared link. Anyone with the link will no longer be able to view the credentials.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setRevokeTarget(null)}>Cancel</Button>
          <Button variant="danger" fullWidth loading={revoking} onClick={handleRevoke}>Revoke</Button>
        </div>
      </Modal>
    </div>
  )
}
