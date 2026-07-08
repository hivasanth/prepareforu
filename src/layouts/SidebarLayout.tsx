import { useState, useEffect, useCallback, Suspense, type ReactNode } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  LogOut, Menu, X, ChevronLeft, ChevronRight, Sun, Moon, LayoutDashboard,
} from 'lucide-react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useSignOutConfirmation } from '../hooks/useSignOutConfirmation'
import { ConfirmModal } from '../components/common/SharedComponents'
import type { NavItem } from '../config/navigation'
import { LogoSVG } from '../components/Logo'
import { AdminPageTitle, IconBadge } from '../components/common/AntigravityUI'
import { NotificationBell } from '../components/common/NotificationPanel'

function ErrorFallback({ error }: FallbackProps) {
  return (
    <div role="alert" className="p-10 text-red-500">
      <p className="font-bold">Something went wrong:</p>
      <pre className="text-sm mt-2">{error instanceof Error ? error.message : String(error)}</pre>
    </div>
  )
}

type SidebarMode = 'drawer' | 'collapsed' | 'expanded'

function getDefaultMode(width: number): SidebarMode {
  if (width < 768) return 'drawer'
  if (width < 1024) return 'collapsed'
  return 'expanded'
}

function getInitialMode(storageKey: string): SidebarMode {
  if (typeof window === 'undefined') return 'expanded'
  const saved = localStorage.getItem(storageKey) as SidebarMode | null
  if (saved && window.innerWidth >= 768) return saved
  return getDefaultMode(window.innerWidth)
}

interface SidebarLayoutProps {
  navConfig: NavItem[]
  storageKey: string
  layoutId: string
  logoText: ReactNode
  roleBadge?: { text: string; icon: LucideIcon } | null
  footerRoleLabel: string
  children?: ReactNode
}

export default function SidebarLayout({
  navConfig,
  storageKey,
  layoutId,
  logoText,
  roleBadge,
  footerRoleLabel,
}: SidebarLayoutProps) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const { isOpen: isSignOutOpen, openDialog: openSignOut, closeDialog: closeSignOut, handleConfirm: confirmSignOut } = useSignOutConfirmation(logout)

  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => getInitialMode(storageKey))
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const breakpoint = useBreakpoint()

  const isMobile = breakpoint.isXs || breakpoint.isSm
  const isTablet = breakpoint.isMd
  const isDesktop = breakpoint.isLg || breakpoint.isXl

  const isCollapsedMode = sidebarMode === 'collapsed'
  const isExpandedMode = sidebarMode === 'expanded'
  const isMobileMode = sidebarMode === 'drawer' || (typeof window !== 'undefined' && window.innerWidth < 768)
  const isEffectivelyExpanded = isExpandedMode

  useEffect(() => {
    if (isMobile) {
      setSidebarMode('drawer')
    } else if (isTablet) {
      setSidebarMode('collapsed')
    } else if (isDesktop) {
      const saved = localStorage.getItem(storageKey) as SidebarMode | null
      setSidebarMode(saved === 'collapsed' ? 'collapsed' : 'expanded')
    }
  }, [isMobile, isTablet, isDesktop, storageKey])

  useEffect(() => {
    setIsDrawerOpen(false)
  }, [location.pathname])

  const toggleSidebar = useCallback(() => {
    setSidebarMode(prev => {
      const next: SidebarMode = prev === 'collapsed' ? 'expanded' : 'collapsed'
      localStorage.setItem(storageKey, next)
      return next
    })
  }, [storageKey])

  if (!user) return null

  const initials = (user.full_name ?? user.email ?? '?')[0].toUpperCase()

  const navItems = navConfig.map(item => ({
    ...item,
    isActive: location.pathname === item.path,
  }))

  return (
    <div className="flex h-screen w-full bg-app-bg text-text-primary overflow-hidden">

      {/* ══ SKIP TO CONTENT (accessibility) ══ */}
      <a
        href="#main-content"
        className="
          sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999]
          focus:px-6 focus:py-3 focus:rounded-2xl focus:bg-primary focus:text-white
          focus:text-sm focus:font-black focus:uppercase focus:tracking-wider focus:shadow-2xl
          focus:outline-none
        "
      >
        Skip to main content
      </a>

      {/* ══ DESKTOP / TABLET SIDEBAR ══ */}
      <aside
        className={`
          hidden md:flex flex-col flex-shrink-0 h-screen
          ${!isDark ? 'ancient-sidebar' : 'bg-card-bg border-r border-border-subtle'}
          transition-[width] duration-300 ease-in-out
          z-40 relative overflow-visible
          ${isMobileMode ? 'w-0' : isEffectivelyExpanded ? 'w-64' : 'w-20'}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden w-full">

          {/* Logo */}
          <div className={`p-4 flex items-center border-b border-border-subtle transition-all duration-300 ${isEffectivelyExpanded ? 'gap-3 justify-start' : 'justify-center'}`}>
            <LogoSVG size={36} className="shadow-lg" />
            {isEffectivelyExpanded && (
              <span className="text-text-primary font-black text-lg tracking-tight whitespace-nowrap">
                {logoText}
              </span>
            )}
          </div>

          {/* Role Badge */}
          {roleBadge && isEffectivelyExpanded && (
            <div className="px-4 pt-4 pb-2">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                <roleBadge.icon size={12} />
                {roleBadge.text}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                title={!isEffectivelyExpanded ? item.label : undefined}
                className={`
                  group/nav relative flex items-center p-3 rounded-xl
                  transition-all duration-200 overflow-visible
                  ${isEffectivelyExpanded ? 'justify-start gap-3' : 'justify-center'}
                  ${item.isActive
                    ? (!isDark ? 'ancient-nav-item-active' : 'bg-primary text-white shadow-md shadow-primary/20')
                    : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'
                  }
                `}
              >
                <item.icon
                  size={20}
                  className={`flex-shrink-0 transition-all duration-200 lg:group-hover/nav:scale-110 ${item.isActive ? 'text-white' : 'text-text-secondary lg:group-hover/nav:text-primary'}`}
                  strokeWidth={item.isActive ? 2.5 : 2}
                />

                {isEffectivelyExpanded && (
                  <span className="text-sm font-bold tracking-tight whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {!isEffectivelyExpanded && (
                  <div
                    role="tooltip"
                    className="
                      pointer-events-none
                      absolute left-full ml-3 px-3 py-2 rounded-lg
                      bg-slate-900 text-white text-xs font-semibold whitespace-nowrap
                      opacity-0 -translate-x-2
                      transition-all duration-200
                      group-hover/nav:opacity-100 group-hover/nav:translate-x-0
                      shadow-xl z-[200]
                    "
                  >
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                  </div>
                )}

                {item.isActive && (
                  <motion.div
                    layoutId={layoutId}
                    className="absolute -left-1 w-1 h-6 bg-white rounded-r-full"
                  />
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border-subtle bg-hover-bg/30 space-y-2 sidebar-footer-container">
            <div className={`flex items-center p-2 rounded-xl overflow-hidden transition-all duration-300 ${isEffectivelyExpanded ? 'gap-3 justify-start' : 'justify-center'}`}>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              {isEffectivelyExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-xs font-bold truncate">{user.full_name || 'User'}</p>
                  <p className="text-text-secondary text-[10px] truncate">{footerRoleLabel}</p>
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              title={!isEffectivelyExpanded ? (isDark ? 'Light Mode' : 'Dark Mode') : undefined}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group ${
                isDark ? 'bg-warning/10 hover:bg-warning/20 text-warning' : 'bg-primary/10 hover:bg-primary/20 text-primary'
              } ${isEffectivelyExpanded ? 'justify-start' : 'justify-center'}`}
            >
              {isDark ? (
                <Sun size={16} className="lg:group-hover:rotate-90 transition-transform duration-500" />
              ) : (
                <Moon size={16} className="lg:group-hover:-rotate-12 transition-transform duration-500" />
              )}
              {isEffectivelyExpanded && (
                <span className="text-xs font-black uppercase tracking-tight">
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
            </button>

            <button
              onClick={openSignOut}
              title={!isEffectivelyExpanded ? 'Sign Out' : undefined}
              className={`w-full flex items-center gap-3 p-3 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger transition-all cursor-pointer group ${isEffectivelyExpanded ? 'justify-start' : 'justify-center'}`}
            >
              <LogOut size={16} className="lg:group-hover:translate-x-1 transition-transform flex-shrink-0" />
              {isEffectivelyExpanded && <span className="text-xs font-black uppercase tracking-tight">Sign Out</span>}
            </button>
          </div>
        </div>

        {!isMobile && (
          <button
            onClick={toggleSidebar}
            title={isCollapsedMode ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`
              absolute -right-3 top-6 w-6 h-6 rounded-full bg-card-bg border border-border-subtle
              flex items-center justify-center text-text-secondary cursor-pointer z-50 transition-all shadow-sm
              opacity-100
            `}
          >
            {isCollapsedMode ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        )}
      </aside>

      {/* ══ MOBILE DRAWER ══ */}
      <AnimatePresence>
        {isDrawerOpen && isMobile && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] md:hidden"
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-card-bg border-r border-border-subtle z-[70] md:hidden flex flex-col"
            >
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary z-10 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-5 flex items-center gap-3 border-b border-border-subtle">
                <LogoSVG size={36} className="shadow-lg" />
                <span className="text-text-primary font-black text-lg tracking-tight">
                  {logoText}
                </span>
              </div>

              {roleBadge && (
                <div className="px-5 pt-4 pb-2">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest">
                    <roleBadge.icon size={12} />
                    {roleBadge.text}
                  </div>
                </div>
              )}

              <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                {navItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsDrawerOpen(false)}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                      ${item.isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'
                      }
                    `}
                  >
                    <item.icon size={20} strokeWidth={item.isActive ? 2.5 : 2} className="flex-shrink-0" />
                    <span className="text-sm font-bold">{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="p-4 border-t border-border-subtle bg-hover-bg/30 space-y-2 sidebar-footer-container">
                <div className="flex items-center justify-between gap-2 bg-card-bg/50 p-2 rounded-2xl border border-border-subtle">
                  <button onClick={toggleTheme}>
                    {isDark
                      ? <IconBadge icon={Sun} size="xl" className="bg-hover-bg hover:bg-primary/10 rounded-xl" darkClassName="text-warning" />
                      : <IconBadge icon={Moon} size="xl" className="bg-hover-bg hover:bg-primary/10 rounded-xl text-primary" darkClassName="" />
                    }
                  </button>
                  <span className="w-10 h-10 flex items-center justify-center">
                    <NotificationBell align="right" />
                  </span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                    <span>{initials}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-xs font-bold truncate">{user.full_name || 'User'}</p>
                    <p className="text-text-secondary text-[10px] truncate">{footerRoleLabel}</p>
                  </div>
                </div>

                <button
                  onClick={openSignOut}
                  className="w-full flex items-center justify-start gap-3 p-3 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger transition-all cursor-pointer group"
                >
                  <LogOut size={16} className="lg:group-hover:translate-x-1 transition-transform" />
                  <span className="text-xs font-bold">Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══ MAIN CONTENT ══ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">

        {/* Mobile header */}
        <header className={`relative z-50 flex items-center h-16 border-b pl-2 pr-2 md:px-8 shadow-sm flex-shrink-0 transition-all duration-300 ${!isDark ? 'ancient-header' : 'bg-card-bg/80 backdrop-blur-xl border-border-subtle'}`}>
          <button
            onClick={e => { e.stopPropagation(); setIsDrawerOpen(true) }}
            className="md:hidden relative z-[100]"
          >
            <IconBadge icon={Menu} size="2xl" className="bg-hover-bg text-text-secondary hover:text-primary active:scale-95 rounded-xl" darkClassName="" />
          </button>

          {(() => {
            const current = navConfig.find(item => item.path === location.pathname)
            if (!current) return null
            return (
              <AdminPageTitle icon={current.icon || LayoutDashboard}>
                {current.label}
              </AdminPageTitle>
            )
          })()}

          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden md:flex items-center gap-4">
              <NotificationBell align="right" />
              <div id="portal-header-actions-desktop" className="flex items-center gap-2" />
            </div>
            <div className="flex md:hidden items-center gap-2">
              <NotificationBell align="right" />
              <div id="portal-header-actions-mobile" className="flex items-center gap-2" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-hidden bg-app-bg transition-colors duration-300">
          <div className="custom-scrollbar h-full overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-full mb-12 sm:mb-16 lg:mb-20">
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Suspense fallback={
                  <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                }>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </main>
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
    </div>
  )
}
