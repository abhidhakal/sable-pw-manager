interface BadgeProps {
  children: React.ReactNode
  color?: string
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, color, size = 'sm', className = '' }: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full
        ${sizeClasses} ${className}
      `}
      style={{
        backgroundColor: color ? `${color}15` : undefined,
        color: color || undefined,
        border: color ? `1px solid ${color}25` : undefined,
      }}
    >
      {children}
    </span>
  )
}
