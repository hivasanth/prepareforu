import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase }    from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { getProfile }  from '../services/userService'
import type { UserProfile } from '../types/auth.types'
import Loader from '../components/Loader'
import { logDebug, logError } from '../utils/logger'

// ─── Context Shape ────────────────────────────────────────────────────────────
interface AuthContextType {
  user:        UserProfile | null
  loading:     boolean
  initialized: boolean
  refreshUser: () => Promise<void>

  // Aliases for compatibility with legacy components (AppShell, etc.)
  currentUser: (UserProfile & { displayName?: string; email_confirmed_at?: string }) | null
  session: Session | null
  userProfile: UserProfile | null
  isAuthenticated: boolean
  isEmailVerified: boolean
  isActive: boolean
  isAdmin: boolean
  isProfileComplete: boolean
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  updateUser: (profile: UserProfile | null, session?: Session | null) => void
  setManualLoginActive: (val: boolean) => void
  clearUser: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// ─── Full-Page Loader ─────────────────────────────────────────────────────────
function FullLoader() {
  return (
    <div style={{
      position:'fixed', inset:0,
      background:'#080810',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      gap:24, zIndex:9999,
    }}>
      <Loader />
      <p style={{ 
        fontSize:16, 
        letterSpacing: '1px',
        color: '#a78bfa',
        margin:0,
        fontWeight: 600,
        textTransform: 'uppercase'
      }}>
        Loading your account...
      </p>
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate      = useNavigate()
  const [user,        setUser]        = useState<UserProfile | null>(null)
  const [session,     setSession]     = useState<Session | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [initialized, setInitialized] = useState(false)
  const mountedRef     = useRef(true)
  // userRef mirrors user state SYNCHRONOUSLY (not via useEffect) so that
  // onAuthStateChange event handlers always see the current user ID when
  // deciding whether a SIGNED_IN event is for the same or a different account.
  const userRef        = useRef<UserProfile | null>(null)
  
  // Synchronous helper — always call instead of bare setUser() so userRef stays in sync.
  const setUserSync = useCallback((profile: UserProfile | null) => {
    userRef.current = profile
    setUser(profile)
  }, [])

  // Fix A — Add a clearUser function to AuthContext
  const clearUser = useCallback(() => {
    setUserSync(null)
    setSession(null)
    setLoading(true)
  }, [setUserSync])

  // ─── Concurrency & Loop Guards ──────────────────────────────────────────────
  const isFetchingUser = useRef(false)
  const isRefreshing   = useRef(false)
  const isLoggingIn    = useRef(false) 
  const isBooting      = useRef(true) // Unified Boot Lock
  const originRef      = useRef<'initial' | 'manual' | 'auth_event'>('initial')

  const refreshUser = useCallback(async () => {
    if (isFetchingUser.current) return
    isFetchingUser.current = true

    try {
      logDebug('auth.refreshUser', { step: 'fetching_user' });
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        logDebug('auth.refreshUser', { step: 'no_user', error: authError?.message });
        if (mountedRef.current) {
          setUserSync(null)
          setLoading(false)
        }
        return
      }
      
      logDebug('auth.refreshUser', { step: 'session_valid', userId: authUser.id });
      const profile = await getProfile(authUser.id)
      
      if (mountedRef.current) {
        if (!profile) {
          logError('auth.profile_missing', { userId: authUser.id });
          setUserSync(null)
        } else {
          logDebug('auth.refreshUser', { step: 'profile_restored' });
          setUserSync(profile)
        }
        setLoading(false)
      }
    } catch (err) {
      logError('auth.refreshUser_exception', { message: err instanceof Error ? err.message : 'Unknown error' })
      if (mountedRef.current) {
        setUserSync(null)
        setLoading(false)
      }
    } finally {
      isFetchingUser.current = false
    }
  }, [setUserSync])

  const refreshSession = useCallback(async () => {
    if (isRefreshing.current) return
    isRefreshing.current = true
    originRef.current = 'manual'

    try {
      const { data: { session: s }, error } = await supabase.auth.refreshSession()
      if (!error && s) {
        setSession(s)
        await refreshUser()
      }
    } finally {
      // Cooldown to prevent "Refresh Storms"
      setTimeout(() => {
        if (mountedRef.current) isRefreshing.current = false
      }, 5000)
    }
  }, [refreshUser])

  // Fix C — Flush Supabase local storage on logout
  const logout = useCallback(async () => {
    clearUser()
    try {
      await supabase.auth.signOut()
    } catch (e) {
      logError('auth.signOut', { message: e instanceof Error ? e.message : 'Unknown error' })
    }
    // Flush local storage
    localStorage.removeItem('supabase.auth.token')
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        localStorage.removeItem(key)
      }
    }
    // Trigger cross-tab sync logout event
    localStorage.setItem('p4u_logout_event', Date.now().toString())
    setLoading(false)
    window.location.href = '/login'
  }, [clearUser])

  useEffect(() => {
    mountedRef.current = true

    // Cross-tab logout synchronization listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'p4u_logout_event' && mountedRef.current) {
        logDebug('auth.cross_tab_logout', {});
        clearUser()
        setLoading(false)
        window.location.href = '/login'
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const timeoutId = setTimeout(() => {
      if (mountedRef.current && !initialized) {
        logDebug('auth.init_timeout', {});
        setLoading(false);
        setInitialized(true);
      }
    }, 8000);

    const initAuth = async () => {
      logDebug('auth.boot', { step: 'unified_boot_start' });
      isBooting.current = true;
      
      try {
        await new Promise(r => setTimeout(r, 100));

        logDebug('auth.boot', { step: 'checking_session' });
        const { data: { session: s }, error: sErr } = await supabase.auth.getSession()
        if (sErr) throw sErr;

        if (!s?.user) {
          logDebug('auth.boot', { step: 'storage_empty_probing_server' });
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (!authUser) {
            logDebug('auth.boot', { step: 'no_session_guest_mode' });
            if (mountedRef.current) { setUserSync(null); setSession(null); }
            return
          }
          if (authUser) s!.user = authUser;
        }

        if (s?.user) {
          setSession(s);
          logDebug('auth.boot', { step: 'session_valid_hydrating_profile', userId: s.user.id });
          
          const profile = await getProfile(s.user.id)
          if (mountedRef.current) {
            if (profile) {
              logDebug('auth.boot', { step: 'profile_synced' });
              setUserSync(profile)
            } else {
              logError('auth.boot', { step: 'profile_not_found', userId: s.user.id });
              setUserSync(null)
            }
          }
        }
      } catch (err) {
        logError('auth.boot_exception', { message: err instanceof Error ? err.message : 'Unknown error' })
        if (mountedRef.current) setUser(null)
      } finally {
        if (mountedRef.current) {
          logDebug('auth.boot', { step: 'boot_complete' });
          setInitialized(true)
          setLoading(false)
          setTimeout(() => { isBooting.current = false; }, 500);
        }
        clearTimeout(timeoutId);
      }
    }

    initAuth()

    // ─── Auth State Listener (Stable & Efficient) ────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mountedRef.current) return
      
      logDebug('auth.onAuthStateChange', { event, origin: originRef.current, hasUser: !!userRef.current })
      setSession(currentSession);

      if (originRef.current === 'manual') {
        originRef.current = 'auth_event'
        return
      }

      switch (event as string) {
        case 'INITIAL_SESSION':
          break

        case 'SIGNED_IN': {
          const incomingUserId = currentSession?.user?.id
          const currentUserId  = userRef.current?.id

          if (incomingUserId && incomingUserId !== currentUserId) {
            logDebug('auth.signed_in', { action: 'account_switch', from: currentUserId ?? 'none', to: incomingUserId });
            setUserSync(null)
            setLoading(true)
            refreshUser().catch(() => logError('auth.refreshUser_failed', {}))
            break
          }

          if ((isBooting.current || isLoggingIn.current) && userRef.current) {
            logDebug('auth.signed_in', { action: 'suppressed_same_user', context: isBooting.current ? 'BOOTING' : 'MANUAL_LOGIN' });
          } else if (!userRef.current && currentSession?.user) {
            setLoading(true)
            refreshUser().catch(() => logError('auth.refreshUser_failed', {}))
          }
          break
        }

        case 'TOKEN_REFRESHED':
          break
        
        case 'SIGNED_OUT':
          if (mountedRef.current) {
            logDebug('auth.signed_out', { action: 'wiping_state' });
            setUserSync(null)
            setSession(null)
            setLoading(false)
          }
          break

        case 'USER_UPDATED':
          setTimeout(async () => {
            if (mountedRef.current) {
              setUserSync(null)
              setLoading(true)
              await refreshUser()
            }
          }, 300);
          break

        case 'TOKEN_REFRESH_FAILED':
          logDebug('auth.token_refresh', { action: 'failed_recovering' })
          await new Promise(r => setTimeout(r, 500))
          const recovery = await supabase.auth.refreshSession()
          if (recovery.error) {
            supabase.auth.signOut()
            if (mountedRef.current) setUserSync(null)
          }
          break
      }
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [refreshUser, navigate, clearUser])

  // ─── Visibility & Refresh Storm Protection ────────────────────────────────
  useEffect(() => {
    const LOCK_KEY = 'p4u_auth_refresh_lock'
    const LOCK_TTL = 5000 

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return

      try {
        const lockStr = localStorage.getItem(LOCK_KEY)
        const lastRefresh = lockStr ? parseInt(lockStr, 10) : 0

        // Multi-tab synchronization
        if (Date.now() - lastRefresh < LOCK_TTL) return

        localStorage.setItem(LOCK_KEY, Date.now().toString())
        await refreshSession()
      } catch (e) {
        logDebug('auth.visibility_refresh', { message: e instanceof Error ? e.message : 'Unknown error' })
      }
    }

    const handleUnload = () => {
      localStorage.removeItem(LOCK_KEY)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleUnload)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [refreshSession])

  // ─── Derived Values & Aliases ───────────────────────────────────────────────
  const isAdmin = user?.role === 'admin' || user?.role === 'sub_admin'
  const isProfileComplete = !!(user?.exam_selection)
  
  // Authoritative Truth: email_confirmed_at from Supabase User object
  const isEmailVerifiedAuthoritative = !!(session?.user?.email_confirmed_at) || (user?.email_verified ?? false)

  // Memoize currentUser object for stability
  const stableCurrentUser = useMemo(() => user ? { 
    ...user, 
    displayName: user.full_name,
    email_confirmed_at: session?.user?.email_confirmed_at 
  } : null, [user, session?.user?.email_confirmed_at]);

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    initialized,
    refreshUser,
    refreshSession,
    session,
    currentUser: stableCurrentUser,
    userProfile: user,
    isAuthenticated: !!user,
    isEmailVerified: isEmailVerifiedAuthoritative,
    isActive: user?.is_active ?? true,
    isAdmin,
    isProfileComplete,
    logout,
    updateUser: (profile: UserProfile | null, session?: Session | null) => {
      if (mountedRef.current) {
        logDebug('auth.updateUser', {});
        isLoggingIn.current = true;
        setUserSync(profile)
        if (session !== undefined) {
          setSession(session)
        }
        setLoading(false)
        setInitialized(true)
        
        // Release block after stabilization
        setTimeout(() => { if (mountedRef.current) isLoggingIn.current = false; }, 1500);
      }
    },
    setManualLoginActive: (val: boolean) => {
      logDebug('auth.setManualLoginActive', { val });
      isLoggingIn.current = val;
    },
    clearUser
  }), [
    user, loading, initialized, refreshUser, refreshSession, 
    session, stableCurrentUser, isEmailVerifiedAuthoritative, 
    isAdmin, isProfileComplete, logout, clearUser
  ]);

  // Show full loader only during very initial boot
  if (!initialized) return <FullLoader />

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
