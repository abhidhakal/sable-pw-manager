import { useState, useEffect } from 'react'

interface ClipboardTimerProps {
  /** When the copy happened (Date.now()) */
  startTime: number
  /** Duration in ms (default 30s) */
  duration?: number
  onExpire?: () => void
}

export function ClipboardTimer({ startTime, duration = 30_000, onExpire }: ClipboardTimerProps) {
  const [remaining, setRemaining] = useState(duration)

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const left = Math.max(0, duration - elapsed)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(interval)
        onExpire?.()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [startTime, duration, onExpire])

  const seconds = Math.ceil(remaining / 1000)
  const progress = remaining / duration

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-text-muted">
      <div className="relative w-4 h-4">
        <svg className="w-4 h-4 -rotate-90" viewBox="0 0 16 16">
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="2"
          />
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeDasharray={`${progress * 37.7} 37.7`}
            className="transition-all duration-100"
          />
        </svg>
      </div>
      <span>{seconds}s</span>
    </div>
  )
}
