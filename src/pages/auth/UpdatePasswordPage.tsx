import { useState, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { useAsyncOperation } from '../../hooks/useAsyncOperation'
import { useNavigate } from 'react-router-dom'
import { updatePassword as apiUpdatePassword } from '../../services/authService'
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
            <span className="text-[64px] mb-2 block">🛡️</span>
            <H1>Password Secured</H1>
            <Body secondary>Your password has been successfully updated. Redirecting you to login...</Body>
            <Spinner size="lg" />
          </Stack>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-10">
              <LogoSVG size={42} className="rounded-full shadow-lg shadow-primary/25" />
              <span className="font-black text-2xl tracking-tight">PrepareForU</span>
            </div>

            <H1 className="mb-2">Reset Password</H1>
            <Body secondary className="mb-8 font-medium">Create a new, strong password for your account.</Body>
            
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
          </>
        )}
      </Card>
    </PageContainer>
    </AuthThemeProvider>
  )
}
