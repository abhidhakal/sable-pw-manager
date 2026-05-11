import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-primary) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="Sable"
            className="w-16 h-16 rounded-xl mb-4"
          />
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-text-muted mt-1.5 text-center max-w-xs">{subtitle}</p>
          )}
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-lg animate-slide-up">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted mt-6">
          Your data is encrypted end-to-end.
          <br />
          We never see your passwords.
        </p>
      </div>
    </div>
  )
}
