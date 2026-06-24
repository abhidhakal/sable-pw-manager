import { useThemeStore } from '@/stores/themeStore'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  const { theme } = useThemeStore()
  return (
    <img
      src={theme === 'dark' ? '/logo-black-sm.png' : '/logo-sm.png'}
      alt="Sable"
      className={className}
      width={48}
      height={48}
      loading="eager"
      decoding="async"
      fetchPriority="high"
    />
  )
}
