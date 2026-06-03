import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { VaultItemDetail } from '@/components/vault/VaultItemDetail'
import { VaultItemForm } from '@/components/vault/VaultItemForm'
import type { VaultItemFormData } from '@/schemas/vaultSchemas'

export default function VaultItemPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { user } = useAuthStore()
  const { items, addItem, updateItem } = useVaultStore()
  const [saving, setSaving] = useState(false)

  const location = useLocation()
  const isNew = !id || id === 'new' || location.pathname.endsWith('/new')
  const isEdit = location.pathname.endsWith('/edit')
  const item = !isNew ? items.find((i) => i.id === id) : undefined

  // New item form
  if (isNew) {
    const handleCreate = async (data: VaultItemFormData) => {
      if (!user) return
      setSaving(true)
      try {
        await addItem(user.uid, { ...data, url: data.url || undefined, notes: data.notes || undefined })
        nav('/app/vault', { replace: true })
      } catch { /* toast shown by store */ } finally { setSaving(false) }
    }

    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => nav('/app/vault')} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer" aria-label="Back to vault">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Add New Password</h2>
            <p className="text-xs text-text-muted">Fill in the details to save a new credential</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          <VaultItemForm onSubmit={handleCreate} loading={saving} />
        </div>
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
        nav(`/app/vault/${id}`, { replace: true })
      } catch { /* toast shown by store */ } finally { setSaving(false) }
    }

    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => nav(`/app/vault/${id}`)} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer" aria-label="Back to password">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Edit Password</h2>
            <p className="text-xs text-text-muted">{item.title}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          <VaultItemForm initialData={item} onSubmit={handleUpdate} loading={saving} />
        </div>
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
      <button onClick={() => nav('/app/vault')} className="text-sm text-primary mt-2 cursor-pointer">Go back</button>
    </div>
  )
}
