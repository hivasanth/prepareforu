import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '../../context/AuthContext';
import { useStableFetch } from '../../hooks/useStableFetch';
import { supabase } from '../../lib/supabase';
import { useToast, ToastContainer } from '../../hooks/useToast';
import {
  Mail,
  BookOpen,
  Calendar,
  Flame,
  Target,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Shield,
  Lock,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  StatCard,
  Button,
  Input,
  Badge,
  PageContainer,
  Stack,
  Grid,
  H3,
  Body,
  Label,
  PageTransition,
  IconBadge
} from '../../components/common/AntigravityUI';
import { LoadingSkeleton } from '../../components/common/SharedComponents';

export default function UserProfile() {

  const { user, loading: authLoading } = useAuth();
  const { toasts, showSuccess, showError } = useToast();

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const { nextId, isStale } = useStableFetch();

  const passwordMatch = newPass && confirmPass ? newPass === confirmPass : null;
  const passwordValid = newPass.length >= 8;

  const handleVerify = useCallback(async () => {
    if (!currentPass) return showError('Please enter your current password.');

    const id = nextId();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPass
      });

      if (isStale(id)) return;
      if (error) {
        setShowForgot(true);
        return showError('Verification failed. Incorrect password.');
      }

      setIsVerified(true);
      showSuccess('Password verified! Now set your new password.');
    } catch (err: any) {
      if (!isStale(id)) {
        showError(err.message || 'An error occurred during verification.');
      }
    } finally {
      if (!isStale(id)) setLoading(false);
    }
  }, [currentPass, user?.email, showError]);

  const handleForgotPassword = useCallback(async () => {
    if (!user?.email) return;
    const id = nextId();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/login?type=recovery`,
      });
      if (isStale(id)) return;
      if (error) throw error;
      showSuccess('Password reset link has been sent to your email.');
    } catch (err: any) {
      if (!isStale(id)) {
        showError(err.message || 'Failed to send reset link.');
      }
    } finally {
      if (!isStale(id)) setLoading(false);
    }
  }, [user?.email, showError, showSuccess]);

  const handlePasswordUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return handleVerify();

    if (!passwordValid) return showError('Password must be at least 8 characters.');
    if (!passwordMatch) return showError('Passwords do not match.');
    if (newPass === currentPass) return showError('New password cannot be the same as the current password.');

    const id = nextId();
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPass });
      if (isStale(id)) return;
      if (updateError) throw updateError;

      showSuccess('Password updated successfully! Logging out for security...');

      setTimeout(async () => {
        if (!isStale(id)) {
          await supabase.auth.signOut();
          window.location.href = '/login';
        }
      }, 2000);

    } catch (err: any) {
      if (!isStale(id)) {
        showError(err.message || 'Failed to update password.');
      }
    } finally {
      if (!isStale(id)) setLoading(false);
    }
  }, [isVerified, passwordValid, passwordMatch, newPass, currentPass, handleVerify, showError, showSuccess]);

  if (authLoading || !user) {
    return (
      <PageContainer>
        <Stack gap={48}>
          <LoadingSkeleton height={180} borderRadius={24} />
          <Stack gap={24}>
            <LoadingSkeleton height={40} width={200} borderRadius={12} />
            <Grid cols={4} gap={24}>
              {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} height={100} borderRadius={16} />)}
            </Grid>
          </Stack>
          <LoadingSkeleton height={400} borderRadius={24} />
        </Stack>
      </PageContainer>
    );
  }

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  const getReadableExam = (exam: string) => {
    if (!exam) return 'Not Selected';
    return exam.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <PageContainer>
      <PageTransition>
        <Stack gap={48}>

          <Card className="p-8 md:p-10 shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden border-primary/5">
            <div className="relative shrink-0">
              <div
                className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] bg-primary flex items-center justify-center text-white text-4xl md:text-5xl font-black shadow-2xl shadow-primary/30"
                aria-label={`${user.full_name}'s avatar`}
                role="img"
              >
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 md:w-10 md:h-10 bg-success border-4 border-card-bg rounded-full shadow-lg" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-6">
              <div className="space-y-1">
                <h2 className="m-0 text-[24px] md:text-[32px] font-black text-text-primary tracking-tighter leading-none">{user.full_name}</h2>
                <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] opacity-60">Academic Portfolio</p>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="h-10 flex items-center gap-3 px-4 bg-hover-bg/50 border border-border-subtle rounded-xl">
                  <Mail size={16} className="text-primary opacity-60" />
                  <span className="text-text-primary font-bold text-[13px] tracking-tight">{user.email}</span>
                </div>
                <div className="h-10 flex items-center gap-3 px-4 bg-hover-bg/50 border border-border-subtle rounded-xl">
                  <Calendar size={16} className="text-primary opacity-60" />
                  <span className="text-text-primary font-bold text-[11px] uppercase tracking-widest">Joined {memberSince}</span>
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          </Card>

          <Stack gap={24}>
            <div className="flex items-center gap-3 px-1">
              <IconBadge icon={BookOpen} size="xl" shape="rounded" className="shadow-inner" />
              <div>
                <H3 className="uppercase tracking-tight m-0">Academic Statistics</H3>
                <Body secondary className="text-[11px] uppercase tracking-widest font-black opacity-40">Verified Performance Metrics</Body>
              </div>
            </div>

            <Grid cols={4} gap={24}>
              <StatCard icon={BookOpen} label="SELECTED EXAM" value={getReadableExam(user.exam_selection || '')} color="var(--primary)" />
              <StatCard icon={Target} label="ACCURACY" value={`${user.overall_accuracy ?? 0}%`} color="var(--success)" />
              <StatCard icon={Flame} label="CURRENT STREAK" value={`${user.streak ?? 0} DAYS`} color="#F59E0B" />
              <StatCard icon={ShieldCheck} label="HIGHEST STREAK" value={`${user.longest_streak ?? 0} DAYS`} color="#6366F1" />
            </Grid>
          </Stack>

          <Card className="p-8 md:p-12 shadow-2xl relative overflow-hidden border-primary/5">
            <div className="flex items-center gap-6 mb-12">
              <IconBadge icon={Shield} size="4xl" shape="rounded" darkClassName="rounded-2xl bg-primary/10 border border-primary/20 shadow-inner" />
              <div>
                <H3 className="uppercase tracking-tight m-0">Security & Credentials</H3>
                <Body secondary className="mt-1 font-medium">Manage your session authentication and account access.</Body>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-12">
              <div className="max-w-3xl">
                <Stack gap={40}>
                  <Stack gap={16} className="relative">
                    <div className="flex justify-between items-end">
                      <Label className="text-[12px] uppercase tracking-widest">Current Password</Label>
                      {isVerified && (
                        <Badge variant="success" className="h-7 px-3 rounded-lg font-black tracking-widest text-[9px]">
                          <CheckCircle2 size={12} className="mr-1.5" /> AUTHENTICATED
                        </Badge>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPass}
                        onChange={(e) => {
                          setCurrentPass(e.target.value);
                          if (isVerified) setIsVerified(false);
                        }}
                        placeholder="Type current password to verify"
                        disabled={isVerified || loading}
                        rightIcon={isVerified ? CheckCircle2 : (showCurrent ? EyeOff : Eye)}
                        onRightIconClick={() => !isVerified && setShowCurrent(!showCurrent)}
                        className={`h-16 rounded-[20px] text-[16px] transition-all font-medium ${isVerified ? 'border-success/30 bg-success/5 text-success' : 'border-border-subtle focus:border-primary/50'}`}
                        inputMode="text"
                        autoComplete="current-password"
                      />
                      {isVerified && (
                        <button
                          type="button"
                          onClick={() => { setIsVerified(false); setCurrentPass(''); }}
                          className="absolute -right-14 top-1/2 -translate-y-1/2 p-3 text-text-secondary lg:hover:text-primary transition-colors bg-hover-bg/50 rounded-xl border border-border-subtle"
                          aria-label="Reset password verification"
                        >
                          <RefreshCcw size={18} />
                        </button>
                      )}
                    </div>

                    {!isVerified && (
                      <div className="flex items-center justify-between mt-2 px-1">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[11px] font-black text-primary uppercase tracking-[0.2em] lg:hover:opacity-70 transition-opacity"
                        >
                          Recover Password?
                        </button>
                        <Button
                          type="button"
                          variant="primary"
                          className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px]"
                          loading={loading}
                          onClick={handleVerify}
                          disabled={!currentPass || loading}
                        >
                          Verify Access
                        </Button>
                      </div>
                    )}
                  </Stack>

                  <AnimatePresence>
                    {isVerified && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: 20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: 20 }}
                        className="overflow-hidden"
                      >
                        <Stack gap={40} className="pt-10 border-t border-border-subtle/30">
                          <Grid cols={1} sm={2} gap={24}>
                            <Stack gap={16}>
                              <Label className="text-[12px] uppercase tracking-widest">New Password</Label>
                              <Input
                                type={showNew ? 'text' : 'password'}
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                placeholder="Create strong password"
                                rightIcon={showNew ? EyeOff : Eye}
                                onRightIconClick={() => setShowNew(!showNew)}
                                className="h-16 rounded-[20px] text-[16px] font-medium"
                                inputMode="text"
                                autoComplete="new-password"
                              />
                            </Stack>
                            <Stack gap={16}>
                              <Label className="text-[12px] uppercase tracking-widest">Confirm Password</Label>
                              <Input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                placeholder="Re-type new password"
                                rightIcon={showConfirm ? EyeOff : Eye}
                                onRightIconClick={() => setShowConfirm(!showConfirm)}
                                className="h-16 rounded-[20px] text-[16px] font-medium"
                                inputMode="text"
                                autoComplete="new-password"
                              />
                            </Stack>
                          </Grid>

                          <div className="flex gap-4 flex-wrap pb-8 border-b border-border-subtle/30">
                            <Badge variant={passwordValid ? 'success' : 'default'} className="px-4 py-2 rounded-xl font-bold tracking-widest">
                              <div className="flex items-center gap-2">
                                {passwordValid ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                                <span>MIN. 8 CHARACTERS</span>
                              </div>
                            </Badge>
                            <Badge variant={passwordMatch === true ? 'success' : passwordMatch === false ? 'danger' : 'default'} className="px-4 py-2 rounded-xl font-bold tracking-widest">
                              <div className="flex items-center gap-2">
                                {passwordMatch === true ? <CheckCircle2 size={16} /> : passwordMatch === false ? <XCircle size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                                <span>IDENTICAL MATCH</span>
                              </div>
                            </Badge>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={loading || !passwordValid || !passwordMatch}
                              variant="success"
                              loading={loading}
                              className="px-12 h-16 rounded-[24px] shadow-2xl shadow-success/20 font-black uppercase tracking-[0.2em] text-[12px]"
                            >
                              <Lock size={18} className="mr-3" /> Commit Changes
                            </Button>
                          </div>
                        </Stack>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Stack>
              </div>

              {!isVerified && showForgot && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-[24px] bg-danger/5 border border-danger/20 flex gap-4 items-center shadow-inner"
                >
                  <AlertCircle size={24} className="text-danger shrink-0" />
                  <div className="flex-1">
                    <Body className="text-danger font-black text-[12px] uppercase tracking-widest">Authentication Conflict</Body>
                    <p className="text-[13px] text-danger/80 font-medium m-0 mt-1">If you can't recall your password, use the recovery engine.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="h-10 px-6 rounded-xl bg-danger/10 text-danger font-black text-[10px] uppercase tracking-widest lg:hover:bg-danger/20 transition-all border border-danger/20"
                  >
                    Reset Via Email
                  </button>
                </motion.div>
              )}
            </form>

            <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-40 -mb-40 pointer-events-none" />
          </Card>

        </Stack>

        <ToastContainer toasts={toasts} />

      </PageTransition>
    </PageContainer>
  );
}
