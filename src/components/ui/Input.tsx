import { type InputHTMLAttributes, forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  rightElement?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, rightElement, className = '', type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-text-muted pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            className={`
              w-full h-10 px-3 bg-surface border border-border rounded-md
              text-sm text-text-primary placeholder:text-text-muted
              transition-all duration-(--transition-fast)
              hover:border-border-focus
              focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${isPassword || rightElement ? 'pr-10' : ''}
              ${error ? 'border-danger focus:border-danger focus:ring-danger/30' : ''}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          {rightElement && !isPassword && (
            <span className="absolute right-3">{rightElement}</span>
          )}
        </div>
        {error && (
          <p className="text-xs text-danger mt-0.5">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-text-muted mt-0.5">{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
