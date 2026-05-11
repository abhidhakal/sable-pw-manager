import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/\d/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const masterPasswordSchema = z
  .object({
    masterPassword: z
      .string()
      .min(4, 'Master password must be at least 4 characters'),
    confirmMasterPassword: z.string().min(1, 'Please confirm your master password'),
  })
  .refine((data) => data.masterPassword === data.confirmMasterPassword, {
    message: 'Master passwords do not match',
    path: ['confirmMasterPassword'],
  })

export const unlockSchema = z.object({
  masterPassword: z
    .string()
    .min(1, 'Enter your master password'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type MasterPasswordFormData = z.infer<typeof masterPasswordSchema>
export type UnlockFormData = z.infer<typeof unlockSchema>
