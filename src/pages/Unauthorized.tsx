import { motion } from 'framer-motion'
import { ShieldAlert, ChevronLeft, Home } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, IconBadge, PageContainer, PageTransition } from '../components/common/AntigravityUI'
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
    <PageContainer centered>
      <PageTransition>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          role="alert"
          aria-live="assertive"
          className="max-w-md w-full bg-card-bg border border-border-subtle rounded-[40px] p-8 sm:p-12 shadow-2xl text-center ancient-overlay"
        >
          <IconBadge icon={ShieldAlert} size="5xl" status="danger" className="mx-auto mb-8 rounded-3xl" />

          <h1 className="text-3xl font-black text-text-primary mb-4 uppercase tracking-tight">
            Unauthorized Access
          </h1>
          
          <p className="text-text-secondary font-medium leading-relaxed mb-10 text-sm sm:text-base">
            It seems you don't have the required administrative permissions to access this specialized module. 
            Your attempt has been logged for security audit purposes.
          </p>

          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate(dashboardUrl, { replace: true })} fullWidth>
              <Home size={18} />
              Return to Dashboard
            </Button>
            
            <Link to="/login" className="w-full">
              <Button variant="secondary" fullWidth>
                <ChevronLeft size={16} />
                Back to Login
              </Button>
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-border-subtle/50">
            <div className="flex items-center justify-center gap-2 opacity-30 grayscale">
              <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                Defense System Active
              </span>
            </div>
          </div>
        </motion.div>
      </PageTransition>
    </PageContainer>
  )
}
