import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('sable-theme') as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  // Default to light
  return 'light'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  // Update meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#0C0D0E' : '#F8F7F4')
  }
}

// Apply on load
const initialTheme = getInitialTheme()
applyTheme(initialTheme)

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,

  setTheme: (theme) => {
    localStorage.setItem('sable-theme', theme)
    applyTheme(theme)
    set({ theme })
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('sable-theme', next)
      applyTheme(next)
      return { theme: next }
    })
  },
}))
