import { Shield, Activity, Link2, Settings, Search, Plus, Code2, CreditCard, Globe, Mail } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

const NAV_ITEMS = [
  { icon: Shield, label: 'All Items', count: 24, active: true },
  { icon: Activity, label: 'Password Health', badge: 3 },
  { icon: Link2, label: 'Shared Links' },
]

const CATEGORIES = [
  { icon: Globe, label: 'Websites', count: 12, color: 'var(--color-primary)' },
  { icon: Code2, label: 'Development', count: 6, color: 'var(--color-secondary)' },
  { icon: CreditCard, label: 'Finance', count: 4, color: '#C9453A' },
  { icon: Mail, label: 'Email', count: 2, color: '#5A7D65' },
]

const ITEMS = [
  { name: 'GitHub', user: 'devon@example.com', color: 'var(--color-secondary)' },
  { name: 'Stripe Dashboard', user: 'devon.k@example.com', color: 'var(--color-primary)' },
  { name: 'AWS Console', user: 'devon@example.com', color: '#C9453A' },
  { name: 'Figma', user: 'devon.k@example.com', color: 'var(--color-secondary)' },
  { name: 'Linear', user: 'devon@example.com', color: 'var(--color-primary)' },
  { name: 'Notion', user: 'devon.k@example.com', color: '#5A7D65' },
]

/** Static replica of the internal vault dashboard, used as a marketing screenshot stand-in. */
export function AppMockup() {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-lg overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 h-10 border-b border-border bg-surface-elevated shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-danger/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
        <div className="flex-1 flex justify-center">
          <div className="h-5 w-64 max-w-full rounded-md bg-bg border border-border" />
        </div>
      </div>

      <div className="flex h-[560px]">
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r border-border bg-surface hidden sm:flex flex-col">
          <div className="p-4 pb-3 border-b border-border flex items-center gap-2.5">
            <Logo className="w-7 h-7 rounded-md" />
            <span className="text-sm font-semibold text-text-primary tracking-tight">Sable</span>
          </div>
          <div className="p-2.5 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm ${
                  item.active ? 'bg-primary/10 text-primary border border-primary/15' : 'text-text-secondary'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <item.icon size={14} />
                  {item.label}
                </span>
                {item.count !== undefined && <span className="text-xs opacity-70">{item.count}</span>}
                {item.badge !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-danger/15 text-danger font-medium">{item.badge}</span>
                )}
              </div>
            ))}
            <div className="pt-3 pb-1 px-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Categories</div>
            {CATEGORIES.map((cat) => (
              <div key={cat.label} className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-text-secondary">
                <span className="flex items-center gap-2.5">
                  <cat.icon size={14} style={{ color: cat.color }} />
                  {cat.label}
                </span>
                <span className="text-xs opacity-50">{cat.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto p-2.5 border-t border-border">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text-secondary">
              <Settings size={14} />
              Settings
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
            <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-md bg-bg border border-border text-text-muted text-sm">
              <Search size={14} />
              Search passwords...
            </div>
            <div className="flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-white text-sm font-medium shrink-0">
              <Plus size={14} />
              <span className="hidden sm:inline">Add</span>
            </div>
          </div>

          {/* Item list */}
          <div className="flex-1 overflow-hidden p-4 space-y-2.5">
            {ITEMS.map((item) => (
              <div key={item.name} className="flex items-center gap-3.5 p-3.5 rounded-lg border border-border bg-surface">
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 text-xs font-semibold"
                  style={{ backgroundColor: `${item.color}1a`, color: item.color }}
                >
                  {item.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                  <p className="text-xs text-text-muted truncate">{item.user}</p>
                </div>
                <div className="hidden sm:block font-mono text-xs text-text-muted tracking-widest">••••••••••</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
