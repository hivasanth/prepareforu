import React from 'react'
import { Button } from './AntigravityButton'

interface RetryButtonProps {
  onRetry: () => void
  loading?: boolean
  disabled?: boolean
  label?: string
  className?: string
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  loading = false,
  disabled = false,
  label = 'Try Again',
  className = '',
}) => (
  <Button
    variant="primary"
    onClick={onRetry}
    disabled={disabled || loading}
    loading={loading}
    className={`px-8 ${className}`}
    aria-label={loading ? 'Retrying…' : label}
  >
    {label}
  </Button>
)
