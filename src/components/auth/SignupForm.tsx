import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { Mail, Lock } from 'lucide-react'
import { signupSchema, type SignupFormData } from '@/schemas/authSchemas'
import { useAuthStore } from '@/stores/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function SignupForm() {
  const { signup, loading, error, clearError } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    clearError()
    try {
      await signup(data.email, data.password)
    } catch {
      // Error is handled by the store
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-danger/10 border border-danger/20 text-sm text-danger">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        icon={<Mail size={16} />}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        icon={<Lock size={16} />}
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        icon={<Lock size={16} />}
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button type="submit" fullWidth loading={loading}>
        Create Account
      </Button>

      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:text-primary-hover transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  )
}
