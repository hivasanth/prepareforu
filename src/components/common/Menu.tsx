import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Context ─────────────────────────────────────────────────────────────────
interface MenuContextValue {
  isOpen: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLDivElement | null>
  defaultAlign: 'left' | 'right' | 'center'
  defaultOffset: string
  defaultZIndex: string
  defaultAnimation: 'scale'
  defaultVariant: 'default' | 'management'
}

const MenuContext = createContext<MenuContextValue | null>(null)

function useMenuContext() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('Menu compound components must be used within <Menu>')
  return ctx
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface MenuProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  align?: 'left' | 'right' | 'center'
  offset?: string
  zIndex?: string
  animation?: 'scale'
  className?: string
  /** Phase 3.9 (D-144) — additive panel surface family. `default` (unchanged)
   *  renders the certified floating/ancient overlay panel; `management` renders
   *  the neutral Management Surface Family panel (no `ancient-overlay`). */
  variant?: 'default' | 'management'
}

// ─── Animation presets ───────────────────────────────────────────────────────
const animationVariants = {
  scale: {
    initial: { opacity: 0, scale: 0.95, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 8 },
  },
}

// ─── Alignment classes ───────────────────────────────────────────────────────
const alignmentClasses = {
  left: 'left-0',
  right: 'right-0',
  center: 'left-1/2 -translate-x-1/2',
}

// ─── Root ────────────────────────────────────────────────────────────────────
export function Menu({
  children,
  open: controlledOpen,
  onOpenChange,
  align = 'left',
  offset = 'mt-2',
  zIndex = 'z-50',
  animation = 'scale',
  className = '',
  variant = 'default',
}: MenuProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(nextOpen)
      } else {
        setInternalOpen(nextOpen)
        onOpenChange?.(nextOpen)
      }
    },
    [isControlled, onOpenChange],
  )

  return (
    <MenuContext.Provider value={{ isOpen, setOpen, triggerRef, defaultAlign: align, defaultOffset: offset, defaultZIndex: zIndex, defaultAnimation: animation, defaultVariant: variant }}>
      <div ref={triggerRef} className={`relative inline-block ${className}`}>
        {children}
      </div>
    </MenuContext.Provider>
  )
}

// ─── Trigger ─────────────────────────────────────────────────────────────────
interface MenuTriggerProps {
  children: ReactNode | ((props: { isOpen: boolean }) => ReactNode)
  asChild?: boolean
  disabled?: boolean
  className?: string
  'aria-label'?: string
  'aria-controls'?: string
}

function MenuTrigger({ children, asChild = false, disabled = false, className = '', ...triggerProps }: MenuTriggerProps) {
  const { isOpen, setOpen } = useMenuContext()

  const content = typeof children === 'function' ? children({ isOpen }) : children

  if (asChild) {
    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-expanded={isOpen}
        aria-haspopup="true"
        {...triggerProps}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(!isOpen)
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
          }
        }}
        onClick={() => {
          if (!disabled) setOpen(!isOpen)
        }}
        className={className}
      >
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-expanded={isOpen}
      aria-haspopup="true"
      {...triggerProps}
      onClick={() => {
        if (!disabled) setOpen(!isOpen)
      }}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setOpen(true)
        }
      }}
      className={className}
    >
      {content}
    </button>
  )
}

// ─── Content ─────────────────────────────────────────────────────────────────
interface MenuContentProps {
  children: ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
  offset?: string
  zIndex?: string
  animation?: 'scale'
  onKeyDown?: (e: React.KeyboardEvent) => void
  role?: 'menu' | 'listbox'
  id?: string
  'aria-label'?: string
  /** Phase 3.9 (D-144) — additive per-content variant override (defaults to the
   *  `Menu` root variant). `default` = certified floating/ancient panel;
   *  `management` = neutral Management Surface Family panel. */
  variant?: 'default' | 'management'
}

function MenuContent({
  children,
  className = '',
  align: contentAlign,
  offset: contentOffset,
  zIndex: contentZIndex,
  animation: contentAnimation,
  onKeyDown,
  role: contentRole = 'menu',
  id: contentId,
  'aria-label': ariaLabel,
  variant: contentVariant,
}: MenuContentProps) {
  const { isOpen, setOpen, triggerRef, defaultAlign, defaultOffset, defaultZIndex, defaultAnimation, defaultVariant } = useMenuContext()
  const contentRef = useRef<HTMLDivElement>(null)

  const resolvedAlign = contentAlign ?? defaultAlign
  const resolvedOffset = contentOffset ?? defaultOffset
  const resolvedZIndex = contentZIndex ?? defaultZIndex
  const resolvedAnimation = contentAnimation ?? defaultAnimation
  const resolvedVariant = contentVariant ?? defaultVariant

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        contentRef.current && !contentRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, setOpen, triggerRef])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, setOpen])

  // Keyboard navigation within menu
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = contentRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"], [role="option"], button:not([disabled])',
      )
      if (!items || items.length === 0) return

      const currentIndex = Array.from(items).indexOf(document.activeElement as HTMLElement)

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          items[(currentIndex + 1) % items.length].focus()
          break
        case 'ArrowUp':
          e.preventDefault()
          items[(currentIndex - 1 + items.length) % items.length].focus()
          break
        case 'Home':
          e.preventDefault()
          items[0].focus()
          break
        case 'End':
          e.preventDefault()
          items[items.length - 1].focus()
          break
      }

      onKeyDown?.(e)
    },
    [onKeyDown],
  )

  const variant = animationVariants[resolvedAnimation]
  const panelClass = resolvedVariant === 'management'
    ? 'bg-[var(--management-surface)] border-[var(--management-border)] shadow-[var(--management-shadow)]'
    : 'bg-[var(--surface-floating)] border-border-subtle ancient-overlay shadow-elevation-4'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={contentRef}
          id={contentId}
          role={contentRole}
          aria-label={ariaLabel}
          initial={variant.initial}
          animate={variant.animate}
          exit={variant.exit}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`absolute ${resolvedOffset} ${alignmentClasses[resolvedAlign]} ${resolvedZIndex} min-w-[200px] rounded-2xl overflow-hidden border ${panelClass} ${className}`}
          onKeyDown={handleKeyDown}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Item ────────────────────────────────────────────────────────────────────
interface MenuItemProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  /** Render the row as the currently selected option (primary text + premium background). */
  selected?: boolean
}

function MenuItem({ children, onClick, className = '', disabled = false, selected = false }: MenuItemProps) {
  const { setOpen } = useMenuContext()

  return (
    <button
      role="menuitem"
      type="button"
      disabled={disabled}
      aria-selected={selected || undefined}
      onClick={() => {
        if (!disabled) {
          onClick?.()
          setOpen(false)
        }
      }}
      className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none ${
        selected
          ? 'bg-primary/20 text-primary hover:bg-primary/25 focus:bg-primary/25'
          : 'text-text-primary hover:bg-hover-bg focus:bg-hover-bg'
      } ${className}`}
    >
      {children}
    </button>
  )
}

// ─── Separator ───────────────────────────────────────────────────────────────
function MenuSeparator({ className = '' }: { className?: string }) {
  return <div className={`my-1 border-t border-border-subtle/50 ${className}`} />
}

// ─── Compound export ─────────────────────────────────────────────────────────
Menu.Trigger = MenuTrigger
Menu.Content = MenuContent
Menu.Item = MenuItem
Menu.Separator = MenuSeparator
