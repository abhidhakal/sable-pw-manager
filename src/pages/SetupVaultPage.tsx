import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Shield, Lock, AlertTriangle, ArrowRight } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { MasterPasswordSetupForm } from '@/components/vault/MasterPasswordForm'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { Button } from '@/components/ui/Button'

export default function SetupVaultPage() {
  const nav = useNavigate()
  const { user } = useAuthStore()
  const { setupVault, loading } = useVaultStore()
  const [showWelcome, setShowWelcome] = useState(true)

  const handleSetup = async (masterPassword: string) => {
    if (!user) return
    await setupVault(user.uid, masterPassword)
    nav('/app/vault', { replace: true })
  }

  if (showWelcome) {
    return (
      <AuthLayout title="Welcome to Sable" subtitle="Let's set up your encrypted vault.">
        <div className="space-y-5">
          {/* Zero-knowledge explanation */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-md bg-primary/5 border border-primary/15">
              <Shield size={18} className="text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-text-secondary leading-relaxed">
                <p className="font-medium text-text-primary mb-1">Zero-Knowledge Encryption</p>
                <p>Your passwords are encrypted on your device before being stored. We never see your data — only you can decrypt it with your master password.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-md bg-danger/5 border border-danger/15">
              <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />
              <div className="text-xs text-text-secondary leading-relaxed">
                <p className="font-medium text-danger mb-1">No Recovery Possible</p>
                <p>If you forget your master password, your data <strong>cannot be recovered</strong>. There is no reset option. Write it down and store it somewhere safe.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-md bg-surface border border-border">
              <Lock size={18} className="text-text-muted shrink-0 mt-0.5" />
              <div className="text-xs text-text-secondary leading-relaxed">
                <p className="font-medium text-text-primary mb-1">How it works</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>You create a 4-character master password</li>
                  <li>A 256-bit encryption key is derived from it</li>
                  <li>All your data is encrypted with AES-256-GCM</li>
                  <li>Only the encrypted data is stored in the cloud</li>
                </ul>
              </div>
            </div>
          </div>

          <Button fullWidth icon={<ArrowRight size={16} />} onClick={() => setShowWelcome(false)}>
            I understand, let's set up my vault
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your master password" subtitle="This password protects your entire vault. Make it memorable but unique.">
      <MasterPasswordSetupForm onSubmit={handleSetup} loading={loading} />
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-text-muted text-center">
          💡 Tip: Write down your master password and store it in a safe place. There is no way to recover it.
        </p>
      </div>
    </AuthLayout>
  )
}
