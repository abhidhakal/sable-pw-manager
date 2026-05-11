import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { SecureNoteForm } from '@/components/vault/SecureNoteForm'

export default function SecureNotePage() {
  const nav = useNavigate()
  const { user } = useAuthStore()
  const { addItem } = useVaultStore()
  const [saving, setSaving] = useState(false)

  const handleCreate = async (data: { title: string; username: string; password: string; notes: string; categoryId: string }) => {
    if (!user) return
    setSaving(true)
    try {
      await addItem(user.uid, data)
      nav('/app/vault', { replace: true })
    } catch {
      // toast shown by store
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => nav('/app/vault')} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer" aria-label="Back to vault">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">New Secure Note</h2>
          <p className="text-xs text-text-muted">Store recovery codes, API keys, or any sensitive text</p>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6">
        <SecureNoteForm onSubmit={handleCreate} loading={saving} />
      </div>
    </div>
  )
}
