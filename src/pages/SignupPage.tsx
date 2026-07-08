import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

import { signupWithEmail } from '../services/authService';
import { fetchActiveExams } from '../services/examService';
import { updateExamSelection } from '../services/userService';
import { useToast, ToastContainer } from '../hooks/useToast';
import { useCouponValidation } from '../hooks/useCouponValidation';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
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
  IconBadge,
} from '../components/common/AntigravityUI';
import { LogoSVG } from '../components/Logo';
import { ConfirmModal } from '../components/common/SharedComponents';
import { t } from '../utils/i18n';

const signupSchema = z.object({
  fullName: z.string().min(2, t("Enter your full name")),
  email: z.string().email(t("Enter a valid email")),
  password: z.string()
    .min(8, t("Password must be at least 8 characters"))
    .regex(/[A-Z]/, t("Must include an uppercase letter"))
    .regex(/[0-9]/, t("Must include a number"))
    .regex(/[^A-Za-z0-9]/, t("Must include a special character")),
  confirmPassword: z.string(),
  couponCode: z.string().optional(),
  examSelection: z.string().min(1, t("Please select the exam you are preparing for"))
}).refine(data => data.password === data.confirmPassword, {
  message: t("Passwords do not match"),
  path: ["confirmPassword"]
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { toasts, showError, showToast } = useToast();
  const navigate = useNavigate();
  const { user, updateUser, refreshUser } = useAuth();
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; } }, []);
  const requestId = useRef(0);
  const isSelectionOnly = !!user && !user.exam_selection && user.role !== 'admin' && user.role !== 'sub_admin';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [dynamicExams, setDynamicExams] = useState<{ id: string; name: string }[]>([]);
  const [selectionLoading, setSelectionLoading] = useState(isSelectionOnly);
  const [confirmExamData, setConfirmExamData] = useState<SignupFormData | null>(null);

  useEffect(() => {
    const id = ++requestId.current;
    (async () => {
      try {
        const active = await fetchActiveExams();
        if (id !== requestId.current || !mountedRef.current) return;
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
        if (id !== requestId.current || !mountedRef.current) return;
        setDynamicExams([
          { id: 'APPSC_GROUPS', name: 'APPSC (Group 1, 2, 3 & 4)' },
          { id: 'BANK_EXAMS', name: 'Bank Exams' },
        ]);
      } finally {
        if (id === requestId.current && mountedRef.current) setSelectionLoading(false);
      }
    })();
  }, []);

  // ── Logged-in user without exam selection: show selection-only card ──
  if (isSelectionOnly) {
    const [localSelected, setLocalSelected] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSaveSelection = async () => {
      if (!localSelected || !user) return;
      const id = ++requestId.current;
      setSaving(true);
      try {
        const res = await updateExamSelection({ user }, user.id, localSelected as any);
        if (id !== requestId.current || !mountedRef.current) return;
        if (!res.success) {
          const msg = (typeof res.error === 'object' && (res.error as any)?.message) ? (res.error as any).message : (res.error || 'Failed to save.');
          showError(msg as string);
          return;
        }
        await refreshUser();
        if (id !== requestId.current || !mountedRef.current) return;
        navigate('/dashboard', { replace: true });
      } catch {
        showError('Failed to save selection.');
      } finally {
        if (id === requestId.current && mountedRef.current) setSaving(false);
      }
    };

    return (
      <ThemeContext.Provider value={{ isDark: false, toggleTheme: () => {} }}>
      <div className="light">
      <PageContainer className="min-h-screen flex items-center justify-center bg-app-bg px-4">
        <Card className="w-full max-w-md p-8 text-center shadow-2xl">
          <IconBadge icon={Shield} size="4xl" className="bg-primary/10 border border-primary/20 mx-auto mb-6 text-primary rounded-2xl" />
          <H3 className="text-2xl font-black mb-2">{t("Select Your Exam")}</H3>
          <Body secondary className="mb-8 font-medium">{t("Choose the exam you are preparing for to get started.")}</Body>
          <Stack gap="lg" className="text-left">
            <Stack gap="xs">
              <Label>{t("Exam Selection")}</Label>
              <div className="relative group">
                <select
                  value={localSelected}
                  onChange={e => setLocalSelected(e.target.value)}
                  disabled={saving || selectionLoading}
                  className="w-full h-[48px] border transition-all cursor-pointer px-4 text-[12px] font-bold uppercase tracking-wide rounded-[12px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-[#FCFAF2] border-primary/20 text-primary shadow-sm"
                >
                  <option value="">{t("-- SELECT AN EXAM --")}</option>
                  {dynamicExams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>
            </Stack>
            <Button fullWidth onClick={handleSaveSelection} loading={saving || selectionLoading} disabled={!localSelected}>
              {t("Continue to Dashboard")}
            </Button>
          </Stack>
        </Card>
      </PageContainer>
      </div>
      </ThemeContext.Provider>
    );
  }

  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors, isSubmitting, touchedFields }
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange'
  });

  const passwordValue = watch('password') || '';
  const couponValue = watch('couponCode');
  const { couponStatus, couponMessage } = useCouponValidation(couponValue ?? '');

  const handleSignupSubmit = (data: SignupFormData) => {
    if (!captchaToken) {
      showError(t("Please complete the security check to continue."));
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
  };

  const onSignup = async (data: SignupFormData) => {
    const id = ++requestId.current;
    try {
      const result = await signupWithEmail({
        fullName:     data.fullName,
        email:        data.email,
        password:     data.password,
        couponCode:   data.couponCode,
        captchaToken: captchaToken,
        examSelection: data.examSelection,
      });

      if (id !== requestId.current || !mountedRef.current) return;

      if (!result.success) {
        if (result.error?.code === 'ALREADY_EXISTS') {
          showError(t("An account with this email already exists"));
        } else {
          showError(result.error?.message || t("Something went wrong. Please try again."));
        }
        return;
      }

      const isAutoConfirmed = !!(result.data?.session?.user?.email_confirmed_at || result.data?.profile?.email_verified);

      if (result.data?.session && result.data?.profile && isAutoConfirmed) {
        showToast(t("Account created successfully!"), "success");
        updateUser(result.data.profile, result.data.session);
        navigate('/dashboard', { replace: true });
      } else {
        showToast(t("Account created! Check your email to confirm."), "success");
        navigate('/verify-email', { replace: true });
      }
    } catch (err: any) {
      if (id !== requestId.current || !mountedRef.current) return;
      setCaptchaToken(null);
      showError(t("Something went wrong. Please try again."));
    }
  };


  const onError = (formErrors: any) => {
    if (formErrors.fullName) { setFocus('fullName'); return; }
    if (formErrors.email) { setFocus('email'); return; }
    if (formErrors.password) { setFocus('password'); return; }
    if (formErrors.confirmPassword) { setFocus('confirmPassword'); return; }
    if (formErrors.examSelection) { setFocus('examSelection'); return; }
    if (formErrors.couponCode) { setFocus('couponCode'); return; }
  };

  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(passwordValue);
  const strengthLabels = [t("Weak"), t("Weak"), t("Fair"), t("Good"), t("Strong")];
  const strengthColors = [
    'var(--color-border-subtle)',
    'var(--color-danger)',
    'var(--color-warning)',
    'var(--color-info)',
    'var(--color-success)'
  ];

  // SECURITY NOTE (Option B — frontend guard only):
  // This captchaToken is NOT verified server-side. A bot calling Supabase auth
  // endpoints directly will bypass this guard entirely.
  // To close this gap:
  //   1. Supabase dashboard → Authentication → Settings → Enable CAPTCHA protection
  //      Enter your Turnstile SECRET key (not the site key).
  //   2. Update loginWithEmail() and signupWithEmail() in authService.ts to pass:
  //      options: { captchaToken }
  //   3. Cloudflare verify endpoint (for custom edge function if needed):
  //      POST https://challenges.cloudflare.com/turnstile/v0/siteverify
  // Ticket: [link to backend verification ticket]

  return (
    <ThemeContext.Provider value={{ isDark: false, toggleTheme: () => {} }}>
    <div className="light">
    <PageContainer className="min-h-screen flex flex-col justify-center bg-app-bg px-4 sm:px-6">
      <Grid cols={2} className="w-full max-w-[1200px] mx-auto items-center min-h-[600px] gap-8 md:gap-16">
        
        {/* LEFT PANEL */}
        <div className="hidden lg:flex flex-col justify-center h-full relative">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.04)_0%,transparent_70%)] top-[-150px] left-[-150px] pointer-events-none" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.03)_0%,transparent_70%)] bottom-[80px] right-[-60px] pointer-events-none" />
          
          <Stack gap="lg" className="relative z-10">
            <Stack gap="sm">
              <LogoSVG size={56} className="mb-2 rounded-full shadow-lg shadow-primary/25" />
              <H3 className="text-2xl font-black">{t("PrepareForU")}</H3>
            </Stack>

            <Stack gap="sm" className="mt-8">
              <h1 className="text-[36px] xl:text-[48px] font-black leading-[1.1] tracking-tight text-text-primary">
                {t("Start Your")} <br />
                {t("Success Story.")}
              </h1>
              <Body secondary className="text-[15px] xl:text-[17px] max-w-[540px]">
                {t("Join thousands of students and get access to the best study material and tests.")}
              </Body>
            </Stack>

            <div className="mt-8 flex flex-wrap gap-3">
              {[t('Mock Tests'), t('PYQs'), t('Topic Analysis'), t('Flashcards'), t('Study Notes')].map(chip => (
                <span key={chip} className="px-[18px] py-[8px] rounded-full border border-border-subtle bg-card-bg text-[13px] text-text-secondary font-bold shadow-sm">
                  {chip}
                </span>
              ))}
            </div>
          </Stack>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col items-center justify-center w-full relative">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.03)_0%,transparent_70%)] top-[-100px] right-[-100px] pointer-events-none" />
          
          <Card className="w-full max-w-[480px] p-6 sm:p-8 relative z-10" variant="elevated">
            
            <Stack gap="sm" className="mb-8 text-center lg:text-left">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <LogoSVG size={40} className="rounded-full shadow-lg shadow-primary/25" />
                <span className="text-xl font-black">{t("PrepareForU")}</span>
              </div>
              <H3 className="text-[28px] sm:text-[32px] font-black">{t("Create account")}</H3>
              <Body secondary className="font-semibold text-[15px]">{t("Join the platform to start your preparation")}</Body>
            </Stack>

            <form onSubmit={handleSubmit(handleSignupSubmit, onError)} noValidate>
              <Stack gap="lg">
                {/* Full Name */}
                <Stack gap="xs">
                  <Label>{t("Full Name")}</Label>
                  <Input 
                    type="text"
                    placeholder="e.g. John Doe"
                    disabled={isSubmitting}
                    id="fullName"
                    aria-describedby={errors.fullName ? "fullName-error" : undefined}
                    {...register("fullName")}
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
                    aria-describedby={errors.email ? "email-error" : undefined}
                    {...register("email")}
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
                      aria-describedby={errors.password ? "password-error" : undefined}
                      {...register("password")}
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
                      <span className="text-[11px] font-bold mt-1 inline-block" style={{ color: strengthScore > 0 ? strengthColors[strengthScore] : 'var(--color-text-secondary)' }}>
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
                      aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                      {...register("confirmPassword")}
                    />
                    <button 
                      type="button" 
                      tabIndex={0}
                      aria-label={showConfirmPassword ? t("Hide password") : t("Show password")}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-secondary/40 hover:text-primary transition-colors rounded-[10px]"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
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
                    aria-describedby={errors.couponCode ? "couponCode-error" : (couponMessage ? "coupon-status" : undefined)}
                    className="uppercase"
                    {...register("couponCode")}
                  />
                  {errors.couponCode && (
                    <span id="couponCode-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                      {errors.couponCode.message}
                    </span>
                  )}
                  
                  <div aria-live="polite" id="coupon-status">
                    {couponStatus === 'loading' && (
                      <span className="text-xs font-bold text-primary mt-1 flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
                <Stack gap="xs">
                  <Label>{t("Exam Selection")}</Label>
                  <div className="relative group">
                    <select
                      id="examSelection"
                      disabled={isSubmitting}
                      className="w-full h-[48px] border transition-all cursor-pointer px-4 text-[12px] font-bold uppercase tracking-wide rounded-[12px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-[#FCFAF2] border-primary/20 text-primary shadow-sm"
                      {...register("examSelection")}
                    >
                      <option value="">{t("-- SELECT AN EXAM --")}</option>
                      {dynamicExams.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}

                    </select>
                  </div>
                  {errors.examSelection && (
                    <span id="examSelection-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                      {errors.examSelection.message}
                    </span>
                  )}
                </Stack>

                {/* SECURITY NOTE (Option B — frontend guard only): 
                    This captchaToken is NOT verified server-side. A bot calling Supabase auth 
                    endpoints directly will bypass this guard entirely. See top of file for the runbook. */}
                <div className="flex justify-center mt-2">
                  <Turnstile 
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
                  loading={isSubmitting}
                  className="mt-2"
                >
                  {t("Create Free Account")}
                </Button>
              </Stack>
            </form>

            <div className="text-center mt-8">
              <Body secondary className="font-semibold text-[14px]">
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
        </div>

      </Grid>
      <ToastContainer toasts={toasts} />
    </PageContainer>
    </div>
    </ThemeContext.Provider>
  );
}
