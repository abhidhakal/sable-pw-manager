import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthGuard } from '@/components/auth/AuthGuard'

import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import SetupVaultPage from '@/pages/SetupVaultPage'
import UnlockPage from '@/pages/UnlockPage'
import VaultPage from '@/pages/VaultPage'
import VaultItemPage from '@/pages/VaultItemPage'
import SecureNotePage from '@/pages/SecureNotePage'
import SettingsPage from '@/pages/SettingsPage'
import HealthPage from '@/pages/HealthPage'
import SharedLinksPage from '@/pages/SharedLinksPage'
import ShareViewerPage from '@/pages/ShareViewerPage'

/**
 * Root layout wraps everything in the AuthGuard which
 * subscribes to Firebase auth and handles route redirects.
 */
function RootLayout() {
  return (
    <AuthGuard>
      <Outlet />
    </AuthGuard>
  )
}

export const router = createBrowserRouter([
  // Public share viewer — no auth required
  { path: '/share/:linkId', element: <ShareViewerPage /> },
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/setup-vault', element: <SetupVaultPage /> },
      { path: '/unlock', element: <UnlockPage /> },
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/app/vault" replace /> },
          { path: 'vault', element: <VaultPage /> },
          { path: 'vault/new', element: <VaultItemPage /> },
          { path: 'vault/new-note', element: <SecureNotePage /> },
          { path: 'vault/:id', element: <VaultItemPage /> },
          { path: 'vault/:id/edit', element: <VaultItemPage /> },
          { path: 'health', element: <HealthPage /> },
          { path: 'shared', element: <SharedLinksPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
])
