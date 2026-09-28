import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { AuthThemeProvider } from '../../components/common/AntigravityUI'
import LoadingScreen from '../../components/LoadingScreen'
import { getInviteSession, onInviteStateChange } from '../../services/inviteAuthService'

/**
 * InviteCallbackPage — dedicated invitation/onboarding entry point.
 *
 * This page is reached when an invited educator clicks their invitation link
 * (the edge function's INVITE_REDIRECT_URL → /auth/invite, carrying the
 * Supabase confirmation tokens in the URL hash).
 *
 * WHY a DEDICATED page + an ISOLATED client:
 *   It is handled by the throwaway invite client (`src/lib/inviteClient.ts`,
 *   persistSession:false, storageKey:'p4u-invite'). Because nothing is written
 *   to the shared localStorage session namespace, accepting this invitation can
 *   NEVER replace the persisted session of a normal app client in another tab
 *   (e.g. an Admin signed in elsewhere in the same browser origin).
 *
 * WHY this page (not /auth/callback) is the single invite entry point:
 *   /auth/callback is for non-invite flows (email verification, password
 *   recovery). It hands off any invite link here, so invite session-isolation
 *   logic lives in exactly one place.
 *
 *   Bounded state machine (never an infinite "Securing your session…"):
 *     processing → validate session → navigate to /auth/update-password
 *                            OR          → recovery path
 *                            OR          → error page (fail-closed)
 *   The safety timeout guarantees the page ALWAYS reaches a terminal state.
 */

type Status = 'processing' | 'error'

export default function InviteCallbackPage() {
  const navigate  = useNavigate()
  const [attempt, setAttempt] = useState(0)

  // Derived synchronously at render time, not from an effect: Supabase passes a
  // bad/expired/double-used link with an `error_description`/`error` param. This
  // is pure, cheap URL-derived data, so we never run the async session-detection
  // (and never flash a spinner) for a link that is already invalid.
  const hashParams  = new URLSearchParams(window.location.hash.substring(1))
  const queryParams = new URLSearchParams(window.location.search)
  const invalidLink = Boolean(
    queryParams.get('error_description') || queryParams.get('error') ||
    hashParams.get('error_description') || hashParams.get('error'),
  )

  // Parsed to stable primitives at render scope so the detection effect can be
  // debounced purely by `attempt` (retry) rather than re-running every render.
  const type           = hashParams.get('type') || queryParams.get('type')
  const isInvite       = type === 'invite' || queryParams.has('invite') || hashParams.has('invite')
  const hasCode        = queryParams.has('code')
  const hasAccessToken = hashParams.has('access_token')

  // Only set from async callbacks (safety timeout / auth events / poll) — the
  // failure that occurs while trying to establish the invite session.
  const [sessionError, setSessionError] = useState('')

  const status: Status = invalidLink || sessionError ? 'error' : 'processing'
  const error = invalidLink ? 'INVITATION_INVALID' : sessionError

  useEffect(() => {
    let done = false
    let subscription: { data: { subscription: { unsubscribe(): void } } } | null = null
    let poll: ReturnType<typeof setInterval> | null = null
    let safety: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      done = true
      if (safety) clearTimeout(safety)
      if (poll) clearInterval(poll)
      subscription?.data?.subscription?.unsubscribe()
    }

    // ── 12-second safety: page ALWAYS reaches a terminal state. ────────────
    safety = setTimeout(() => {
      if (done) return
      cleanup()
      setSessionError('INVITATION_SESSION_FAILED')
    }, 12000)

    function handleSession() {
      if (done) return
      if (!isInvite) {
        // Not an invitation (e.g. a magic-link/email-confirm landed here by
        // misroute) — hand off to the standard callback handler.
        cleanup()
        navigate('/auth/callback', { replace: true })
        return
      }
      cleanup()
      navigate('/auth/update-password', { replace: true, state: { fromInvite: true } })
    }

    // Robust detection: the invite tokens may be processed by the isolated
    // client (detectSessionInUrl) asynchronously. Poll getInviteSession() until
    // a session with a user appears, OR the PASSWORD_RECOVERY / INITIAL_SESSION
    // / SIGNED_IN events fire. Whichever resolves first wins; the safety timer
    // guarantees we never spin forever.
    const pollOnce = async () => {
      if (done) return
      const { data: { session }, error } = await getInviteSession()
      if (done) return
      if (!error && session?.user) {
        handleSession()
      }
    }

    // Immediate attempt, then poll until a terminal state is reached.
    pollOnce()
    poll = setInterval(() => { pollOnce() }, 400)

    subscription = onInviteStateChange((event, session) => {
      if (done) return
      if (event === 'PASSWORD_RECOVERY') {
        cleanup()
        navigate('/auth/update-password', { replace: true, state: { fromRecovery: true, fromInvite: true } })
        return
      }
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        const s = session as { user?: { id: string } } | null
        if (s?.user?.id) {
          handleSession()
        } else if (!hasCode && !hasAccessToken) {
          // No session and nothing pending — this is a direct/open of /auth/invite
          cleanup()
          setSessionError('INVITATION_INVALID')
        }
      }
    })

    return cleanup
  }, [attempt, navigate, type, isInvite, hasCode, hasAccessToken])

  return (
    <AuthThemeProvider>
      {status === 'error' ? (
        <div className="min-h-screen flex items-center justify-center bg-[#080810] text-white">
          <div className="text-center max-w-md px-6">
            <AlertTriangle size={80} className="mx-auto mb-4 block" aria-hidden />
            <h1 className="text-2xl font-bold mb-4">Invitation Issue</h1>
            <p className="text-gray-300 mb-6">
              {error === 'INVITATION_SESSION_FAILED'
                ? 'We could not securely open your invitation. Please request a new invitation.'
                : 'Your invitation link is invalid.'}
            </p>
            <div className="flex flex-col items-center gap-3">
              {error === 'INVITATION_SESSION_FAILED' && (
                <button
                  type="button"
                  onClick={() => {
                    setSessionError('')
                    setAttempt(a => a + 1)
                  }}
                  className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90"
                >
                  Retry
                </button>
              )}
              <Link to="/login" className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90">
                Go to login
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <LoadingScreen message="Securing your session..." />
      )}
    </AuthThemeProvider>
  )
}
