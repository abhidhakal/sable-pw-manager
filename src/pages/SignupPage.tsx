import { AuthLayout } from '@/components/layout/AuthLayout'
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Start securing your passwords with end-to-end encryption.">
      <SignupForm />
    </AuthLayout>
  )
}
