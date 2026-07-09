import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import * as authService from '../services/authService';
import {
  Stack,
  Card,
  Button,
  H3,
  Body,
  IconBadge,
} from '../components/common/AntigravityUI';
import { LogoSVG } from '../components/Logo';
import { ConfirmModal } from '../components/common/SharedComponents';
import { useSignOutConfirmation } from '../hooks/useSignOutConfirmation';

// i18n stub
const t = (s: string) => s;

export default function VerifyEmailPage() {
  const { isEmailVerified, session, user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const { isOpen: isSignOutOpen, openDialog: openSignOut, closeDialog: closeSignOut, handleConfirm: confirmSignOut } = useSignOutConfirmation(logout);

  const [checking, setChecking]     = useState(false);
  const [verified, setVerified]     = useState(false);
  const [resending, setResending]   = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Auto-redirect once the session is verified AND the profile is loaded ─────
  // We check both `isEmailVerified` (session-level) AND `user` (profile-level)
  // to prevent a race where AuthGuard on /dashboard sees user=null and sends to /login.
  useEffect(() => {
    if (isEmailVerified && user) {
      setVerified(true);
      // Brief success flash before redirect
      const t = setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
      return () => clearTimeout(t);
    }
  }, [isEmailVerified, user, navigate]);

  // ── Manual "I've verified" button ─────────────────────────────────────────
  const handleCheck = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      // Force a fresh server-side user fetch to pick up email_confirmed_at
      await authService.getCurrentUser();
      await refreshUser();
    } finally {
      setChecking(false);
    }
  }, [checking, refreshUser]);

  // ── Resend verification email ─────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (resending || resendCooldown > 0) return;
    const email = session?.user?.email;
    if (!email) return;

    setResending(true);
    try {
      await authService.resendVerificationEmail(email);
      // Trigger a 60-second cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setResending(false);
    }
  }, [resending, resendCooldown, session]);

  const userEmail = session?.user?.email;

  // ── Verified state (brief success flash) ─────────────────────────────────
  const verifiedContent = (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-4">
      <Stack gap="lg" align="center" className="text-center">
        <IconBadge icon={CheckCircle} size="5xl" shape="circle" className="bg-success/10 text-success" />
        <Stack gap="xs" align="center">
          <H3 className="text-[22px] font-black">{t('Email Verified!')}</H3>
          <Body secondary>{t('Redirecting you to your dashboard…')}</Body>
        </Stack>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </Stack>
    </div>
  );

  // ── Main verify email page ────────────────────────────────────────────────
  const mainContent = (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-app-bg relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Brand header */}
        <Stack gap="sm" align="center" className="mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 bg-white shadow-md">
            <LogoSVG size={32} />
          </div>
          <H3 className="text-[20px] font-black tracking-tight">{t('PrepareForU')}</H3>
        </Stack>

        <Card variant="elevated" className="w-full">
          <Stack gap="xl" className="p-2">

            {/* Mail icon */}
            <div className="flex justify-center">
              <div className="relative">
                <IconBadge icon={Mail} size="5xl" shape="circle" className="bg-primary/10 text-primary" />
                {/* Animated ring */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping duration-[2.5s]" />
              </div>
            </div>

            {/* Headline & description */}
            <Stack gap="sm" align="center" className="text-center">
              <H3 className="text-[24px] sm:text-[28px] font-black">{t('Verify Your Email')}</H3>
              <Body secondary className="text-[14px] leading-relaxed max-w-[340px]">
                {userEmail ? (
                  <>
                    {t("We sent a verification link to")}{' '}
                    <span className="font-bold text-text-primary break-all">{userEmail}</span>
                    {'. '}
                    {t("Click the link in that email to activate your account.")}
                  </>
                ) : (
                  t("We sent a verification link to your email. Click the link to activate your account.")
                )}
              </Body>
            </Stack>

            {/* Steps hint */}
            <div className="rounded-[12px] p-4 bg-primary/5 border border-primary/10">
              <Stack gap="sm">
                {[
                  { step: '1', label: t('Open your email inbox') },
                  { step: '2', label: t('Find the email from PrepareForU') },
                  { step: '3', label: t('Click the "Confirm your email" link') },
                ].map(({ step, label }) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-black text-primary">{step}</span>
                    </div>
                    <Body secondary className="text-[13px]">{label}</Body>
                  </div>
                ))}
              </Stack>
            </div>

            {/* Actions */}
            <Stack gap="sm">
              <Button
                type="button"
                variant="primary"
                fullWidth
                loading={checking}
                onClick={handleCheck}
                id="check-verification-btn"
              >
                {checking ? t('Checking…') : t("I've Verified My Email")}
              </Button>

              {/* Resend email */}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className={`w-full flex items-center justify-center gap-2 h-[44px] rounded-[12px] text-[12px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  resendCooldown > 0 || resending
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-hover-bg'
                } text-text-secondary`}
                id="resend-email-btn"
              >
                <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                {resendCooldown > 0
                  ? `${t('Resend in')} ${resendCooldown}s`
                  : resending
                  ? t('Sending…')
                  : t('Resend Verification Email')}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-border-subtle/50" />
                <Body secondary className="text-[11px]">{t('or')}</Body>
                <div className="flex-1 h-px bg-border-subtle/50" />
              </div>

              {/* Sign out */}
              <button
                type="button"
                onClick={openSignOut}
                className="w-full flex items-center justify-center gap-2 h-[44px] rounded-[12px] text-[12px] font-bold uppercase tracking-wider text-danger/70 hover:text-danger hover:bg-danger/5 transition-all duration-200"
                id="signout-retry-btn"
              >
                <LogOut size={13} />
                {t('Sign Out & Try Again')}
              </button>
            </Stack>

          </Stack>
        </Card>

        {/* Footer note */}
        <p className="text-center text-[11px] text-text-secondary opacity-50 mt-6 font-medium">
          {t("Didn't get the email? Check your spam folder.")}
        </p>
      </div>
    </div>
  );

  return (
    <ThemeContext.Provider value={{ isDark: false, toggleTheme: () => {} }}>
    <div className="light">
      {verified ? verifiedContent : mainContent}

      <ConfirmModal
        open={isSignOutOpen}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to sign in again to continue."
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        onConfirm={confirmSignOut}
        onCancel={closeSignOut}
        danger
      />
    </div>
    </ThemeContext.Provider>
  );
}
