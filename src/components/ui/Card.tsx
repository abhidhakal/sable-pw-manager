import type { HTMLAttributes, ReactNode } from 'react'

type CardVariant = 'default' | 'elevated' | 'interactive'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-surface border border-border',
  elevated: 'bg-surface-elevated border border-border shadow-md',
  interactive:
    'bg-surface border border-border hover:border-border-focus hover:bg-surface-elevated transition-all duration-[var(--transition-base)] cursor-pointer',
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-lg ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
