import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, Key, ExternalLink, Check } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useVaultStore } from '@/stores/vaultStore'
import { copyToClipboard } from '@/lib/clipboard'
import { toast } from '@/components/ui/Toast'

function getCatIcon(name: string): LucideIcon {
  return (Icons as any)[name] || Icons.Folder
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const { items, categories, locked } = useVaultStore()

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!locked) setOpen(true)
      }
      if (e.key === '/' && !locked && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [locked])

  // Focus input when opened
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (open) {
      timeout = setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(0)
    }
    return () => clearTimeout(timeout)
  }, [open])

  // Lock background scroll while open
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const results = useMemo(() => {
    if (!query.trim()) return items.slice(0, 8)
    const q = query.toLowerCase()
    return items
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.username.toLowerCase().includes(q) ||
          (item.url && item.url.toLowerCase().includes(q)),
      )
      .slice(0, 10)
  }, [items, query])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = results[selectedIndex]
      if (item) {
        setOpen(false)
        nav(`/app/vault/${item.id}`)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const handleCopyPassword = async (e: React.MouseEvent, password: string, id: string) => {
    e.stopPropagation()
    const ok = await copyToClipboard(password)
    if (ok) {
      setCopiedId(id)
      toast.success('Password copied — clipboard clears in 30s')
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center pt-[15vh] p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg bg-surface-elevated border border-border rounded-xl shadow-lg animate-scale-in overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search size={18} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search passwords..."
            className="flex-1 h-12 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-text-muted bg-surface border border-border rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {results.length > 0 ? (
            results.map((item, i) => {
              const cat = categories.find((c) => c.id === item.categoryId)
              const CatIcon = cat ? getCatIcon(cat.icon) : Icons.Folder
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setOpen(false)
                    nav(`/app/vault/${item.id}`)
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                    i === selectedIndex ? 'bg-primary/10 text-text-primary' : 'text-text-secondary hover:bg-surface'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cat ? `${cat.color}15` : 'var(--color-surface)' }}
                  >
                    <CatIcon size={14} style={{ color: cat?.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-text-muted truncate">{item.username}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleCopyPassword(e, item.password, item.id)}
                      className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
                      title="Copy password"
                    >
                      {copiedId === item.id ? <Check size={13} className="text-success" /> : <Key size={13} />}
                    </button>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
                        title="Open URL"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-8 text-center text-sm text-text-muted">
              No passwords found
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[10px] text-text-muted">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-surface border border-border rounded">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-surface border border-border rounded">↵</kbd> open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-surface border border-border rounded">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}
