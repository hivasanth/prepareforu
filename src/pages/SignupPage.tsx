import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

import { signupWithEmail } from '../services/authService';
import { signupSchema } from '../validations/authSchemas';
import type { SignupFormData } from '../validations/authSchemas';
import { getPasswordStrengthScore } from '../validations/securitySchemas';
import { fetchActiveExams } from '../services/examService';
import { updateExamSelection } from '../services/userService';
import { useStableFetch } from '../hooks/useStableFetch';
import { useCouponValidation } from '../hooks/useCouponValidation';
import { useAuth } from '../context/AuthContext';
import {
  PageContainer,
  Grid,
  Stack,
  Card,
  Input,
  Button,
  IconButton,
  Select,
  H3,
  Display,
  Body,
  Label,
  IconBadge,
  Alert,
  AuthThemeProvider,
  Spinner,
} from '../components/common/AntigravityUI';
import { LogoSVG } from '../components/Logo';
import { ConfirmModal } from '../components/common/SharedComponents';
import { SuccessModal } from '../components/common/SuccessModal';
import { t } from '../utils/i18n';

export default function SignupPage() {
  const navigate = useNavigate();
  const { user, updateUser, refreshUser } = useAuth();
  const { nextId, isStale } = useStableFetch();
  const isSelectionOnly = !!user && !user.exam_selection && user.role !== 'admin' && user.role !== 'sub_admin';

  const [signupError, setSignupError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState<{ title: string; message: string; target: 'dashboard' | 'verify-email' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [dynamicExams, setDynamicExams] = useState<{ id: string; name: string }[]>([]);
  const [selectionLoading, setSelectionLoading] = useState(isSelectionOnly);
  const [confirmExamData, setConfirmExamData] = useState<SignupFormData | null>(null);
  const [localSelected, setLocalSelected] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = nextId();
    (async () => {
      try {
        const active = await fetchActiveExams();
        if (isStale(id)) return;
        const seen = new Set<string>();
        const deduped: { id: string; name: string }[] = [];
        for (const e of active) {
          if (!seen.has(e.exam_selection)) {
            seen.add(e.exam_selection);
            const label = e.exam_selection
              .replace(/_/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase())
              .replace(/Appsc/, 'APPSC');
            deduped.push({ id: e.exam_selection, name: label });
          }
        }
        setDynamicExams(deduped);
      } catch {
        // fallback to hardcoded list
        if (isStale(id)) return;
        setDynamicExams([
          { id: 'APPSC_GROUPS', name: 'APPSC (Group 1, 2, 3 & 4)' },
          { id: 'BANK_EXAMS', name: 'Bank Exams' },
        ]);
      } finally {
        if (!isStale(id)) setSelectionLoading(false);
      }
    })();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors, isSubmitting, touchedFields }
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  const passwordValue = watch('password') || '';
  const couponValue = watch('couponCode');
  const { couponStatus, couponMessage } = useCouponValidation(couponValue ?? '');

  // ── Logged-in user without exam selection: show selection-only card ──
  if (isSelectionOnly) {

    const handleSaveSelection = async () => {
      if (!localSelected || !user) return;
      const id = nextId();
      setSelectionError(null);
      setSaving(true);
      try {
        const res = await updateExamSelection({ user }, user.id, localSelected as any);
        if (isStale(id)) return;
        if (!res.success) {
          const msg = (typeof res.error === 'object' && (res.error as any)?.message) ? (res.error as any).message : (res.error || 'Failed to save.');
          setSelectionError(msg as string);
          return;
        }
        await refreshUser();
        if (isStale(id)) return;
        navigate('/dashboard', { replace: true });
      } catch {
        setSelectionError('Failed to save selection.');
      } finally {
        if (!isStale(id)) setSaving(false);
      }
    };

    return (
      <AuthThemeProvider>
      <PageContainer className="min-h-screen flex items-center justify-center bg-app-bg px-4">
        <Card variant="elevated" className="w-full max-w-md p-8 text-center shadow-elevation-3">
          <IconBadge icon={Shield} size="4xl" status="primary" className="mx-auto mb-6 rounded-2xl" />
          <H3 className="text-2xl font-black mb-2">{t("Select Your Exam")}</H3>
          <Body secondary className="mb-8">{t("Choose the exam you are preparing for to get started.")}</Body>
            <Stack gap="lg" className="text-left">
              {selectionError && (
                <div aria-live="polite">
                  <Alert variant="error" icon={AlertCircle} title={t("Action failed")} className="w-full">
                    {selectionError}
                  </Alert>
                </div>
              )}
              <Select
                label={t("Exam Selection")}
                value={localSelected}
                onChange={(val) => setLocalSelected(val)}
                options={dynamicExams}
                placeholder={t("-- SELECT AN EXAM --")}
                disabled={saving || selectionLoading}
              />
            <Button fullWidth onClick={handleSaveSelection} loading={saving || selectionLoading} disabled={!localSelected}>
              {t("Continue to Dashboard")}
            </Button>
          </Stack>
        </Card>
      </PageContainer>
      </AuthThemeProvider>
    );
  }

  const handleSignupSubmit = (data: SignupFormData) => {
    if (!captchaToken) {
      setSignupError(t("Please complete the security check to continue."));
      return;
    }
    setConfirmExamData(data);
  };

  const handleConfirmSignup = () => {
    if (!confirmExamData) return;
    const data = confirmExamData;
    setConfirmExamData(null);
    onSignup(data);
  };

  const handleCancelSignup = () => {
    setConfirmExamData(null);
    setSignupError(null);
  };

  const onSignup = async (data: SignupFormData) => {
    const id = nextId();
    setSignupError(null);
    try {
      const result = await signupWithEmail({
        fullName:     data.fullName,
        email:        data.email,
        password:     data.password,
        couponCode:   data.couponCode,
        captchaToken: captchaToken ?? '',
        examSelection: data.examSelection,
      });

      if (isStale(id)) return;

      if (!result.success) {
        setSignupError(
          result.error?.code === 'ALREADY_EXISTS'
            ? t("An account with this email already exists")
            : (result.error?.message || t("Something went wrong. Please try again."))
        );
        return;
      }

      const isAutoConfirmed = !!(result.data?.session?.user?.email_confirmed_at || result.data?.profile?.email_verified);

      if (result.data?.session && result.data?.profile && isAutoConfirmed) {
        updateUser(result.data.profile, result.data.session);
        setAccountCreated({
          title: t("Account Created!"),
          message: t("Your account has been created successfully. Welcome to PrepareForU!"),
          target: 'dashboard',
        });
      } else {
        setAccountCreated({
          title: t("Account Created!"),
          message: t("Your account has been created. Check your email to confirm."),
          target: 'verify-email',
        });
      }
    } catch (err: any) {
      if (isStale(id)) return;
      setCaptchaToken(null);
      setSignupError(t("Something went wrong. Please try again."));
    }
  };

  const handleAccountCreatedClose = () => {
    if (!accountCreated) return;
    const target = accountCreated.target;
    setAccountCreated(null);
    navigate(target === 'dashboard' ? '/dashboard' : '/verify-email', { replace: true });
  };


  const onError = (formErrors: any) => {
    if (formErrors.fullName) { setFocus('fullName'); return; }
    if (formErrors.email) { setFocus('email'); return; }
    if (formErrors.password) { setFocus('password'); return; }
    if (formErrors.confirmPassword) { setFocus('confirmPassword'); return; }
    if (formErrors.examSelection) { setFocus('examSelection'); return; }
    if (formErrors.couponCode) { setFocus('couponCode'); return; }
  };

  const strengthScore = getPasswordStrengthScore(passwordValue);
  const strengthLabels = [t("Weak"), t("Weak"), t("Fair"), t("Good"), t("Strong")];
  const strengthColors = [
    'var(--color-border-subtle)',
    'var(--color-danger)',
    'var(--color-warning)',
    'var(--color-info)',
    'var(--color-success)'
  ];

  // SECURITY NOTE:
  // captchaToken is passed to Supabase auth methods in authService.ts, which handles
  // server-side Turnstile verification when CAPTCHA protection is enabled in the
  // Supabase Dashboard (Authentication → Settings → Enable CAPTCHA protection).
  // The Turnstile SECRET key must be configured in the Supabase Dashboard.

  return (
    <AuthThemeProvider>
    <PageContainer className="min-h-screen flex flex-col justify-center bg-app-bg px-4 sm:px-6">
      <Grid cols={2} className="w-full max-w-[1200px] mx-auto items-center min-h-[600px] gap-8 md:gap-16">
        
        {/* LEFT PANEL */}
        <div className="hidden lg:flex flex-col justify-center h-full relative">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-accent)_4%,transparent)_0%,transparent_70%)] top-[-150px] left-[-150px] pointer-events-none" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-accent)_3%,transparent)_0%,transparent_70%)] bottom-[80px] right-[-60px] pointer-events-none" />
          
          <Stack gap="lg" className="relative z-10">
            <Stack gap="sm">
              <LogoSVG size={56} className="mb-2 rounded-full shadow-lg shadow-primary/25" />
              <H3 className="text-2xl font-black">{t("PrepareForU")}</H3>
            </Stack>

            <Stack gap="sm" className="mt-8">
              <Display className="leading-[1.1]">
                {t("Start Your")} <br />
                {t("Success Story.")}
              </Display>
              <Body secondary className="max-w-[540px]">
                {t("Join thousands of students and get access to the best study material and tests.")}
              </Body>
            </Stack>

            <div className="mt-8 flex flex-wrap gap-3">
              {[t('Mock Tests'), t('PYQs'), t('Topic Analysis'), t('Flashcards'), t('Study Notes')].map(chip => (
                <span key={chip} className="px-4 py-2 rounded-full border border-border-subtle bg-card-bg text-sm text-text-secondary font-bold shadow-sm">
                  {chip}
                </span>
              ))}
            </div>
          </Stack>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col items-center justify-center w-full relative">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-accent)_3%,transparent)_0%,transparent_70%)] top-[-100px] right-[-100px] pointer-events-none" />
          
          <Card className="w-full max-w-[480px] p-6 sm:p-8 relative z-10" variant="elevated">
            
            <Stack gap="sm" className="mb-8 text-center lg:text-left">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <LogoSVG size={40} className="rounded-full shadow-lg shadow-primary/25" />
                <span className="text-xl font-black">{t("PrepareForU")}</span>
              </div>
              <H3 className="text-2xl sm:text-3xl font-black">{t("Create account")}</H3>
              <Body secondary className="font-semibold">{t("Join the platform to start your preparation")}</Body>
            </Stack>

            <form onSubmit={handleSubmit(handleSignupSubmit, onError)} noValidate>
              <Stack gap="lg">
                {signupError && (
                  <div aria-live="polite">
                    <Alert variant="error" icon={AlertCircle} title={t("Action failed")} className="w-full">
                      {signupError}
                    </Alert>
                  </div>
                )}
                {/* Full Name */}
                <Stack gap="xs">
                  <Label>{t("Full Name")}</Label>
                  <Input 
                    type="text"
                    placeholder="e.g. John Doe"
                    disabled={isSubmitting}
                    id="fullName"
                    aria-invalid={errors.fullName ? true : undefined}
                    aria-describedby={errors.fullName ? "fullName-error" : undefined}
                    {...register("fullName", { onChange: () => setSignupError(null) })}
                  />
                  {errors.fullName && (
                    <span id="fullName-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                      {errors.fullName.message}
                    </span>
                  )}
                </Stack>

                {/* Email Address */}
                <Stack gap="xs">
                  <Label>{t("Email Address")}</Label>
                  <Input 
                    type="email"
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                    id="email"
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    {...register("email", { onChange: () => setSignupError(null) })}
                  />
                  {errors.email && (
                    <span id="email-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                      {errors.email.message}
                    </span>
                  )}
                </Stack>

                {/* Password */}
                <Stack gap="xs">
                  <Label>{t("Password")}</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t("Min 8 characters")}
                      disabled={isSubmitting}
                      id="password"
                      aria-invalid={errors.password ? true : undefined}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      {...register("password", { onChange: () => setSignupError(null) })}
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
                  {errors.password && (
                    <span id="password-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                      {errors.password.message}
                    </span>
                  )}

                  {/* Password Strength Meter */}
                  {touchedFields.password && (
                    <div className="mt-2">
                      <Grid cols={4} gap={4} className="h-1.5 w-full">
                        {[1, 2, 3, 4].map(segment => (
                          <div 
                            key={segment} 
                            className="h-full rounded-full transition-colors duration-300"
                            style={{ 
                              backgroundColor: strengthScore >= segment 
                                ? strengthColors[strengthScore] 
                                : 'var(--color-border-subtle)' 
                            }}
                          />
                        ))}
                      </Grid>
                      <span className="text-xs font-bold mt-1 inline-block" style={{ color: strengthScore > 0 ? strengthColors[strengthScore] : 'var(--color-text-secondary)' }}>
                        {strengthLabels[strengthScore]}
                      </span>
                    </div>
                  )}
                </Stack>

                {/* Confirm Password */}
                <Stack gap="xs">
                  <Label>{t("Confirm Password")}</Label>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t("Repeat your password")}
                      disabled={isSubmitting}
                      id="confirmPassword"
                      aria-invalid={errors.confirmPassword ? true : undefined}
                      aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                      {...register("confirmPassword", { onChange: () => setSignupError(null) })}
                    />
                    <IconButton 
                      type="button" 
                      variant="ghost"
                      size="sm"
                      tabIndex={0}
                      aria-label={showConfirmPassword ? t("Hide password") : t("Show password")}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </div>
                  {errors.confirmPassword && (
                    <span id="confirmPassword-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                      {errors.confirmPassword.message}
                    </span>
                  )}
                </Stack>

                {/* Coupon Code */}
                <Stack gap="xs">
                  <Label>{t("Coupon Code (Optional)")}</Label>
                  <Input 
                    type="text"
                    placeholder={t("Enter referral code")}
                    disabled={isSubmitting}
                    id="couponCode"
                    aria-invalid={errors.couponCode ? true : undefined}
                    aria-describedby={errors.couponCode ? "couponCode-error" : (couponMessage ? "coupon-status" : undefined)}
                    className="uppercase"
                    {...register("couponCode", { onChange: () => setSignupError(null) })}
                  />
                  {errors.couponCode && (
                    <span id="couponCode-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                      {errors.couponCode.message}
                    </span>
                  )}
                  
                  <div aria-live="polite" id="coupon-status">
                    {couponStatus === 'loading' && (
                      <span className="text-xs font-bold text-primary mt-1 flex items-center gap-2">
                        <Spinner size="sm" />
                        {t("Validating...")}
                      </span>
                    )}
                    {couponStatus === 'valid' && (
                      <span className="text-xs font-bold text-success mt-1">✔ {couponMessage}</span>
                    )}
                    {couponStatus === 'invalid' && (
                      <span className="text-xs font-bold text-danger mt-1">⚠ {couponMessage}</span>
                    )}
                  </div>
                </Stack>

                {/* Exam Selection */}
                <Select
                  label={t("Exam Selection")}
                  id="examSelection"
                  aria-invalid={errors.examSelection ? true : undefined}
                  aria-describedby={errors.examSelection ? "examSelection-error" : undefined}
                  value={watch('examSelection') || ''}
                  onChange={(val) => { setValue('examSelection', val, { shouldValidate: true }); setSignupError(null); }}
                  options={dynamicExams}
                  placeholder={t("-- SELECT AN EXAM --")}
                  disabled={isSubmitting}
                />
                {errors.examSelection && (
                  <span id="examSelection-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                    {errors.examSelection.message}
                  </span>
                )}

                {/* SECURITY NOTE: captchaToken is verified server-side via Supabase auth */}
                <div className="flex justify-center mt-2">
                  <Turnstile 
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
                    onSuccess={(token) => { setCaptchaToken(token); setSignupError(null); }}
                    onExpire={() => setCaptchaToken(null)}
                    onError={() => {
                      setCaptchaToken(null);
                      setSignupError(t("Security check failed. Please try again."));
                    }}
                  />
                </div>

                <Button 
                  type="submit" 
                  fullWidth 
                  loading={isSubmitting}
                  className="mt-2"
                >
                  {t("Create Free Account")}
                </Button>
              </Stack>
            </form>

            <div className="text-center mt-8">
              <Body secondary className="font-semibold">
                {t("Already have an account?")} <Link to="/login" className="text-text-primary font-bold ml-1 hover:underline">{t("Sign in")}</Link>
              </Body>
            </div>

          </Card>

          <ConfirmModal
            open={!!confirmExamData}
            title={t("Confirm Exam Selection")}
            message={(() => {
              const selected = dynamicExams.find(e => e.id === confirmExamData?.examSelection);
              return t(`You selected "${selected?.name || confirmExamData?.examSelection}". This choice cannot be changed later. Are you sure you want to proceed?`);
            })()}
            confirmLabel={t("Yes, I'm Sure")}
            cancelLabel={t("Go Back")}
            onConfirm={handleConfirmSignup}
            onCancel={handleCancelSignup}
            danger
          />

          <SuccessModal
            isOpen={!!accountCreated}
            title={accountCreated?.title || ''}
            message={accountCreated?.message || ''}
            okLabel={t("Continue")}
            onClose={handleAccountCreatedClose}
          />
        </div>

      </Grid>
    </PageContainer>
    </AuthThemeProvider>
  );
}
