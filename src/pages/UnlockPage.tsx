import { useState } from 'react'
import { useNavigate } from 'react-router'
import { LogOut, Loader2, XCircle } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { Button } from '@/components/ui/Button'
import { PinInput } from '@/components/ui/PinInput'
import { Modal } from '@/components/ui/Modal'

export default function UnlockPage() {
  const nav = useNavigate()
  const { user, logout } = useAuthStore()
  const { unlockVault, getLockoutRemaining } = useVaultStore()
  const [masterPassword, setMasterPassword] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lockoutRemaining = getLockoutRemaining()

  const handleChange = (value: string) => {
    setMasterPassword(value)
    if (value.length === 4) {
      handleUnlock(value)
    }
  }

  const handleUnlock = async (password: string) => {
    if (!user) return
    setError(null)
    setUnlocking(true)
    try {
      await unlockVault(user.uid, password)
      const lastPath = sessionStorage.getItem('sable:lastPath')
      sessionStorage.removeItem('sable:lastPath')
      nav(lastPath && lastPath.startsWith('/app') ? lastPath : '/app/vault', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock vault')
      setMasterPassword('')
      setUnlocking(false)
    }
  }

  const handleLogout = async () => {
    useVaultStore.getState().clearVault()
    await logout()
    nav('/login', { replace: true })
  }

  const dismissError = () => {
    setError(null)
  }

  return (
    <AuthLayout title="Unlock your vault" subtitle="Enter your master password to access your passwords.">
      {/* User email */}
      <div className="text-center mb-6">
        <p className="text-xs text-text-muted">Signed in as</p>
        <p className="text-sm text-text-secondary font-medium">{user?.email}</p>
      </div>

      {/* Lockout warning */}
      {lockoutRemaining && lockoutRemaining > 0 && (
        <div className="p-3 rounded-md bg-warning/10 border border-warning/20 text-sm text-warning text-center mb-4">
          Too many failed attempts. Try again in {Math.ceil(lockoutRemaining / 1000)}s.
        </div>
      )}

      {/* Pin input */}
      <PinInput
        length={4}
        value={masterPassword}
        onChange={handleChange}
        numericOnly={false}
        label="Enter your master password"
      />

      <div className="mt-6 pt-4 border-t border-border">
        <Button variant="ghost" size="sm" fullWidth icon={<LogOut size={14} />} onClick={handleLogout}>
          Sign out
        </Button>
      </div>

      {/* Unlocking modal */}
      <Modal open={unlocking && !error} onClose={() => {}} showClose={false} size="sm">
        <div className="flex flex-col items-center py-6">
          <Loader2 size={32} className="text-primary animate-spin mb-4" />
          <p className="text-sm text-text-primary font-medium">Unlocking vault...</p>
          <p className="text-xs text-text-muted mt-1">Decrypting your data</p>
        </div>
      </Modal>

      {/* Error modal */}
      <Modal open={!!error} onClose={dismissError} showClose={true} size="sm">
        <div className="flex flex-col items-center py-4">
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mb-4">
            <XCircle size={24} className="text-danger" />
          </div>
          <p className="text-sm text-text-primary font-medium mb-1">Unlock Failed</p>
          <p className="text-xs text-text-muted text-center">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={dismissError}>
            Try Again
          </Button>
        </div>
      </Modal>
    </AuthLayout>
  )
}
