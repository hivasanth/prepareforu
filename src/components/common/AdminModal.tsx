import React from 'react'
import { createPortal } from 'react-dom'
import { FocusTrap } from 'focus-trap-react'
import { X } from 'lucide-react'
import { IconButton } from './AntigravityButton'

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

  if (!isOpen) return null

  const titleId = `${instanceId}-title`
  const descId = description ? `${instanceId}-desc` : undefined
  const management = variant === 'management'
  const panelClass = management
    ? `relative bg-[var(--management-surface)] w-full h-full sm:h-auto sm:max-h-[92vh] ${maxWidth} sm:rounded-[2.5rem] border-0 sm:border border-[var(--management-border)] shadow-2xl flex flex-col animate-in overflow-hidden`
    : `relative bg-card-bg w-full h-full sm:h-auto sm:max-h-[92vh] ${maxWidth} sm:rounded-[2.5rem] border-0 sm:border border-border-subtle shadow-2xl flex flex-col animate-in overflow-hidden ancient-overlay`
  const sectionBorderClass = management ? 'border-[var(--management-border)]' : 'border-border-subtle'
  const footerBgClass = management ? 'bg-[var(--management-surface)]/95' : 'bg-card-bg/95'

  return createPortal(
    <FocusTrap focusTrapOptions={{
      escapeDeactivates: false,
      initialFocus: false
    }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId}>
        <div 
          className="absolute inset-0 bg-app-bg/60 backdrop-blur-md animate-in" 
          onClick={onClose}
        />
        
        <div className={panelClass}>
          
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
        </div>
      </div>
    </FocusTrap>,
    document.body
  )
}
