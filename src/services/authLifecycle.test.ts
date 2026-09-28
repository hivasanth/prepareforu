// @vitest-environment node
// Auth lifecycle unit tests with a mocked Supabase client.
// Guards the authoritative application gates added to login: unverified-email
// and disabled-account must never yield an authenticated application session.
// Also covers the surrounding lifecycle: per-account lockout, reauthentication,
// logout cache purging, and password reset/update paths.
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
      resend: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    functions: { invoke: vi.fn() },
  },
}))

vi.mock('../lib/repositories/user.repository', () => ({
  isAccountLockedRpc: vi.fn(),
  recordFailedLoginRpc: vi.fn(),
  resetFailedLoginRpc: vi.fn(),
  checkUserExistsRpc: vi.fn(),
  validateCouponRpc: vi.fn(),
}))

vi.mock('./userService', () => ({
  getProfile: vi.fn(),
}))

import { supabase } from '../lib/supabase'
import * as userRepo from '../lib/repositories/user.repository'
import { getProfile } from './userService'
import {
  loginWithEmail,
  resendVerificationEmail,
  logout,
  sendPasswordReset,
  sendPasswordResetWithRedirect,
  updatePassword,
  reauthenticate,
} from './authService'

const supa = vi.mocked(supabase.auth)
const repo = vi.mocked(userRepo)

const USER = {
  id: 'user-1',
  email: 'user@example.com',
  email_confirmed_at: '2026-01-01T00:00:00.000Z',
}

const SESSION = { access_token: 'token', refresh_token: 'refresh', user: USER }

function makeProfile(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: USER.id,
    email: USER.email,
    role: 'user',
    is_active: true,
    email_verified: true,
    ...overrides,
  }
}

// Node test environment lacks browser storage globals which some service paths
// (logout cache purge, sendPasswordReset redirect origin) touch. Provide minimal
// stubs so the browser-agnostic lifecycle logic can be exercised in isolation.
function stubBrowserGlobals(store: Record<string, string> = {}) {
  const storage = {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => { store[k] = v }),
    removeItem: vi.fn((k: string) => { delete store[k] }),
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    get length() { return Object.keys(store).length },
    clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]) }),
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: storage })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { origin: 'http://localhost:3000' } },
  })
  return storage
}

beforeEach(() => {
  vi.clearAllMocks()
  supa.signInWithPassword.mockReset()
  supa.getSession.mockReset()
  supa.signOut.mockReset()
  supa.resend.mockReset()
  supa.updateUser.mockReset()
  supa.resetPasswordForEmail.mockReset()
  repo.isAccountLockedRpc.mockReset()
  repo.recordFailedLoginRpc.mockReset()
  repo.resetFailedLoginRpc.mockReset()
  repo.checkUserExistsRpc.mockReset()
  repo.validateCouponRpc.mockReset()
  vi.mocked(getProfile).mockReset()

  repo.isAccountLockedRpc.mockResolvedValue({ locked: false } as never)
  repo.recordFailedLoginRpc.mockResolvedValue(undefined)
  repo.resetFailedLoginRpc.mockResolvedValue(undefined)
  repo.checkUserExistsRpc.mockResolvedValue(true as never)
  supa.signOut.mockResolvedValue({ error: null } as never)
  supa.getSession.mockResolvedValue({ data: { session: SESSION }, error: null } as never)
  supa.updateUser.mockResolvedValue({ data: { user: USER }, error: null } as never)
  supa.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null } as never)
  stubBrowserGlobals()
})

describe('loginWithEmail — unverified email handling', () => {
  it('maps a server-side "email not confirmed" error to EMAIL_NOT_VERIFIED', async () => {
    supa.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Email not confirmed', status: 400 },
    } as never)

    const result = await loginWithEmail({ email: USER.email, password: 'p', captchaToken: 't' })

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('EMAIL_NOT_VERIFIED')
    expect(result.error?.message).toContain('verify your email')
  })

  it('never grants a session when auth succeeds but the email is unconfirmed', async () => {
    supa.signInWithPassword.mockResolvedValue({
      data: { user: { ...USER, email_confirmed_at: null }, session: SESSION },
      error: null,
    } as never)
    vi.mocked(getProfile).mockResolvedValue(makeProfile({ email_verified: false }) as never)

    const result = await loginWithEmail({ email: USER.email, password: 'p', captchaToken: 't' })

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('EMAIL_NOT_VERIFIED')
    expect(supa.signOut).toHaveBeenCalled()
  })
})

describe('loginWithEmail — disabled-account handling', () => {
  it('never grants a session to a disabled account and clears the session', async () => {
    supa.signInWithPassword.mockResolvedValue({
      data: { user: USER, session: SESSION },
      error: null,
    } as never)
    vi.mocked(getProfile).mockResolvedValue(makeProfile({ is_active: false }) as never)

    const result = await loginWithEmail({ email: USER.email, password: 'p', captchaToken: 't' })

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('ACCOUNT_DISABLED')
    expect(supa.signOut).toHaveBeenCalled()
  })
})

describe('loginWithEmail — per-account lockout', () => {
  it('blocks login before any auth attempt when the account is locked', async () => {
    repo.isAccountLockedRpc.mockResolvedValue({ locked: true, seconds_left: 900 } as never)

    const result = await loginWithEmail({ email: USER.email, password: 'p', captchaToken: 't' })

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('ACCOUNT_LOCKED')
    expect(supa.signInWithPassword).not.toHaveBeenCalled()
  })
})

describe('loginWithEmail — successful verified/active login', () => {
  it('returns the session and profile for a confirmed, active user', async () => {
    supa.signInWithPassword.mockResolvedValue({
      data: { user: USER, session: SESSION },
      error: null,
    } as never)
    const profile = makeProfile()
    vi.mocked(getProfile).mockResolvedValue(profile as never)

    const result = await loginWithEmail({ email: USER.email, password: 'p', captchaToken: 't' })

    expect(result.success).toBe(true)
    expect(result.data?.user).toEqual(profile)
    expect(result.data?.session).toBeDefined()
    expect(supa.signOut).not.toHaveBeenCalled()
  })

  it('returns MISSING_DATA when no user or session is present', async () => {
    supa.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as never)

    const result = await loginWithEmail({ email: USER.email, password: 'p', captchaToken: 't' })

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('MISSING_DATA')
  })

  it('returns USER_NOT_FOUND when the application profile is missing', async () => {
    supa.signInWithPassword.mockResolvedValue({
      data: { user: USER, session: SESSION },
      error: null,
    } as never)
    vi.mocked(getProfile).mockResolvedValue(null as never)

    const result = await loginWithEmail({ email: USER.email, password: 'p', captchaToken: 't' })

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('USER_NOT_FOUND')
    // The profile lookup failed before any application session was established,
    // so no canonical cleanup is required.
    expect(supa.signOut).not.toHaveBeenCalled()
  })
})

describe('loginWithEmail — failed-login counter', () => {
  it('records a failed login on invalid credentials without resetting', async () => {
    supa.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    } as never)

    const result = await loginWithEmail({ email: USER.email, password: 'bad', captchaToken: 't' })

    expect(result.success).toBe(false)
    expect(repo.recordFailedLoginRpc).toHaveBeenCalledTimes(1)
    expect(repo.resetFailedLoginRpc).not.toHaveBeenCalled()
  })

  it('does not record a failed login for a non-credential error', async () => {
    supa.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'something else failed', status: 500 },
    } as never)

    await loginWithEmail({ email: USER.email, password: 'x', captchaToken: 't' })

    expect(repo.recordFailedLoginRpc).not.toHaveBeenCalled()
  })

  it('resets the failed-login counter on a successful login', async () => {
    supa.signInWithPassword.mockResolvedValue({
      data: { user: USER, session: SESSION },
      error: null,
    } as never)
    vi.mocked(getProfile).mockResolvedValue(makeProfile() as never)

    await loginWithEmail({ email: USER.email, password: 'p', captchaToken: 't' })

    expect(repo.resetFailedLoginRpc).toHaveBeenCalledTimes(1)
    expect(repo.recordFailedLoginRpc).not.toHaveBeenCalled()
  })
})

describe('reauthenticate', () => {
  it('succeeds and resets the failed counter for valid credentials', async () => {
    supa.signInWithPassword.mockResolvedValue({
      data: { user: USER, session: SESSION },
      error: null,
    } as never)

    const result = await reauthenticate(USER.email, 'p')

    expect(result.success).toBe(true)
    expect(repo.resetFailedLoginRpc).toHaveBeenCalledTimes(1)
    expect(repo.recordFailedLoginRpc).not.toHaveBeenCalled()
  })

  it('records a failed login and maps INVALID_CREDENTIALS on a wrong password', async () => {
    supa.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    } as never)

    const result = await reauthenticate(USER.email, 'bad')

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('INVALID_CREDENTIALS')
    expect(repo.recordFailedLoginRpc).toHaveBeenCalledTimes(1)
  })

  it('blocks reauth before any attempt when the account is locked', async () => {
    repo.isAccountLockedRpc.mockResolvedValue({ locked: true, seconds_left: 300 } as never)

    const result = await reauthenticate(USER.email, 'p')

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('ACCOUNT_LOCKED')
    expect(supa.signInWithPassword).not.toHaveBeenCalled()
  })
})

describe('logout', () => {
  it('signs out via supabase and purges persisted auth tokens', async () => {
    const ls = stubBrowserGlobals({
      'supabase.auth.token': 'jwt',
      'sb-xyz-auth-token': 'tk',
      'other-key': 'keep',
    })

    await logout()

    expect(supa.signOut).toHaveBeenCalledTimes(1)
    expect(ls.getItem('supabase.auth.token')).toBeNull()
    expect(ls.getItem('sb-xyz-auth-token')).toBeNull()
    // Non-supabase keys are untouched.
    expect(ls.getItem('other-key')).toBe('keep')
  })
})

describe('sendPasswordReset', () => {
  it('returns generic success and does NOT reveal when the email is unknown', async () => {
    repo.checkUserExistsRpc.mockResolvedValue(false as never)

    const result = await sendPasswordReset('nobody@example.com')

    expect(result.success).toBe(true)
    expect(supa.resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('sends the reset email when the account exists', async () => {
    const result = await sendPasswordReset(USER.email)

    expect(result.success).toBe(true)
    expect(supa.resetPasswordForEmail).toHaveBeenCalledWith(
      USER.email,
      expect.objectContaining({ redirectTo: expect.stringContaining('/auth/update-password') }),
    )
  })

  it('rejects when the email is blank', async () => {
    const result = await sendPasswordReset('   ')

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('INVALID_CREDENTIALS')
  })
})

describe('sendPasswordResetWithRedirect', () => {
  it('passes the redirect URL through to the auth API', async () => {
    await sendPasswordResetWithRedirect(USER.email, 'https://app.example.com/auth/update-password')

    expect(supa.resetPasswordForEmail).toHaveBeenCalledWith(USER.email, {
      redirectTo: 'https://app.example.com/auth/update-password',
    })
  })
})

describe('updatePassword', () => {
  it('rejects a weak password before calling the auth API', async () => {
    const result = await updatePassword('weak')

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('VALIDATION_ERROR')
    expect(supa.updateUser).not.toHaveBeenCalled()
  })

  it('updates the password when it passes validation', async () => {
    const result = await updatePassword('Str0ng!Pass')

    expect(result.success).toBe(true)
    expect(supa.updateUser).toHaveBeenCalledWith({ password: 'Str0ng!Pass' })
  })
})

describe('resendVerificationEmail', () => {
  it('targets the exact email provided (works without a session)', async () => {
    supa.resend.mockResolvedValue({ data: {}, error: null } as never)

    await resendVerificationEmail('new-user@example.com')

    expect(supa.resend).toHaveBeenCalledWith({ type: 'signup', email: 'new-user@example.com' })
  })
})
