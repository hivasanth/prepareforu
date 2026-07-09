import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FocusTrap } from 'focus-trap-react';
import { Eye, EyeOff } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

import { loginWithEmail, sendPasswordReset } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useToast } from '../hooks/useToast';
import { getRouteForRole } from '../utils/getRouteForRole';
import {
  PageContainer,
  Grid,
  Stack,
  Card,
  Input,
  Button,
  H3,
  Body,
  Label,
} from '../components/common/AntigravityUI';
import { LogoSVG } from '../components/Logo';
import { t } from '../utils/i18n';

const loginSchema = z.object({
  email: z.string().email(t("Enter a valid email address.")),
  password: z.string().min(1, t("Password is required")),
});

const resetSchema = z.object({
  email: z.string().email(t("Enter a valid email address.")),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

// SECURITY NOTE:
// captchaToken is passed to Supabase auth methods in authService.ts, which handles
// server-side Turnstile verification when CAPTCHA protection is enabled in the
// Supabase Dashboard (Authentication → Settings → Enable CAPTCHA protection).
// The Turnstile SECRET key must be configured in the Supabase Dashboard.

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { updateUser, setManualLoginActive, clearUser } = useAuth();
  const { showError, showToast } = useToast();
  
  const mountedRef = useRef(true);
  const forgotPasswordBtnRef = useRef<HTMLButtonElement>(null);
  const turnstileRef = useRef<any>(null);

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
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isResetLoading },
    reset: resetResetForm,
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  // ─── Lifecycle & Cleanup ────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Handle URL error params (e.g. ?error=disabled from guards or auth callbacks)
  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      if (err === 'disabled') {
        showError(t('Your account has been disabled. Contact support.'));
      } else {
        showError(decodeURIComponent(err));
      }
      // Clear URL parameter so toast doesn't re-fire on refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('error');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, showError]);

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
      showError(t("Please complete the security check to continue."));
      return;
    }
    
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
        showError(result.error?.message || t('Login failed.'));
        return;
      }

      const { session, user: profile } = result.data;
      
      if (!session) {
        setCaptchaToken(null);
        turnstileRef.current?.reset();
        setManualLoginActive(false);
        showError(t('Session initialization failed.'));
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
      showError(t('An unexpected error occurred.'));
    }
  };

  // ─── Reset Password Flow ───────────────────────────────────────────────────
  const onReset = async (data: ResetFormData) => {
    if (resetCooldown > 0) return;
    
    try {
      const result = await sendPasswordReset(data.email);
      
      if (!mountedRef.current) return;

      if (!result.success) {
        showError(result.error?.message || t('Failed to send email.'));
        return;
      }
      
      setResetSent(true);
      showToast(t("Reset link sent — check your email"), "success");
      setResetCooldown(60);
    } catch (err: any) {
      if (!mountedRef.current) return;
      showError(t('An unexpected error occurred.'));
    }
  };

  const closeResetModal = () => { 
    setShowReset(false);
    setResetSent(false);
    resetResetForm();
    forgotPasswordBtnRef.current?.focus();
  };

  return (
    <ThemeContext.Provider value={{ isDark: false, toggleTheme: () => {} }}>
    <div className="light">
    <PageContainer className="min-h-screen flex flex-col justify-center bg-app-bg px-4 sm:px-6">
      <Grid cols={2} className="w-full max-w-[1200px] mx-auto items-center min-h-[600px] gap-8 md:gap-16">
        
        {/* LEFT PANEL */}
        <div className="hidden lg:flex flex-col justify-center h-full relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(79,70,229,0.04)_0%,transparent_70%)] pointer-events-none -left-20 -top-20 w-[600px] h-[600px] rounded-full" />
          
          <Stack gap="lg" className="relative z-10">
            <Stack gap="sm">
              <LogoSVG size={56} className="mb-2 rounded-full shadow-lg shadow-primary/25" />
              <H3 className="text-2xl font-black">{t("PrepareForU")}</H3>
              <Label className="text-text-secondary opacity-80">{t("Exam Preparation Platform")}</Label>
            </Stack>

            <Stack gap="sm" className="mt-8">
              <h1 className="text-[36px] xl:text-[48px] font-black leading-[1.1] tracking-tight text-text-primary">
                {t("Ace Your Exam.")} <br />
                {t("Beat the Competition.")}
              </h1>
              <Body secondary className="text-[15px] xl:text-[17px] max-w-md">
                {t("Structured mock tests, subject-wise practice, real-time leaderboards and deep analytics — everything you need to crack your exam.")}
              </Body>
            </Stack>

            <Grid cols={3} gap={32} className="mt-8">
              <Stack gap="xs">
                <span className="text-[32px] font-black text-text-primary">50K+</span>
                <Label>{t("Students")}</Label>
              </Stack>
              <Stack gap="xs">
                <span className="text-[32px] font-black text-text-primary">1M+</span>
                <Label>{t("Questions")}</Label>
              </Stack>
              <Stack gap="xs">
                <span className="text-[32px] font-black text-text-primary">9</span>
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
              <H3 className="text-[28px] sm:text-[32px] font-black">{t("Welcome back")}</H3>
              <Body secondary className="font-semibold text-[15px]">{t("Sign in to continue your preparation")}</Body>
            </Stack>

            <form onSubmit={handleLoginSubmit(onLogin)} noValidate>
              <Stack gap="lg">
                <Stack gap="xs">
                  <Label>{t("Email Address")}</Label>
                  <Input 
                    type="email"
                    placeholder="you@example.com"
                    disabled={isLoginLoading}
                    {...registerLogin("email")}
                  />
                  {loginErrors.email && (
                    <span className="text-xs font-bold text-danger mt-1">
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
                      {...registerLogin("password")}
                    />
                    <button 
                      type="button" 
                      tabIndex={0}
                      aria-label={showPassword ? t("Hide password") : t("Show password")}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-secondary/40 hover:text-primary transition-colors rounded-[10px]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <span className="text-xs font-bold text-danger mt-1">
                      {loginErrors.password.message}
                    </span>
                  )}
                </Stack>

                <div className="flex justify-end -mt-2">
                  <button 
                    type="button" 
                    ref={forgotPasswordBtnRef}
                    onClick={() => setShowReset(true)}
                    className="text-sm font-bold text-primary hover:text-primary-hover transition-colors"
                  >
                    {t("Forgot password?")}
                  </button>
                </div>

                {/* SECURITY NOTE: captchaToken is verified server-side via Supabase auth */}
                <div className="flex justify-center mt-2">
                  <Turnstile 
                    ref={turnstileRef}
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
                    onSuccess={setCaptchaToken}
                    onExpire={() => setCaptchaToken(null)}
                    onError={() => {
                      setCaptchaToken(null);
                      showError(t("Security check failed. Please try again."));
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
                <Label className="text-text-secondary/60 uppercase tracking-widest text-[10px]">{t("Or continue with")}</Label>
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
              <Body secondary className="font-semibold text-[14px]">
                {t("Don't have an account?")} <Link to="/signup" className="text-text-primary font-bold ml-1 hover:underline">{t("Create one")}</Link>
              </Body>
            </div>

          </Card>
        </div>

      </Grid>

      {/* RESET MODAL */}
      {showReset && (
        <FocusTrap focusTrapOptions={{ 
          onDeactivate: closeResetModal,
          clickOutsideDeactivates: true,
          escapeDeactivates: true,
          initialFocus: false // FocusTrap automatically focuses the first tabbable element by default
        }}>
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 transition-all"
            role="dialog"
            aria-modal="true"
            aria-label={t("Reset password")}
          >
            <Card className="w-full max-w-[440px] !p-8 animate-in zoom-in-95 duration-200">
              {resetSent ? (
                <Stack gap="lg" className="text-center items-center">
                  <div className="text-5xl mb-2">📬</div>
                  <H3 className="text-2xl font-black">{t("Check your inbox")}</H3>
                  <Body secondary className="mb-4">
                    {t("We sent a reset link to your email. Check your spam folder if you don't see it.")}
                  </Body>
                  <Button fullWidth onClick={closeResetModal}>
                    {t("Done")}
                  </Button>
                </Stack>
              ) : (
                <form onSubmit={handleResetSubmit(onReset)} noValidate>
                  <Stack gap="lg">
                    <Stack gap="xs">
                      <H3 className="text-2xl font-black">{t("Reset Password")}</H3>
                      <Body secondary className="mb-2">
                        {t("Enter your email and we'll send you a link to reset your password.")}
                      </Body>
                    </Stack>

                    <div aria-live="polite">
                       {resetErrors.email && (
                         <div className="p-3 mb-2 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-bold">
                           {resetErrors.email.message}
                         </div>
                       )}
                    </div>

                    <Stack gap="xs">
                      <Label>{t("Email Address")}</Label>
                      <Input 
                        type="email"
                        placeholder="you@example.com"
                        disabled={isResetLoading || resetCooldown > 0}
                        {...registerReset("email")}
                        autoFocus
                      />
                    </Stack>

                    <Grid cols={2} gap={12} className="mt-4">
                      <Button variant="secondary" onClick={closeResetModal} type="button">
                        {t("Cancel")}
                      </Button>
                      <Button 
                        type="submit" 
                        loading={isResetLoading}
                        disabled={resetCooldown > 0}
                      >
                        {resetCooldown > 0 ? t(`Retry in ${resetCooldown}s`) : t("Send Link")}
                      </Button>
                    </Grid>
                  </Stack>
                </form>
              )}
            </Card>
          </div>
        </FocusTrap>
      )}

    </PageContainer>
    </div>
    </ThemeContext.Provider>
  );
}
