import { type ReactNode }  from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth }          from '../context/AuthContext'
import type { UserRole }    from '../types/auth.types'
import Loader from '../components/Loader'
import { getRouteForRole }  from '../utils/getRouteForRole'
import { logDebug, logWarn } from '../utils/logger'

// ─── Inline Loader ────────────────────────────────────────────────────────────
export function GuardLoader() {
  return (
    <div style={{
      position:'fixed', inset:0, background:'#080810',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex: 9999
    }}>
      <Loader />
    </div>
  )
}

// ─── AuthGuard ────────────────────────────────────────────────────────────────
// Authoritative check with sanitized redirection memory (URL + Search + Hash)
interface AuthGuardProps {
  children?:             ReactNode
  requireExamSelection?: boolean
}

export function AuthGuard({ children, requireExamSelection = true }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <GuardLoader />

  if (!user) {
    const fullRelativePath = location.pathname + location.search + location.hash
    logDebug('guard.auth.no_user', { path: fullRelativePath });
    return <Navigate to={`/login?redirectTo=${encodeURIComponent(fullRelativePath)}`} replace />
  }

  // CRITICAL: Robust check for disabled account
  if (user.is_active === false) {
    logDebug('guard.auth.account_suspended', {});
    return <Navigate to="/login?error=disabled" replace />
  }

  const isPrivilegedUser = user.role === 'admin' || user.role === 'sub_admin';

  if (isPrivilegedUser) {
    return children ? <>{children}</> : <Outlet />
  }
  
  if (requireExamSelection && !user.exam_selection) {
    if (location.pathname !== '/signup') {
      logDebug('guard.auth.no_exam_selection', { path: location.pathname });
      return <Navigate to="/signup" replace />
    }
  }

  return children ? <>{children}</> : <Outlet />
}

// ─── RoleGuard ────────────────────────────────────────────────────────────────
interface RoleGuardProps {
  children?:    ReactNode
  allowedRoles: UserRole[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading } = useAuth()

  // Guard against stale roles during auth transitions/loading
  if (loading || !user || !user.role) {
    return <GuardLoader />
  }

  if (!allowedRoles.includes(user.role)) {
    logWarn('guard.role.access_denied', { role: user.role });
    return <Navigate to="/unauthorized" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export function GuestGuard({ children }: { children?: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <GuardLoader />

  if (user) {
    // CRITICAL: If account is suspended, stay on login page (don't redirect to selection)
    if (user.is_active === false) {
      logDebug('guard.guest.account_suspended', {});
      return children ? <>{children}</> : <Outlet />
    }

    const isPrivilegedUser = user.role === 'admin' || user.role === 'sub_admin';
    
    if (!user.exam_selection && !isPrivilegedUser) {
      if (location.pathname === '/signup') {
        logDebug('guard.guest.selection_on_signup', {});
        return children ? <>{children}</> : <Outlet />
      }
      logDebug('guard.guest.no_selection', {});
      return <Navigate to="/signup" replace />
    }
    const target = getRouteForRole(user.role);
    logDebug('guard.guest.authenticated_redirect', { path: location.pathname, target });
    return <Navigate to={target} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
