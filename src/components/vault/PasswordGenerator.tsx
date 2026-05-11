import { useState, useCallback } from 'react'
import { RefreshCw, Copy, Check } from 'lucide-react'
import { generateRandomPassword, getPasswordStrength, DEFAULT_PASSWORD_OPTIONS, type PasswordOptions } from '@/lib/passwordGenerator'
import { copyToClipboard } from '@/lib/clipboard'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'

interface PasswordGeneratorProps {
  onUsePassword?: (password: string) => void
  compact?: boolean
}

export function PasswordGenerator({ onUsePassword, compact = false }: PasswordGeneratorProps) {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS)
  const [password, setPassword] = useState(() => generateRandomPassword(DEFAULT_PASSWORD_OPTIONS))
  const [copied, setCopied] = useState(false)

  const strength = getPasswordStrength(password)

  const regenerate = useCallback(() => {
    setPassword(generateRandomPassword(options))
    setCopied(false)
  }, [options])

  const handleCopy = async () => {
    const ok = await copyToClipboard(password)
    if (ok) {
      setCopied(true)
      toast.success('Password copied — clipboard clears in 30s')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleUse = () => {
    onUsePassword?.(password)
    toast.info('Password applied')
  }

  const updateOption = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
    const newOptions = { ...options, [key]: value }
    setOptions(newOptions)
    setPassword(generateRandomPassword(newOptions))
    setCopied(false)
  }

  return (
    <div className={`space-y-4 ${compact ? '' : 'p-4 bg-surface border border-border rounded-lg'}`}>
      {/* Generated password display */}
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2.5 bg-bg border border-border rounded-md font-mono text-sm text-text-primary break-all select-all">
          {password}
        </div>
        <button
          onClick={regenerate}
          className="p-2 rounded-sm text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
          title="Regenerate"
        >
          <RefreshCw size={16} />
        </button>
        <button
          onClick={handleCopy}
          className="p-2 rounded-sm text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
          title="Copy"
        >
          {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
        </button>
      </div>

      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors duration-200"
              style={{
                backgroundColor: i < strength.score ? strength.color : 'var(--color-border)',
              }}
            />
          ))}
        </div>
        <p className="text-[11px]" style={{ color: strength.color }}>
          {strength.label}
        </p>
      </div>

      {/* Length slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-text-secondary">Length</label>
          <span className="text-xs text-text-muted font-mono">{options.length}</span>
        </div>
        <input
          type="range"
          min={4}
          max={64}
          value={options.length}
          onChange={(e) => updateOption('length', Number(e.target.value))}
          className="w-full h-1.5 appearance-none rounded-full bg-border cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-sm"
        />
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-2">
        {([
          ['uppercase', 'A-Z'],
          ['lowercase', 'a-z'],
          ['numbers', '0-9'],
          ['symbols', '!@#'],
        ] as const).map(([key, label]) => (
          <label
            key={key}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer
              border transition-all duration-(--transition-fast)
              ${options[key]
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-surface border-border text-text-muted hover:border-border-focus'}
            `}
          >
            <input
              type="checkbox"
              checked={options[key]}
              onChange={(e) => updateOption(key, e.target.checked)}
              className="sr-only"
            />
            <span className="font-mono text-xs">{label}</span>
          </label>
        ))}
      </div>

      {/* Use password button */}
      {onUsePassword && (
        <Button variant="secondary" size="sm" fullWidth onClick={handleUse}>
          Use This Password
        </Button>
      )}
    </div>
  )
}
