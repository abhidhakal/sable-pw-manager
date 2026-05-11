import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Search, Upload, Download, CheckSquare, Square, Trash2, X, List, LayoutGrid, ArrowUpDown, FileText } from 'lucide-react'
import { useVaultStore } from '@/stores/vaultStore'
import { useAuthStore } from '@/stores/authStore'
import { VaultItemCard } from './VaultItemCard'
import { ImportCSV } from './ImportCSV'
import { ExportModal } from './ExportModal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { VaultListSkeleton } from '@/components/ui/Skeleton'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'

type ViewMode = 'grid' | 'list'
type SortMode = 'alpha' | 'recent' | 'modified'

export function VaultItemList() {
  const nav = useNavigate()
  const { items, categories, searchQuery, setSearchQuery, activeCategoryId, deleteItems, loading } = useVaultStore()
  const { user } = useAuthStore()
  const [showImport, setShowImport] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortMode, setSortMode] = useState<SortMode>('alpha')
  const searchRef = useRef<HTMLInputElement>(null)

  // Cmd+K hint — focus search on /
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (activeCategoryId && item.categoryId !== activeCategoryId) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          item.title.toLowerCase().includes(q) ||
          item.username.toLowerCase().includes(q) ||
          (item.url && item.url.toLowerCase().includes(q))
        )
      }
      return true
    })

    // Sort
    return filtered.sort((a, b) => {
      // Favorites always first
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1

      switch (sortMode) {
        case 'recent': {
          const aTime = a.createdAt?.toMillis?.() || (a.createdAt as any)?.seconds * 1000 || 0
          const bTime = b.createdAt?.toMillis?.() || (b.createdAt as any)?.seconds * 1000 || 0
          return bTime - aTime
        }
        case 'modified': {
          const aTime = a.updatedAt?.toMillis?.() || (a.updatedAt as any)?.seconds * 1000 || 0
          const bTime = b.updatedAt?.toMillis?.() || (b.updatedAt as any)?.seconds * 1000 || 0
          return bTime - aTime
        }
        default:
          return a.title.localeCompare(b.title)
      }
    })
  }, [items, searchQuery, activeCategoryId, sortMode])

  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id))

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allFilteredSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredItems.map((item) => item.id)))
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const handleDelete = async () => {
    if (!user?.uid || selectedIds.size === 0) return
    setDeleting(true)
    try {
      await deleteItems(user.uid, Array.from(selectedIds))
      setSelectedIds(new Set())
      setSelectMode(false)
    } catch {
      // error toast handled in store
    } finally {
      setDeleting(false)
    }
  }

  // Show skeleton while loading
  if (loading && items.length === 0) {
    return <VaultListSkeleton />
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header / Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            ref={searchRef}
            placeholder="Search passwords... (⌘K)"
            icon={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<Plus size={16} />} onClick={() => nav('/app/vault/new')}>
            Add
          </Button>
          <Button variant="ghost" size="sm" icon={<FileText size={14} />} onClick={() => nav('/app/vault/new-note')}>
            Note
          </Button>
          <Dropdown
            trigger={
              <Button variant="secondary" size="sm" icon={<ArrowUpDown size={14} />}>
                Sort
              </Button>
            }
          >
            <DropdownItem onClick={() => setSortMode('alpha')} icon={sortMode === 'alpha' ? <CheckSquare size={14} /> : <Square size={14} />}>
              Alphabetical
            </DropdownItem>
            <DropdownItem onClick={() => setSortMode('recent')} icon={sortMode === 'recent' ? <CheckSquare size={14} /> : <Square size={14} />}>
              Recently Added
            </DropdownItem>
            <DropdownItem onClick={() => setSortMode('modified')} icon={sortMode === 'modified' ? <CheckSquare size={14} /> : <Square size={14} />}>
              Recently Modified
            </DropdownItem>
          </Dropdown>
          <div className="flex border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-surface-elevated text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
              title="Grid view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-surface-elevated text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
              title="List view"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar row */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => setShowImport(true)}>
          Import
        </Button>
        <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => setShowExport(true)}>
          Export
        </Button>
        {!selectMode ? (
          <Button
            variant="ghost"
            size="sm"
            icon={<CheckSquare size={14} />}
            onClick={() => setSelectMode(true)}
            disabled={filteredItems.length === 0}
          >
            Select
          </Button>
        ) : (
          <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={exitSelectMode}>
            Cancel
          </Button>
        )}
      </div>

      {/* Selection toolbar */}
      {selectMode && (
        <div className="flex items-center gap-3 p-3 bg-surface-elevated border border-border rounded-lg">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            {allFilteredSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
            Select all
          </button>
          {selectedIds.size > 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={handleDelete}
              loading={deleting}
            >
              Delete {selectedIds.size} password{selectedIds.size === 1 ? '' : 's'}
            </Button>
          )}
          {selectedIds.size > 0 && (
            <span className="text-xs text-text-muted">
              {selectedIds.size} selected
            </span>
          )}
        </div>
      )}

      {/* List */}
      {filteredItems.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
          {filteredItems.map((item) => (
            <VaultItemCard
              key={item.id}
              item={item}
              category={categories.find((c) => c.id === item.categoryId)}
              onClick={() => nav(`/app/vault/${item.id}`)}
              selectable={selectMode}
              selected={selectedIds.has(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search size={48} />}
          title={searchQuery ? 'No results found' : 'No passwords yet'}
          description={searchQuery ? 'Try adjusting your search terms.' : 'Create your first password to securely store it in your vault.'}
          action={
            <Button size="sm" icon={<Plus size={15} />} onClick={() => nav('/app/vault/new')}>
              Add Password
            </Button>
          }
        />
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => nav('/app/vault/new')}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-primary-hover transition-colors z-20"
        aria-label="Add password"
      >
        <Plus size={24} />
      </button>

      <ImportCSV open={showImport} onClose={() => setShowImport(false)} />
      <ExportModal open={showExport} onClose={() => setShowExport(false)} />
    </div>
  )
}
