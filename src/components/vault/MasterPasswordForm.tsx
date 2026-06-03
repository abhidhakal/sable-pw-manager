import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { masterPasswordSchema, type MasterPasswordFormData } from '@/schemas/authSchemas'
import { Button } from '@/components/ui/Button'
import { PinInput } from '@/components/ui/PinInput'

interface SetupFormProps {
  onSubmit: (masterPassword: string) => Promise<void>
  loading: boolean
}

export function MasterPasswordSetupForm({ onSubmit, loading }: SetupFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MasterPasswordFormData>({
    resolver: zodResolver(masterPasswordSchema),
    defaultValues: {
      masterPassword: '',
      confirmMasterPassword: '',
    },
  })

  const handleFormSubmit = async (data: MasterPasswordFormData) => {
    await onSubmit(data.masterPassword)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      <div className="flex items-start gap-3 p-3 rounded-md bg-primary/5 border border-primary/15">
        <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          Create a 4-digit master password to protect your vault. If you lose this password, your data cannot be recovered.
        </p>
      </div>

      <div className="space-y-6">
        <Controller
          control={control}
          name="masterPassword"
          render={({ field: { onChange, value } }) => (
            <PinInput
              label="Master Password"
              length={4}
              value={value}
              onChange={onChange}
              error={errors.masterPassword?.message}
              numericOnly={false}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmMasterPassword"
          render={({ field: { onChange, value } }) => (
            <PinInput
              label="Confirm Master Password"
              length={4}
              value={value}
              onChange={onChange}
              error={errors.confirmMasterPassword?.message}
              numericOnly={false}
            />
          )}
        />
      </div>

      <Button type="submit" fullWidth loading={loading}>
        Create Vault
      </Button>
    </form>
  )
}

interface UnlockFormProps {
  onSubmit: (masterPassword: string) => Promise<void>
  loading: boolean
  error?: string | null
  lockoutRemaining?: number | null
}

export function MasterPasswordUnlockForm({ onSubmit, loading, error, lockoutRemaining }: UnlockFormProps) {
  const [masterPassword, setMasterPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  // Reset loggingIn on error or lockout
  const [prevError, setPrevError] = useState(error)
  const [prevLockout, setPrevLockout] = useState(lockoutRemaining)

  if (error !== prevError || lockoutRemaining !== prevLockout) {
    setPrevError(error)
    setPrevLockout(lockoutRemaining)
    if (error || (lockoutRemaining && lockoutRemaining > 0)) {
      setLoggingIn(false)
    }
  }

  const handleChange = (value: string) => {
    setMasterPassword(value)
    if (value.length === 4) {
      setLoggingIn(true)
      onSubmit(value)
    }
  }

  return (
    <div className="space-y-4">
      {lockoutRemaining && lockoutRemaining > 0 && (
        <div className="p-3 rounded-md bg-warning/10 border border-warning/20 text-sm text-warning text-center">
          Too many failed attempts. Try again in {Math.ceil(lockoutRemaining / 1000)}s.
        </div>
      )}

      {error && !lockoutRemaining && (
        <div className="p-3 rounded-md bg-danger/10 border border-danger/20 text-sm text-danger text-center">
          {error}
        </div>
      )}

      {loggingIn && !error && !lockoutRemaining && (
        <div className="text-center text-sm text-success">Logging in...</div>
      )}

      {loading && !loggingIn && (
        <div className="text-center text-sm text-text-muted">Unlocking...</div>
      )}

      <PinInput
        length={4}
        value={masterPassword}
        onChange={handleChange}
        numericOnly={false}
        label="Enter your master password"
      />
    </div>
  )
}
