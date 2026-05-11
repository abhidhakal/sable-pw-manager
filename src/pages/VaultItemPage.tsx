// ... (Keep imports the same)
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { VaultItemDetail } from '@/components/vault/VaultItemDetail'
import { VaultItemForm } from '@/components/vault/VaultItemForm'
import type { VaultItemFormData } from '@/schemas/vaultSchemas'
import { Card } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'

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
        <button onClick={() => nav('/vault')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-4 transition-colors cursor-pointer">
          <ArrowLeft size={16} /> Back to vault
        </button>
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
        <button onClick={() => nav(`/vault/${id}`)} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-4 transition-colors cursor-pointer">
          <ArrowLeft size={16} /> Back to password
        </button>
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
