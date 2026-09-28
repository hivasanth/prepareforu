// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { emailSchema, loginSchema, resetSchema, signupSchema, subAdminOnboardSchema } from './authSchemas'

// ─── emailSchema ─────────────────────────────────────────────────────────────

describe('emailSchema', () => {
  it('accepts a valid email', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true)
  })

  it('rejects missing @', () => {
    expect(emailSchema.safeParse('userexample.com').success).toBe(false)
  })

  it('rejects missing domain', () => {
    expect(emailSchema.safeParse('user@').success).toBe(false)
  })

  it('rejects empty string', () => {
    expect(emailSchema.safeParse('').success).toBe(false)
  })

  it('produces the canonical message for an invalid email', () => {
    const result = emailSchema.safeParse('not-an-email')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Enter a valid email address')
    }
  })
})

// ─── loginSchema ─────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  const VALID = { email: 'user@example.com', password: 'secret123' }

  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ ...VALID, email: 'bad' }).success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ ...VALID, password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password is required')
    }
  })
})

// ─── resetSchema ─────────────────────────────────────────────────────────────

describe('resetSchema', () => {
  it('accepts a valid email', () => {
    expect(resetSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(resetSchema.safeParse({ email: 'bad' }).success).toBe(false)
  })
})

// ─── signupSchema ────────────────────────────────────────────────────────────

describe('signupSchema', () => {
  const VALID = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    password: 'StrongP@ss1',
    confirmPassword: 'StrongP@ss1',
    examSelection: 'APPSC_GROUPS',
  }

  it('accepts a valid signup payload', () => {
    expect(signupSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects passwords that do not match', () => {
    const result = signupSchema.safeParse({ ...VALID, confirmPassword: 'DifferentP@ss1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('confirmPassword')
    }
  })

  it('rejects a weak password (shared password policy)', () => {
    expect(signupSchema.safeParse({ ...VALID, password: 'weak', confirmPassword: 'weak' }).success).toBe(false)
  })

  it('rejects an invalid email (canonical message)', () => {
    const result = signupSchema.safeParse({ ...VALID, email: 'bad' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Enter a valid email address')
    }
  })

  it('rejects empty fullName', () => {
    expect(signupSchema.safeParse({ ...VALID, fullName: '' }).success).toBe(false)
  })

  it('rejects empty examSelection', () => {
    expect(signupSchema.safeParse({ ...VALID, examSelection: '' }).success).toBe(false)
  })

  it('accepts a payload without couponCode', () => {
    expect(signupSchema.safeParse({ ...VALID }).success).toBe(true)
  })
})

// ─── subAdminOnboardSchema ────────────────────────────────────────────────────

describe('subAdminOnboardSchema', () => {
  const VALID = {
    name: 'Dr. Satish Kumar',
    email: 'satish@example.com',
    couponCode: 'SATISH25',
    commissionPercentage: '',
  }

  it('accepts a valid onboarding payload', () => {
    expect(subAdminOnboardSchema.safeParse(VALID).success).toBe(true)
  })

  it('accepts a valid payload with surrounding whitespace', () => {
    expect(subAdminOnboardSchema.safeParse({
      name: '  Dr. Satish Kumar  ',
      email: ' satish@example.com ',
      couponCode: '  SATISH25  ',
      commissionPercentage: '   ',
    }).success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(subAdminOnboardSchema.safeParse({ ...VALID, name: '' }).success).toBe(false)
  })

  it('rejects a single-character name', () => {
    expect(subAdminOnboardSchema.safeParse({ ...VALID, name: 'A' }).success).toBe(false)
  })

  it('rejects an invalid email (canonical email rule)', () => {
    const result = subAdminOnboardSchema.safeParse({ ...VALID, email: 'bad' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Enter a valid email address')
    }
  })

  it('rejects an empty email', () => {
    expect(subAdminOnboardSchema.safeParse({ ...VALID, email: '' }).success).toBe(false)
  })

  it('accepts an empty coupon code (auto-generate)', () => {
    // Blank coupon is now valid: the server auto-generates a unique code in the
    // atomic provisioning RPC. The client never mints coupons itself.
    expect(subAdminOnboardSchema.safeParse({ ...VALID, couponCode: '' }).success).toBe(true)
  })

  it('rejects a coupon code shorter than 3 characters', () => {
    expect(subAdminOnboardSchema.safeParse({ ...VALID, couponCode: 'AB' }).success).toBe(false)
  })
})
