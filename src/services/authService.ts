import { supabase } from '../lib/supabase'
import { safeSupabaseCall } from '../utils/safeSupabase'
import * as userRepo from '../lib/repositories/user.repository'
import type { 
  UserProfile,
  AuthError,
  ServiceResult,
} from '../types/auth.types'
import { getProfile } from './userService'
import { invalidateCache as invalidateAdminQueryCache } from './adminQueryCache'
import { logError, logWarn, logInfo } from '../utils/logger'
import { passwordSchema } from '../validations/securitySchemas'

// ─── Security Gateway ────────────────────────────────────────────────────────
/**
 * Invokes the security gateway Edge Function to perform adaptive rate limiting,
 * Turnstile CAPTCHA verification, and fingerprinting before sensitive auth calls.
 */
async function checkSecurityGateway(pathname: string, captchaToken?: string): Promise<ServiceResult> {
  // Fail-open in local development environment to prevent local developers/testing from hanging or blocking
  if (import.meta.env.DEV) {
    logInfo('security-gateway.dev.bypass', {})
    return { success: true };
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), 4000)
  );

  try {
    const invokePromise = supabase.functions.invoke('security-gateway', {
      method: 'POST',
      body: { pathname, captchaToken }
    })

    const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;

    if (error) {
      logError('security-gateway.functionError', { message: error.message })
      return {
        success: false,
        error: { source: 'auth', code: 'SECURITY_ERROR', message: 'Security check failed. Please try again later.' }
      }
    }

    if (data?.error === 'Too Many Requests') {
      return {
        success: false,
        error: { 
          source: 'auth', 
          code: 'RATE_LIMIT', 
          message: `Too many attempts. Please wait ${data.retryAfter} seconds.` 
        }
      }
    }

    if (data?.error === 'CAPTCHA_FAILED') {
      return {
        success: false,
        error: { 
          source: 'auth', 
          code: 'CAPTCHA_FAILED', 
          message: data?.message || 'Security check failed. Please try again.'
        }
      }
    }

    return { success: true }
  } catch (err: any) {
    if (err.message === 'TIMEOUT') {
      logWarn('security-gateway.timeout', {})
      return {
        success: false,
        error: { source: 'network', code: 'TIMEOUT', message: 'Security check timed out. Please try again.' }
      }
    }
    logError('security-gateway.networkError', { message: err.message })
    return {
      success: false,
      error: { source: 'network', code: 'NETWORK_ERROR', message: 'Security layer unreachable.' }
    }
  }
}

// ─── Promise Timeout Wrapper ───────────────────────────────────────────────
/**
 * Wraps a promise in a timeout that rejects after ms milliseconds.
 */
function withTimeout<T>(promise: Promise<T> | PromiseLike<T>, ms: number, errorName: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorName));
    }, ms);
    
    Promise.resolve(promise).then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// ─── Error Mapper ────────────────────────────────────────────────────────────
function mapError(error: any, source: 'auth' | 'db' | 'network' | 'unknown' = 'auth'): AuthError {
  if (!error) return { source: 'unknown', code: 'UNKNOWN', message: 'An unknown error occurred.', field: 'general' }

  const msg = error.message?.toLowerCase() || ''
  const status = error.status

  if (error.message === 'SIGNUP_TIMEOUT') {
    return {
      source: 'network',
      code: 'SIGNUP_TIMEOUT',
      message: 'Registration request took too long. Please check your connection or disable ad-blockers and try again.',
      field: 'general'
    }
  }

  if (error.message === 'COUPON_TIMEOUT') {
    return {
      source: 'network',
      code: 'COUPON_TIMEOUT',
      message: 'Coupon validation timed out. Please check your connection and try again.',
      field: 'general'
    }
  }

  if (error.message === 'CHECK_USER_TIMEOUT') {
    return {
      source: 'network',
      code: 'CHECK_USER_TIMEOUT',
      message: 'Checking existing user took too long. Please check your connection and try again.',
      field: 'general'
    }
  }

  if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
    return { source, code: 'RATE_LIMIT', message: 'Too many attempts. Please wait a few minutes.', field: 'general' }
  }

  if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('incorrect')) {
    return { source, code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.', field: 'general' }
  }

  if (msg.includes('user not found') || msg.includes('no user')) {
    return { source, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.', field: 'general' }
  }

  if (msg.includes('email not confirmed') || msg.includes('email not verified') || msg.includes('not confirmed')) {
    return { source, code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before signing in.', field: 'general' }
  }

  if (msg.includes('already registered') || msg.includes('already exists')) {
    return { source, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.', field: 'general' }
  }
  
  if (msg.includes('weak password') || msg.includes('password is too short')) {
    return { source, code: 'WEAK_PASSWORD', message: 'Password is too weak. Try a stronger one.', field: 'password' }
  }

  if (msg.includes('stole it') || msg.includes('lock') || msg.includes('navigatorlock')) {
    return { source, code: 'LOCK_ERROR', message: 'The session was momentarily interrupted. Please try again.', field: 'general' }
  }

  if (msg.includes('account temporarily locked') || (error.code === 'ACCOUNT_LOCKED')) {
    return { source, code: 'ACCOUNT_LOCKED', message: error.message || 'Account temporarily locked.', field: 'general' }
  }

  return {
    source,
    code: error.code || 'UNKNOWN',
    message: error.message || 'Something went wrong. Please try again.',
    field: 'general'
  }
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────
export async function signupWithEmail(params: {
  fullName:     string
  email:        string
  password:     string
  couponCode?:  string
  captchaToken: string
  examSelection: string
}): Promise<ServiceResult> {
  // 0. Security Gate (includes Turnstile verification)
  const security = await checkSecurityGateway('/auth/signup', params.captchaToken)
  if (!security.success) return security

  try {
    const cleanEmail = params.email.trim().toLowerCase()
    let educatorId: string | null = null
    
    // 1. Validate Coupon (as requested in STEP 1)
    if (params.couponCode?.trim()) {
      const cleanCoupon = params.couponCode.trim().toUpperCase()
      const { data: couponData, error: couponErr } = await safeSupabaseCall(
        withTimeout(
          userRepo.validateCouponRpc(cleanCoupon),
          6000,
          'COUPON_TIMEOUT'
        )
      )
      
      if (import.meta.env.DEV) {
        logInfo('authService.couponValidation', { status: couponData?.valid, hasError: !!couponErr })
      }

      if (couponErr || !couponData || couponData.valid !== true) {
        return {
          success: false,
          error: { 
            source: 'db', 
            code: couponErr?.message === 'COUPON_TIMEOUT' ? 'COUPON_TIMEOUT' : 'INVALID_COUPON', 
            message: couponErr?.message === 'COUPON_TIMEOUT' 
              ? 'Coupon validation timed out. Please check your connection and try again.' 
              : (couponErr ? `Server error: ${couponErr.message}` : 'Invalid coupon code. Please check and try again.')
          }
        }
      }
      educatorId = couponData.educator_id
    }

    // 2. Explicit check for existing email
    const { data: exists, error: checkError } = await safeSupabaseCall(
      withTimeout(
        userRepo.checkUserExistsRpc(cleanEmail),
        6000,
        'CHECK_USER_TIMEOUT'
      )
    )
    
    if (checkError) {
      logError('authService.signupEmailCheckError', { message: checkError.message })
      if (checkError.message === 'CHECK_USER_TIMEOUT') {
        return {
          success: false,
          error: {
            source: 'network',
            code: 'CHECK_USER_TIMEOUT',
            message: 'Checking existing user took too long. Please check your connection and try again.'
          }
        }
      }
    }

    if (exists) {
      // Return generic error to prevent account enumeration
      return {
        success: false,
        error: { source: 'db', code: 'REGISTRATION_FAILED', field: 'general', message: 'Registration failed. Please try again.' }
      }
    }

    // 3. Create User with metadata (including educator_id from STEP 2)
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email:    cleanEmail,
        password: params.password,
        options:  {
          captchaToken: params.captchaToken,
          data: { 
            full_name: params.fullName.trim(),
            coupon_code: params.couponCode?.trim().toUpperCase(),
            educator_id: educatorId,
            exam_selection: params.examSelection
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      }),
      10000,
      'SIGNUP_TIMEOUT'
    )

    if (error) return { success: false, error: mapError(error) }

    // If verification is disabled/auto-confirmed, Supabase returns the session immediately.
    // In that case, fetch and resolve user profile immediately.
    if (data.session && data.user) {
      const profile = await getProfile(data.user.id)
      return {
        success: true,
        data: {
          ...data,
          profile
        }
      }
    }

    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: mapError(err, 'unknown') }
  }
}

// ─── Login ───────────────────────────────────────────────────────────────────
export async function loginWithEmail(params: {
  email:        string
  password:     string
  captchaToken: string
}): Promise<ServiceResult<{ session: any; user: UserProfile }>> {
  // 0. Security Gate (includes rate limiting & Turnstile verification)
  const security = await checkSecurityGateway('/auth/login', params.captchaToken)
  if (!security.success) return security

  try {
    const cleanEmail = params.email.trim().toLowerCase()

    // 1. Per-account lockout check (NEW)
    const { data: lockData, error: lockError } = await safeSupabaseCall(
      userRepo.isAccountLockedRpc(cleanEmail)
    )

    if (!lockError && lockData?.locked === true) {
      const mins = Math.ceil((lockData.seconds_left ?? 900) / 60)
      return {
        success: false,
        error: {
          source: 'auth',
          code:   'ACCOUNT_LOCKED',
          field:  'general',
          message: `Account temporarily locked. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`,
        },
      }
    }

    // 2. Attempt Supabase auth (existing)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email:    cleanEmail,
      password: params.password,
      options:  { captchaToken: params.captchaToken },
    })

    // 3. Wrong password → increment counter (NEW)
    if (authError) {
      if (import.meta.env.DEV) {
        logWarn('authService.loginFailed', { message: authError.message })
      }

      const isWrongPassword =
        authError.message?.toLowerCase().includes('invalid login') ||
        authError.message?.toLowerCase().includes('invalid credentials') ||
        authError.message?.toLowerCase().includes('incorrect')

      if (isWrongPassword) {
        safeSupabaseCall(
          userRepo.recordFailedLoginRpc(cleanEmail)
        ).catch((e) => logError('authService.recordFailedLogin.error', { message: e?.message }))
      }

      return { success: false, error: mapError(authError) }
    }

    if (!authData.user || !authData.session) {
      return {
        success: false,
        error: { source: 'auth', code: 'MISSING_DATA', message: 'No user or session data received.' },
      }
    }

    // Confirm that the session is fully replaced in local storage/client
    const { data: { session: confirmedSession } } = await supabase.auth.getSession()
    const activeSession = confirmedSession || authData.session

    // 4. Successful login → reset counter (NEW)
    safeSupabaseCall(
      userRepo.resetFailedLoginRpc(cleanEmail)
    ).catch((e) => logError('authService.resetFailedLogin.error', { message: e?.message }))

    // 5. Fetch profile (existing)
    const profile = await getProfile(authData.user.id)
    if (!profile) {
      return {
        success: false,
        error: { source: 'db', code: 'USER_NOT_FOUND', message: 'Profile initialization failed. Please try again.' },
      }
    }

    // 6. Authoritative application gates (defense-in-depth; never trust client-side)
    //    Supabase auth succeeded, but the application must NOT grant access if the
    //    account is disabled or the email is unconfirmed. Both use the authoritative
    //    application profile (`public.users`) plus server-confirmed email state.
    const emailConfirmed =
      !!authData.user.email_confirmed_at || !!profile.email_verified

    if (profile.is_active === false) {
      // A disabled account must never obtain a session. Clear the just-created
      // local session via the canonical cleanup so the user cannot slip through.
      await logout().catch(() => undefined)
      return {
        success: false,
        error: {
          source: 'auth',
          code:   'ACCOUNT_DISABLED',
          field:  'general',
          message: 'Your account has been disabled. Contact support.',
        },
      }
    }

    if (!emailConfirmed) {
      // Unverified email: DO NOT return an authenticated application session.
      // Clear the just-created local session via the canonical cleanup.
      await logout().catch(() => undefined)
      return {
        success: false,
        error: {
          source: 'auth',
          code:   'EMAIL_NOT_VERIFIED',
          field:  'general',
          message: 'Please verify your email before signing in.',
        },
      }
    }

    return {
      success: true,
      data: { session: activeSession, user: profile },
    }
  } catch (err: any) {
    logError('authService.loginException', { message: err.message })
    return { success: false, error: mapError(err, 'unknown') }
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────
// Navigation after sign-out is handled by the caller (AuthContext uses navigate()).
// This function only handles the Supabase sign-out — keeping service layer pure.
export async function logout(): Promise<void> {
  try {
    await supabase.auth.signOut()
  } finally {
    // F-3 security purge: cached admin data is RLS-scoped to the signed-in
    // identity. It must never outlive that identity in this tab, regardless
    // of whether the remote signOut itself succeeded (fail-closed).
    invalidateAdminQueryCache()
  }
  localStorage.removeItem('supabase.auth.token')
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
      localStorage.removeItem(key)
    }
  }
}

// ─── Password Reset ───────────────────────────────────────────────────────────
export async function sendPasswordReset(email: string): Promise<ServiceResult> {
  // 0. Security Gate
  const security = await checkSecurityGateway('/auth/reset-password')
  if (!security.success) return security

  try {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      return { 
        success: false, 
        error: { source: 'auth', code: 'INVALID_CREDENTIALS', field: 'email', message: 'Email is required.' } 
      }
    }

    // Check if email exists using secure RPC (bypasses RLS for anonymous check)
    // We always return generic success to prevent account enumeration
    const { data: exists, error: checkError } = await safeSupabaseCall(userRepo.checkUserExistsRpc(cleanEmail))

    if (checkError) {
      logError('authService.resetEmailCheckError', { message: checkError.message })
    } else if (!exists) {
      logInfo('authService.resetEmailNotFound', {}) // Log silently, do NOT reveal to caller
      return { success: true }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) return { success: false, error: mapError(error) }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: mapError(err, 'unknown') }
  }
}

// ─── Update Password ──────────────────────────────────────────────────────────
export async function updatePassword(newPassword: string): Promise<ServiceResult> {
  try {
    // Server-side validation using shared schema (trusted execution path)
    const validation = passwordSchema.safeParse(newPassword)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return { 
        success: false, 
        error: { source: 'auth', code: 'VALIDATION_ERROR', field: 'password', message: firstError.message } 
      }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { success: false, error: mapError(error) }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: mapError(err, 'unknown') }
  }
}

// ─── Session Management ─────────────────────────────────────────────────────

export async function getCurrentSession() {
  return await supabase.auth.getSession()
}

export async function getCurrentUser() {
  return await supabase.auth.getUser()
}

export async function refreshSession() {
  return await supabase.auth.refreshSession()
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

export async function resendVerificationEmail(email: string) {
  return await supabase.auth.resend({ type: 'signup', email })
}

/**
 * Re-authenticates an already signed-in user for privileged flows (e.g. the
 * /profile password-change gate). Runs through the SAME security pipeline as
 * login: security-gateway (rate limit + Turnstile) → per-account lockout check
 * → signInWithPassword → record/reset the failed-login counter. Returns the
 * canonical ServiceResult shape.
 */
export async function reauthenticate(email: string, password: string, captchaToken?: string): Promise<ServiceResult> {
  // 0. Security gate (includes rate limiting & Turnstile verification)
  const security = await checkSecurityGateway('/auth/reauthenticate', captchaToken)
  if (!security.success) return security

  try {
    const cleanEmail = email.trim().toLowerCase()

    // 1. Per-account lockout check (same as loginWithEmail)
    const { data: lockData, error: lockError } = await safeSupabaseCall(
      userRepo.isAccountLockedRpc(cleanEmail)
    )

    if (!lockError && lockData?.locked === true) {
      const mins = Math.ceil((lockData.seconds_left ?? 900) / 60)
      return {
        success: false,
        error: {
          source: 'auth',
          code:   'ACCOUNT_LOCKED',
          field:  'general',
          message: `Account temporarily locked. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`,
        },
      }
    }

    // 2. Attempt Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email:    cleanEmail,
      password,
      options:  { captchaToken },
    })

    // 3. Wrong password → increment the failed-login counter
    if (authError) {
      if (import.meta.env.DEV) {
        logWarn('authService.reauthenticateFailed', { message: authError.message })
      }

      const isWrongPassword =
        authError.message?.toLowerCase().includes('invalid login') ||
        authError.message?.toLowerCase().includes('invalid credentials') ||
        authError.message?.toLowerCase().includes('incorrect')

      if (isWrongPassword) {
        safeSupabaseCall(
          userRepo.recordFailedLoginRpc(cleanEmail)
        ).catch((e) => logError('authService.recordFailedLogin.error', { message: e?.message }))
      }

      return { success: false, error: mapError(authError) }
    }

    // 4. Success → reset the failed-login counter
    if (authData.user && authData.session) {
      safeSupabaseCall(
        userRepo.resetFailedLoginRpc(cleanEmail)
      ).catch((e) => logError('authService.resetFailedLogin.error', { message: e?.message }))
    }

    return { success: true, data: null }
  } catch (err: any) {
    logError('authService.reauthenticate.exception', { message: err.message })
    return { success: false, error: mapError(err, 'unknown') }
  }
}

export async function sendPasswordResetWithRedirect(email: string, redirectTo: string) {
  return await supabase.auth.resetPasswordForEmail(email, { redirectTo })
}

