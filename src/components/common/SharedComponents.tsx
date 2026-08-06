import { memo, useEffect, useId, type ReactNode } from 'react';
import { Button } from './AntigravityButton';
import { AdminModal } from './AdminModal';
import { GOLD_SURFACE } from './AntigravityCard';

interface SkeletonProps {
  height?: number | string
  width?:  number | string
  borderRadius?: number
  className?: string
  type?: 'text' | 'card'
  /** Phase 3.9 (D-144) — additive surface family. `premium` (default, unchanged)
   *  renders the gold skeleton material; `management` renders the neutral
   *  Management Surface Family material. No consumer migration. */
  variant?: 'premium' | 'management'
}

const MANAGEMENT_SKELETON_SURFACE =
  'bg-[var(--management-surface)] border border-[var(--management-border)] shadow-[var(--management-shadow)]'
const MANAGEMENT_SKELETON_BLOCK = 'bg-[var(--management-surface-muted)]'

export const LoadingSkeleton = memo(({ height = 20, width = '100%', borderRadius = 8, className = '', type = 'text', variant = 'premium' }: SkeletonProps) => {
  const management = variant === 'management'
  if (type === 'card') {
    return (
      <div className={`${management ? MANAGEMENT_SKELETON_SURFACE : `${GOLD_SURFACE} shadow-premium-icon`} rounded-2xl p-6 space-y-4 animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className={'w-10 h-10 rounded-xl bg-hover-bg'} />
          <div className={'w-16 h-6 rounded-lg bg-hover-bg'} />
        </div>
        <div className="space-y-2">
          <div className={'h-4 rounded-full w-3/4 bg-hover-bg'} />
          <div className={'h-3 rounded-full w-1/2 opacity-60 bg-hover-bg'} />
        </div>
        <div className={'pt-4 border-t border-border-subtle grid grid-cols-2 gap-4'}>
          <div className={'h-10 rounded-xl bg-hover-bg'} />
          <div className={'h-10 rounded-xl bg-hover-bg'} />
        </div>
      </div>
    );
  }
  return (
    <div
      className={`${management ? MANAGEMENT_SKELETON_BLOCK : `${GOLD_SURFACE} shadow-premium-icon`} animate-pulse ${className}`}
      style={{
        height,
        width,
        borderRadius,
      }}
    />
  )
});

export const GridSkeleton = memo(({ count = 6, height = 180, columns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3', variant = 'premium' }: { count?: number; height?: number | string; columns?: string; variant?: 'premium' | 'management' }) => {
  return (
    <div className={`grid ${columns} gap-6 w-full`}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton key={i} height={height} borderRadius={24} variant={variant} />
      ))}
    </div>
  )
});

export const StatSkeleton = memo(({ count = 4 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${GOLD_SURFACE} rounded-[24px] p-6 flex items-center gap-4 shadow-premium-card animate-pulse`}>
          <LoadingSkeleton width={48} height={48} borderRadius={16} />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton width="40%" height={10} />
            <LoadingSkeleton width="70%" height={20} />
          </div>
        </div>
      ))}
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
    ? 'bg-[var(--management-surface)] border border-[var(--management-border)] shadow-[var(--management-shadow)]'
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

interface ConfirmModalProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel: () => void
  danger?: boolean
  /** Locks the dialog while a confirmation action is in flight (loading confirm, close disabled). */
  busy?: boolean
}

export const ConfirmModal = memo(({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, danger = false, busy = false
}: ConfirmModalProps) => {
  const instanceId = useId()
  const cancelBtnId = `${instanceId}-cancel`

  const isInfo = !onConfirm

  // A11y (C-3): land initial focus on Cancel — the safe default for a
  // destructive confirm. The Foundation focus trap keeps Tab cycling inside
  // the dialog and AdminModal restores focus to the trigger on close.
  useEffect(() => {
    if (!open) return
    const cancelBtn = document.getElementById(cancelBtnId)
    if (cancelBtn && typeof cancelBtn.focus === 'function') {
      cancelBtn.focus()
    }
  }, [open, cancelBtnId])

  if (!open) return null

  return (
    <AdminModal
      isOpen={open}
      onClose={busy ? () => {} : onCancel}
      title={title}
      maxWidth="sm:max-w-md"
      showCloseButton={isInfo}
      footer={(
        <div className="flex gap-4 justify-end">
          {!isInfo && (
            <Button
              id={cancelBtnId}
              variant="secondary"
              onClick={onCancel}
              className="px-6"
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm ?? onCancel}
            className="px-6"
            loading={busy}
          >
            {confirmLabel}
          </Button>
        </div>
      )}
    >
      <div className="text-sm text-text-secondary leading-relaxed font-semibold">{message}</div>
    </AdminModal>
  )
});
