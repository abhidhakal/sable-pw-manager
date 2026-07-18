import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { RefreshCw, Copy, Check, ArrowRight, Sparkles, Shuffle } from 'lucide-react'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { generateRandomPassword, generateFunPassword, getPasswordStrength, DEFAULT_PASSWORD_OPTIONS, type PasswordOptions, type PasswordMode } from '@/lib/passwordGenerator'
import { copyToClipboard } from '@/lib/clipboard'
import { useSEO } from '@/lib/useSEO'
import { CTA_GRADIENT } from '@/lib/ctaGradient'
import { Confetti } from '@/components/ui/Confetti'

const FAQS = [
  {
    q: 'Is this password generator actually secure?',
    a: 'Yes. It uses the Web Crypto API (crypto.getRandomValues), the same cryptographically secure random number source browsers use for encryption keys, not Math.random(), which is predictable and unsuitable for passwords.',
  },
  {
    q: 'Does Sable store or see the passwords I generate here?',
    a: 'No. Generation happens entirely in your browser via JavaScript. Nothing is sent to a server unless you choose to save it in a Sable vault.',
  },
  {
    q: 'How long should my password be?',
    a: 'Use at least 14 to 16 characters when a site allows it. Length matters more than complexity: a long random password is far harder to brute-force than a short one packed with symbols.',
  },
  {
    q: 'Should I reuse a strong password across sites?',
    a: 'No. Reusing passwords means one breached site exposes every account using that password. Generate a unique one per account and store them in a password manager.',
  },
]

const CHAR_OPTIONS: Record<PasswordMode, readonly [key: Exclude<keyof PasswordOptions, 'length'>, label: string, sample: string][]> = {
  random: [
    ['uppercase', 'Uppercase', 'A-Z'],
    ['lowercase', 'Lowercase', 'a-z'],
    ['numbers', 'Numbers', '0-9'],
    ['symbols', 'Symbols', '!@#$%'],
  ],
  fun: [
    ['uppercase', 'Capitalize', 'Ab'],
    ['lowercase', 'Lowercase', 'ab'],
    ['numbers', 'Digits', '123'],
    ['symbols', 'Separator', '#'],
  ],
}

function generate(mode: PasswordMode, options: PasswordOptions): string {
  return mode === 'fun' ? generateFunPassword(options) : generateRandomPassword(options)
}

const DEFAULT_FUN_DIGITS = 3

export default function PasswordGeneratorPage() {
  const [mode, setMode] = useState<PasswordMode>('random')
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS)
  const [funDigits, setFunDigits] = useState(DEFAULT_FUN_DIGITS)
  const [password, setPassword] = useState(() => generate('random', DEFAULT_PASSWORD_OPTIONS))
  const [copied, setCopied] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)

  useSEO({
    title: 'Free Password Generator - Strong, Random & Secure | Sable',
    description: 'Generate a strong, random password free, no signup. Runs entirely in your browser using the Web Crypto API. Customize length and character sets, then copy it straight to your clipboard.',
    path: '/password-generator',
  })

  const strength = getPasswordStrength(password)
  const length = mode === 'fun' ? funDigits : options.length

  const regenerate = useCallback(() => {
    setPassword(generate(mode, { ...options, length }))
    setCopied(false)
  }, [mode, options, length])

  const switchMode = (newMode: PasswordMode) => {
    setMode(newMode)
    if (newMode === 'fun') setConfettiTrigger((n) => n + 1)
    const newLength = newMode === 'fun' ? funDigits : options.length
    setPassword(generate(newMode, { ...options, length: newLength }))
    setCopied(false)
  }

  const updateLength = (value: number) => {
    if (mode === 'fun') {
      setFunDigits(value)
      setPassword(generate(mode, { ...options, length: value }))
    } else {
      const newOptions = { ...options, length: value }
      setOptions(newOptions)
      setPassword(generate(mode, newOptions))
    }
    setCopied(false)
  }

  const updateOption = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
    // Uppercase and lowercase can't both be off — there'd be no letters left.
    if ((key === 'uppercase' || key === 'lowercase') && value === false) {
      const otherKey = key === 'uppercase' ? 'lowercase' : 'uppercase'
      if (!options[otherKey]) return
    }
    const newOptions = { ...options, [key]: value }
    setOptions(newOptions)
    setPassword(generate(mode, { ...newOptions, length }))
    setCopied(false)
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(password)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const lengthMin = mode === 'fun' ? 2 : 4
  const lengthMax = mode === 'fun' ? 8 : 64
  const lengthPercent = ((length - lengthMin) / (lengthMax - lengthMin)) * 100

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-4 text-center">
        <h1 className="font-display text-[40px] sm:text-[52px] lg:text-[60px] font-semibold text-text-primary leading-[1.08] tracking-tight max-w-200 mx-auto">
          Strong Password Generator
        </h1>
        <p className="text-lg sm:text-xl text-text-secondary mt-6 leading-relaxed max-w-140 mx-auto">
          Create a secure, random password to keep your accounts safe from credential stuffing and brute-force attacks. Runs entirely in your browser, nothing is ever sent to a server.
        </p>
      </section>

      {/* Generator card */}
      <section className="max-w-200 mx-auto px-6 py-12">
        <div className="relative bg-surface border border-border rounded-2xl shadow-lg overflow-hidden">
          <div className="relative z-10 p-6 sm:p-8 space-y-6">
            {/* Mode toggle */}
            <div className="relative grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1">
              <Confetti trigger={confettiTrigger} />
              <div
                className="absolute inset-y-1 rounded-full bg-primary transition-[left] duration-300 ease-out"
                style={{ left: mode === 'fun' ? 'calc(50% + 2px)' : '4px', width: 'calc(50% - 6px)' }}
              />
              {(['random', 'fun'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`relative z-10 flex items-center justify-center gap-2 py-2 text-sm font-medium capitalize transition-colors cursor-pointer ${
                    mode === m ? 'text-white' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {m === 'random' ? <Shuffle size={15} /> : <Sparkles size={15} />}
                  {m}
                </button>
              ))}
            </div>

            {/* Generated password display */}
            <div
              className="relative rounded-xl border-2 p-5 transition-colors duration-300"
              style={{
                borderColor: `color-mix(in srgb, ${strength.color} 45%, var(--color-border))`,
                backgroundColor: `color-mix(in srgb, ${strength.color} 6%, var(--color-bg))`,
              }}
            >
              <p className="font-mono text-2xl sm:text-[28px] text-text-primary break-all select-all text-center leading-snug">
                {password}
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={regenerate}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary border border-border hover:border-border-focus bg-surface transition-colors cursor-pointer"
                >
                  <RefreshCw size={15} />
                  Regenerate
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copied' : 'Copy Password'}
                </button>
              </div>
            </div>

            {/* Strength bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">Password Strength</span>
                <span className="text-sm font-medium" style={{ color: strength.color }}>{strength.label}</span>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-colors duration-200"
                    style={{ backgroundColor: i < strength.score ? strength.color : 'var(--color-border)' }}
                  />
                ))}
              </div>
            </div>

            {/* Length / digit count slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-secondary">{mode === 'fun' ? 'Digits' : 'Password Length'}</label>
                <span className="text-sm text-text-muted font-mono">{length}</span>
              </div>
              <input
                type="range"
                min={lengthMin}
                max={lengthMax}
                value={length}
                onChange={(e) => updateLength(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, var(--color-primary) ${lengthPercent}%, var(--color-border) ${lengthPercent}%)`,
                }}
                className="w-full h-1.5 appearance-none rounded-full cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-sm
                  [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-sm
                  [&::-moz-range-progress]:h-1.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-primary"
              />
            </div>

            {/* Character options */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Characters Used</label>
              <div className="flex rounded-md border border-border divide-x divide-border overflow-hidden">
                {CHAR_OPTIONS[mode].map(([key, label, sample]) => (
                  <label
                    key={key}
                    className={`
                      flex-1 flex flex-col items-center gap-1 py-2.5 cursor-pointer text-center transition-colors
                      ${options[key] ? 'bg-primary/10' : 'bg-surface hover:bg-surface-elevated'}
                    `}
                  >
                    <span className={`font-mono text-xs tracking-wider ${options[key] ? 'text-primary' : 'text-text-muted'}`}>{sample}</span>
                    <span className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={options[key]}
                        onChange={(e) => updateOption(key, e.target.checked)}
                        className="w-3 h-3 rounded-sm accent-primary cursor-pointer"
                      />
                      <span className={`text-[11px] ${options[key] ? 'text-primary font-medium' : 'text-text-secondary'}`}>{label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-[13px] text-text-muted mt-6 text-center">
          Want to save this password and autofill it later? <Link to="/signup" className="text-primary hover:text-primary-hover font-medium">Create a free vault →</Link>
        </p>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Why strong passwords matter */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-24">
        <div className="max-w-[560px] mx-auto text-center mb-16">
          <h2 className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Why it matters</h2>
          <p className="font-display text-[28px] sm:text-[34px] font-semibold text-text-primary tracking-tight">
            A strong password is your first line of defense
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-border bg-surface">
            <p className="text-[16px] font-medium text-text-primary mb-1.5">Attackers guess, not just hack</p>
            <p className="text-[15px] text-text-secondary leading-relaxed">
              Most account breaches come from credential stuffing and brute-force attacks against weak, reused, or predictable passwords, not sophisticated exploits. A long, random password makes those attacks computationally infeasible.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-surface">
            <p className="text-[16px] font-medium text-text-primary mb-1.5">Length beats complexity</p>
            <p className="text-[15px] text-text-secondary leading-relaxed">
              A longer password is exponentially harder to crack than a shorter one stuffed with symbols. Aim for at least 14–16 characters when the site allows it, mixing character types on top of that length.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-surface">
            <p className="text-[16px] font-medium text-text-primary mb-1.5">Never reuse passwords</p>
            <p className="text-[15px] text-text-secondary leading-relaxed">
              If one site you use gets breached, attackers try that same email/password pair everywhere else. A unique password per account contains the damage to a single service.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-surface">
            <p className="text-[16px] font-medium text-text-primary mb-1.5">Generated locally, never stored</p>
            <p className="text-[15px] text-text-secondary leading-relaxed">
              This generator runs entirely in your browser using the Web Crypto API. The password you see here is never transmitted, logged, or saved unless you choose to save it in a vault.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* FAQ */}
      <div className="bg-surface">
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-24">
        <div className="max-w-[560px] mx-auto text-center mb-16">
          <h2 className="text-sm font-medium text-primary uppercase tracking-wider mb-3">FAQ</h2>
          <p className="font-display text-[28px] sm:text-[34px] font-semibold text-text-primary tracking-tight">
            Common questions
          </p>
        </div>
        <div className="max-w-[720px] mx-auto divide-y divide-border">
          {FAQS.map((faq) => (
            <div key={faq.q} className="py-6 first:pt-0">
              <h3 className="text-[16px] font-medium text-text-primary mb-2">{faq.q}</h3>
              <p className="text-[15px] text-text-secondary leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQS.map((faq) => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: { '@type': 'Answer', text: faq.a },
              })),
            }),
          }}
        />
      </section>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-24">
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
            Don't just generate it, save it.
          </p>
          <p className="relative text-[15px] sm:text-base text-white/85 mt-3 max-w-[460px] mx-auto">
            Store every password behind one encrypted master key, and autofill it wherever you need it next.
          </p>
          <div className="relative flex flex-wrap items-center justify-center gap-4 mt-9">
            <Link to="/signup" className="inline-flex items-center gap-2 text-[15px] font-semibold text-primary bg-white hover:bg-white/90 px-6 py-3.5 rounded-md transition-colors shadow-lg">
              Create your vault <ArrowRight size={16} />
            </Link>
            <Link to="/" className="inline-flex items-center text-[15px] font-medium text-white/90 hover:text-white px-6 py-3.5 rounded-md border border-white/30 hover:border-white/50 transition-colors">
              Learn more about Sable
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
