import { useMemo, type CSSProperties } from 'react'

interface Particle {
  id: number
  left: number
  tx: number
  ty: number
  rot: number
  dur: number
  delay: number
  color: string
  width: number
  height: number
}

const COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
]

const PARTICLE_COUNT = 60

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    tx: Math.random() * 60 - 30,
    ty: 220 + Math.random() * 160,
    rot: Math.random() * 720 - 360,
    dur: 1100 + Math.random() * 700,
    delay: Math.random() * 200,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    width: 7 + Math.random() * 6,
    height: 10 + Math.random() * 8,
  }))
}

interface ConfettiProps {
  /** Bump this value to fire a new burst (e.g. an incrementing counter). */
  trigger: number
}

/** One-shot decorative confetti burst, fired whenever `trigger` changes. No-op while trigger is 0. */
export function Confetti({ trigger }: ConfettiProps) {
  if (trigger === 0) return null
  return <ConfettiBurst key={trigger} />
}

function ConfettiBurst() {
  const particles = useMemo(() => createParticles(), [])

  return (
    <div className="absolute inset-0 pointer-events-none z-20" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute -top-4 rounded-xs animate-confetti"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            animationDuration: `${p.dur}ms`,
            animationDelay: `${p.delay}ms`,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--rot': `${p.rot}deg`,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}
