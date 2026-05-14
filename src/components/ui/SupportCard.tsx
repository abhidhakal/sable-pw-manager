import { Heart, ExternalLink } from 'lucide-react'

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL

/**
 * Full card variant — used in Settings page alongside Appearance.
 */
export function SupportCard() {
  if (!SUPPORT_URL) return null

  return (
    <div className="p-5 bg-surface border border-border rounded-xl flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <Heart size={18} className="text-primary" />
        <h3 className="text-sm font-semibold text-text-primary">Support Sable</h3>
      </div>
      <p className="text-xs text-text-muted leading-relaxed mb-4 flex-1">
        Sable is free and open source. If it's useful to you, consider buying me a momo to keep development going.
      </p>
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 w-full h-9 px-4 rounded-[var(--radius-sm)] text-xs font-medium bg-primary text-white hover:bg-primary-hover transition-all"
      >
        <Heart size={13} className="fill-white" />
        BuyMeMomo
        <ExternalLink size={11} />
      </a>
    </div>
  )
}

/**
 * Small pill variant — used in vault sidebar area.
 */
export function SupportPill() {
  if (!SUPPORT_URL) return null

  return (
    <a
      href={SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/15 hover:border-primary/30 transition-all"
    >
      <Heart size={12} className="fill-primary" />
      Support Me
    </a>
  )
}
