import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updatePassword as apiUpdatePassword } from '../../services/authService'

export default function UpdatePasswordPage() {
  const navigate      = useNavigate()
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw]                   = useState(false)
  const [showConfirmPw, setShowConfirmPw]     = useState(false)
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')
  const [done, setDone]                       = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmPassword) { setError('Both fields are required.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be 8+ characters.'); return }

    setLoading(true); setError('')
    try {
      const result = await apiUpdatePassword(password)
      if (!result.success) { 
        setError(result.error?.message || 'Update failed.')
        return 
      }
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafbff] text-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute pointer-events-none" style={{width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,0.04) 0%,transparent 70%)',top:-150,left:-150}}/>
      <div className="absolute pointer-events-none" style={{width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(167,139,250,0.03) 0%,transparent 70%)',bottom:-100,right:-100}}/>

      <div className="w-full max-w-[460px] bg-white p-12 rounded-[28px] border border-slate-100 relative z-[1] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]">
        <div className="p-8">
          {done ? (
            <div className="text-center" style={{animation:'fi .4s ease'}}>
              <span className="text-[64px] mb-6 block">🛡️</span>
              <h2 className="text-[32px] font-black mb-3 text-slate-900 tracking-[-1px]">Password Secured</h2>
              <p className="text-slate-500 text-base leading-[1.6] mb-8 font-medium">Your password has been successfully updated. Redirecting you to login...</p>
              <div className="mx-auto" style={{width:28,height:28,border:'3px solid rgba(124,58,237,0.1)',borderTopColor:'#7c3aed',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-[42px] h-[42px] bg-gradient-to-br from-violet-600 to-violet-400 rounded-[12px] flex items-center justify-center text-white font-black text-lg shadow-[0_8px_20px_rgba(124,58,237,0.25)]">P</div>
                <span className="font-black text-[22px] tracking-[-0.5px]">PrepareForU</span>
              </div>

              <h2 className="text-[36px] font-black mb-2 tracking-[-1.5px]">Reset Password</h2>
              <p className="text-slate-500 text-base mb-8 font-medium">Create a new, strong password for your account.</p>
              
              {error && (
                <div className="text-red-500 bg-red-50 p-4 rounded-[16px] text-sm mb-6 border border-red-100 flex gap-2.5 items-center font-semibold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdate} noValidate>
                <div className="mb-6">
                  <label className="block text-xs font-extrabold text-slate-900 mb-3 uppercase tracking-[1.5px] opacity-70">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      autoFocus
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 text-base outline-none transition-all duration-250 font-medium focus:border-violet-600 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.08)] focus:bg-white"
                      value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 8 characters"
                    />
                    <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-0 text-slate-500 cursor-pointer p-2 flex items-center rounded-[10px] transition-all duration-200">
                      {showPw 
                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                <div className="mb-10">
                  <label className="block text-xs font-extrabold text-slate-900 mb-3 uppercase tracking-[1.5px] opacity-70">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[16px] text-slate-900 text-base outline-none transition-all duration-250 font-medium focus:border-violet-600 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.08)] focus:bg-white"
                      value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repeat password"
                    />
                    <button type="button" onClick={()=>setShowConfirmPw(!showConfirmPw)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-0 text-slate-500 cursor-pointer p-2 flex items-center rounded-[10px] transition-all duration-200">
                      {showConfirmPw 
                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                <button disabled={loading} className="w-full py-5 bg-gradient-to-br from-violet-600 to-violet-800 border-0 rounded-[18px] text-white font-black cursor-pointer shadow-[0_12px_24px_rgba(124,58,237,0.3)] transition-all duration-300 uppercase tracking-[1.5px] hover:-translate-y-1 hover:brightness-105 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div style={{width:20,height:20,border:'3px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
                      <span>Securing...</span>
                    </div>
                  ) : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  )
}
