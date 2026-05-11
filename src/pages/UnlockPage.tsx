import { useState } from 'react'
import { useNavigate } from 'react-router'
import { LogOut } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { MasterPasswordUnlockForm } from '@/components/vault/MasterPasswordForm'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { Button } from '@/components/ui/Button'

export default function UnlockPage() {
  const nav = useNavigate()
  const { user, logout } = useAuthStore()
  const { unlockVault, loading, getLockoutRemaining } = useVaultStore()
  const [error, setError] = useState<string | null>(null)

  const lockoutRemaining = getLockoutRemaining()

  const handleUnlock = async (masterPassword: string) => {
    if (!user) return
    setError(null)
    try {
      await unlockVault(user.uid, masterPassword)
      nav('/vault', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock vault')
    }
  }

  const handleLogout = async () => {
    useVaultStore.getState().clearVault()
    await logout()
    nav('/login', { replace: true })
  }

  return (
    <AuthLayout title="Unlock your vault" subtitle="Enter your master password to access your passwords.">
      <MasterPasswordUnlockForm onSubmit={handleUnlock} loading={loading} error={error} lockoutRemaining={lockoutRemaining} />
      <div className="mt-4 pt-4 border-t border-border">
        <Button variant="ghost" size="sm" fullWidth icon={<LogOut size={14} />} onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </AuthLayout>
  )
}
