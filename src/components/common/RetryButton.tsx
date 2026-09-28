import React from 'react'
import { Button } from './AntigravityButton'

type RetryButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface RetryButtonProps {
  onRetry: () => void
  loading?: boolean
  disabled?: boolean
  label?: string
  /** Design-system button size. Omitted → legacy default render
   *  (md-height primary with px-8), unchanged for existing consumers. */
  size?: RetryButtonSize
  className?: string
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  loading = false,
  disabled = false,
  label = 'Try Again',
  size,
  className = '',
}) => (
  <Button
    variant="primary"
    size={size}
    onClick={onRetry}
    disabled={disabled || loading}
    loading={loading}
    /* BUG-G: the wide default is part of the legacy page-level look. Callers
     * that opt into an explicit design-system size own their spacing through
     * the Button size scale — no !important counter-overrides needed. */
    className={size ? className : `px-8 ${className}`}
    aria-label={loading ? 'Retrying…' : label}
    aria-busy={loading || undefined}
  >
    {label}
  </Button>
)
