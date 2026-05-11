import { z } from 'zod'

export const vaultItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  url: z.string().max(500, 'URL is too long').optional(),
  username: z.string().min(1, 'Username is required').max(200, 'Username is too long'),
  password: z.string().min(1, 'Password is required'),
  notes: z.string().max(2000, 'Notes are too long').optional(),
  categoryId: z.string().min(1, 'Category is required'),
  favorite: z.boolean().optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(30, 'Name is too long'),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().min(1, 'Color is required'),
})

export type VaultItemFormData = z.infer<typeof vaultItemSchema>
export type CategoryFormData = z.infer<typeof categorySchema>
