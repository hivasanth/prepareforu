import { useState, useRef } from 'react'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import { useAsyncOperation } from '../../hooks/useAsyncOperation'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { updatePassword as apiUpdatePassword } from '../../services/authService'
import { updateInvitePassword, endInviteSession, getInviteUser } from '../../services/inviteAuthService'
import { getProfile } from '../../services/userService'
import {
  H1,
  Body,
  Button,
  IconButton,
  Input,
  Label,
  Alert,
  Spinner,
  Card,
  PageContainer,
  Stack,
  AuthThemeProvider,
} from '../../components/common/AntigravityUI'
import { LogoSVG } from '../../components/Logo'
import { passwordCreateSchema } from '../../validations/securitySchemas'

export default function UpdatePasswordPage() {
  const navigate      = useNavigate()
  const location      = useLocation()
  // `fromInvite` distinguishes an ADMIN-INVITED educator landing to SET their
  // password from a self-service RESET. Presentation hint + which auth client
  // to use — authorization is always validated from the database, never from
  // URL/navigation state.
  //
  // Critical session-isolation decision:
  //   • fromInvite → set password via the ISOLATED invite client
  //                  (`inviteAuthService`), whose session is memory-only and
  //                  never touches the Normal app client's persisted session.
  //                  After success: sign out the throwaway session and send to
  //                  /login (no auto-login, Admin session untouched).
  //   • !fromInvite → self-service password RESET via the Normal app client
  //                  (`authService`) for an already-signed-in / recovery user.
  const fromInvite    = !!(location.state as { fromInvite?: boolean })?.fromInvite
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw]                   = useState(false)
  const [showConfirmPw, setShowConfirmPw]     = useState(false)
  const { loading, execute } = useAsyncOperation()
  const [fieldErrors, setFieldErrors]         = useState<{ password?: string; confirmPassword?: string }>({})
  const [apiError, setApiError]               = useState('')
  const [done, setDone]                       = useState(false)
  const submittedRef                          = useRef(false)

  const validateAll = () => {
    const result = passwordCreateSchema.safeParse({ password, confirmPassword })
    if (result.success) return { password: undefined, confirmPassword: undefined }
    const issues = result.error.issues
    return {
      password: issues.find(i => i.path[0] === 'password')?.message,
      confirmPassword: issues.find(i => i.path[0] === 'confirmPassword')?.message,
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    submittedRef.current = true

    const errors = validateAll()
    if (errors.password || errors.confirmPassword) {
      setFieldErrors(errors)
      setApiError('')
      return
    }

    setFieldErrors({})
    setApiError('')
    try {
      await execute(async () => {
        if (fromInvite) {
          // ── INVITE path: isolated invite client (session isolation) ──────
          // Password is set on the throwaway invite client. This client never
          // persists a session, so it can NEVER clobber a Normal app session
          // (e.g. an Admin signed in in another tab).
          //
          // Guard first: the invite session (established on /auth/invite) must
          // still be present on the invite client. If it is missing (expired or
          // the educator opened the URL directly), surface an actionable error
          // instead of a generic "update failed" with no recovery path.
          const { data: { user: inviteUser }, error: inviteUserError } = await getInviteUser()
          if (inviteUserError || !inviteUser?.id) {
            setApiError('Your invitation session has expired. Please return to the invitation link in your email and try again.')
            return
          }

          const inviteResult = await updateInvitePassword(password)
          if (!inviteResult.success) {
            setApiError(inviteResult.error?.message || 'Update failed.')
            return
          }

          // Verify the invited user is provisioned as a sub_admin. If the DB
          // role does not reflect that, surface an actionable error.
          try {
            const profile = await getProfile(inviteUser.id)
            if (profile && profile.role !== 'sub_admin') {
              await endInviteSession()
              setApiError('Your educator access is not active yet. Contact an administrator.')
              return
            }
          } catch {
            // Transient failure: do not strand the educator; fall through.
          }

          // Terminate the throwaway invitation session. scope:'local' only
          // clears THIS isolated, non-persisted session — it cannot sign out
          // the Normal app client / the Admin in another tab.
          await endInviteSession()

          setDone(true)
          // No auto-login into a dashboard — the educator must sign in fresh.
          setTimeout(() => navigate('/login?invite=complete', { replace: true }), 2500)
          return
        }

        // ── RESET / normal path ────────────────────────────────────────────
        const result = await apiUpdatePassword(password)
        if (!result.success) {
          setApiError(result.error?.message || 'Update failed.')
          return
        }

        setDone(true)
        setTimeout(() => navigate('/login', { replace: true }), 3000)
      })
    } catch {
      setApiError('Update failed. Please try again.')
    }
  }

  const handleBlur = (name: 'password' | 'confirmPassword') => () => {
    if (!submittedRef.current) return
    setFieldErrors(prev => ({ ...prev, [name]: validateAll()[name] }))
  }

  return (
    <AuthThemeProvider>
    <PageContainer centered>
      <Card variant="auth-light" className="w-full max-w-[460px]">
        {done ? (
          <Stack gap="lg" align="center" className="text-center">
            <ShieldCheck size={80} className="text-primary mx-auto mb-2" aria-hidden />
            <H1>Password Secured</H1>
            <Body secondary>{fromInvite
              ? 'Your educator account is active. Please sign in with your email and new password.'
              : 'Your password has been successfully updated. Redirecting you to login...'}</Body>
            <Spinner size="lg" />
            <Body secondary className="font-semibold mt-2">
              <Link to="/login" className="text-text-primary font-bold hover:underline">Go to login</Link>
              {' '}·{' '}
              <Link to="/signup" className="text-text-primary font-bold hover:underline">Create an account</Link>
            </Body>
          </Stack>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-10">
              <LogoSVG size={42} className="rounded-full shadow-lg shadow-primary/25" />
              <span className="font-black text-2xl tracking-tight">PrepareForU</span>
            </div>

            <H1 className="mb-2">{fromInvite ? 'Set Your Password' : 'Reset Password'}</H1>
            <Body secondary className="mb-8 font-medium">{fromInvite
              ? 'You were invited as an educator. Create a strong password to activate your account.'
              : 'Create a new, strong password for your account.'}</Body>
            
            {apiError && (
              <Alert variant="error" icon={AlertCircle} title="Action failed" className="w-full mb-6">
                {apiError}
              </Alert>
            )}

            <form onSubmit={handleUpdate} noValidate>
              <Stack gap="lg">
                <Stack gap="xs">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPw ? 'text' : 'password'}
                      autoFocus
                      value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 8 characters"
                      id="new-password"
                      aria-invalid={fieldErrors.password ? true : undefined}
                      aria-describedby={fieldErrors.password ? "new-password-error" : undefined}
                      onBlur={handleBlur('password')}
                    />
                    <IconButton type="button" variant="ghost" size="sm" onClick={()=>setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}>
                      {showPw 
                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </IconButton>
                  </div>
                  {fieldErrors.password && (
                    <span id="new-password-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                      {fieldErrors.password}
                    </span>
                  )}
                </Stack>

                <Stack gap="xs">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repeat password"
                      id="confirm-password"
                      aria-invalid={fieldErrors.confirmPassword ? true : undefined}
                      aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
                      onBlur={handleBlur('confirmPassword')}
                    />
                    <IconButton type="button" variant="ghost" size="sm" onClick={()=>setShowConfirmPw(!showConfirmPw)} aria-label={showConfirmPw ? "Hide password" : "Show password"}>
                      {showConfirmPw 
                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </IconButton>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span id="confirm-password-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                </Stack>

                <Button type="submit" fullWidth loading={loading}>
                  {loading ? 'Securing...' : 'Reset Password'}
                </Button>
              </Stack>
            </form>

            <div className="text-center mt-8">
              <Body secondary className="font-semibold">
                Having trouble?{' '}
                <Link to="/login" className="text-text-primary font-bold ml-1 hover:underline">Back to login</Link>
                {' '}·{' '}
                <Link to="/signup" className="text-text-primary font-bold ml-1 hover:underline">Create an account</Link>
              </Body>
            </div>
          </>
        )}
      </Card>
    </PageContainer>
    </AuthThemeProvider>
  )
}
