import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  checkIsSignInWithEmailLink, 
  completePasswordlessSignIn, 
  parseAuthError 
} from '../services/authService';
import { LogoSVG } from '../components/Logo';
import { PaletteBackground } from '../components/PaletteBackground';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { IconBadge } from '../components/common/AntigravityUI';

export default function FinishSignInPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'confirm_email' | 'success' | 'error'>('verifying');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleLink = async () => {
      const url = window.location.href;
      
      if (!checkIsSignInWithEmailLink(url)) {
        setStatus('error');
        setError('The link provided is invalid or has expired.');
        return;
      }

      // Try to get email from localStorage (same device)
      let storedEmail = window.localStorage.getItem('emailForSignIn');
      
      if (!storedEmail) {
        // Different device or storage cleared
        setStatus('confirm_email');
        return;
      }

      // Auto-complete if email found
      await completeSignIn(storedEmail, url);
    };

    handleLink();
  }, []);

  const completeSignIn = async (emailToUse: string, link: string) => {
    setLoading(true);
    setError(null);
    try {
      await completePasswordlessSignIn(emailToUse, link);
      window.localStorage.removeItem('emailForSignIn');
      setStatus('success');
      
      // Short delay for the success state view
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setError(parseAuthError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const handleManualConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    completeSignIn(email, window.location.href);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 text-slate-900">
      <PaletteBackground />
      <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-3xl" />
      
      <div className="w-full max-w-[440px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm">
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
                    <div className="w-10 h-10 border-[3px] border-sky-600/20 border-t-sky-600 rounded-full animate-spin" />
                  </div>
                  <h1 className="text-2xl font-black tracking-tight">Verifying Link</h1>
                  <p className="text-slate-500 text-sm font-medium">Please wait while we secure your session...</p>
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
                    <h1 className="text-2xl font-black tracking-tight">Confirm Your Email</h1>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                      You're opening this link on a different device. For security, please enter your email again.
                    </p>
                  </div>

                  <form onSubmit={handleManualConfirm} className="space-y-4">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 text-sm font-semibold outline-none focus:bg-white focus:border-sky-500 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group transition-all hover:bg-black disabled:opacity-50"
                    >
                      {loading ? 'AUTHENTICATING...' : 'FINISH SIGN IN'}
                      {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </button>
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
                    <IconBadge icon={CheckCircle2} size="4xl" shape="circle" className="bg-emerald-50 text-emerald-500" darkClassName="" />
                  </div>
                  <h1 className="text-2xl font-black tracking-tight">Securely Signed In</h1>
                  <p className="text-slate-500 text-sm font-medium">Welcome back! Redirecting to your dashboard...</p>
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
                    <IconBadge icon={AlertCircle} size="4xl" shape="circle" className="bg-rose-50 text-rose-500" darkClassName="" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-2xl font-black tracking-tight">Unable to Sign In</h1>
                    <p className="text-rose-500 text-sm font-bold bg-rose-50 py-2 px-4 rounded-xl border border-rose-100 italic">
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm tracking-wide"
                  >
                    GO TO LOGIN
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
