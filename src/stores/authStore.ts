import { create } from 'zustand'
import type { User } from 'firebase/auth'
import * as authService from '@/features/auth/authService'

/** Map Firebase error codes to generic messages to prevent account enumeration */
function sanitizeAuthError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
        return 'Invalid email or password'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.'
      case 'auth/weak-password':
        return 'Password is too weak'
      default:
        return 'Authentication failed. Please try again.'
    }
  }
  return err instanceof Error ? err.message : 'Authentication failed. Please try again.'
}

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  error: string | null

  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void

  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      await authService.signIn(email, password)
    } catch (err) {
      set({ error: sanitizeAuthError(err) })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  signup: async (email, password) => {
    set({ loading: true, error: null })
    try {
      await authService.signUp(email, password)
    } catch (err) {
      set({ error: sanitizeAuthError(err) })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    set({ loading: true })
    try {
      await authService.signOut()
      set({ user: null })
    } catch (err) {
      set({ error: sanitizeAuthError(err) })
    } finally {
      set({ loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
