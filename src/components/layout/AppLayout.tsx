import { useState, useEffect, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router'
import { Sidebar } from './Sidebar'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { useVaultStore } from '@/stores/vaultStore'
import { useAuthStore } from '@/stores/authStore'
import { Menu, X } from 'lucide-react'
import { toast } from '@/components/ui/Toast'

const PRE_LOCK_WARNING_MS = 60_000 // Warn 60s before lock

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [preLockWarningShown, setPreLockWarningShown] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { locked, resetAutoLock } = useVaultStore()
  const { user } = useAuthStore()

  // Redirect to unlock if vault is locked
  useEffect(() => {
    if (locked && user && !location.pathname.startsWith('/unlock')) {
      navigate('/unlock', { replace: true })
    }
  }, [locked, user, location.pathname, navigate])

  // Reset auto-lock on user activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const handler = () => {
      if (!locked) {
        resetAutoLock()
        setPreLockWarningShown(false)
      }
    }

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, handler))
  }, [locked, resetAutoLock])

  // Pre-lock warning: show toast 60s before auto-lock
  useEffect(() => {
    if (locked || preLockWarningShown) return

    const AUTO_LOCK_MS = 5 * 60 * 1000
    const warningTimer = setTimeout(() => {
      if (!useVaultStore.getState().locked) {
        toast.warning('Vault will lock in 60 seconds due to inactivity')
        setPreLockWarningShown(true)
      }
    }, AUTO_LOCK_MS - PRE_LOCK_WARNING_MS)

    return () => clearTimeout(warningTimer)
  }, [locked, preLockWarningShown])

  const categories = useVaultStore((s) => s.categories)
  const items = useVaultStore((s) => s.items)
  const activeCategoryId = useVaultStore((s) => s.activeCategoryId)
  const setActiveCategoryId = useVaultStore((s) => s.setActiveCategoryId)

  const categoryItemCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    items.forEach((item) => {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1
    })
    return counts
  }, [items])

  return (
    <div className="h-screen flex bg-bg overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-sm bg-surface-elevated border border-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 transform transition-transform duration-(--transition-base)
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar
          categories={categories}
          categoryItemCounts={categoryItemCounts}
          activeCategoryId={activeCategoryId}
          onSelectCategory={(id) => {
            setActiveCategoryId(id)
            setSidebarOpen(false)
          }}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  )
}
