import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 text-text-muted opacity-50">{icon}</div>
      )}
      <h3 className="text-base font-medium text-text-secondary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted max-w-xs mb-5">{description}</p>
      )}
      {action}
    </div>
  )
}
