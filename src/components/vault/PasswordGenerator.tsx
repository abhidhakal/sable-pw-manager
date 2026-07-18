import { useState, useCallback } from 'react'
import { RefreshCw, Copy, Check, Shuffle, Sparkles } from 'lucide-react'
import { generateRandomPassword, generateFunPassword, getPasswordStrength, DEFAULT_PASSWORD_OPTIONS, type PasswordOptions, type PasswordMode } from '@/lib/passwordGenerator'
import { copyToClipboard } from '@/lib/clipboard'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { Confetti } from '@/components/ui/Confetti'

interface PasswordGeneratorProps {
  onUsePassword?: (password: string) => void
  compact?: boolean
}

type ToggleKey = Exclude<keyof PasswordOptions, 'length'>

const TOGGLE_LABELS: Record<PasswordMode, [key: ToggleKey, label: string][]> = {
  random: [
    ['uppercase', 'A-Z'],
    ['lowercase', 'a-z'],
    ['numbers', '0-9'],
    ['symbols', '!@#'],
  ],
  fun: [
    ['uppercase', 'Ab'],
    ['lowercase', 'ab'],
    ['numbers', '123'],
    ['symbols', '#'],
  ],
}

function generate(mode: PasswordMode, options: PasswordOptions): string {
  return mode === 'fun' ? generateFunPassword(options) : generateRandomPassword(options)
}

const DEFAULT_FUN_DIGITS = 3

export function PasswordGenerator({ onUsePassword, compact = false }: PasswordGeneratorProps) {
  const [mode, setMode] = useState<PasswordMode>('random')
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS)
  const [funDigits, setFunDigits] = useState(DEFAULT_FUN_DIGITS)
  const [password, setPassword] = useState(() => generate('random', DEFAULT_PASSWORD_OPTIONS))
  const [copied, setCopied] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)

  const strength = getPasswordStrength(password)
  const length = mode === 'fun' ? funDigits : options.length

  const regenerate = useCallback(() => {
    setPassword(generate(mode, { ...options, length }))
    setCopied(false)
  }, [mode, options, length])

  const switchMode = (newMode: PasswordMode) => {
    setMode(newMode)
    if (newMode === 'fun') setConfettiTrigger((n) => n + 1)
    const newLength = newMode === 'fun' ? funDigits : options.length
    setPassword(generate(newMode, { ...options, length: newLength }))
    setCopied(false)
  }

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

  const updateLength = (value: number) => {
    if (mode === 'fun') {
      setFunDigits(value)
      setPassword(generate(mode, { ...options, length: value }))
    } else {
      const newOptions = { ...options, length: value }
      setOptions(newOptions)
      setPassword(generate(mode, newOptions))
    }
    setCopied(false)
  }

  const updateOption = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
    // Uppercase and lowercase can't both be off — there'd be no letters left.
    if ((key === 'uppercase' || key === 'lowercase') && value === false) {
      const otherKey = key === 'uppercase' ? 'lowercase' : 'uppercase'
      if (!options[otherKey]) return
    }
    const newOptions = { ...options, [key]: value }
    setOptions(newOptions)
    setPassword(generate(mode, { ...newOptions, length }))
    setCopied(false)
  }

  const lengthMin = mode === 'fun' ? 2 : 4
  const lengthMax = mode === 'fun' ? 8 : 64

  return (
    <div className={`space-y-4 ${compact ? '' : 'p-4 bg-surface border border-border rounded-lg'}`}>
      {/* Mode toggle */}
      <div className="relative grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1">
        <Confetti trigger={confettiTrigger} />
        <div
          className="absolute inset-y-1 rounded-full bg-primary transition-[left] duration-300 ease-out"
          style={{ left: mode === 'fun' ? 'calc(50% + 2px)' : '4px', width: 'calc(50% - 6px)' }}
        />
        {(['random', 'fun'] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`relative z-10 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer ${
              mode === m ? 'text-white' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {m === 'random' ? <Shuffle size={13} /> : <Sparkles size={13} />}
            {m}
          </button>
        ))}
      </div>

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

      {/* Length / digit count slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-text-secondary">{mode === 'fun' ? 'Digits' : 'Length'}</label>
          <span className="text-xs text-text-muted font-mono">{length}</span>
        </div>
        <input
          type="range"
          min={lengthMin}
          max={lengthMax}
          value={length}
          onChange={(e) => updateLength(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, var(--color-primary) ${((length - lengthMin) / (lengthMax - lengthMin)) * 100}%, var(--color-border) ${((length - lengthMin) / (lengthMax - lengthMin)) * 100}%)`,
          }}
          className="w-full h-1.5 appearance-none rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-sm
            [&::-moz-range-progress]:h-1.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-primary"
        />
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-2">
        {TOGGLE_LABELS[mode].map(([key, label]) => (
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
