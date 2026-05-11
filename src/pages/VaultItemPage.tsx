import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { VaultItemDetail } from '@/components/vault/VaultItemDetail'
import { VaultItemForm } from '@/components/vault/VaultItemForm'
import type { VaultItemFormData } from '@/schemas/vaultSchemas'
import { Card } from '@/components/ui/Card'

export default function VaultItemPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { user } = useAuthStore()
  const { items, addItem, updateItem } = useVaultStore()
  const [saving, setSaving] = useState(false)

  const isNew = !id || id === 'new' || window.location.pathname.endsWith('/new')
  const isEdit = window.location.pathname.endsWith('/edit')
  const item = !isNew ? items.find((i) => i.id === id) : undefined

  // New item form
  if (isNew) {
    const handleCreate = async (data: VaultItemFormData) => {
      if (!user) return
      setSaving(true)
      try {
        await addItem(user.uid, { ...data, url: data.url || undefined, notes: data.notes || undefined })
        nav('/vault', { replace: true })
      } catch { /* toast shown by store */ } finally { setSaving(false) }
    }

    return (
      <div className="max-w-lg animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => nav('/vault')} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer" aria-label="Back to vault">
            <ArrowLeft size={18} />
          </button>
          <nav className="flex items-center gap-1.5 text-xs text-text-muted">
            <button onClick={() => nav('/vault')} className="hover:text-text-primary transition-colors cursor-pointer">Vault</button>
            <span>/</span>
            <span className="text-text-secondary">New Password</span>
          </nav>
        </div>
        <Card variant="elevated" padding="lg">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Add New Password</h2>
          <VaultItemForm onSubmit={handleCreate} loading={saving} />
        </Card>
      </div>
    )
  }

  // Edit existing item
  if (isEdit && item) {
    const handleUpdate = async (data: VaultItemFormData) => {
      if (!user || !id) return
      setSaving(true)
      try {
        await updateItem(user.uid, id, { ...data, url: data.url || undefined, notes: data.notes || undefined })
        nav(`/vault/${id}`, { replace: true })
      } catch { /* toast shown by store */ } finally { setSaving(false) }
    }

    return (
      <div className="max-w-lg animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => nav(`/vault/${id}`)} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer" aria-label="Back to password">
            <ArrowLeft size={18} />
          </button>
          <nav className="flex items-center gap-1.5 text-xs text-text-muted">
            <button onClick={() => nav('/vault')} className="hover:text-text-primary transition-colors cursor-pointer">Vault</button>
            <span>/</span>
            <button onClick={() => nav(`/vault/${id}`)} className="hover:text-text-primary transition-colors cursor-pointer truncate max-w-32">{item.title}</button>
            <span>/</span>
            <span className="text-text-secondary">Edit</span>
          </nav>
        </div>
        <Card variant="elevated" padding="lg">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Edit Password</h2>
          <VaultItemForm initialData={item} onSubmit={handleUpdate} loading={saving} />
        </Card>
      </div>
    )
  }

  // View item detail
  if (item) {
    return <VaultItemDetail item={item} />
  }

  // Not found
  return (
    <div className="text-center py-16">
      <p className="text-text-muted">Password not found</p>
      <button onClick={() => nav('/vault')} className="text-sm text-primary mt-2 cursor-pointer">Go back</button>
    </div>
  )
}
