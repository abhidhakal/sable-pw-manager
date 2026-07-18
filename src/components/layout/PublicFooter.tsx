import { Link } from 'react-router'
import { Heart } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export function PublicFooter() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col items-center sm:items-start gap-2">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="w-6 h-6 rounded-md" />
            <span className="font-display text-sm font-semibold text-text-primary">Sable</span>
          </Link>
          <p className="text-[13px] text-text-muted">© {new Date().getFullYear()} Sable · Open source</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
          <Link to="/password-generator" className="text-[13px] text-text-muted hover:text-text-secondary transition-colors">
            Password Generator
          </Link>
          <Link to="/login" className="text-[13px] text-text-muted hover:text-text-secondary transition-colors">
            Sign In
          </Link>
          <a href="https://github.com/abhidhakal/sable-pw-manager" target="_blank" rel="noopener noreferrer" className="text-[13px] text-text-muted hover:text-text-secondary transition-colors">
            GitHub
          </a>
          <a href={import.meta.env.VITE_SUPPORT_URL || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[13px] text-primary hover:text-primary-hover font-medium transition-colors">
            <Heart size={12} /> Support
          </a>
        </div>
      </div>
    </footer>
  )
}
