import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { isNavItemActive } from '../../config/navigation'
import { TRANSITION_INTERACTION, FOCUS_RING } from './AntigravityMotion'

// ─── Types ───────────────────────────────────────────────────────────────────
export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  color?: string
}

export type NavigationMode = 'drawer' | 'collapsed' | 'expanded'

// ─── Context ─────────────────────────────────────────────────────────────────
interface NavigationContextValue {
  isExpanded: boolean
  isDark: boolean
  layoutId: string
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  onToggleCollapse?: () => void
}

export const NavigationContext = createContext<NavigationContextValue | null>(null)

function useNavigationContext() {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('Navigation compound components must be used within <Navigation>')
  return ctx
}

// ─── Hook: Sidebar Mode ──────────────────────────────────────────────────────
function getDefaultMode(width: number): NavigationMode {
  if (width < 768) return 'drawer'
  if (width < 1024) return 'collapsed'
  return 'expanded'
}

function getInitialMode(storageKey: string): NavigationMode {
  if (typeof window === 'undefined') return 'expanded'
  const saved = localStorage.getItem(storageKey) as NavigationMode | null
  if (saved && window.innerWidth >= 768) return saved
  return getDefaultMode(window.innerWidth)
}

export function useSidebarMode(storageKey: string) {
  const [mode, setMode] = useState<NavigationMode>(() => getInitialMode(storageKey))
  const breakpoint = useBreakpoint()

  const isMobile = breakpoint.isXs || breakpoint.isSm
  const isTablet = breakpoint.isMd
  const isDesktop = breakpoint.isLg || breakpoint.isXl

  useEffect(() => {
    if (isMobile) setMode('drawer')
    else if (isTablet) setMode('collapsed')
    else if (isDesktop) {
      const saved = localStorage.getItem(storageKey) as NavigationMode | null
      setMode(saved === 'collapsed' ? 'collapsed' : 'expanded')
    }
  }, [isMobile, isTablet, isDesktop, storageKey])

  const toggleCollapse = useCallback(() => {
    setMode(prev => {
      const next: NavigationMode = prev === 'collapsed' ? 'expanded' : 'collapsed'
      localStorage.setItem(storageKey, next)
      return next
    })
  }, [storageKey])

  const isExpanded = mode === 'expanded'
  const isCollapsed = mode === 'collapsed'
  const isDrawer = mode === 'drawer'

  return { mode, isExpanded, isCollapsed, isDrawer, toggleCollapse, isMobile, isTablet, isDesktop }
}

// ─── Component: Navigation Shell ─────────────────────────────────────────────
interface NavigationShellProps {
  children: ReactNode
  isExpanded: boolean
  isDark: boolean
  layoutId: string
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  onToggleCollapse?: () => void
  className?: string
}

function NavigationShell({
  children,
  isExpanded,
  isDark,
  layoutId,
  isMobile,
  isTablet,
  isDesktop,
  onToggleCollapse,
  className = '',
}: NavigationShellProps) {
  return (
    <NavigationContext.Provider value={{
      isExpanded,
      isDark,
      layoutId,
      isMobile,
      isTablet,
      isDesktop,
      onToggleCollapse,
    }}>
      <aside
        className={`
          hidden md:flex flex-col flex-shrink-0 h-screen
          ${!isDark ? 'ancient-sidebar' : 'bg-sidebar border-r border-border-subtle'}
          transition-[width] duration-slow ease-standard
          z-40 relative overflow-visible
          ${isExpanded ? 'w-64' : 'w-20'}
          ${className}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden w-full">
          {children}
        </div>

        {isDesktop && (
          <CollapseToggle />
        )}
      </aside>
    </NavigationContext.Provider>
  )
}

// ─── Component: Collapse Toggle ──────────────────────────────────────────────
function CollapseToggle() {
  const { isExpanded, onToggleCollapse } = useNavigationContext()

  if (!onToggleCollapse) return null

  return (
    <button
      onClick={onToggleCollapse}
      title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      aria-expanded={isExpanded}
      className="
        absolute -right-3 top-6 w-6 h-6 rounded-full bg-sidebar border border-border-subtle
        flex items-center justify-center text-text-secondary cursor-pointer z-50 transition-interaction duration-fast ease-standard shadow-sm
        opacity-100
      "
    >
      {isExpanded ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
    </button>
  )
}

// ─── Component: Navigation Item ──────────────────────────────────────────────
interface NavigationItemProps {
  item: NavItem
  isActive: boolean
  onClick?: () => void
}

function NavigationItem({ item, isActive, onClick }: NavigationItemProps) {
  const { isExpanded, isDark, layoutId } = useNavigationContext()

  return (
    <NavLink
      to={item.path}
      title={!isExpanded ? item.label : undefined}
      onClick={() => onClick?.()}
      className={`
        group/nav relative flex items-center p-3 rounded-xl
        ${TRANSITION_INTERACTION} ${FOCUS_RING} overflow-visible
        ${isExpanded ? 'justify-start gap-3' : 'justify-center'}
        ${isActive
          ? (!isDark ? 'ancient-nav-item-active' : 'bg-primary text-white shadow-md shadow-primary/20')
          : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'
        }
      `}
    >
      <item.icon
        size={20}
        className={`flex-shrink-0 ${TRANSITION_INTERACTION} ${isActive ? 'text-white' : 'text-text-secondary lg:group-hover/nav:text-primary'}`}
        strokeWidth={isActive ? 2.5 : 2}
      />

      {isExpanded && (
        <span className="text-sm font-bold tracking-tight whitespace-nowrap">
          {item.label}
        </span>
      )}

      {!isExpanded && (
        <div
          role="tooltip"
          className="
            pointer-events-none
            absolute left-full ml-3 px-3 py-2 rounded-lg
            bg-slate-900 text-white text-xs font-semibold whitespace-nowrap
            opacity-0 -translate-x-2
            transition-[opacity,transform] duration-fast ease-standard
            group-hover/nav:opacity-100 group-hover/nav:translate-x-0
            shadow-xl z-[200]
          "
        >
          {item.label}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
        </div>
      )}

      {isActive && (
        <motion.div
          layoutId={layoutId}
          className="absolute -left-1 w-1 h-6 bg-white rounded-r-full"
        />
      )}
    </NavLink>
  )
}

// ─── Component: Navigation Items ─────────────────────────────────────────────
interface NavigationItemsProps {
  items: NavItem[]
  activePath?: string
  onItemNavigate?: () => void
  className?: string
}

function NavigationItems({ items, activePath, onItemNavigate, className = '' }: NavigationItemsProps) {
  const location = useLocation()
  const currentPath = activePath ?? location.pathname

  return (
    <nav aria-label="Main navigation" className={`flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar ${className}`}>
      {items.map(item => (
        <NavigationItem
          key={item.path}
          item={item}
          isActive={isNavItemActive(item, currentPath)}
          onClick={onItemNavigate}
        />
      ))}
    </nav>
  )
}

export const Navigation = {
  Shell: NavigationShell,
  Item: NavigationItem,
  Items: NavigationItems,
}
