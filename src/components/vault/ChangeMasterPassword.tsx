import { useState } from 'react'
import { Key, AlertTriangle, CheckCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { PinInput } from '@/components/ui/PinInput'
import { useVaultStore } from '@/stores/vaultStore'
import { useAuthStore } from '@/stores/authStore'
import { deriveVaultKey, verifyKey, generateSalt, createVerifier, encryptVaultItem } from '@/lib/crypto'
import * as vaultMetaService from '@/features/vault/vaultMetaService'
import * as vaultService from '@/features/vault/vaultService'

import { toast } from '@/components/ui/Toast'

interface ChangeMasterPasswordProps {
  open: boolean
  onClose: () => void
}

type Step = 'current' | 'new' | 'confirm' | 'processing' | 'done'

export function ChangeMasterPassword({ open, onClose }: ChangeMasterPasswordProps) {
  const { user } = useAuthStore()
  const { items, vaultKey } = useVaultStore()
  const [step, setStep] = useState<Step>('current')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const reset = () => {
    setStep('current')
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setError(null)
    setProgress({ current: 0, total: 0 })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleVerifyCurrent = async () => {
    if (!user || !vaultKey) return
    setError(null)

    try {
      const meta = await vaultMetaService.getVaultMeta(user.uid)
      if (!meta) throw new Error('Vault metadata not found')

      const key = await deriveVaultKey(currentPw, meta.salt)
      const valid = await verifyKey(key, meta.encryptedVerifier)

      if (!valid) {
        setError('Invalid current master password')
        setCurrentPw('')
        return
      }

      setStep('new')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      setCurrentPw('')
    }
  }

  const handleSetNew = () => {
    if (newPw.length < 4) {
      setError('Master password must be at least 4 characters')
      return
    }
    setError(null)
    setStep('confirm')
  }

  const handleConfirm = async () => {
    if (newPw !== confirmPw) {
      setError('Passwords do not match')
      setConfirmPw('')
      return
    }

    if (!user) return
    setError(null)
    setStep('processing')

    try {
      // Generate new salt and key
      const newSalt = generateSalt()
      const newKey = await deriveVaultKey(newPw, newSalt)
      const newVerifier = await createVerifier(newKey)

      // Encrypt all items in memory first — no Firestore writes yet
      setProgress({ current: 0, total: items.length })
      let done = 0
      const encrypted = await Promise.all(
        items.map(async (item) => {
          const enc = await encryptVaultItem(item, newKey)
          done++
          setProgress({ current: done, total: items.length })
          return { itemId: item.id as string, encrypted: enc }
        }),
      )

      // Atomically batch-write all re-encrypted items, then update vault meta.
      // If the batch fails, vault meta is untouched and old key still works.
      await vaultService.updateVaultItemsBatch(user.uid, encrypted)
      await vaultMetaService.updateVaultMeta(user.uid, newSalt, newVerifier)

      // Lock vault to force re-unlock with new password
      useVaultStore.getState().lockVault()

      setStep('done')
      toast.success('Master password changed successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change master password')
      setStep('current')
    }
  }

  // Auto-submit on pin completion
  const handleCurrentChange = (value: string) => {
    setCurrentPw(value)
    if (value.length === 4) {
      setTimeout(() => handleVerifyCurrent(), 100)
    }
  }

  const handleNewChange = (value: string) => {
    setNewPw(value)
  }

  const handleConfirmChange = (value: string) => {
    setConfirmPw(value)
    if (value.length === 4 && newPw.length === 4) {
      setTimeout(() => handleConfirm(), 100)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Change Master Password" size="sm">
      <div className="space-y-4">
        {step === 'current' && (
          <>
            <div className="flex items-start gap-3 p-3 rounded-md bg-warning/5 border border-warning/20">
              <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary">
                All passwords will be re-encrypted with your new master password. This may take a moment.
              </p>
            </div>
            {error && (
              <div className="p-3 rounded-md bg-danger/10 border border-danger/20 text-sm text-danger text-center">
                {error}
              </div>
            )}
            <PinInput
              length={4}
              value={currentPw}
              onChange={handleCurrentChange}
              numericOnly={false}
              label="Enter current master password"
            />
          </>
        )}

        {step === 'new' && (
          <>
            <p className="text-sm text-text-secondary text-center">Choose your new master password</p>
            {error && (
              <div className="p-3 rounded-md bg-danger/10 border border-danger/20 text-sm text-danger text-center">
                {error}
              </div>
            )}
            <PinInput
              length={4}
              value={newPw}
              onChange={handleNewChange}
              numericOnly={false}
              label="New master password"
            />
            <Button fullWidth onClick={handleSetNew} disabled={newPw.length < 4}>
              Continue
            </Button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <p className="text-sm text-text-secondary text-center">Confirm your new master password</p>
            {error && (
              <div className="p-3 rounded-md bg-danger/10 border border-danger/20 text-sm text-danger text-center">
                {error}
              </div>
            )}
            <PinInput
              length={4}
              value={confirmPw}
              onChange={handleConfirmChange}
              numericOnly={false}
              label="Confirm new password"
            />
          </>
        )}

        {step === 'processing' && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <Key size={24} className="text-primary mx-auto mb-2 animate-spin" />
              <p className="text-sm text-text-primary font-medium">Re-encrypting vault...</p>
              <p className="text-xs text-text-muted mt-1">
                {progress.current} of {progress.total} items
              </p>
            </div>
            <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle size={40} className="text-success mx-auto" />
            <div>
              <p className="text-sm text-text-primary font-medium">Master password changed</p>
              <p className="text-xs text-text-muted mt-1">Please unlock your vault with the new password.</p>
            </div>
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
