import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authService from '../../services/authService'
import { ThemeContext } from '../../context/ThemeContext'
import LoadingScreen from '../../components/LoadingScreen'

/**
 * AuthCallbackPage — Handles all Supabase redirect flows:
 *   - Email verification  → /auth/callback (fires SIGNED_IN)
 *   - Password recovery   → /auth/callback (fires PASSWORD_RECOVERY)
 *
 * WHY we navigate to /verify-email (not /) on email confirmation:
 *   When this page loads in a new tab after clicking the verification link,
 *   the AuthContext is still booting (user = null). If we navigate to /
 *   immediately, RoleBasedRedirector sees user=null and sends to /login
 *   before refreshUser() finishes — a classic race condition.
 *
 *   Instead, we navigate to /verify-email which:
 *     1. Uses `isEmailVerified` from AuthContext (reactive, not a one-shot read)
 *     2. Auto-redirects to /dashboard the moment `isEmailVerified` becomes true
 *     3. Has a "Check Status" button as a manual fallback
 *   This makes the redirect reliable regardless of network latency or boot timing.
 *
 * WHY onAuthStateChange instead of getSession():
 *   When this page loads, Supabase is still exchanging the URL tokens
 *   (access_token in the hash/query) into a session. Calling getSession()
 *   at the same time causes the "lock stolen" error because both
 *   the internal token exchange AND getSession() compete for the same
 *   localStorage lock. onAuthStateChange fires AFTER the exchange is done.
 */
export default function AuthCallbackPage() {
  const navigate  = useNavigate()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    // Parse URL query and hash parameters
    const hashParams  = new URLSearchParams(window.location.hash.substring(1))
    const queryParams = new URLSearchParams(window.location.search)

    const type           = hashParams.get('type') || queryParams.get('type')
    const hasCode        = queryParams.has('code')
    const hasAccessToken = hashParams.has('access_token')

    // Early error exit: Supabase passes error details as query params or hash params on bad links
    const errorMsg = queryParams.get('error_description') || queryParams.get('error') || hashParams.get('error_description') || hashParams.get('error')
    if (errorMsg) {
      console.error('[AuthCallback] Redirect error detected:', errorMsg)
      navigate(`/login?error=${encodeURIComponent(errorMsg)}`, { replace: true })
      return
    }

    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      console.log('[AuthCallback] Auth event:', event, '| session:', !!session, '| type:', type)

      // ── Password Recovery flow ───────────────────────────────────────────────
      if (
        event === 'PASSWORD_RECOVERY' ||
        (event === 'INITIAL_SESSION' && session && type === 'recovery')
      ) {
        subscription.unsubscribe()
        navigate('/auth/update-password', {
          replace: true,
          state: { fromRecovery: true },
        })
        return
      }

      // ── Successful email confirmation / magic link ────────────────────────────
      // Navigate to /verify-email rather than / so it can wait for the AuthContext
      // profile fetch to complete before redirecting to /dashboard.
      // VerifyEmailPage watches `isEmailVerified` reactively and auto-redirects.
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        subscription.unsubscribe()
        navigate('/verify-email', { replace: true })
        return
      }

      // ── INITIAL_SESSION with no session and no pending token exchange ─────────
      // Guard: if there IS a code or access_token in the URL, keep waiting
      // because the async PKCE exchange hasn't fired SIGNED_IN yet.
      if (event === 'INITIAL_SESSION' && !session && !hasCode && !hasAccessToken) {
        subscription.unsubscribe()
        navigate('/login', { replace: true })
        return
      }
    })

    // Safety timeout — if nothing fires within 10 seconds, redirect to login
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      console.warn('[AuthCallback] Timeout — redirecting to login.')
      navigate('/login', { replace: true })
    }, 10000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <ThemeContext.Provider value={{ isDark: false, toggleTheme: () => {} }}>
    <div className="light">
      <LoadingScreen message="Securing your session..." />
    </div>
    </ThemeContext.Provider>
  );
}
