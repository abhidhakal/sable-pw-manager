import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { onAuthChange } from '@/features/auth/authService'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { toast } from '@/components/ui/Toast'

const PUBLIC_PAGES = ['/', '/login', '/signup']
// Only these trigger an auth redirect for a signed-in user — i.e. only when
// they explicitly go to log in or sign up. The homepage itself is exempt so
// an authenticated (or locked) user can freely browse it, no bounce.
const AUTH_ENTRY_PAGES = ['/login', '/signup']
const SETUP_PAGE = '/setup-vault'
const UNLOCK_PAGE = '/unlock'

export function AuthGuard({ children }: { children: ReactNode }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { user, initialized, setUser, setInitialized } = useAuthStore()
  const { checkVaultExists, vaultExists, locked, clearVault } = useVaultStore()
  const [checking, setChecking] = useState(true)

  // Subscribe to Firebase auth changes
  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          await checkVaultExists(firebaseUser.uid)
        } catch {
          // Transient failure (e.g. network blip) — retry once before giving
          // up, so a flaky connection doesn't strand the user on a route
          // that can never resolve (vaultExists stays null otherwise, and
          // no redirect branch below matches a null state).
          try {
            await checkVaultExists(firebaseUser.uid)
          } catch {
            toast.error("Couldn't verify your vault — check your connection and reload.")
          }
        }
      } else {
        clearVault()
      }
      setInitialized(true)
      setChecking(false)
    })
    return unsub
  }, [setUser, setInitialized, checkVaultExists, clearVault])

  // Route guard logic
  useEffect(() => {
    if (!initialized || checking) return
    const path = pathname

    // Not logged in — only allow public pages
    if (!user) {
      if (!PUBLIC_PAGES.includes(path)) nav('/login', { replace: true })
      return
    }

    // User is authenticated — redirect login/signup to appropriate place
    if (AUTH_ENTRY_PAGES.includes(path)) {
      if (vaultExists === false) {
        nav(SETUP_PAGE, { replace: true })
      } else if (vaultExists === true && locked) {
        nav(UNLOCK_PAGE, { replace: true })
      } else {
        nav('/app/vault', { replace: true })
      }
      return
    }

    // Handle vault state for app routes
    if (vaultExists === false) {
      if (path !== SETUP_PAGE) nav(SETUP_PAGE, { replace: true })
      return
    }

    if (vaultExists === true && locked) {
      if (path !== UNLOCK_PAGE && !PUBLIC_PAGES.includes(path)) nav(UNLOCK_PAGE, { replace: true })
      return
    }

    // Vault is unlocked — redirect away from setup/unlock to the app
    if (!locked && [SETUP_PAGE, UNLOCK_PAGE].includes(path)) {
      nav('/app/vault', { replace: true })
    }
  }, [user, initialized, checking, vaultExists, locked, pathname, nav])

  if (!initialized || checking) {
    return <FullPageSpinner />
  }

  return <>{children}</>
}
