import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CategoryBadgeProps {
  name: string
  icon: string
  color: string
  size?: 'sm' | 'md'
}

export function CategoryBadge({ name, icon, color, size = 'sm' }: CategoryBadgeProps) {
  const Icon: LucideIcon = (Icons as any)[icon] || Icons.Folder
  const s = size === 'sm' ? 12 : 14
  const cls = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5'

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${cls}`}
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}25` }}
    >
      <Icon size={s} />
      {name}
    </span>
  )
}
