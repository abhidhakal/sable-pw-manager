import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Copy, Check, Eye, EyeOff, ExternalLink, Pencil, Trash2, ArrowLeft, FolderInput } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { VaultItem } from '@/types/vault'
import { useVaultStore } from '@/stores/vaultStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { copyToClipboard } from '@/lib/clipboard'
import { toast } from '@/components/ui/Toast'

interface VaultItemDetailProps {
  item: VaultItem & { id: string }
}

function getCatIcon(name: string): LucideIcon {
  return (Icons as any)[name] || Icons.Folder
}

export function VaultItemDetail({ item }: VaultItemDetailProps) {
  const nav = useNavigate()
  const { user } = useAuthStore()
  const { categories, deleteItem, moveItemToCategory } = useVaultStore()
  const [showPw, setShowPw] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showMove, setShowMove] = useState(false)

  const category = useMemo(() => categories.find((c) => c.id === item.categoryId), [categories, item.categoryId])
  const CatIcon = category ? getCatIcon(category.icon) : Icons.Folder

  const copy = async (val: string, field: string) => {
    const ok = await copyToClipboard(val)
    if (ok) {
      setCopied(field)
      toast.success(`${field} copied — clipboard clears in 30s`)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    setDeleting(true)
    try {
      await deleteItem(user.uid, item.id)
      nav('/vault', { replace: true })
    } catch { /* toast shown by store */ } finally { setDeleting(false) }
  }

  const handleMove = async (catId: string) => {
    if (!user) return
    try {
      await moveItemToCategory(user.uid, item.id, catId)
      setShowMove(false)
    } catch { /* toast shown by store */ }
  }

  const fields = [
    { label: 'Username', value: item.username, copyable: true },
    { label: 'Password', value: item.password, copyable: true, secret: true },
    { label: 'URL', value: item.url, copyable: true, isUrl: true },
    { label: 'Notes', value: item.notes },
  ]

  return (
    <div className="max-w-2xl animate-fade-in">
      {/* Back button */}
      <button onClick={() => nav('/vault')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-4 transition-colors cursor-pointer">
        <ArrowLeft size={16} /> Back to vault
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: category ? `${category.color}15` : 'var(--color-surface-elevated)' }}>
            <CatIcon size={22} style={{ color: category?.color }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{item.title}</h2>
            {category && <Badge color={category.color}>{category.name}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" icon={<FolderInput size={14} />} onClick={() => setShowMove(true)}>Move</Button>
          <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => nav(`/vault/${item.id}/edit`)}>Edit</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setShowDelete(true)}>Delete</Button>
        </div>
      </div>

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
                ) : f.isUrl ? (
                  <a href={f.value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary-hover flex items-center gap-1 truncate">
                    {f.value} <ExternalLink size={12} />
                  </a>
                ) : (
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{f.value}</p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-3">
                {f.secret && (
                  <button onClick={() => setShowPw(!showPw)} className="p-1.5 rounded-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer">
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
    </div>
  )
}
