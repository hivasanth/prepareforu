import { useState, useCallback, useRef, useEffect } from 'react';

import { useAuth } from '../../context/AuthContext';
import { useStableFetch } from '../../hooks/useStableFetch';
import { dashboardService, type DashboardStats } from '../../services/dashboardService';
import * as authService from '../../services/authService';
import { deleteOwnAccount } from '../../services/accountService';
import type { CaptchaFieldHandle } from '../common/CaptchaField';
import {
  passwordChangeSchema,
  hasMinLength,
  hasUppercase,
  hasNumber,
  hasSpecial,
} from '../../validations/securitySchemas';

export function useProfile() {
  const { user, loading: authLoading, initialized, logout, refreshUser } = useAuth();
  const { nextId, isStale } = useStableFetch();

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ currentPass?: string; newPass?: string; confirmPass?: string }>({});
  const submittedRef = useRef(false);

  // Update Password action: the canonical ProfileForm flow is collapsed behind
  // an explicit "Update Password" action rather than an always-visible
  // "Security & Credentials" container. Opening it reveals the SAME canonical
  // re-authentication + validation + updatePassword implementation.
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Delete Account action state (loading / error / duplicate-submission guard).
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteInFlightRef = useRef(false);

  // FIX-4 (BE-5): reauthenticate gate reuses the login captcha mechanism.
  const captchaRef = useRef<CaptchaFieldHandle>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // FIX-5 (BE-7): profile stats come from the canonical get_user_dashboard_stats RPC.
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsRetrying, setStatsRetrying] = useState(false);

  // FIX-13 (UX-2): managed logout timer — cleared on unmount.
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [profileRetrying, setProfileRetrying] = useState(false);

  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, []);

  const loadStats = useCallback(async (force = false) => {
    if (!user?.id) return;
    const id = nextId();
    setStatsLoading(true);
    setStatsError(null);
    if (force) setStatsRetrying(true);
    try {
      const result = await dashboardService.fetchDashboardStats(user.id, force);
      if (isStale(id)) return;
      if (!result.success) {
        setStatsError(result.error?.message || 'Failed to load statistics.');
        return;
      }
      setStats(result.data ?? null);
    } catch (err: unknown) {
      if (!isStale(id)) {
        setStatsError(err instanceof Error ? err.message : 'Failed to load statistics.');
      }
    } finally {
      if (!isStale(id)) {
        setStatsLoading(false);
        setStatsRetrying(false);
      }
    }
  }, [user?.id, nextId, isStale]);

  useEffect(() => {
    if (!user?.id) return;
    loadStats();
  }, [loadStats, user?.id]);

  const retryStats = useCallback(() => {
    loadStats(true);
  }, [loadStats]);

  const retryProfile = useCallback(async () => {
    setProfileRetrying(true);
    try {
      await refreshUser();
    } finally {
      setProfileRetrying(false);
    }
  }, [refreshUser]);

  const passwordMatch = newPass && confirmPass ? newPass === confirmPass : null;
  const minLength = hasMinLength(newPass);
  const uppercase = hasUppercase(newPass);
  const number = hasNumber(newPass);
  const special = hasSpecial(newPass);
  const passwordValid = minLength && uppercase && number && special;

  const validateAll = useCallback((): { currentPass?: string; newPass?: string; confirmPass?: string } => {
    const result = passwordChangeSchema.safeParse({ currentPass, newPass, confirmPass });
    if (result.success) return {};
    const issues = result.error.issues;
    return {
      currentPass: issues.find(i => i.path[0] === 'currentPass')?.message,
      newPass: issues.find(i => i.path[0] === 'newPass')?.message,
      confirmPass: issues.find(i => i.path[0] === 'confirmPass')?.message,
    };
  }, [currentPass, newPass, confirmPass]);

  const memberSince = user
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    : '';

  const getReadableExam = (exam: string) => {
    if (!exam) return 'Not Selected';
    return exam.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const clearSuccessMessage = useCallback(() => setSuccessMessage(null), []);

  const handleVerify = useCallback(async () => {
    submittedRef.current = true;
    if (!currentPass) {
      setFieldErrors(prev => ({ ...prev, currentPass: 'Current password is required' }));
      return;
    }
    if (!captchaToken) {
      setError('Please complete the security check to continue.');
      return;
    }

    const id = nextId();
    setLoading(true);
    try {
      const result = await authService.reauthenticate(user?.email || '', currentPass, captchaToken);

      if (isStale(id)) return;
      if (!result.success) {
        setShowForgot(true);
        setCaptchaToken(null);
        captchaRef.current?.reset();
        return setError(result.error?.message || 'Verification failed. Incorrect password.');
      }

      setError(null);
      setCaptchaToken(null);
      setIsVerified(true);
      setSuccessMessage('Password verified! Now set your new password.');
    } catch {
      if (!isStale(id)) {
        setCaptchaToken(null);
        captchaRef.current?.reset();
        setError('Verification failed. Please try again.');
      }
    } finally {
      if (!isStale(id)) setLoading(false);
    }
  }, [currentPass, captchaToken, user?.email, nextId, isStale]);

  const handleCaptchaTokenChange = useCallback((token: string | null) => {
    setError(null);
    setCaptchaToken(token);
  }, []);

  const handleForgotPassword = useCallback(async () => {
    if (!user?.email) return;
    const id = nextId();
    setLoading(true);
    try {
      const { error } = await authService.sendPasswordResetWithRedirect(
        user.email,
        `${window.location.origin}/login?type=recovery`
      );
      if (isStale(id)) return;
      if (error) throw error;
      setSuccessMessage('Password reset link has been sent to your email.');
    } catch (err: unknown) {
      if (!isStale(id)) {
        setError(err instanceof Error ? err.message : 'Could not send the reset link. Please try again.');
      }
    } finally {
      if (!isStale(id)) setLoading(false);
    }
  }, [user?.email, nextId, isStale]);

  const handlePasswordUpdate = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    submittedRef.current = true;

    const errors = validateAll();
    if (errors.currentPass || errors.newPass || errors.confirmPass) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setError(null);

    const id = nextId();
    setLoading(true);
    try {
      const result = await authService.updatePassword(newPass);
      if (isStale(id)) return;
      if (!result.success) throw new Error(result.error?.message);

      setSuccessMessage('Password updated successfully! Logging out for security...');

      logoutTimerRef.current = setTimeout(async () => {
        if (!isStale(id)) {
          await logout();
        }
      }, 2000);
    } catch (err: unknown) {
      if (!isStale(id)) {
        setError(err instanceof Error ? err.message : 'Password update failed. Please try again.');
      }
    } finally {
      if (!isStale(id)) setLoading(false);
    }
  }, [validateAll, newPass, nextId, isStale, logout]);

  const revalidateField = useCallback((name: 'currentPass' | 'newPass' | 'confirmPass') => {
    if (!submittedRef.current) return;
    setFieldErrors(prev => ({ ...prev, [name]: validateAll()[name] }));
  }, [validateAll]);

  const resetVerification = useCallback(() => {
    setIsVerified(false);
    setCurrentPass('');
    setFieldErrors({});
    setCaptchaToken(null);
  }, []);

  const handleCurrentPassChange = useCallback((value: string) => {
    setError(null);
    setCurrentPass(value);
  }, []);

  const togglePasswordForm = useCallback(() => {
    setShowPasswordForm(prev => !prev);
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteInFlightRef.current) return;
    deleteInFlightRef.current = true;
    setDeleteLoading(true);
    setDeleteError(null);

    const id = nextId();
    try {
      const result = await deleteOwnAccount();
      if (isStale(id)) return;
      if (!result.success) {
        setDeleteError(result.error?.message || 'We could not delete your account. Please try again.');
        return;
      }
      // Account + session destroyed server-side. Terminate the local session
      // and route the user to the sign-in page (same logout path as password
      // update success).
      await logout();
    } catch {
      if (!isStale(id)) {
        setDeleteError('We could not delete your account. Please try again.');
      }
    } finally {
      if (!isStale(id)) {
        setDeleteLoading(false);
        deleteInFlightRef.current = false;
      }
    }
  }, [nextId, isStale, logout]);

  return {
    user,
    authLoading,
    initialized,
    error,
    currentPass, setCurrentPass, handleCurrentPassChange,
    newPass, setNewPass,
    confirmPass, setConfirmPass,
    loading,
    showCurrent, setShowCurrent,
    showNew, setShowNew,
    showConfirm, setShowConfirm,
    isVerified, setIsVerified,
    showForgot,
    fieldErrors,
    captchaRef,
    captchaToken,
    onCaptchaTokenChange: handleCaptchaTokenChange,
    stats,
    statsLoading,
    statsError,
    statsRetrying,
    retryStats,
    profileRetrying,
    retryProfile,
    onCurrentPassBlur: () => revalidateField('currentPass'),
    onNewPassBlur: () => revalidateField('newPass'),
    onConfirmPassBlur: () => revalidateField('confirmPass'),
    passwordMatch,
    hasMinLength: minLength, hasUppercase: uppercase, hasNumber: number, hasSpecial: special,
    passwordValid,
    memberSince,
    getReadableExam,
    successMessage, clearSuccessMessage,
    logout,
    handleVerify,
    handleForgotPassword,
    handlePasswordUpdate,
    resetVerification,
    showPasswordForm,
    togglePasswordForm,
    deleteLoading,
    deleteError,
    handleDeleteAccount,
  };
}
