import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

import { loginWithEmail, sendPasswordReset } from '../services/authService';
import { loginSchema, resetSchema } from '../validations/authSchemas';
import type { LoginFormData, ResetFormData } from '../validations/authSchemas';
import { useAuth } from '../context/AuthContext';
import { useToast, ToastContainer } from '../hooks/useToast';
import { useStableFetch } from '../hooks/useStableFetch';
import { getRouteForRole } from '../utils/getRouteForRole';
import {
  PageContainer,
  Grid,
  Stack,
  Card,
  Input,
  Button,
  IconButton,
  H3,
  Display,
  Body,
  Label,
  Alert,
  AuthThemeProvider,
} from '../components/common/AntigravityUI';
import { AdminModal } from '../components/common/AdminModal';
import { LogoSVG } from '../components/Logo';
import { t } from '../utils/i18n';

// SECURITY NOTE:
// captchaToken is passed to Supabase auth methods in authService.ts, which handles
// server-side Turnstile verification when CAPTCHA protection is enabled in the
// Supabase Dashboard (Authentication → Settings → Enable CAPTCHA protection).
// The Turnstile SECRET key must be configured in the Supabase Dashboard.

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { updateUser, setManualLoginActive, clearUser } = useAuth();
  const { toasts, showToast } = useToast();
  
  const { mountedRef } = useStableFetch();
  const forgotPasswordBtnRef = useRef<HTMLButtonElement>(null);
  const turnstileRef = useRef<any>(null);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [resetSent, setResetSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginLoading },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isResetLoading },
    reset: resetResetForm,
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  // Handle URL error params (e.g. ?error=disabled from guards or auth callbacks)
  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      if (err === 'disabled') {
        setLoginError(t('Your account has been disabled. Contact support.'));
      } else {
        setLoginError(decodeURIComponent(err));
      }
      // Clear URL parameter so error doesn't re-fire on refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('error');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Cooldown Timer
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown(c => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  // ─── Login Flow ─────────────────────────────────────────────────────────────
  const onLogin = async (data: LoginFormData) => {
    if (!captchaToken) {
      setLoginError(t("Please complete the security check to continue."));
      return;
    }
    
    setLoginError(null);
    // Wipes any stale account details first as requested in Fix A
    clearUser();

    // Acquire manual login lock to suppress global SIGNED_IN auth state changes
    setManualLoginActive(true);

    try {
      const result = await loginWithEmail({
        email:        data.email,
        password:     data.password,
        captchaToken: captchaToken,
      });
      
      if (!mountedRef.current) return;

      if (!result.success || !result.data) {
        setCaptchaToken(null);
        turnstileRef.current?.reset();
        setManualLoginActive(false);
        setLoginError(result.error?.message || t('Login failed.'));
        return;
      }

      const { session, user: profile } = result.data;
      
      if (!session) {
        setCaptchaToken(null);
        turnstileRef.current?.reset();
        setManualLoginActive(false);
        setLoginError(t('Session initialization failed.'));
        return;
      }

      // Wipes user before update
      clearUser();
      updateUser(profile, session);

      if (!mountedRef.current) return;

      let redirectTo = searchParams.get('redirectTo') || '/';
      if (!redirectTo.startsWith('/')) redirectTo = '/';

      const isPrivilegedUser = profile.role === 'admin' || profile.role === 'sub_admin';
      if (!profile.exam_selection && !isPrivilegedUser) {
        navigate('/signup', { replace: true });
        return;
      }
      
      const target = (redirectTo === '/' || redirectTo === '/login') ? getRouteForRole(profile.role) : redirectTo;
      navigate(target, { replace: true });
    } catch (err: any) {
      if (!mountedRef.current) return;
      setCaptchaToken(null);
      turnstileRef.current?.reset();
      setManualLoginActive(false);
      setLoginError(t('An unexpected error occurred.'));
    }
  };

  // ─── Reset Password Flow ───────────────────────────────────────────────────
  const onReset = async (data: ResetFormData) => {
    if (resetCooldown > 0) return;
    setResetError(null);
    
    try {
      const result = await sendPasswordReset(data.email);
      
      if (!mountedRef.current) return;

      if (!result.success) {
        setResetError(result.error?.message || t('Failed to send email.'));
        return;
      }
      
      setResetSent(true);
      showToast(t("Reset link sent — check your email"), "success");
      setResetCooldown(60);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setResetError(t('An unexpected error occurred.'));
    }
  };

  const closeResetModal = () => { 
    setShowReset(false);
    setResetSent(false);
    setResetError(null);
    resetResetForm();
    forgotPasswordBtnRef.current?.focus();
  };

  return (
    <AuthThemeProvider>
    <PageContainer className="min-h-screen flex flex-col justify-center bg-app-bg px-4 sm:px-6">
      <Grid cols={2} className="w-full max-w-[1200px] mx-auto items-center min-h-[600px] gap-8 md:gap-16">
        
        {/* LEFT PANEL */}
        <div className="hidden lg:flex flex-col justify-center h-full relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-accent)_4%,transparent)_0%,transparent_70%)] pointer-events-none -left-20 -top-20 w-[600px] h-[600px] rounded-full" />
          
          <Stack gap="lg" className="relative z-10">
            <Stack gap="sm">
              <LogoSVG size={56} className="mb-2 rounded-full shadow-lg shadow-primary/25" />
              <H3 className="text-2xl font-black">{t("PrepareForU")}</H3>
              <Label className="text-text-secondary opacity-80">{t("Exam Preparation Platform")}</Label>
            </Stack>

            <Stack gap="sm" className="mt-8">
              <Display className="leading-[1.1]">
                {t("Ace Your Exam.")} <br />
                {t("Beat the Competition.")}
              </Display>
              <Body secondary className="max-w-md">
                {t("Structured mock tests, subject-wise practice, real-time leaderboards and deep analytics — everything you need to crack your exam.")}
              </Body>
            </Stack>

            <Grid cols={3} gap={32} className="mt-8">
              <Stack gap="xs">
                <Display className="text-stat-value">{t("50K+")}</Display>
                <Label>{t("Students")}</Label>
              </Stack>
              <Stack gap="xs">
                <Display className="text-stat-value">{t("1M+")}</Display>
                <Label>{t("Questions")}</Label>
              </Stack>
              <Stack gap="xs">
                <Display className="text-stat-value">{t("9")}</Display>
                <Label>{t("Exams Covered")}</Label>
              </Stack>
            </Grid>
          </Stack>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col items-center justify-center w-full">
          <Card className="w-full max-w-[460px] p-6 sm:p-10" variant="elevated">
            
            <Stack gap="sm" className="mb-10 text-center lg:text-left">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <LogoSVG size={40} className="rounded-full shadow-lg shadow-primary/25" />
                <span className="text-xl font-black">{t("PrepareForU")}</span>
              </div>
              <H3 className="text-2xl sm:text-3xl font-black">{t("Welcome back")}</H3>
              <Body secondary className="font-semibold">{t("Sign in to continue your preparation")}</Body>
            </Stack>

            <form onSubmit={handleLoginSubmit(onLogin)} noValidate>
              <Stack gap="lg">
                {loginError && (
                  <div aria-live="polite">
                    <Alert variant="error" icon={AlertCircle} title={t("Action failed")} className="w-full">
                      {loginError}
                    </Alert>
                  </div>
                )}

                <Stack gap="xs">
                  <Label>{t("Email Address")}</Label>
                  <Input 
                    type="email"
                    placeholder="you@example.com"
                    disabled={isLoginLoading}
                    id="login-email"
                    aria-invalid={loginErrors.email ? true : undefined}
                    aria-describedby={loginErrors.email ? "login-email-error" : undefined}
                    {...registerLogin("email", { onChange: () => setLoginError(null) })}
                  />
                  {loginErrors.email && (
                    <span id="login-email-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                      {loginErrors.email.message}
                    </span>
                  )}
                </Stack>

                <Stack gap="xs">
                  <Label>{t("Password")}</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t("Enter your password")}
                      disabled={isLoginLoading}
                      id="login-password"
                      aria-invalid={loginErrors.password ? true : undefined}
                      aria-describedby={loginErrors.password ? "login-password-error" : undefined}
                      {...registerLogin("password", { onChange: () => setLoginError(null) })}
                    />
                    <IconButton 
                      type="button" 
                      variant="ghost"
                      size="sm"
                      tabIndex={0}
                      aria-label={showPassword ? t("Hide password") : t("Show password")}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </div>
                  {loginErrors.password && (
                    <span id="login-password-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                      {loginErrors.password.message}
                    </span>
                  )}
                </Stack>

                <div className="flex justify-end -mt-2">
                  <Button 
                    type="button" 
                    variant="ghost"
                    size="sm"
                    ref={forgotPasswordBtnRef}
                    onClick={() => setShowReset(true)}
                    className="text-sm font-bold"
                  >
                    {t("Forgot password?")}
                  </Button>
                </div>

                {/* SECURITY NOTE: captchaToken is verified server-side via Supabase auth */}
                <div className="flex justify-center mt-2">
                  <Turnstile 
                    ref={turnstileRef}
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
                    onSuccess={(token) => { setCaptchaToken(token); setLoginError(null); }}
                    onExpire={() => setCaptchaToken(null)}
                    onError={() => {
                      setCaptchaToken(null);
                      setLoginError(t("Security check failed. Please try again."));
                    }}
                  />
                </div>

                <Button 
                  type="submit" 
                  fullWidth 
                  loading={isLoginLoading}
                >
                  {t("Sign In")}
                </Button>
              </Stack>
            </form>

            {/* SSO Integration Placeholder Scaffold */}
            {/* 
            <div className="mt-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-border-subtle/50" />
                <Label className="text-text-secondary/60 uppercase tracking-widest">{t("Or continue with")}</Label>
                <div className="flex-1 h-px bg-border-subtle/50" />
              </div>

              <Grid cols={2} gap={12}>
                <Button variant="secondary" onClick={() => {}} type="button">
                  Google
                </Button>
                <Button variant="secondary" onClick={() => {}} type="button">
                  Apple
                </Button>
              </Grid>
            </div>
            */}

            <div className="text-center mt-8">
              <Body secondary className="font-semibold">
                {t("Don't have an account?")} <Link to="/signup" className="text-text-primary font-bold ml-1 hover:underline">{t("Create one")}</Link>
              </Body>
            </div>

          </Card>
        </div>

      </Grid>

      {/* RESET MODAL */}
      <AdminModal
        isOpen={showReset}
        onClose={closeResetModal}
        title={resetSent ? t("Check your inbox") : t("Reset Password")}
        maxWidth="sm:max-w-md"
        footer={resetSent ? undefined : (
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={closeResetModal} type="button" className="flex-1">
              {t("Cancel")}
            </Button>
            <Button 
              type="submit" 
              loading={isResetLoading}
              disabled={resetCooldown > 0}
              className="flex-1"
              onClick={() => {
                const form = document.querySelector('#reset-form') as HTMLFormElement
                form?.requestSubmit()
              }}
            >
              {resetCooldown > 0 ? t(`Retry in ${resetCooldown}s`) : t("Send Link")}
            </Button>
          </div>
        )}
      >
        {resetSent ? (
          <Stack gap="lg" className="text-center items-center">
            <div className="text-5xl mb-2">📬</div>
            <Body secondary className="mb-4">
              {t("We sent a reset link to your email. Check your spam folder if you don't see it.")}
            </Body>
            <Button fullWidth onClick={closeResetModal}>
              {t("Done")}
            </Button>
          </Stack>
        ) : (
          <form id="reset-form" onSubmit={handleResetSubmit(onReset)} noValidate>
            <Stack gap="lg">
              <Body secondary className="mb-2">
                {t("Enter your email and we'll send you a link to reset your password.")}
              </Body>

              <Stack gap="xs">
                <Label>{t("Email Address")}</Label>
                <Input 
                  type="email"
                  placeholder="you@example.com"
                  disabled={isResetLoading || resetCooldown > 0}
                  id="reset-email"
                  aria-invalid={resetErrors.email ? true : undefined}
                  aria-describedby={resetErrors.email ? "reset-email-error" : undefined}
                  {...registerReset("email")}
                  autoFocus
                />
                {resetErrors.email && (
                  <span id="reset-email-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                    {resetErrors.email.message}
                  </span>
                )}
              </Stack>

              {resetError && (
                <div aria-live="polite">
                  <Alert variant="error" icon={AlertCircle} title={t("Action failed")} className="w-full">
                    {resetError}
                  </Alert>
                </div>
              )}
            </Stack>
          </form>
        )}
      </AdminModal>

      <ToastContainer toasts={toasts} />
    </PageContainer>
    </AuthThemeProvider>
  );
}
