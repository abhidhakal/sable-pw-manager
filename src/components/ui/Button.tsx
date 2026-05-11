import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-bg hover:bg-primary-hover active:brightness-90 shadow-sm',
  secondary:
    'bg-surface-elevated text-text-primary hover:bg-[#1e2d28] border border-border',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
  danger:
    'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20',
  outline:
    'bg-transparent text-text-primary border border-border hover:bg-surface-elevated hover:border-border-focus',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-sm gap-2 rounded-[var(--radius-md)]',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-[var(--radius-md)]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-medium
          transition-all duration-(--transition-fast)
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer select-none
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
