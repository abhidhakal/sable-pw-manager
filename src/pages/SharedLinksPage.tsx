import { useEffect, useState } from 'react'
import { Link2, Trash2, Clock, Eye, AlertTriangle, CheckSquare, Square, Copy, Check } from 'lucide-react'
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
  const { sharedLinks, loadingLinks, linkSecrets, loadSharedLinks, revokeLink, deleteLinks } = useSharingStore()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.uid) loadSharedLinks(user.uid)
  }, [user?.uid, loadSharedLinks])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [sharedLinks])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await revokeLink(deleteTarget)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    setDeleting(true)
    try {
      await deleteLinks(Array.from(selectedIds))
      setBulkDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCopyLink = async (linkId: string) => {
    const secret = linkSecrets[linkId]
    if (!secret) return
    const url = `${window.location.origin}/share/${linkId}#${secret}`
    const ok = await copyToClipboard(url)
    if (ok) {
      setCopiedId(linkId)
      toast.success('Link copied')
      setTimeout(() => setCopiedId(null), 3000)
    }
  }

  const activeLinks = sharedLinks.filter((l) => !l.burned && !isExpired(l.expiresAt))
  const expiredLinks = sharedLinks.filter((l) => l.burned || isExpired(l.expiresAt))

  const selectAllExpired = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      expiredLinks.forEach((l) => l.id && next.add(l.id))
      return next
    })
  }

  const selectionCount = selectedIds.size

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Shared Links</h2>
          <p className="text-sm text-text-muted mt-0.5">Manage your active and expired share links</p>
        </div>
        {selectionCount > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-text-muted">{selectionCount} selected</span>
            <Button variant="secondary" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => setBulkDeleteOpen(true)}
            >
              Delete {selectionCount}
            </Button>
          </div>
        )}
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
                {activeLinks.map((link) => {
                  const id = link.id!
                  const selected = selectedIds.has(id)
                  return (
                    <div
                      key={id}
                      className={`flex items-center gap-4 p-4 bg-surface border rounded-lg transition-colors ${selected ? 'border-primary/50 bg-primary/5' : 'border-border'}`}
                    >
                      <button
                        onClick={() => toggleSelect(id)}
                        className="text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
                      >
                        {selected ? (
                          <CheckSquare size={16} className="text-primary" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                      <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Link2 size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {link.itemCount} item{link.itemCount === 1 ? '' : 's'}
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
                        {linkSecrets[id] ? (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-xs text-text-muted font-mono truncate max-w-50">
                              {`${window.location.origin}/share/${id}#…`}
                            </span>
                            <button
                              onClick={() => handleCopyLink(id)}
                              className="p-0.5 rounded text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
                              title="Copy share link"
                            >
                              {copiedId === id ? (
                                <Check size={12} className="text-success" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-text-muted mt-1.5 italic">
                            URL unavailable — re-open vault to restore
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setDeleteTarget(id)}
                        className="p-2 rounded-md text-text-muted hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer"
                        title="Delete link"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Expired / Burned links */}
          {expiredLinks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs text-text-muted uppercase tracking-wider">
                  Expired / Burned ({expiredLinks.length})
                </h3>
                <button
                  onClick={selectAllExpired}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  Select all expired
                </button>
              </div>
              <div className="space-y-2">
                {expiredLinks.map((link) => {
                  const id = link.id!
                  const selected = selectedIds.has(id)
                  return (
                    <div
                      key={id}
                      className={`flex items-center gap-4 p-4 bg-surface border rounded-lg transition-colors opacity-60 ${selected ? 'border-primary/50 opacity-80!' : 'border-border'}`}
                    >
                      <button
                        onClick={() => toggleSelect(id)}
                        className="text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
                      >
                        {selected ? (
                          <CheckSquare size={16} className="text-primary" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                      <div className="w-9 h-9 rounded-md bg-surface-elevated flex items-center justify-center shrink-0">
                        <AlertTriangle size={16} className="text-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-muted truncate">
                          {link.itemCount} item{link.itemCount === 1 ? '' : 's'}
                        </p>
                        <span className="text-xs text-text-muted">
                          {link.burned ? 'Burned (viewed)' : 'Expired'}
                        </span>
                      </div>
                      <button
                        onClick={() => setDeleteTarget(id)}
                        className="p-2 rounded-md text-text-muted hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Single delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Share Link"
        size="sm"
      >
        <p className="text-sm text-text-secondary mb-4">
          Permanently delete this share link. Anyone with the link will no longer be able to view the credentials.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* Bulk delete confirmation */}
      <Modal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Delete Selected Links"
        size="sm"
      >
        <p className="text-sm text-text-secondary mb-4">
          Permanently delete {selectionCount} link{selectionCount === 1 ? '' : 's'}. Anyone with these links will no longer be able to access the shared credentials.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setBulkDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth loading={deleting} onClick={handleBulkDelete}>
            Delete {selectionCount}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
