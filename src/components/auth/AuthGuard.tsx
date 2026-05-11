import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { onAuthChange } from '@/features/auth/authService'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { FullPageSpinner } from '@/components/ui/Spinner'

const AUTH_PAGES = ['/login', '/signup']
const SETUP_PAGE = '/setup-vault'
const UNLOCK_PAGE = '/unlock'

export function AuthGuard({ children }: { children: ReactNode }) {
  const nav = useNavigate()
  const location = useLocation()
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
          // handled below
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
    const path = location.pathname

    if (!user) {
      if (!AUTH_PAGES.includes(path)) nav('/login', { replace: true })
      return
    }

    if (vaultExists === false) {
      if (path !== SETUP_PAGE) nav(SETUP_PAGE, { replace: true })
      return
    }

    if (vaultExists === true && locked) {
      if (path !== UNLOCK_PAGE) nav(UNLOCK_PAGE, { replace: true })
      return
    }

    if (!locked && [...AUTH_PAGES, SETUP_PAGE, UNLOCK_PAGE].includes(path)) {
      nav('/vault', { replace: true })
    }
  }, [user, initialized, checking, vaultExists, locked, location.pathname, nav])

  if (!initialized || checking) return <FullPageSpinner />

  return <>{children}</>
}
