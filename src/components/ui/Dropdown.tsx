import { useState, useRef, useEffect, type ReactNode } from 'react'

interface DropdownProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({ trigger, children, align = 'right', className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={`
            absolute top-full mt-1.5 z-50 min-w-45
            bg-surface-elevated border border-border rounded-md
            shadow-lg animate-slide-down overflow-hidden
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps {
  children: ReactNode
  onClick?: () => void
  danger?: boolean
  icon?: ReactNode
  disabled?: boolean
}

export function DropdownItem({ children, onClick, danger, icon, disabled }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left
        transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${
          danger
            ? 'text-danger hover:bg-danger/10'
            : 'text-text-secondary hover:bg-surface hover:text-text-primary'
        }
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
