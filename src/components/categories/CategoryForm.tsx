import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { categorySchema, type CategoryFormData } from '@/schemas/vaultSchemas'
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/types/category'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface CategoryFormProps {
  initialData?: { name: string; icon: string; color: string }
  onSubmit: (data: CategoryFormData) => Promise<void>
  loading: boolean
  onCancel: () => void
}

export function CategoryForm({ initialData, onSubmit, loading, onCancel }: CategoryFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData || { name: '', icon: CATEGORY_ICONS[0], color: CATEGORY_COLORS[0] },
  })

  const selectedIcon = watch('icon')
  const selectedColor = watch('color')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Name" placeholder="Category name" error={errors.name?.message} {...register('name')} />

      {/* Icon picker */}
      <div>
        <label className="text-sm font-medium text-text-secondary mb-2 block">Icon</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_ICONS.map((iconName) => {
            const Icon: LucideIcon = (Icons as any)[iconName] || Icons.Folder
            return (
              <button key={iconName} type="button" onClick={() => setValue('icon', iconName)}
                className={`p-2 rounded-md transition-all cursor-pointer ${selectedIcon === iconName ? 'bg-primary/15 border border-primary/30 text-primary' : 'border border-border text-text-muted hover:text-text-secondary hover:border-border-focus'}`}>
                <Icon size={16} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="text-sm font-medium text-text-secondary mb-2 block">Color</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setValue('color', c)}
              className={`w-7 h-7 rounded-full transition-all cursor-pointer ${selectedColor === c ? 'outline-2 outline-offset-2' : 'hover:scale-110'}`}
              style={{ backgroundColor: c, outlineColor: c }} />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" fullWidth onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" fullWidth loading={loading}>{initialData ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  )
}
