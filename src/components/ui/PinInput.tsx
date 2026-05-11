import { useRef, useState } from 'react'

interface PinInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  error?: string
  label?: string
  /** If true, only allow numeric input. Defaults to true for backward compat. */
  numericOnly?: boolean
}

export function PinInput({ length = 4, value, onChange, error, label, numericOnly = true }: PinInputProps) {
  const [values, setValues] = useState<string[]>(() =>
    value.length === length ? value.split('') : Array(length).fill('')
  )
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, val: string) => {
    if (numericOnly && val !== '' && !/^\d+$/.test(val)) return

    const newValues = [...values]
    newValues[index] = val.slice(-1)
    setValues(newValues)

    const combinedValue = newValues.join('')
    onChange(combinedValue)

    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length)
    if (numericOnly && !/^\d+$/.test(pastedData)) return

    const newValues = pastedData.split('').concat(Array(length).fill('')).slice(0, length)
    setValues(newValues)
    onChange(newValues.join(''))

    const nextIndex = Math.min(pastedData.length, length - 1)
    inputRefs.current[nextIndex]?.focus()
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-text-secondary text-center mb-2">{label}</label>}
      <div className="flex gap-3 justify-center">
        {values.map((v, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type={numericOnly ? 'tel' : 'text'}
            inputMode={numericOnly ? 'numeric' : undefined}
            pattern={numericOnly ? '[0-9]*' : undefined}
            value={v}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            autoComplete="one-time-code"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            aria-label={`Digit ${i + 1}`}
            className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border bg-surface text-text-primary transition-all [-webkit-text-security:disc]
              ${error ? 'border-danger focus:ring-danger/20' : 'border-border focus:border-primary focus:ring-primary/20'}
              focus:outline-none focus:ring-4`}
          />
        ))}
      </div>
      {error && <p className="text-xs text-danger text-center mt-1">{error}</p>}
    </div>
  )
}