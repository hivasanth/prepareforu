import { useState, useMemo, Suspense, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  LogOut, Menu, X, Sun, Moon, LayoutDashboard,
} from 'lucide-react'
import { ErrorBoundary } from 'react-error-boundary'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useSignOutConfirmation } from '../hooks/useSignOutConfirmation'
import { ConfirmModal } from '../components/common/SharedComponents'
import { isNavItemActive, type NavItem } from '../config/navigation'
import { LogoSVG } from '../components/Logo'
import { AdminPageTitle, IconButton, Button, ThemeToggle, Navigation, NavigationContext, useSidebarMode } from '../components/common/AntigravityUI'
import { Spinner } from '../components/common/Spinner'
import { NotificationBell } from '../components/common/NotificationPanel'
import { MOTION_DURATION, DRAWER_SPRING } from '../components/common/AntigravityMotion'

function ErrorFallback() {
  return (
    <div role="alert" aria-live="assertive" className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center space-y-3">
        <p className="text-lg font-bold text-text-primary">An Error Occurred</p>
        <p className="text-sm font-sans text-text-secondary">
          We encountered an unexpected issue. Our team has been notified.
        </p>
      </div>
    </div>
  )
}

// ─── Page Title (isolated route subscription) ────────────────────────────────
function PageTitleDisplay({ navConfig }: { navConfig: NavItem[] }) {
  const location = useLocation()
  // L-2: section-level match (exact, descendant, or attributed detail paths)
  // so nested/detail routes keep their owning section title.
  const current = navConfig.find(item => isNavItemActive(item, location.pathname))
  if (!current) return null
  return (
    <AdminPageTitle icon={current.icon || LayoutDashboard}>
      {current.label}
    </AdminPageTitle>
  )
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
  const { isOpen: isSignOutOpen, openDialog: openSignOut, closeDialog: closeSignOut, handleConfirm: confirmSignOut } = useSignOutConfirmation(logout)

  const { isExpanded, isMobile, isTablet, isDesktop, toggleCollapse } = useSidebarMode(storageKey)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const drawerContextValue = useMemo(() => ({
    isExpanded: true,
    isDark,
    layoutId: `${layoutId}-drawer`,
    isMobile,
    isTablet,
    isDesktop,
    onToggleCollapse: toggleCollapse,
  }), [isDark, layoutId, isMobile, isTablet, isDesktop, toggleCollapse])

  if (!user) return null

  const initials = (user.full_name ?? user.email ?? '?')[0].toUpperCase()

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
      <Navigation.Shell
        isExpanded={isExpanded}
        isDark={isDark}
        layoutId={layoutId}
        isMobile={isMobile}
        isTablet={false}
        isDesktop={!isMobile}
        onToggleCollapse={toggleCollapse}
      >
        {/* Logo */}
        <div className={`p-4 flex items-center border-b border-border-subtle transition-all duration-slow ${isExpanded ? 'gap-3 justify-start' : 'justify-center'}`}>
          <LogoSVG size={36} className="shadow-lg" />
          {isExpanded && (
            <span className="text-text-primary font-black text-lg tracking-tight whitespace-nowrap">
              {logoText}
            </span>
          )}
        </div>

        {/* Role Badge */}
        {roleBadge && isExpanded && (
          <div className="px-4 pt-4 pb-2">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
              <roleBadge.icon size={12} />
              {roleBadge.text}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <Navigation.Items items={navConfig} />

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-hover-bg/30 space-y-2 sidebar-footer-container">
          <div className={`flex items-center p-2 rounded-xl overflow-hidden transition-all duration-slow ${isExpanded ? 'gap-3 justify-start' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-xs font-bold truncate">{user.full_name || 'User'}</p>
                <p className="text-text-secondary text-[10px] truncate">{footerRoleLabel}</p>
              </div>
            )}
          </div>

          {isExpanded ? (
            <ThemeToggle
              theme={isDark ? 'dark' : 'light'}
              onToggle={toggleTheme}
              className="w-full"
            />
          ) : (
            <IconButton
              variant="theme"
              size="sm"
              onClick={toggleTheme}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
              className="w-full justify-center"
            >
              <span className="w-[28px] h-[28px] rounded-full nav-active-surface flex items-center justify-center transition-transform duration-slow">
                {isDark ? <Moon size={14} /> : <Sun size={14} />}
              </span>
            </IconButton>
          )}

          <Button
            variant="danger"
            size="sm"
            onClick={openSignOut}
            title={!isExpanded ? 'Sign Out' : undefined}
            className={`w-full ${isExpanded ? 'justify-start' : 'justify-center'}`}
          >
            <LogOut size={16} className="lg:group-hover:translate-x-1 flex-shrink-0" />
            {isExpanded && <span className="text-xs font-bold uppercase tracking-tight">Sign Out</span>}
          </Button>
        </div>
      </Navigation.Shell>

      {/* ══ MOBILE DRAWER ══ */}
      {isMobile && (
        <NavigationContext.Provider value={drawerContextValue}>
          <div
            className={`fixed inset-0 z-[60] ${isDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
            onClick={() => setIsDrawerOpen(false)}
          />

          <motion.div
            initial={false}
            animate={{ opacity: isDrawerOpen ? 1 : 0 }}
            transition={{ duration: MOTION_DURATION.normal }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] pointer-events-none"
          />

          <motion.aside
            initial={false}
            animate={{ x: isDrawerOpen ? 0 : '-100%' }}
            transition={DRAWER_SPRING}
            role={isDrawerOpen ? 'dialog' : undefined}
            aria-modal={isDrawerOpen ? 'true' : undefined}
            aria-label={isDrawerOpen ? 'Navigation menu' : undefined}
            inert={!isDrawerOpen}
            className={`fixed top-0 left-0 bottom-0 w-72 ${!isDark ? 'ancient-sidebar' : 'bg-card-bg border-r border-border-subtle'} z-[70] flex flex-col`}
          >
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-4 z-10"
            >
              <X size={20} />
            </IconButton>

            <div className="p-5 flex items-center gap-3 border-b border-border-subtle">
              <LogoSVG size={36} className="shadow-lg" />
              <span className="text-text-primary font-black text-lg tracking-tight">
                {logoText}
              </span>
            </div>

            {roleBadge && (
              <div className="px-5 pt-4 pb-2">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest">
                  <roleBadge.icon size={12} />
                  {roleBadge.text}
                </div>
              </div>
            )}

            <div className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
              <Navigation.Items items={navConfig} onItemNavigate={() => setIsDrawerOpen(false)} />
            </div>

            <div className="p-4 border-t border-border-subtle bg-hover-bg/30 space-y-2 sidebar-footer-container">
              <div className="flex items-center justify-center bg-card-bg/50 p-2 rounded-2xl border border-border-subtle">
                <ThemeToggle
                  theme={isDark ? 'dark' : 'light'}
                  onToggle={toggleTheme}
                  className="w-full"
                />
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

              <Button
                variant="danger"
                size="sm"
                onClick={() => { setIsDrawerOpen(false); openSignOut() }}
                className="w-full justify-start"
              >
                <LogOut size={16} className="lg:group-hover:translate-x-1" />
                <span className="text-xs font-bold">Sign Out</span>
              </Button>
            </div>
          </motion.aside>
        </NavigationContext.Provider>
      )}

      {/* ══ MAIN CONTENT ══ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">

        {/* Mobile header */}
        <header className={`relative z-50 flex items-center h-16 border-b pl-2 pr-2 md:px-8 shadow-sm flex-shrink-0 transition-all duration-slow ${!isDark ? 'ancient-header' : 'bg-card-bg/80 backdrop-blur-xl border-border-subtle'}`}>
          <IconButton
            variant="ghost"
            size="md"
            onClick={e => {
              e.stopPropagation()
              setIsDrawerOpen(true)
            }}
            aria-label="Open menu"
            className="md:hidden relative z-[100]"
          >
            <Menu size={20} />
          </IconButton>

          <PageTitleDisplay navConfig={navConfig} />

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
        <main id="main-content" className="flex-1 overflow-hidden bg-app-bg transition-colors duration-slow" style={{ contain: 'content' }}>
          <div className="custom-scrollbar h-full overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-full mb-12 sm:mb-16 lg:mb-20">
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Suspense fallback={
                  <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <Spinner size="md" />
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
