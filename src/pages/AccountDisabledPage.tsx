import { useAuth } from '../context/AuthContext';
import { LogoSVG } from '../components/Logo';
import { PaletteBackground } from '../components/PaletteBackground';
import { ConfirmModal } from '../components/common/SharedComponents';
import { useSignOutConfirmation } from '../hooks/useSignOutConfirmation';

export default function AccountDisabledPage() {
  const { logout } = useAuth();
  const { isOpen: isSignOutOpen, openDialog: openSignOut, closeDialog: closeSignOut, handleConfirm: confirmSignOut } = useSignOutConfirmation(logout);

  return (
    <>
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        <PaletteBackground />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 z-[3] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.1%22/%3E%3C/svg%3E')] opacity-20 pointer-events-none mix-blend-overlay" />

        <div className="w-full max-w-[440px] relative z-20 space-y-6">
          <div className="relative z-10 flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20">
              <LogoSVG size={36} />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-white tracking-tight leading-tight">Account Disabled</h1>
              <p className="text-white/60 text-xs font-medium uppercase tracking-[2px] mt-2">Access Revoked</p>
            </div>
          </div>

          <div className="relative z-10 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <div className="w-12 h-12 bg-slate-400 rounded-2xl grayscale flex items-center justify-center shadow-lg shadow-black/10">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-slate-600 text-sm font-semibold leading-relaxed px-4">
                Your account has been deactivated by the platform administrators. This can happen for various reasons including policy violations or subscription issues.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <a 
                href="mailto:support@prepareforu.com"
                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-sm tracking-wide transition-all duration-300 shadow-xl shadow-slate-900/10 active:scale-[0.98] flex items-center justify-center"
              >
                CONTACT SUPPORT
              </a>
              <button 
                onClick={openSignOut}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs tracking-widest transition-all"
              >
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      </div>

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
    </>
  );
}
