import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Search, Upload, CheckSquare, Square, Trash2, X } from 'lucide-react'
import { useVaultStore } from '@/stores/vaultStore'
import { useAuthStore } from '@/stores/authStore'
import { VaultItemCard } from './VaultItemCard'
import { ImportCSV } from './ImportCSV'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export function VaultItemList() {
  const nav = useNavigate()
  const { items, categories, searchQuery, setSearchQuery, activeCategoryId, deleteItems } = useVaultStore()
  const { user } = useAuthStore()
  const [showImport, setShowImport] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
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
      .sort((a, b) => {
        if (a.favorite === b.favorite) return a.title.localeCompare(b.title)
        return a.favorite ? -1 : 1
      })
  }, [items, searchQuery, activeCategoryId])

  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id))

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)))
    }
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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header / Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search passwords..."
            icon={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button icon={<Plus size={16} />} onClick={() => nav('/vault/new')}>
          Add Password
        </Button>
        <Button variant="secondary" icon={<Upload size={16} />} onClick={() => setShowImport(true)}>
          Import
        </Button>
        {!selectMode ? (
          <Button
            variant="ghost"
            icon={<CheckSquare size={16} />}
            onClick={() => setSelectMode(true)}
            disabled={filteredItems.length === 0}
          >
            Select
          </Button>
        ) : (
          <Button variant="ghost" icon={<X size={16} />} onClick={exitSelectMode}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <VaultItemCard
              key={item.id}
              item={item}
              category={categories.find((c) => c.id === item.categoryId)}
              onClick={() => nav(`/vault/${item.id}`)}
              selectable={selectMode}
              selected={selectedIds.has(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search size={48} />}
          title={searchQuery ? 'No results found' : 'No passwords yet'}
          description={searchQuery ? 'Try adjusting your search terms.' : 'Create your first password to securely store it in your vault.'}
          action={
            <Button size="sm" icon={<Plus size={15} />} onClick={() => nav('/vault/new')}>
              Add Password
            </Button>
          }
        />
      )}
      <ImportCSV open={showImport} onClose={() => setShowImport(false)} />
    </div>
  )
}