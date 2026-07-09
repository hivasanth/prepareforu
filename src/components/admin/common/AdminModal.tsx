import React from 'react'
import { createPortal } from 'react-dom'
import { FocusTrap } from 'focus-trap-react'
import { X } from 'lucide-react'

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
  maxWidth?: string // e.g. 'max-w-4xl'
  showCloseButton?: boolean
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
  titleClassName = ''
}) => {
  if (!isOpen) return null

  const instanceId = React.useId()
  const titleId = `${instanceId}-title`
  const descId = description ? `${instanceId}-desc` : undefined

  return createPortal(
    <FocusTrap focusTrapOptions={{
      onDeactivate: onClose,
      clickOutsideDeactivates: true,
      escapeDeactivates: true,
      initialFocus: false
    }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId}>
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-app-bg/60 backdrop-blur-md animate-in fade-in duration-300" 
          onClick={onClose}
        />
        
        {/* Modal Box */}
        <div className={`relative bg-card-bg w-full h-full sm:h-auto sm:max-h-[92vh] ${maxWidth} sm:rounded-[2.5rem] border-0 sm:border border-border-subtle shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden`}>
          
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-border-subtle shrink-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {headerBadge && <div className="mb-2">{headerBadge}</div>}
                <h2 id={titleId} className={`text-xl sm:text-2xl font-black text-text-primary tracking-tight ${titleClassName}`}>
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
                  <button 
                    onClick={onClose} 
                    aria-label="Close modal"
                    className="p-2 rounded-full hover:bg-hover-bg transition-colors"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                )}
              </div>
            </div>
            {subHeader}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 form-scrollbar">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="sticky bottom-0 p-6 border-t border-border-subtle bg-card-bg/95 backdrop-blur-md shrink-0 flex justify-end gap-3 z-30">
              {footer}
            </div>
          )}
        </div>
      </div>
    </FocusTrap>,
    document.body
  )
}
