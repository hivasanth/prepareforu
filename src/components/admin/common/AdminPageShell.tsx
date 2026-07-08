import type { ReactNode } from 'react'

interface AdminPageShellProps {
  loading?: boolean
  error?: string | null
  empty?: boolean
  onRetry?: () => void
  loadingState?: ReactNode
  errorState?: ReactNode
  emptyState?: ReactNode
  children: ReactNode
}

export function AdminPageShell({
  loading,
  error,
  empty,
  onRetry,
  loadingState,
  errorState,
  emptyState,
  children,
}: AdminPageShellProps) {
  if (loading && loadingState) return <>{loadingState}</>
  if (error && errorState) return <>{errorState}</>
  if (empty && emptyState) return <>{emptyState}</>
  return <>{children}</>
}
