import { getPasswordStrength } from '@/lib/passwordGenerator'

interface PasswordStrengthBarProps {
  password: string
  showLabel?: boolean
  className?: string
}

export function PasswordStrengthBar({ password, showLabel = true, className = '' }: PasswordStrengthBarProps) {
  const strength = getPasswordStrength(password)

  return (
    <div className={`space-y-1 ${className}`}>
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
      {showLabel && (
        <p className="text-[11px]" style={{ color: strength.color }}>
          {strength.label}
        </p>
      )}
    </div>
  )
}
