import { Link } from 'react-router'
import { EyeOff, WifiOff, Code2, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { AppMockup } from '@/components/marketing/AppMockup'
import { useSEO } from '@/lib/useSEO'
import { CTA_GRADIENT } from '@/lib/ctaGradient'

const FEATURES = [
  {
    icon: Lock,
    color: 'var(--color-primary)',
    title: 'Zero-knowledge architecture',
    body: "Your master password never leaves your device. We can't decrypt your data even if we wanted to. That's the tradeoff for real privacy.",
  },
  {
    icon: EyeOff,
    color: 'var(--color-secondary)',
    title: 'No tracking, no analytics',
    body: "We don't track what you store, how often you log in, or what sites you visit. The app ships with no analytics SDK.",
  },
  {
    icon: WifiOff,
    color: 'var(--color-primary)',
    title: 'Works offline',
    body: 'Your encrypted vault is cached locally, so you can reach your passwords without a connection after the first sync.',
  },
  {
    icon: Code2,
    color: 'var(--color-secondary)',
    title: 'Open source',
    body: "The encryption code is auditable. You don't have to trust our claims, you can read the implementation yourself.",
  },
]

const SPECS = [
  ['Encryption', 'AES-256-GCM (authenticated encryption)', 'var(--color-primary)'],
  ['Key derivation', 'PBKDF2, 600,000 iterations, SHA-256', 'var(--color-secondary)'],
  ['Storage', 'Firebase Firestore (ciphertext only)', 'var(--color-primary)'],
  ['Session', 'Auto-locks after 5 minutes of inactivity', 'var(--color-secondary)'],
  ['Clipboard', 'Auto-clears copied passwords after 30 seconds', 'var(--color-primary)'],
]

const STEPS = [
  {
    title: 'Sign up with your email',
    body: 'Just an email and account password. Standard stuff.',
  },
  {
    title: 'Create a master password',
    body: 'A short key that derives a 256-bit encryption key entirely on your device.',
  },
  {
    title: 'Add your passwords',
    body: 'Everything is encrypted with AES-256-GCM before it leaves your browser. We store ciphertext, you hold the only key.',
  },
]

export default function LandingPage() {
  useSEO({
    title: 'Sable - Zero-Knowledge Password Manager',
    description: 'Sable is a free, open-source password manager with true end-to-end encryption. Your master password never leaves your device, we never see your data. AES-256-GCM, no tracking, works offline.',
    path: '/',
  })

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-20 lg:pt-28 text-center overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] -z-10 opacity-60"
          style={{
            background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--color-primary) 14%, transparent) 0%, color-mix(in srgb, var(--color-secondary) 10%, transparent) 45%, transparent 70%)',
          }}
        />
        <h1 className="font-display text-[40px] sm:text-[52px] lg:text-[60px] font-semibold text-text-primary leading-[1.08] tracking-tight max-w-[800px] mx-auto">
          Your passwords, encrypted on your device.
        </h1>
        <p className="text-lg sm:text-xl text-text-secondary mt-6 leading-relaxed max-w-[560px] mx-auto">
          Sable encrypts everything in your browser before it ever touches our servers. No master password is transmitted, not to us, not to anyone.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-9">
          <Link to="/signup" className="inline-flex items-center gap-2 text-[15px] font-medium text-white bg-primary hover:bg-primary-hover px-6 py-3.5 rounded-md transition-colors">
            Create your vault <ArrowRight size={16} />
          </Link>
          <Link to="/password-generator" className="inline-flex items-center text-[15px] font-medium text-text-secondary hover:text-text-primary px-6 py-3.5 rounded-md border border-border hover:border-border-focus transition-colors">
            Try the password generator
          </Link>
        </div>
        <p className="text-[13px] text-text-muted mt-5">
          Free. Open source. No data collection.
        </p>
      </section>

      {/* App screenshot */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 pb-24 lg:pb-32">
        <div className="relative">
          <div className="absolute -inset-x-8 -inset-y-8 bg-primary/5 rounded-[2.5rem] blur-3xl -z-10" />
          <AppMockup />
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* How it works */}
      <div className="bg-surface">
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-24">
        <div className="max-w-[560px] mx-auto text-center mb-16">
          <h2 className="text-sm font-medium text-primary uppercase tracking-wider mb-3">How it works</h2>
          <p className="font-display text-[28px] sm:text-[34px] font-semibold text-text-primary tracking-tight">
            Three steps to a locked-down vault
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative">
              <span
                className="text-[40px] font-semibold leading-none"
                style={{ color: i % 2 === 0 ? 'color-mix(in srgb, var(--color-primary) 30%, transparent)' : 'color-mix(in srgb, var(--color-secondary) 30%, transparent)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-[17px] font-medium text-text-primary mt-4">{step.title}</p>
              <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Why Sable */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-24">
        <div className="max-w-[560px] mx-auto text-center mb-16">
          <h2 className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Why Sable</h2>
          <p className="font-display text-[28px] sm:text-[34px] font-semibold text-text-primary tracking-tight">
            Built for people who don't trust the cloud with their secrets
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="p-6 rounded-xl border border-border bg-surface transition-all hover:border-border-focus hover:shadow-sm">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `color-mix(in srgb, ${feature.color} 12%, transparent)` }}>
                <feature.icon size={18} style={{ color: feature.color }} />
              </div>
              <p className="text-[15px] font-medium text-text-primary mb-1.5">{feature.title}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Security specs */}
      <div className="bg-surface">
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Security</h2>
            <p className="font-display text-[28px] sm:text-[34px] font-semibold text-text-primary tracking-tight leading-tight">
              The specifics, in case you're checking
            </p>
            <p className="text-[15px] text-text-secondary mt-4 leading-relaxed max-w-[440px]">
              Every detail of how your data is protected. No marketing fluff, just the mechanisms.
            </p>
          </div>
          <div className="divide-y divide-border">
            {SPECS.map(([label, value, color]) => (
              <div key={label} className="flex items-baseline gap-3 py-4 first:pt-0">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 relative -top-0.5" style={{ backgroundColor: color }} />
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-0 flex-1">
                  <span className="text-sm font-medium text-text-primary sm:w-44 shrink-0">{label}</span>
                  <span className="text-sm text-text-secondary">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>

      {/* CTA */}
      <div className="bg-surface">
      <section className="max-w-6xl mx-auto px-6 lg:px-8 pb-24">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-20 text-center"
          style={{ background: CTA_GRADIENT }}
        >
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-black/10 blur-2xl" />

          <div className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-xs font-medium text-white mb-6">
            <Sparkles size={14} />
            Free forever, no credit card
          </div>
          <p className="relative font-display text-[32px] sm:text-[40px] font-semibold text-white tracking-tight leading-tight">
            Stop reusing passwords.
          </p>
          <p className="relative text-[15px] sm:text-base text-white/85 mt-3 max-w-[460px] mx-auto">
            Set up your encrypted vault in under a minute. Generate strong, unique passwords for every account and let Sable remember them.
          </p>
          <div className="relative flex flex-wrap items-center justify-center gap-4 mt-9">
            <Link to="/signup" className="inline-flex items-center gap-2 text-[15px] font-semibold text-primary bg-white hover:bg-white/90 px-6 py-3.5 rounded-md transition-colors shadow-lg">
              Create your vault <ArrowRight size={16} />
            </Link>
            <Link to="/password-generator" className="inline-flex items-center text-[15px] font-medium text-white/90 hover:text-white px-6 py-3.5 rounded-md border border-white/30 hover:border-white/50 transition-colors">
              Try the generator
            </Link>
          </div>
        </div>
      </section>
      </div>

      <PublicFooter />
    </div>
  )
}
