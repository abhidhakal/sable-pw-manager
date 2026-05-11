import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { SecureNoteForm } from '@/components/vault/SecureNoteForm'
import { Card } from '@/components/ui/Card'

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
      nav('/vault', { replace: true })
    } catch {
      // toast shown by store
    } finally {
      setSaving(false)
    }
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
          <span className="text-text-secondary">New Secure Note</span>
        </nav>
      </div>
      <Card variant="elevated" padding="lg">
        <h2 className="text-lg font-semibold text-text-primary mb-4">New Secure Note</h2>
        <SecureNoteForm onSubmit={handleCreate} loading={saving} />
      </Card>
    </div>
  )
}
