import { useState, createElement } from 'react'
import { Copy, Check, ExternalLink, Folder } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { VaultItem, Category } from '@/types/vault'
import { Badge } from '@/components/ui/Badge'
import { copyToClipboard } from '@/lib/clipboard'
import { toast } from '@/components/ui/Toast'

interface VaultItemCardProps {
  item: VaultItem & { id: string }
  category?: Category & { id: string }
  onClick: () => void
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  compact?: boolean
}

const iconMap = Icons as any

function renderCategoryIcon(iconName: string, color: string | undefined) {
  const IconComponent = iconMap[iconName] || Folder
  return createElement(IconComponent, {
    size: 18,
    style: { color: color || 'var(--color-text-muted)' },
  })
}

function getFaviconUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return null
  }
}

export function VaultItemCard({ item, category, onClick, selectable, selected, onToggleSelect, compact }: VaultItemCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [faviconError, setFaviconError] = useState(false)

  const faviconUrl = getFaviconUrl(item.url)
  const isSecureNote = item.username === '__secure_note__'

  const handleCopy = async (value: string, field: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const ok = await copyToClipboard(value)
    if (ok) {
      setCopiedField(field)
      toast.success(`${field} copied — clipboard clears in 30s`)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  return (
    <div
      onClick={selectable ? onToggleSelect : onClick}
      className={`group flex items-center gap-4 ${compact ? 'p-2.5' : 'p-3.5'} bg-surface border rounded-lg transition-all duration-(--transition-base) cursor-pointer hover:shadow-sm hover:-translate-y-[1px] ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-border-focus hover:bg-surface-elevated'
      }`}
    >
      {/* Checkbox or icon */}
      {selectable ? (
        <div className="shrink-0">
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              selected ? 'bg-primary border-primary' : 'border-border-hover bg-surface'
            }`}
          >
            {selected && <Check size={14} className="text-bg" />}
          </div>
        </div>
      ) : (
        <div
          className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-md flex items-center justify-center shrink-0 overflow-hidden`}
          style={{ backgroundColor: category ? `${category.color}15` : 'var(--color-surface-elevated)' }}
        >
          {faviconUrl && !faviconError && !isSecureNote ? (
            <img
              src={faviconUrl}
              alt=""
              className="w-5 h-5"
              onError={() => setFaviconError(true)}
              loading="lazy"
            />
          ) : category ? (
            renderCategoryIcon(category.icon, category.color)
          ) : (
            <Folder size={18} className="text-text-muted" />
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-text-primary truncate`}>{item.title}</h3>
          {isSecureNote && (
            <Badge color="#A8B3A9" size="sm">Note</Badge>
          )}
          {category && !selectable && !compact && (
            <Badge color={category.color} size="sm" className="hidden sm:inline-flex">
              {category.name}
            </Badge>
          )}
        </div>
        <p className="text-xs text-text-muted truncate mt-0.5">
          {isSecureNote ? 'Secure Note' : item.username}
        </p>
      </div>

      {/* Actions — hidden in selection mode */}
      {!selectable && !isSecureNote && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => handleCopy(item.username, 'Username', e)}
            className="p-1.5 rounded-sm text-text-muted hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
            title="Copy username"
          >
            {copiedField === 'Username' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          </button>
          <button
            onClick={(e) => handleCopy(item.password, 'Password', e)}
            className="p-1.5 rounded-sm text-text-muted hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
            title="Copy password"
          >
            {copiedField === 'Password' ? <Check size={14} className="text-success" /> : <Icons.KeyRound size={14} />}
          </button>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-sm text-text-muted hover:text-text-primary hover:bg-bg transition-colors"
              title="Open URL"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
