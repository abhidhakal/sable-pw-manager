import type { Category } from './vault'

export interface CategoryFormData {
  name: string
  icon: string
  color: string
}

/** Default categories seeded on vault setup */
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Social Media', icon: 'Users', color: '#5B8DEF', isDefault: true },
  { name: 'Banking', icon: 'Landmark', color: '#7FAE82', isDefault: true },
  { name: 'Email', icon: 'Mail', color: '#D6A84F', isDefault: true },
  { name: 'Work', icon: 'Briefcase', color: '#6F8F7A', isDefault: true },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#D96C5F', isDefault: true },
  { name: 'Entertainment', icon: 'Gamepad2', color: '#A07BD4', isDefault: true },
  { name: 'Personal', icon: 'User', color: '#5BC0BE', isDefault: true },
  { name: 'Servers', icon: 'Server', color: '#8B9DC3', isDefault: true },
  { name: 'API Keys', icon: 'Key', color: '#E5BD68', isDefault: true },
  { name: 'Secure Notes', icon: 'FileText', color: '#A8B3A9', isDefault: true },
  { name: 'Other', icon: 'FolderOpen', color: '#6F7B73', isDefault: true },
]

/** Available icons for categories */
export const CATEGORY_ICONS = [
  'Users', 'Landmark', 'Mail', 'Briefcase', 'ShoppingBag',
  'Gamepad2', 'User', 'Server', 'Key', 'FileText',
  'FolderOpen', 'Globe', 'Shield', 'Lock', 'CreditCard',
  'Smartphone', 'Wifi', 'Cloud', 'Database', 'Code',
  'Heart', 'Star', 'Bookmark', 'Folder', 'Settings',
] as const

/** Available colors for categories */
export const CATEGORY_COLORS = [
  '#5B8DEF', '#7FAE82', '#D6A84F', '#6F8F7A', '#D96C5F',
  '#A07BD4', '#5BC0BE', '#8B9DC3', '#E5BD68', '#A8B3A9',
  '#6F7B73', '#FF8C69', '#4ECDC4', '#C1666B', '#48639C',
] as const
