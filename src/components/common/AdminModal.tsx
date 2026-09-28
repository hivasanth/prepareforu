import React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FocusTrap } from 'focus-trap-react'
import { X } from 'lucide-react'
import { IconButton } from './AntigravityButton'
import { MODAL_TRANSITION } from './AntigravityMotion'
import { GOLD_LIGHT_MATERIAL } from './AntigravityCard'

interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  title: React.ReactNode
  titleClassName?: string
  description?: string
  headerBadge?: React.ReactNode
  headerActions?: React.ReactNode
  footer?: React.ReactNode
  subHeader?: React.ReactNode
  children: React.ReactNode
  maxWidth?: string
  showCloseButton?: boolean
  /** Phase 3.9 (D-144) — additive surface family. `premium` (default, unchanged)
   *  renders the parchment/overlay panel; `management` renders the neutral
   *  Management Surface Family panel (no `ancient-overlay`, neutral borders).
   *  No existing consumer changes. */
  variant?: 'premium' | 'management'
}

/* Phase 5.4E (D-169) — ONE modal animation. Scrim + panel share the SAME
   timing (MODAL_TRANSITION = 200ms / --ease-standard) and the same 10px/0.98
   settle; the close (exit) mirrors the open exactly. Mirrors the .animate-modal
   CSS recipe; MotionConfig reducedMotion="user" collapses it for reduced-motion
   users (same as the CSS prefers-reduced-motion block). */
const MODAL_VARIANTS = {
  closed: { opacity: 0 },
  open: { opacity: 1, transition: MODAL_TRANSITION },
}

const PANEL_VARIANTS = {
  closed: { opacity: 0, y: 10, scale: 0.98 },
  open: { opacity: 1, y: 0, scale: 1, transition: MODAL_TRANSITION },
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  headerBadge,
  headerActions,
  footer,
  subHeader,
  children,
  maxWidth = 'sm:max-w-4xl',
  showCloseButton = true,
  titleClassName = '',
  variant = 'premium',
}) => {
  const instanceId = React.useId()
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Focus restoration: remember the triggering element while the dialog is
  // open and return focus to it when it closes.
  React.useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    } else {
      const previous = previouslyFocusedRef.current
      previouslyFocusedRef.current = null
      if (previous && typeof previous.focus === 'function') {
        previous.focus()
      }
    }
  }, [isOpen])

  const titleId = `${instanceId}-title`
  const descId = description ? `${instanceId}-desc` : undefined
  const management = variant === 'management'
  const panelClass = management
    ? `relative bg-[var(--management-surface)] w-full h-full sm:h-auto sm:max-h-[92vh] ${maxWidth} sm:rounded-[2.5rem] border-0 sm:border border-[var(--management-border)] shadow-card-shadow flex flex-col overflow-hidden ${GOLD_LIGHT_MATERIAL}`
    : `relative bg-card-bg w-full h-full sm:h-auto sm:max-h-[92vh] ${maxWidth} sm:rounded-[2.5rem] border-0 sm:border border-border-subtle shadow-card-shadow flex flex-col overflow-hidden ancient-overlay ${GOLD_LIGHT_MATERIAL}`
  const sectionBorderClass = management ? 'border-[var(--management-border)]' : 'border-border-subtle'
  const footerBgClass = management ? `bg-[var(--management-surface)]/95 ${GOLD_LIGHT_MATERIAL}` : `bg-card-bg/95 ${GOLD_LIGHT_MATERIAL}`

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <FocusTrap
          key="admin-modal-trap"
          focusTrapOptions={{
            escapeDeactivates: false,
            delayInitialFocus: false,
            /* AU-4 remediation (shared modal contract): when a caller marks an
             * element with [data-modal-initial-focus], the trap focuses it on
             * activation — deterministic, race-free initial focus. Otherwise
             * the trap focuses the dialog container itself (which carries
             * tabIndex={-1} so it is programmatically focusable) so focus is
             * ALWAYS inside the dialog — never left on the page trigger behind
             * the overlay. (Returning `false` would mean "no initial focus at
             * all", leaving focus on the trigger — the HIGH focus defect.) */
            initialFocus: () => {
              const preferred = document.querySelector('[data-modal-initial-focus]')
              if (preferred instanceof HTMLElement) return preferred
              const container = document.querySelector('[role="dialog"]')
              return container instanceof HTMLElement ? container : false
            },
          }}
        >
          {/* Plain host container: focus-trap-react v12 captures its container
              via a cloned ref, which motion components do not reliably yield —
              a plain div guarantees the trap always receives its container. */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
            role="dialog"
            tabIndex={-1}
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
          >
            <motion.div
              className="absolute inset-0 bg-app-bg/60 backdrop-blur-md"
              onClick={onClose}
              initial="closed"
              animate="open"
              exit="closed"
              variants={MODAL_VARIANTS}
            />

            <motion.div
              className={panelClass}
              initial="closed"
              animate="open"
              exit="closed"
              variants={PANEL_VARIANTS}
            >
              <div className={`p-6 sm:p-8 border-b ${sectionBorderClass} shrink-0`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {headerBadge && <div className="mb-2">{headerBadge}</div>}
                    <h2 id={titleId} className={`text-xl sm:text-2xl font-black text-text-title tracking-tight ${titleClassName}`}>
                      {title}
                    </h2>
                    {description && (
                      <p id={descId} className="text-[10px] sm:text-xs text-text-secondary font-medium">
                        {description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {headerActions}
                    {showCloseButton && (
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        aria-label="Close modal"
                      >
                        <X size={18} />
                      </IconButton>
                    )}
                  </div>
                </div>
                {subHeader}
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 form-scrollbar">
                {children}
              </div>

              {footer && (
                <div className={`sticky bottom-0 p-6 border-t ${sectionBorderClass} ${footerBgClass} backdrop-blur-md shrink-0 flex justify-end gap-3 z-30`}>
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </FocusTrap>
      )}
    </AnimatePresence>,
    document.body
  )
}
