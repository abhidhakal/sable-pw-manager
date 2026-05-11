import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthGuard } from '@/components/auth/AuthGuard'

import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import SetupVaultPage from '@/pages/SetupVaultPage'
import UnlockPage from '@/pages/UnlockPage'
import VaultPage from '@/pages/VaultPage'
import VaultItemPage from '@/pages/VaultItemPage'
import SettingsPage from '@/pages/SettingsPage'

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
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/setup-vault', element: <SetupVaultPage /> },
      { path: '/unlock', element: <UnlockPage /> },
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/vault" replace /> },
          { path: 'vault', element: <VaultPage /> },
          { path: 'vault/new', element: <VaultItemPage /> },
          { path: 'vault/:id', element: <VaultItemPage /> },
          { path: 'vault/:id/edit', element: <VaultItemPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
])
