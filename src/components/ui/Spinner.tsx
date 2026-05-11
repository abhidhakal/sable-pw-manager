interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-4 h-4 border-[1.5px]',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`
        ${sizeMap[size]}
        border-border border-t-primary
        rounded-full animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    </div>
  )
}
