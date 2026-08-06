import { z } from 'zod'
import { passwordSchema } from './securitySchemas'
import { t } from '../utils/i18n'

// ─── Shared Authentication Schemas ───────────────────────────────────────────
// Canonical Login / Reset / Signup schemas. Consumers reference these instead
// of declaring file-local schemas, so validation rules exist only once.
//
// The email rule is defined here as a single schema so every form produces the
// same message for the same rule (see Duplicate Register — C12).

export const emailSchema = z.string().email(t('Enter a valid email address'))

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, t('Password is required')),
})

export const resetSchema = z.object({
  email: emailSchema,
})

export const signupSchema = z
  .object({
    fullName: z.string().min(2, t('Enter your full name')),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    couponCode: z.string().optional(),
    examSelection: z.string().min(1, t('Please select the exam you are preparing for')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('Passwords do not match'),
    path: ['confirmPassword'],
  })

// ─── Sub-Admin Onboarding Schema ──────────────────────────────────────────────
// Used by: AdminSubAdmins "Onboard New Educator" modal. Replaces the former
// manual truthiness + inline email-regex checks.

export const subAdminOnboardSchema = z.object({
  name: z.string().trim().min(2, t('Enter a valid name')),
  email: z.string().trim().pipe(emailSchema),
  couponCode: z.string().trim().min(3, t('Coupon code must be at least 3 characters')),
})

export type SubAdminOnboardInput = z.infer<typeof subAdminOnboardSchema>

export type LoginFormData = z.infer<typeof loginSchema>
export type ResetFormData = z.infer<typeof resetSchema>
export type SignupFormData = z.infer<typeof signupSchema>
