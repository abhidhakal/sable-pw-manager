import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Wand2 } from 'lucide-react'
import { vaultItemSchema, type VaultItemFormData } from '@/schemas/vaultSchemas'
import { useVaultStore } from '@/stores/vaultStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PasswordGenerator } from './PasswordGenerator'
import type { VaultItem } from '@/types/vault'

interface VaultItemFormProps {
  initialData?: VaultItem & { id: string }
  onSubmit: (data: VaultItemFormData) => Promise<void>
  loading: boolean
}

export function VaultItemForm({ initialData, onSubmit, loading }: VaultItemFormProps) {
  const [showGenerator, setShowGenerator] = useState(false)
  const { categories } = useVaultStore()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<VaultItemFormData>({
    resolver: zodResolver(vaultItemSchema),
    defaultValues: initialData
      ? { title: initialData.title, url: initialData.url || '', username: initialData.username, password: initialData.password, notes: initialData.notes || '', categoryId: initialData.categoryId, favorite: initialData.favorite }
      : { title: '', url: '', username: '', password: '', notes: '', categoryId: categories[0]?.id || '', favorite: false },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Two-column grid on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Input label="Title" placeholder="e.g. GitHub" error={errors.title?.message} {...register('title')} />
        <Input label="URL" placeholder="https://example.com" error={errors.url?.message} {...register('url')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Input label="Username / Email" placeholder="user@example.com" error={errors.username?.message} {...register('username')} />

        {/* Category select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Category</label>
          <select {...register('categoryId')} className="w-full h-10 px-3 bg-surface border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-primary cursor-pointer">
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="text-xs text-danger">{errors.categoryId.message}</p>}
        </div>
      </div>

      {/* Password with generator */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-text-secondary">Password</label>
          <button type="button" onClick={() => setShowGenerator(!showGenerator)} className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors cursor-pointer">
            <Wand2 size={12} /> {showGenerator ? 'Hide' : 'Generate'}
          </button>
        </div>
        <Input type="password" placeholder="Enter password" error={errors.password?.message} {...register('password')} />
        {showGenerator && (
          <div className="mt-3">
            <PasswordGenerator compact onUsePassword={(pw) => { setValue('password', pw); setShowGenerator(false) }} />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Notes</label>
        <textarea {...register('notes')} rows={3} placeholder="Optional notes..." className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none" />
        {errors.notes && <p className="text-xs text-danger">{errors.notes.message}</p>}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading} className="min-w-[160px]">
          {initialData ? 'Update Password' : 'Save Password'}
        </Button>
      </div>
    </form>
  )
}
