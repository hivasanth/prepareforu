import { supabase } from '../lib/supabase'
import { safeSupabaseCall } from '../utils/safeSupabase'
import type { 
  UserProfile,
  AuthError,
  ServiceResult,
} from '../types/auth.types'
import { getProfile } from './userService'

// ─── Security Gateway ────────────────────────────────────────────────────────
/**
 * Invokes the security gateway Edge Function to perform adaptive rate limiting
 * and fingerprinting before sensitive auth calls.
 */
async function checkSecurityGateway(pathname: string): Promise<ServiceResult> {
  // Fail-open in local development environment to prevent local developers/testing from hanging or blocking
  if (import.meta.env.DEV) {
    console.log('[security-gateway] Local development detected. Bypassing gateway check.');
    return { success: true };
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), 4000)
  );

  try {
    const invokePromise = supabase.functions.invoke('security-gateway', {
      method: 'POST',
      body: { pathname }
    });

    const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;

    if (error) {
      console.error('[security-gateway] Function error:', error.message)
      // Fail-Closed for Auth is the enterprise policy in prod
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

    return { success: true }
  } catch (err: any) {
    if (err.message === 'TIMEOUT') {
      console.warn('[security-gateway] Request timed out. Failing closed for production auth safety.');
      return {
        success: false,
        error: { source: 'network', code: 'TIMEOUT', message: 'Security check timed out. Please try again.' }
      }
    }
    console.error('[security-gateway] Network error:', err.message)
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
    return { source, code: 'USER_NOT_FOUND', message: 'No account found with this email.', field: 'email' }
  }

  if (msg.includes('already registered') || msg.includes('already exists')) {
    return { source, code: 'ALREADY_EXISTS', message: 'This email is already registered.', field: 'email' }
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
  // 0. Security Gate
  const security = await checkSecurityGateway('/auth/signup')
  if (!security.success) return security

  try {
    const cleanEmail = params.email.trim().toLowerCase()
    let educatorId: string | null = null
    
    // 1. Validate Coupon (as requested in STEP 1)
    if (params.couponCode?.trim()) {
      const cleanCoupon = params.couponCode.trim().toUpperCase()
      const { data: couponData, error: couponErr } = await safeSupabaseCall(
        withTimeout(
          supabase.rpc('validate_coupon', { p_coupon: cleanCoupon }),
          6000,
          'COUPON_TIMEOUT'
        )
      )
      
      if (import.meta.env.DEV) {
        console.log('[authService] Coupon validation result:', { status: couponData?.valid, hasError: !!couponErr })
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
        supabase.rpc('check_user_exists', { p_email: cleanEmail }),
        6000,
        'CHECK_USER_TIMEOUT'
      )
    )
    
    if (checkError) {
      console.error('[authService] Signup email check error:', checkError.message)
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
      return {
        success: false,
        error: { source: 'db', code: 'ALREADY_EXISTS', field: 'email', message: 'This email is already registered.' }
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
  // 0. IP-level rate limit (existing gateway)
  const security = await checkSecurityGateway('/auth/login')
  if (!security.success) return security

  try {
    const cleanEmail = params.email.trim().toLowerCase()

    // 1. Per-account lockout check (NEW)
    const { data: lockData, error: lockError } = await safeSupabaseCall(
      supabase.rpc('is_account_locked', { p_email: cleanEmail })
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
        console.warn('[authService] Login failed:', authError.message)
      }

      const isWrongPassword =
        authError.message?.toLowerCase().includes('invalid login') ||
        authError.message?.toLowerCase().includes('invalid credentials') ||
        authError.message?.toLowerCase().includes('incorrect')

      if (isWrongPassword) {
        // Fire-and-forget — don't block the user-facing error response
        safeSupabaseCall(
          supabase.rpc('record_failed_login', { p_email: cleanEmail })
        ).catch(() => {})
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
      supabase.rpc('reset_failed_login', { p_email: cleanEmail })
    ).catch(() => {})

    // 5. Fetch profile (existing)
    const profile = await getProfile(authData.user.id)
    if (!profile) {
      return {
        success: false,
        error: { source: 'db', code: 'USER_NOT_FOUND', message: 'Profile initialization failed. Please try again.' },
      }
    }

    return {
      success: true,
      data: { session: activeSession, user: profile },
    }
  } catch (err: any) {
    console.error('[authService] Login exception:', err.message)
    return { success: false, error: mapError(err, 'unknown') }
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────
// Navigation after sign-out is handled by the caller (AuthContext uses navigate()).
// This function only handles the Supabase sign-out — keeping service layer pure.
export async function logout(): Promise<void> {
  await supabase.auth.signOut()
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
    const { data: exists, error: checkError } = await safeSupabaseCall(supabase.rpc('check_user_exists', { p_email: cleanEmail }))

    if (checkError) {
      console.error('[authService] Reset email check error:', checkError.message)
    } else if (!exists) {
      return { 
        success: false, 
        error: { source: 'db', code: 'USER_NOT_FOUND', field: 'email', message: 'No account found with this email address.' } 
      }
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
    if (!newPassword || newPassword.length < 8) {
      return { 
        success: false, 
        error: { source: 'auth', code: 'INVALID_CREDENTIALS', field: 'password', message: 'Minimum 8 characters.' } 
      }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { success: false, error: mapError(error) }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: mapError(err, 'unknown') }
  }
}

// ─── Magic Link / Passwordless Implementation ────────────────────────────────

/**
 * Heuristic check if the URL provided is a Supabase magic link/OTP link.
 * Supabase magic links usually contain an access_token (Implicit) or a code (PKCE).
 */
export function checkIsSignInWithEmailLink(url: string): boolean {
  if (!url) return false;
  // Common patterns for Supabase magic links
  return (
    url.includes('access_token=') || 
    url.includes('code=') || 
    url.includes('type=magiclink') || 
    url.includes('type=signup') ||
    url.includes('type=recovery')
  );
}

/**
 * Completes the sign-in flow for a magic link.
 * If a PKCE code exists, it exchanges it for a session.
 * Finally verifies that a valid user/session exists.
 */
export async function completePasswordlessSignIn(_email: string, link: string): Promise<void> {
  try {
    const url = new URL(link);
    const code = url.searchParams.get('code');

    if (code) {
      console.log('[authService] Magic Link: Exchanging code for session...');
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    }

    // Auth state check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication failed: No valid session found after link verification.');
    }
  } catch (err: any) {
    console.error('[authService] completePasswordlessSignIn error:', err.message);
    throw err;
  }
}

/**
 * Error parser for legacy components that expect a simple string message from an error code/object.
 */
export function parseAuthError(error: any): string {
  if (typeof error === 'string') {
    return mapError({ code: error, message: error }).message;
  }
  return mapError(error).message;
}

