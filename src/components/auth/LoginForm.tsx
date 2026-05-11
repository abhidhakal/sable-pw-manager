import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { Mail, Lock } from 'lucide-react'
import { loginSchema, type LoginFormData } from '@/schemas/authSchemas'
import { useAuthStore } from '@/stores/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function LoginForm() {
  const { login, loading, error, clearError } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    try {
      await login(data.email, data.password)
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
        placeholder="Enter your password"
        icon={<Lock size={16} />}
        error={errors.password?.message}
        {...register('password')}
      />

      <Button type="submit" fullWidth loading={loading}>
        Sign In
      </Button>

      <p className="text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="text-primary hover:text-primary-hover transition-colors">
          Sign up
        </Link>
      </p>
    </form>
  )
}
