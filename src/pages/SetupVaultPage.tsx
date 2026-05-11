import { useNavigate } from 'react-router'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { MasterPasswordSetupForm } from '@/components/vault/MasterPasswordForm'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'

export default function SetupVaultPage() {
  const nav = useNavigate()
  const { user } = useAuthStore()
  const { setupVault, loading } = useVaultStore()

  const handleSetup = async (masterPassword: string) => {
    if (!user) return
    await setupVault(user.uid, masterPassword)
    nav('/vault', { replace: true })
  }

  return (
    <AuthLayout title="Setup your vault" subtitle="Create a strong master password to protect your vault. This password is never stored or sent to our servers.">
      <MasterPasswordSetupForm onSubmit={handleSetup} loading={loading} />
    </AuthLayout>
  )
}
