import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Copy, Check, Eye, EyeOff, ExternalLink, Pencil, Trash2, FolderInput, Clock, History, ArrowLeft, Share2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { VaultItem } from '@/types/vault'
import { useVaultStore } from '@/stores/vaultStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ClipboardTimer } from '@/components/ui/ClipboardTimer'
import { PasswordStrengthBar } from './PasswordStrengthBar'
import { ShareModal } from './ShareModal'
import { copyToClipboard } from '@/lib/clipboard'
import { toast } from '@/components/ui/Toast'
import { getPasswordHistory, formatHistoryDate, type PasswordHistoryEntry } from '@/lib/passwordHistory'
import { isSafeUrl } from '@/lib/url'

interface VaultItemDetailProps {
  item: VaultItem & { id: string }
}

function getCatIcon(name: string): LucideIcon {
  return (Icons as any)[name] || Icons.Folder
}

const PEEK_DURATION = 5000 // 5 seconds

export function VaultItemDetail({ item }: VaultItemDetailProps) {
  const nav = useNavigate()
  const { user } = useAuthStore()
  const { categories, deleteItem, moveItemToCategory, vaultKey } = useVaultStore()
  const [showPw, setShowPw] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [copyTime, setCopyTime] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showMove, setShowMove] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [history, setHistory] = useState<PasswordHistoryEntry[]>([])

  useEffect(() => {
    if (!vaultKey) return
    getPasswordHistory(item.id, vaultKey).then(setHistory)
  }, [item.id, vaultKey])

  const category = useMemo(() => categories.find((c) => c.id === item.categoryId), [categories, item.categoryId])
  const CatIcon = category ? getCatIcon(category.icon) : Icons.Folder
  const isSecureNote = item.username === '__secure_note__'

  // Peek mode: auto-hide password after 5 seconds
  useEffect(() => {
    if (showPw) {
      const timer = setTimeout(() => setShowPw(false), PEEK_DURATION)
      return () => clearTimeout(timer)
    }
  }, [showPw])

  const copy = async (val: string, field: string) => {
    const ok = await copyToClipboard(val)
    if (ok) {
      setCopied(field)
      setCopyTime(Date.now())
      toast.success(`${field} copied — clipboard clears in 30s`)
      setTimeout(() => setCopied(null), 30000)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    setDeleting(true)
    try {
      await deleteItem(user.uid, item.id)
      nav('/app/vault', { replace: true })
    } catch { /* toast shown by store */ } finally { setDeleting(false) }
  }

  const handleMove = async (catId: string) => {
    if (!user) return
    try {
      await moveItemToCategory(user.uid, item.id, catId)
      setShowMove(false)
    } catch { /* toast shown by store */ }
  }

  // Calculate age
  const lastUpdated = item.updatedAt?.toMillis?.() || (item.updatedAt as any)?.seconds * 1000 || item.createdAt?.toMillis?.() || (item.createdAt as any)?.seconds * 1000
  const daysSinceUpdate = lastUpdated ? Math.floor((Date.now() - lastUpdated) / (1000 * 60 * 60 * 24)) : null
  const isOld = daysSinceUpdate !== null && daysSinceUpdate > 90

  const fields = isSecureNote
    ? [{ label: 'Content', value: item.notes }]
    : [
        { label: 'Username', value: item.username, copyable: true },
        { label: 'Password', value: item.password, copyable: true, secret: true },
        { label: 'URL', value: item.url, copyable: true, isUrl: true },
        { label: 'Notes', value: item.notes },
      ]

  return (
    <div className="animate-fade-in">
      {/* Back button + Breadcrumb */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => nav('/app/vault')} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer" aria-label="Back to vault">
          <ArrowLeft size={18} />
        </button>
        <nav className="flex items-center gap-1.5 text-xs text-text-muted">
          <button onClick={() => nav('/app/vault')} className="hover:text-text-primary transition-colors cursor-pointer">Vault</button>
          <span>/</span>
          <span className="text-text-secondary truncate max-w-48">{item.title}</span>
        </nav>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: category ? `${category.color}15` : 'var(--color-surface-elevated)' }}>
            <CatIcon size={22} style={{ color: category?.color }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{item.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {category && <Badge color={category.color}>{category.name}</Badge>}
              {isSecureNote && <Badge color="#A8B3A9">Secure Note</Badge>}
              {isOld && (
                <Badge color="#D96C5F">
                  <Clock size={10} /> {daysSinceUpdate}d old
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" icon={<Share2 size={14} />} onClick={() => setShowShare(true)}>Share</Button>
          <Button variant="ghost" size="sm" icon={<FolderInput size={14} />} onClick={() => setShowMove(true)}>Move</Button>
          <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => nav(`/app/vault/${item.id}/edit`)}>Edit</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setShowDelete(true)}>Delete</Button>
        </div>
      </div>

      {/* Password strength */}
      {!isSecureNote && (
        <div className="mb-4">
          <PasswordStrengthBar password={item.password} />
        </div>
      )}

      {/* Fields */}
      <div className="space-y-1 bg-surface border border-border rounded-lg divide-y divide-border">
        {fields.map((f) => {
          if (!f.value) return null
          return (
            <div key={f.label} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-text-muted uppercase tracking-wider mb-0.5">{f.label}</p>
                {f.secret ? (
                  <p className="text-sm text-text-primary font-mono">{showPw ? f.value : '•'.repeat(16)}</p>
                ) : f.isUrl && isSafeUrl(f.value) ? (
                  <a href={f.value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary-hover flex items-center gap-1 truncate">
                    {f.value} <ExternalLink size={12} />
                  </a>
                ) : (
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{f.value}</p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-3">
                {f.secret && (
                  <button onClick={() => setShowPw(!showPw)} className="p-1.5 rounded-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer" title={showPw ? 'Hide (auto-hides in 5s)' : 'Peek (5s)'}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
                {f.copyable && (
                  <button onClick={() => copy(f.value!, f.label)} className="p-1.5 rounded-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer">
                    {copied === f.label ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Clipboard timer */}
      {copied && copyTime && (
        <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
          <ClipboardTimer startTime={copyTime} onExpire={() => { setCopied(null); setCopyTime(null) }} />
          <span>Clipboard will auto-clear</span>
        </div>
      )}

      {/* Last updated info */}
      {daysSinceUpdate !== null && (
        <p className="text-xs text-text-muted mt-4">
          Last updated {daysSinceUpdate === 0 ? 'today' : `${daysSinceUpdate} day${daysSinceUpdate === 1 ? '' : 's'} ago`}
        </p>
      )}

      {/* Password history */}
      {!isSecureNote && history.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            <History size={13} />
            {history.length} previous password{history.length === 1 ? '' : 's'}
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1 p-3 bg-surface border border-border rounded-md">
              {history.map((entry, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-xs font-mono text-text-muted">{'•'.repeat(12)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">{formatHistoryDate(entry.changedAt)}</span>
                    <button
                      onClick={() => copy(entry.password, `Old password ${i + 1}`)}
                      className="p-1 rounded text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                      title="Copy old password"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete confirm */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Item" size="sm">
        <p className="text-sm text-text-secondary mb-4">Are you sure you want to delete <strong>{item.title}</strong>? This cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" fullWidth loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

      {/* Move modal */}
      <Modal open={showMove} onClose={() => setShowMove(false)} title="Move to Category" size="sm">
        <div className="space-y-1">
          {categories.filter((c) => c.id !== item.categoryId).map((c) => {
            const I = getCatIcon(c.icon)
            return (
              <button key={c.id} onClick={() => handleMove(c.id)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors cursor-pointer">
                <I size={16} style={{ color: c.color }} /> {c.name}
              </button>
            )
          })}
        </div>
      </Modal>

      {/* Share modal */}
      <ShareModal open={showShare} onClose={() => setShowShare(false)} items={[item]} />
    </div>
  )
}
