import { useThemeStore } from '@/stores/themeStore'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  const { theme } = useThemeStore()
  return (
    <img
      src={theme === 'dark' ? '/logo-black.png' : '/logo.png'}
      alt="Sable"
      className={className}
    />
  )
}
