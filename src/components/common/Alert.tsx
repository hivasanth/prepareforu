import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'

/* ─── Alert ────────────────────────────────────────────────────────────────
 * Design role:
 *   Inline informational/status message banner.
 *   Used for contextual feedback within forms, modals, and page sections.
 *
 * Variants:
 *   info    — Blue tint (primary/10) — general information
 *   success — Green tint (success/10) — positive confirmation
 *   error   — Red tint (danger/10) — inline errors, validation failures
 *   warning — Yellow tint (warning/10) — caution notices
 *
 * Use for:
 *   - Form validation errors (inside modals/forms)
 *   - Upload progress/status messages
 *   - Inline warnings before destructive actions
 *   - Success confirmations after actions
 *
 * Do NOT use for:
 *   - Page-level retryable errors (use ErrorContainer)
 *   - Skeleton loading states (use Skeleton)
 *   - Card content (use Card)
 *
 * Theme: Light + Dark (semantic color tokens, theme-adaptive)
 * Consumers: 14 files (admin questions, settings, upload, auth, exam)
 * ────────────────────────────────────────────────────────────────────────── */

export type AlertVariant = 'info' | 'success' | 'error' | 'warning'

interface AlertProps {
  variant?: AlertVariant
  icon?: LucideIcon
  title?: string
  children: React.ReactNode
  className?: string
  onDismiss?: () => void
}

const variantClasses: Record<AlertVariant, string> = {
  info: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  error: 'bg-danger/10 text-danger border-danger/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
}

const iconWrapClasses: Record<AlertVariant, string> = {
  info: 'text-primary',
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  icon: Icon,
  title,
  children,
  className = '',
  onDismiss,
}) => {
  const hasTitle = Boolean(title)
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`
        flex items-start gap-2.5 rounded-button-md border px-4 py-3
        text-[13px] font-medium leading-relaxed
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {Icon && (
        <span className={`mt-0.5 shrink-0 ${iconWrapClasses[variant]}`}>
          <Icon size={16} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {hasTitle && (
          <p className="font-bold uppercase tracking-wide text-[11px] mb-0.5">
            {title}
          </p>
        )}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 mt-0.5 p-0.5 rounded-md hover:bg-black/5 light:hover:bg-black/10 transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} className="text-current opacity-50 hover:opacity-100" />
        </button>
      )}
    </div>
  )
}
