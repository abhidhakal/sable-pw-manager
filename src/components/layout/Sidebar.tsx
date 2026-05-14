import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router'
import {
  Shield, Lock, Settings, Plus, ChevronDown, ChevronRight,
  Activity, Sun, Moon, Link2,
  type LucideIcon,
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { useThemeStore } from '@/stores/themeStore'
import { analyzePasswordHealth } from '@/lib/passwordHealth'
import type { Category } from '@/types/vault'

interface SidebarProps {
  categories: (Category & { id: string })[]
  categoryItemCounts: Record<string, number>
  activeCategoryId: string | null
  onSelectCategory: (id: string | null) => void
  onClose: () => void
}

function getCategoryIcon(iconName: string): LucideIcon {
  const icon = (Icons as any)[iconName]
  return icon || Icons.Folder
}

export function Sidebar({
  categories,
  categoryItemCounts,
  activeCategoryId,
  onSelectCategory,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isOnVault = location.pathname.startsWith('/app/vault') || location.pathname === '/'
  const isOnSettings = location.pathname.startsWith('/app/settings')
  const isOnHealth = location.pathname.startsWith('/app/health')
  const isOnShared = location.pathname.startsWith('/app/shared')
  const { user } = useAuthStore()
  const { lockVault, items } = useVaultStore()
  const { theme, toggleTheme } = useThemeStore()
  const [categoriesExpanded, setCategoriesExpanded] = useState(true)

  const totalItems = Object.values(categoryItemCounts).reduce((a, b) => a + b, 0)

  // Health summary for badge
  const healthReport = useMemo(() => analyzePasswordHealth(items), [items])
  const issueCount = healthReport.weakPasswords.length +
    Array.from(healthReport.reusedPasswords.values()).length +
    healthReport.oldPasswords.length

  const handleLock = () => {
    lockVault()
    navigate('/unlock')
  }

  return (
    <aside className="h-full bg-surface border-r border-border flex flex-col">
      {/* Brand */}
      <div className="p-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Sable" className="w-9 h-9 rounded-md" />
          <div>
            <h1 className="text-sm font-semibold text-text-primary tracking-tight">Sable</h1>
            <p className="text-[10px] text-text-muted truncate max-w-35">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
        {/* All Items */}
        <button
          onClick={() => {
            onSelectCategory(null)
            if (!location.pathname.startsWith('/app/vault')) navigate('/app/vault')
            onClose?.()
          }}
          className={`
            w-full flex items-center justify-between px-3 py-2 rounded-md text-sm
            transition-all duration-(--transition-fast) cursor-pointer
            ${isOnVault && activeCategoryId === null
              ? 'bg-primary/10 text-primary border border-primary/15'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'}
          `}
        >
          <span className="flex items-center gap-2.5">
            <Shield size={15} />
            All Items
          </span>
          <span className="text-xs opacity-70">{totalItems}</span>
        </button>

        {/* Health */}
        <button
          onClick={() => {
            navigate('/app/health')
            onClose?.()
          }}
          className={`
            w-full flex items-center justify-between px-3 py-2 rounded-md text-sm
            transition-all duration-(--transition-fast) cursor-pointer
            ${isOnHealth
              ? 'bg-primary/10 text-primary border border-primary/15'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'}
          `}
        >
          <span className="flex items-center gap-2.5">
            <Activity size={15} />
            Password Health
          </span>
          {issueCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-danger/15 text-danger font-medium">
              {issueCount}
            </span>
          )}
        </button>

        {/* Shared Links */}
        <button
          onClick={() => {
            navigate('/app/shared')
            onClose?.()
          }}
          className={`
            w-full flex items-center justify-between px-3 py-2 rounded-md text-sm
            transition-all duration-(--transition-fast) cursor-pointer
            ${isOnShared
              ? 'bg-primary/10 text-primary border border-primary/15'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'}
          `}
        >
          <span className="flex items-center gap-2.5">
            <Link2 size={15} />
            Shared Links
          </span>
        </button>

        {/* Categories header */}
        <div className="pt-3 pb-1">
          <button
            onClick={() => setCategoriesExpanded(!categoriesExpanded)}
            className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors"
          >
            Categories
            {categoriesExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        </div>

        {/* Category list */}
        {categoriesExpanded && (
          <div className="space-y-0.5">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon)
              const count = categoryItemCounts[cat.id] || 0
              const isActive = activeCategoryId === cat.id

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectCategory(cat.id)
                    if (!location.pathname.startsWith('/app/vault')) navigate('/app/vault')
                    onClose?.()
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-md text-sm
                    transition-all duration-(--transition-fast) cursor-pointer
                    ${isOnVault && isActive
                      ? 'bg-surface-elevated text-text-primary border border-border'
                      : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'}
                  `}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon size={15} style={{ color: cat.color }} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  {count > 0 && (
                    <span className="text-xs opacity-50 shrink-0">{count}</span>
                  )}
                </button>
              )
            })}

            {/* Add category */}
            <button
              onClick={() => navigate('/app/settings')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text-muted hover:text-text-secondary hover:bg-surface-elevated transition-all cursor-pointer"
            >
              <Plus size={15} />
              Add Category
            </button>
          </div>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="p-2.5 border-t border-border space-y-0.5">
        <button
          onClick={() => navigate('/app/settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all cursor-pointer
            ${isOnSettings
              ? 'bg-surface-elevated text-text-primary border border-border'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
            }
          `}
        >
          <Settings size={15} />
          Settings
        </button>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleLock}
            className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all cursor-pointer"
          >
            <Lock size={15} />
            Lock Vault
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </aside>
  )
}
