import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'

interface ThemeToggleProps {
  size?: 'sm' | 'md'
}

export function ThemeToggle({ size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore()
  const iconSize = size === 'sm' ? 14 : 16

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
    </button>
  )
}
