import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useVaultStore } from '@/stores/vaultStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const secureNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  notes: z.string().min(1, 'Content is required').max(10000, 'Content is too long'),
  categoryId: z.string().min(1, 'Category is required'),
})

type SecureNoteFormData = z.infer<typeof secureNoteSchema>

interface SecureNoteFormProps {
  initialData?: { title: string; notes: string; categoryId: string }
  onSubmit: (data: { title: string; username: string; password: string; notes: string; categoryId: string }) => Promise<void>
  loading: boolean
}

export function SecureNoteForm({ initialData, onSubmit, loading }: SecureNoteFormProps) {
  const { categories } = useVaultStore()

  const { register, handleSubmit, formState: { errors } } = useForm<SecureNoteFormData>({
    resolver: zodResolver(secureNoteSchema),
    defaultValues: initialData || {
      title: '',
      notes: '',
      categoryId: categories.find((c) => c.name === 'Secure Notes')?.id || categories[0]?.id || '',
    },
  })

  const handleFormSubmit = async (data: SecureNoteFormData) => {
    // Store as a vault item with a special marker in username
    await onSubmit({
      title: data.title,
      username: '__secure_note__',
      password: '__secure_note__',
      notes: data.notes,
      categoryId: data.categoryId,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input label="Title" placeholder="e.g. Recovery Codes" error={errors.title?.message} {...register('title')} />

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

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Content</label>
        <textarea
          {...register('notes')}
          rows={8}
          placeholder="Paste your recovery codes, API keys, or any secure text here..."
          className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none font-mono"
        />
        {errors.notes && <p className="text-xs text-danger">{errors.notes.message}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" fullWidth loading={loading}>
          {initialData ? 'Update Note' : 'Save Note'}
        </Button>
      </div>
    </form>
  )
}
