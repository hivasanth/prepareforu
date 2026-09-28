import { useNavigate } from 'react-router-dom'
import { NotFoundSurface } from '../components/common/NotFoundSurface'
import { useAuth } from '../context/AuthContext'

const DASHBOARD_ROUTE: Record<string, string> = {
  admin: '/admin/overview',
  sub_admin: '/sub-admin/dashboard',
  user: '/dashboard',
}

/* Route-level 404 (audit §12/§14 P1-9). Replaces the silent wildcard
   redirect: an unmatched route now renders the canonical NotFoundSurface.
   Authenticated users get a role-aware home action; guests get Back to
   Login. */
export default function NotFoundPage() {
  const { user, loading, initialized } = useAuth()
  const navigate = useNavigate()
  const dashboardUrl = DASHBOARD_ROUTE[user?.role ?? 'user']

  if (!initialized || loading) return null

  if (!user) {
    return (
      <NotFoundSurface
        primaryLabel="Back to Login"
        onPrimary={() => navigate('/login', { replace: true })}
        secondaryLabel="Create an Account"
        onSecondary={() => navigate('/signup', { replace: true })}
      />
    )
  }

  return (
    <NotFoundSurface
      onPrimary={() => navigate(dashboardUrl, { replace: true })}
      onSecondary={() => navigate('/login', { replace: true })}
      secondaryLabel="Back to Login"
    />
  )
}