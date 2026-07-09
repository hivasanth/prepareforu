import { memo, useCallback, type ReactNode } from 'react';
import { FocusTrap } from 'focus-trap-react';
import { Button } from './AntigravityUI';

interface SkeletonProps {
  height?: number | string
  width?:  number | string
  borderRadius?: number
  className?: string
  type?: 'text' | 'card'
}

export const LoadingSkeleton = memo(({ height = 20, width = '100%', borderRadius = 8, className = '', type = 'text' }: SkeletonProps) => {
  if (type === 'card') {
    return (
      <div className={`bg-card-bg border border-border-subtle rounded-2xl p-6 space-y-4 animate-pulse ${className}`}>
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
      className={`skeleton-static ${className} bg-hover-bg/50 border-border-subtle/10 border`}
      style={{
        height,
        width,
        borderRadius,
      }}
    />
  )
});

export const GridSkeleton = memo(({ count = 6, height = 180, columns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' }: { count?: number; height?: number | string; columns?: string }) => {
  return (
    <div className={`grid ${columns} gap-6 w-full`}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton key={i} height={height} borderRadius={24} />
      ))}
    </div>
  )
});

export const StatSkeleton = memo(({ count = 4 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card-bg border border-border-subtle rounded-[24px] p-6 flex items-center gap-4">
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

export const ErrorState = memo(({ message, onRetry }: { message: string; onRetry?: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center gap-4">
      <div className="text-4xl" role="img" aria-label="Error">⚠️</div>
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
    </div>
  )
});

export const EmptyState = memo(({ 
  icon = '📂', 
  title, 
  subtitle, 
  actionLabel, 
  onAction 
}: { 
  icon?: ReactNode; 
  title: string; 
  subtitle: string; 
  actionLabel?: string; 
  onAction?: () => void 
}) => {
  return (
    <div className={'flex flex-col items-center justify-center p-12 text-center gap-2 border-2 border-dashed border-border-subtle rounded-[32px] bg-card-bg/30'}>
      <div className="text-5xl mb-4" role="img" aria-label={title}>{icon}</div>
      <div className={`text-xl font-black text-text-primary uppercase tracking-tight font-['Vend_Sans']`}>{title}</div>
      <div className={'text-sm font-bold text-text-secondary max-w-sm'}>{subtitle}</div>
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
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export const ConfirmModal = memo(({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, danger = false
}: ConfirmModalProps) => {
  if (!open) return null

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
  }, [onCancel]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel();
  }, [onCancel]);

  return (
    <FocusTrap focusTrapOptions={{
      escapeDeactivates: false,
      clickOutsideDeactivates: false,
      initialFocus: false
    }}>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-5"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={handleKeyDown}
        onClick={handleOverlayClick}
      >
        <div className={'bg-card-bg border border-border-subtle rounded-2xl p-6 w-full max-w-md shadow-2xl transition-colors duration-300'}>
          <h3 className={`m-0 text-xl font-black text-text-primary font-['Vend_Sans']`}>{title}</h3>
          <p className={'mt-3 mb-8 text-sm text-text-secondary leading-relaxed font-semibold'}>{message}</p>
          <div className="flex gap-4 justify-end">
            <Button
              variant="secondary"
              onClick={onCancel}
              className="px-6"
            >
              {cancelLabel}
            </Button>
            <Button
              variant={danger ? 'danger' : 'primary'}
              onClick={onConfirm}
              className="px-6"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </FocusTrap>
  )
});
