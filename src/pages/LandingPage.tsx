import { Link } from 'react-router'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#FAFAF8]/90 backdrop-blur-sm border-b border-[#E8E7E4]">
        <div className="max-w-[720px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Sable" className="w-7 h-7 rounded-md" />
            <span className="text-[15px] font-semibold text-[#1A1A1A]">Sable</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-[#5A5A5A] hover:text-[#1A1A1A] transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="text-sm font-medium text-white bg-[#B8892E] hover:bg-[#A07524] px-4 py-2 rounded-md transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[720px] mx-auto px-6 pt-24 pb-20">
        <h1 className="text-[32px] md:text-[40px] font-semibold text-[#1A1A1A] leading-tight tracking-tight">
          Your passwords, encrypted<br className="hidden md:block" /> on your device.
        </h1>
        <p className="text-[17px] text-[#5A5A5A] mt-4 leading-relaxed max-w-[560px]">
          Sable is a password manager that encrypts everything in your browser before it touches our servers. No master password is ever transmitted.
        </p>
        <div className="mt-8">
          <Link to="/signup" className="inline-flex items-center text-[15px] font-medium text-white bg-[#B8892E] hover:bg-[#A07524] px-6 py-3 rounded-md transition-colors">
            Create your vault →
          </Link>
        </div>
        <p className="text-[13px] text-[#9A9A9A] mt-4">
          Free. Open source. No data collection.
        </p>
      </section>

      {/* Divider */}
      <div className="max-w-[720px] mx-auto px-6">
        <div className="h-px bg-[#E8E7E4]" />
      </div>

      {/* How it works */}
      <section className="max-w-[720px] mx-auto px-6 py-20">
        <h2 className="text-[13px] font-medium text-[#9A9A9A] uppercase tracking-wider mb-10">How it works</h2>
        <div className="space-y-8">
          <div className="flex gap-5">
            <span className="text-[24px] font-semibold text-[#B8892E] leading-none mt-0.5">1</span>
            <div>
              <p className="text-[16px] font-medium text-[#1A1A1A]">Sign up with your email</p>
              <p className="text-[15px] text-[#5A5A5A] mt-1">Just an email and account password. Standard stuff.</p>
            </div>
          </div>
          <div className="flex gap-5">
            <span className="text-[24px] font-semibold text-[#B8892E] leading-none mt-0.5">2</span>
            <div>
              <p className="text-[16px] font-medium text-[#1A1A1A]">Create a master password</p>
              <p className="text-[15px] text-[#5A5A5A] mt-1">A short key that derives a 256-bit encryption key entirely on your device.</p>
            </div>
          </div>
          <div className="flex gap-5">
            <span className="text-[24px] font-semibold text-[#B8892E] leading-none mt-0.5">3</span>
            <div>
              <p className="text-[16px] font-medium text-[#1A1A1A]">Add your passwords</p>
              <p className="text-[15px] text-[#5A5A5A] mt-1">Everything is encrypted with AES-256-GCM before leaving your browser. We store ciphertext. You hold the only key.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[720px] mx-auto px-6">
        <div className="h-px bg-[#E8E7E4]" />
      </div>

      {/* What makes Sable different */}
      <section className="max-w-[720px] mx-auto px-6 py-20">
        <h2 className="text-[13px] font-medium text-[#9A9A9A] uppercase tracking-wider mb-10">Why Sable</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          <div>
            <p className="text-[16px] font-medium text-[#1A1A1A] mb-1.5">Zero-knowledge architecture</p>
            <p className="text-[15px] text-[#5A5A5A] leading-relaxed">
              Your master password never leaves your device. We can't decrypt your data even if we wanted to. If you lose your master password, your data is gone — that's the tradeoff for real privacy.
            </p>
          </div>
          <div>
            <p className="text-[16px] font-medium text-[#1A1A1A] mb-1.5">No tracking, no analytics</p>
            <p className="text-[15px] text-[#5A5A5A] leading-relaxed">
              We don't track what you store, how often you log in, or what sites you visit. The app has no analytics SDK.
            </p>
          </div>
          <div>
            <p className="text-[16px] font-medium text-[#1A1A1A] mb-1.5">Works offline</p>
            <p className="text-[15px] text-[#5A5A5A] leading-relaxed">
              Your encrypted vault is cached locally. You can access your passwords without an internet connection after the first sync.
            </p>
          </div>
          <div>
            <p className="text-[16px] font-medium text-[#1A1A1A] mb-1.5">Open source</p>
            <p className="text-[15px] text-[#5A5A5A] leading-relaxed">
              The encryption code is auditable. You don't have to trust our claims — you can read the implementation.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[720px] mx-auto px-6">
        <div className="h-px bg-[#E8E7E4]" />
      </div>

      {/* Security specs */}
      <section className="max-w-[720px] mx-auto px-6 py-20">
        <h2 className="text-[13px] font-medium text-[#9A9A9A] uppercase tracking-wider mb-10">Security</h2>
        <div className="space-y-4">
          {[
            ['Encryption', 'AES-256-GCM (authenticated encryption)'],
            ['Key derivation', 'PBKDF2, 600,000 iterations, SHA-256'],
            ['Storage', 'Firebase Firestore (ciphertext only)'],
            ['Session', 'Auto-locks after 5 minutes of inactivity'],
            ['Clipboard', 'Auto-clears copied passwords after 30 seconds'],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-0">
              <span className="text-[14px] font-medium text-[#1A1A1A] sm:w-40 shrink-0">{label}</span>
              <span className="text-[14px] text-[#5A5A5A]">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-[720px] mx-auto px-6 py-12 border-t border-[#E8E7E4]">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[#9A9A9A]">Sable</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#9A9A9A] hover:text-[#5A5A5A] transition-colors">
              GitHub
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#9A9A9A] hover:text-[#5A5A5A] transition-colors">
              Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
