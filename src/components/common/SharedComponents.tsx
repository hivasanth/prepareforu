import { memo, useEffect, useId, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './AntigravityButton';
import { AdminModal } from './AdminModal';
import { Alert } from './Alert';
import { GOLD_SURFACE, GOLD_LIGHT_MATERIAL } from './AntigravityCard';
import { Skeleton, type SkeletonProps } from './Skeleton';
import { Spinner } from './Spinner';

/* ─── SharedComponents ─────────────────────────────────────────────────────
 * Design role:
 *   Higher-level skeleton composites, loading overlays, empty states,
 *   error states, and confirmation modals. These compose the primitives
 *   (Skeleton, Card, Button, Spinner) into page-level patterns.
 *
 * Skeleton Composites:
 *   LoadingSkeleton — Thin wrapper over Skeleton (text type)
 *   GridSkeleton    — Grid of Skeleton cards (card type, configurable columns)
 *   StatSkeleton    — StatCard-shaped skeleton (mirrors StatCard geometry)
 *
 * Loading Overlays:
 *   LoadingOverlay  — Full-page or inline spinner overlay
 *
 * Status Composites:
 *   ErrorState      — Simple centered error display (NOT ErrorContainer)
 *   EmptyState      — Empty content state with premium/management variants
 *   ConfirmModal    — Confirmation dialog wrapping AdminModal
 *
 * Use for:
 *   - Page-level loading states (via skeleton composites)
 *   - Empty collection states (EmptyState)
 *   - Confirmation dialogs before destructive actions (ConfirmModal)
 *
 * Do NOT use for:
 *   - Card content (use Card directly)
 *   - Selection containers (use SelectionContainer)
 *   - Retryable page errors (use ErrorContainer)
 *   - Inline form errors (use Alert)
 *
 * Theme: Light + Dark (skeletons use GOLD_LIGHT_MATERIAL)
 * Consumers: 18+ files across all layers
 * ────────────────────────────────────────────────────────────────────────── */

/* Phase 5.4F (D-172) — the skeleton family is THREE thin wrappers over the ONE
   `Skeleton` primitive (src/components/common/Skeleton.tsx). Skeleton owns
   surface/block colors, radius, pulse, and a11y; wrappers own geometry,
   convenience props, and backward compatibility only. No rendering duplication. */

export const LoadingSkeleton = memo(({ height = 20, width = '100%', borderRadius = 8, className = '', type = 'text', variant = 'premium', decorative = false }: SkeletonProps) => {
  return (
    <Skeleton
      type={type}
      height={height}
      width={width}
      borderRadius={borderRadius}
      variant={variant}
      className={className}
      decorative={decorative}
    />
  )
});

export const GridSkeleton = memo(({ count = 6, height = 180, columns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3', gap = 'gap-6', variant = 'premium', unit = 'card', decorative = false }: { count?: number; height?: number | string; columns?: string; gap?: string; variant?: 'premium' | 'management'; unit?: 'card' | 'row'; decorative?: boolean }) => {
  return (
    <div className={`grid ${columns} ${gap} w-full`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} type="card" unit={unit} height={height} borderRadius={24} variant={variant} decorative={decorative} />
      ))}
    </div>
  )
});

/* Phase 5.4F (D-172) — StatSkeleton mirrors the final StatCard geometry
   (AntigravityCard.tsx) so the dashboard skeleton is pixel-approximate:
   fixed height h-16 sm:h-20 lg:h-24, StatCard padding scale, icon box
   w-9 sm:w-11 lg:w-12 rounded-stat-icon-radius, and the skeleton surface
   tokens (same recipe as the Skeleton primitive). `decorative` opts out of
   the per-card live region for pages that already wrap the grid in one
   container-level `role="status"`. */
export const StatSkeleton = memo(({ count = 4, columns = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4', gap = 'gap-6', decorative = false }: { count?: number; columns?: string; gap?: string; decorative?: boolean }) => {
  return (
    <div className={`grid ${columns} ${gap} w-full`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          role={decorative ? undefined : 'status'}
          aria-label={decorative ? undefined : 'Loading'}
          aria-hidden={decorative || undefined}
          className={`flex items-center gap-2 sm:gap-3 lg:gap-4 h-16 sm:h-20 lg:h-24 px-3 sm:px-4 lg:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[var(--skeleton-surface)] border border-[var(--border-subtle)] shadow-[var(--card-shadow)] ${GOLD_LIGHT_MATERIAL}`}
        >
          <div className="w-9 sm:w-11 lg:w-12 h-9 sm:h-11 lg:h-12 rounded-stat-icon-radius bg-[var(--skeleton-block)] animate-pulse" />
          <div className="flex flex-col min-w-0 flex-1 gap-1.5">
            <div className="w-3/5 h-2 lg:h-2.5 rounded-full bg-[var(--skeleton-block)] animate-pulse" />
            <div className="w-2/5 h-4 sm:h-5 lg:h-6 rounded-full bg-[var(--skeleton-block)] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
});

interface LoadingOverlayProps {
  /** `true` = fixed inset-0 full-surface overlay (app background + fade);
   *  `false` = inline centered spinner + optional caption (no background). */
  fullScreen?: boolean
  /** Adds the two certified-accent decorative pulses (primary/secondary). */
  ambient?: boolean
  /** Optional caption under the spinner (text-secondary). */
  message?: string
  /** Container aria-label (default "Loading"). */
  ariaLabel?: string
}

/* Phase 5.4F (D-172) — the ONE loading overlay (loading-language owner).
   `LoadingScreen`/`PremiumLoader` delegate here; consumers are unchanged. */
export const LoadingOverlay = memo(({
  fullScreen = true,
  ambient = false,
  message,
  ariaLabel = 'Loading',
}: LoadingOverlayProps) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={`${fullScreen
        ? 'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-app-bg overflow-hidden transition-interaction duration-very-slow ease-standard'
        : 'flex flex-col items-center justify-center p-8'}`}
    >
      {ambient && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] animate-pulse [animation-delay:var(--duration-very-slow)]" />
        </>
      )}
      <div className="relative z-10 flex flex-col items-center scale-90 md:scale-100">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          {message && (
            <span className="text-base font-semibold text-text-secondary">{message}</span>
          )}
        </div>
      </div>
    </div>
  )
});

export const ErrorState = memo(({
  icon: Icon,
  title,
  message,
  onRetry,
  onBack,
}: {
  icon?: ReactNode;
  title?: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
}) => {
  return (
    <div role="alert" className="flex flex-col items-center justify-center p-10 text-center gap-4">
      {Icon ? (
        <div className="text-4xl" role="img" aria-label={title || 'Error'}>{Icon}</div>
      ) : (
        <div className="text-4xl" role="img" aria-label="Error">⚠️</div>
      )}
      {title && <div className="text-lg font-bold text-text-primary">{title}</div>}
      <div className="text-base text-text-primary opacity-90">{message}</div>
      {onRetry && (
        <Button
          variant="primary"
          onClick={onRetry}
          className="px-8"
          aria-label="Retry loading data"
        >
          Try Again
        </Button>
      )}
      {onBack && (
        <Button
          variant="secondary"
          onClick={onBack}
          className="px-8"
        >
          Return Home
        </Button>
      )}
    </div>
  )
});

export const EmptyState = memo(({
  icon = '📂',
  title,
  subtitle,
  actionLabel,
  onAction,
  variant = 'premium'
}: {
  icon?: ReactNode;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Phase 3.9 (D-144) — additive surface family. `premium` (default, unchanged)
   *  renders the gold material; `management` renders the neutral Management
   *  Surface Family. No consumer migration. */
  variant?: 'premium' | 'management'
}) => {
  const surface = variant === 'management'
    ? `bg-[var(--management-surface)] border border-[var(--management-border)] shadow-[var(--management-shadow)] ${GOLD_LIGHT_MATERIAL}`
    : `${GOLD_SURFACE} shadow-premium-card`
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center gap-2 rounded-[32px] ${surface}`}>
      <div className="text-5xl mb-4" role="img" aria-label={title}>{icon}</div>
      <div className="text-xl font-black text-text-primary uppercase tracking-tight font-['Vend_Sans']">{title}</div>
      <div className="text-sm font-bold text-text-secondary max-w-sm">{subtitle}</div>
      {onAction && actionLabel && (
        <Button
          onClick={onAction}
          variant="primary"
          className="mt-6 px-10"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
});

/* Phase 2 3D (gap 23.9): canonical per-field error markup. Roughly 45
   production sites duplicating <span aria-live="polite" class="text-xs
   font-bold text-danger mt-1"> were collapsed onto this one primitive —
   identical a11y contract (live region, no role=alert) + identical styling.
   Consumers override size/layout via className (e.g. text-[11px] mt-0.5). */
export const FieldError: React.FC<{
  id?: string
  children?: ReactNode
  className?: string
}> = memo(({ id, children, className = '' }) => (
  <span id={id} aria-live="polite" className={`text-xs font-bold text-danger mt-1 block ${className}`}>
    {children}
  </span>
));

/* State-container unification (audit §12): canonical row/card-level mutation
   failure. Compact inline annotation with the same a11y contract as Alert
   (role="alert") but no thickness — for a single row/card surface where a
   full Alert banner would steal vertical rhythm. Mirrors the Alert tint +
   border/20 token convention; never a raw color utility. */
export const RowLevelError: React.FC<{
  id?: string
  children?: ReactNode
  className?: string
}> = memo(({ id, children, className = '' }) => (
  <div
    id={id}
    role="alert"
    aria-live="assertive"
    className={`flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-[13px] font-semibold text-danger ${className}`}
  >
    <AlertCircle size={16} className="mt-0.5 shrink-0" />
    <div className="min-w-0 flex-1">{children}</div>
  </div>
));

interface ConfirmModalAction {
  label: string
  onClick: () => void
}

interface ConfirmModalProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel: () => void
  danger?: boolean
  /** Optional destructive middle action (e.g. "Discard Changes") rendered
   *  between Cancel and Confirm for three-decision flows such as
   *  unsaved-changes prompts. */
  secondaryAction?: ConfirmModalAction
  /** Locks the dialog while a confirmation action is in flight (loading confirm, close disabled). */
  busy?: boolean
  /** Persistent error rendered inside the dialog so destructive-action
   *  failures are visible while the dialog stays open (never hidden behind
   *  the overlay). */
  error?: ReactNode
}

export const ConfirmModal = memo(({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, danger = false, secondaryAction, busy = false, error = null
}: ConfirmModalProps) => {
  const instanceId = useId()
  const cancelBtnId = `${instanceId}-cancel`

  const isInfo = !onConfirm && !secondaryAction

  // A11y (C-3): land initial focus on Cancel — the safe default for a
  // destructive confirm. Enforced with a short rAF settle loop so portal
  // mount + enter-animation timing can never win the race; the Foundation
  // focus trap keeps Tab cycling inside the dialog and AdminModal restores
  // focus to the trigger on close.
  useEffect(() => {
    if (!open) return
    let raf = 0
    let tries = 0
    const tick = () => {
      const dlg = document.querySelector('[role="dialog"]')
      const target = dlg?.querySelector('[data-modal-initial-focus]')
      if (target instanceof HTMLElement) {
        target.focus()
        if (dlg && dlg.contains(document.activeElement)) return
      }
      if (++tries < 30) raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [open])

  if (!open) return null

  return (
    <AdminModal
      isOpen={open}
      onClose={busy ? () => {} : onCancel}
      title={title}
      maxWidth="sm:max-w-md"
      showCloseButton={isInfo}
      footer={(
        <div className="flex flex-wrap gap-3 justify-end">
          {!isInfo && (
            <Button
              id={cancelBtnId}
              variant="secondary"
              onClick={onCancel}
              disabled={busy}
              className="px-6"
              data-modal-initial-focus="true"
            >
              {cancelLabel}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="danger"
              onClick={secondaryAction.onClick}
              disabled={busy}
              className="px-6"
            >
              {secondaryAction.label}
            </Button>
          )}
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={busy ? undefined : (onConfirm ?? onCancel)}
            className="px-6"
            loading={busy}
          >
            {confirmLabel}
          </Button>
        </div>
      )}
    >
      <div className="flex flex-col gap-3">
        {error && (
          <Alert variant="error" icon={AlertCircle} title="Action failed" className="w-full">
            {error}
          </Alert>
        )}
        <div className="text-sm text-text-secondary leading-relaxed font-semibold">{message}</div>
      </div>
    </AdminModal>
  )
});
