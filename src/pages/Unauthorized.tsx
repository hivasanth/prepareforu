import { motion } from 'framer-motion'
import { ShieldAlert, ChevronLeft, Home } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, IconBadge } from '../components/common/AntigravityUI'
import { useAuth } from '../context/AuthContext'

const DASHBOARD_ROUTE: Record<string, string> = {
  admin: '/admin/overview',
  sub_admin: '/sub-admin/dashboard',
  user: '/dashboard',
}

export default function Unauthorized() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const dashboardUrl = DASHBOARD_ROUTE[user?.role ?? 'user']

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-card-bg border border-border-subtle rounded-[40px] p-8 sm:p-12 shadow-2xl text-center"
      >
        <IconBadge icon={ShieldAlert} size="5xl" className="bg-danger/10 text-danger mx-auto mb-8 border border-danger/20 shadow-lg shadow-danger/5 rounded-3xl" darkClassName="" />

        <h1 className="text-3xl font-black text-text-primary mb-4 uppercase tracking-tight">
          Unauthorized Access
        </h1>
        
        <p className="text-text-secondary font-medium leading-relaxed mb-10 text-sm sm:text-base">
          It seems you don't have the required administrative permissions to access this specialized module. 
          Your attempt has been logged for security audit purposes.
        </p>

        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate(dashboardUrl, { replace: true })} className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-all">
            <Home size={18} />
            Return to Dashboard
          </Button>
          
          <Link to="/login">
            <Button variant="secondary" className="w-full py-4 rounded-2xl bg-hover-bg/50 text-text-secondary font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:text-primary transition-all active:scale-95 border-none !h-auto !shadow-none">
              <ChevronLeft size={16} />
              Back to Login
            </Button>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-border-subtle/50">
          <div className="flex items-center justify-center gap-2 opacity-30 grayscale">
            <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">
              Defense System Active
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
