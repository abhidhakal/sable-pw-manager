import { Link, useLocation } from 'react-router'
import { Logo } from '@/components/ui/Logo'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/password-generator', label: 'Password Generator' },
] as const

export function PublicHeader() {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <Logo className="w-7 h-7 rounded-md" />
          <span className="text-[15px] font-display font-semibold text-text-primary tracking-tight">Sable</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === link.to
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            Sign In
          </Link>
          <Link to="/signup" className="text-sm font-medium text-white bg-primary hover:bg-primary-hover px-4 py-2 rounded-md transition-colors">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
