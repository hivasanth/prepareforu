import { useEffect, useState, useCallback } from 'react';
import { useAsyncOperation } from '../hooks/useAsyncOperation';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  checkIsSignInWithEmailLink, 
  completePasswordlessSignIn, 
  parseAuthError 
} from '../services/authService';
import { LogoSVG } from '../components/Logo';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import {
  IconBadge,
  Button,
  Input,
  Label,
  Spinner,
  Alert,
  Card,
  PageContainer,
  H3,
  Body,
  AuthThemeProvider,
} from '../components/common/AntigravityUI';
import { emailSchema } from '../validations/authSchemas';

export default function FinishSignInPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'confirm_email' | 'success' | 'error'>('verifying');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailAttempted, setEmailAttempted] = useState(false);
  const { loading, execute } = useAsyncOperation();

  const completeSignIn = useCallback(async (emailToUse: string, link: string) => {
    setError(null);
    try {
      await execute(async () => {
        await completePasswordlessSignIn(emailToUse, link);
        window.localStorage.removeItem('emailForSignIn');
        setStatus('success');

        // Short delay for the success state view
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      });
    } catch (e) {
      console.error(e);
      setStatus('error');
      setError(parseAuthError(e));
    }
  }, [execute, navigate]);

  useEffect(() => {
    const handleLink = async () => {
      const url = window.location.href;

      if (!checkIsSignInWithEmailLink(url)) {
        setStatus('error');
        setError('The link provided is invalid or has expired.');
        return;
      }

      // Try to get email from localStorage (same device)
      const storedEmail = window.localStorage.getItem('emailForSignIn');

      if (!storedEmail) {
        // Different device or storage cleared
        setStatus('confirm_email');
        return;
      }

      // Auto-complete if email found
      await completeSignIn(storedEmail, url);
    };

    handleLink();
  }, [completeSignIn]);

  const handleManualConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailAttempted(true);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0].message);
      return;
    }
    setEmailError(null);
    completeSignIn(email, window.location.href);
  };

  const handleEmailBlur = () => {
    if (!emailAttempted) return;
    const parsed = emailSchema.safeParse(email);
    setEmailError(parsed.success ? null : parsed.error.issues[0].message);
  };

  return (
    <AuthThemeProvider>
    <PageContainer centered>
      <div className="w-full max-w-[440px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="auth-light">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-hover-bg rounded-2xl flex items-center justify-center shadow-sm">
                <LogoSVG size={36} />
              </div>

              <AnimatePresence mode="wait">
                {status === 'verifying' && (
                  <motion.div
                    key="verifying"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-center">
                      <Spinner size="md" />
                    </div>
                    <H3 className="text-2xl font-black tracking-tight">Verifying Link</H3>
                    <Body secondary className="text-sm font-medium">Please wait while we secure your session...</Body>
                  </motion.div>
                )}

                {status === 'confirm_email' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6 w-full"
                  >
                    <div className="space-y-2">
                      <H3 className="text-2xl font-black tracking-tight">Confirm Your Email</H3>
                      <Body secondary className="text-sm font-medium leading-relaxed">
                        You're opening this link on a different device. For security, please enter your email again.
                      </Body>
                    </div>

                    <form onSubmit={handleManualConfirm} className="space-y-4" noValidate>
                      <div className="space-y-2 text-left">
                        <Label htmlFor="confirm-email" className="uppercase tracking-widest ml-1">
                          Email Address
                        </Label>
                        <Input
                          type="email"
                          id="confirm-email"
                          aria-invalid={emailError ? true : undefined}
                          aria-describedby={emailError ? "confirm-email-error" : undefined}
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={handleEmailBlur}
                        />
                        {emailError && (
                          <span id="confirm-email-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                            {emailError}
                          </span>
                        )}
                      </div>
                      <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        className="group"
                      >
                        {loading ? 'AUTHENTICATING...' : 'FINISH SIGN IN'}
                        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                      </Button>
                    </form>
                  </motion.div>
                )}

                {status === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-center">
                      <IconBadge icon={CheckCircle2} size="4xl" shape="circle" status="success" />
                    </div>
                    <H3 className="text-2xl font-black tracking-tight">Securely Signed In</H3>
                    <Body secondary className="text-sm font-medium">Welcome back! Redirecting to your dashboard...</Body>
                  </motion.div>
                )}

                {status === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-center">
                      <IconBadge icon={AlertCircle} size="4xl" shape="circle" status="danger" />
                    </div>
                    <div className="space-y-2">
                      <H3 className="text-2xl font-black tracking-tight">Unable to Sign In</H3>
                      <Alert variant="error" icon={AlertCircle} title="Action failed">
                        {error}
                      </Alert>
                    </div>
                    <Button
                      fullWidth
                      onClick={() => navigate('/login')}
                    >
                      GO TO LOGIN
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageContainer>
    </AuthThemeProvider>
  );
}
