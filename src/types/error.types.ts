// ─── Error Categories ──────────────────────────────────────────────────────
export type ErrorCategory =
  | 'network'
  | 'offline'
  | 'timeout'
  | 'authentication'
  | 'authorization'
  | 'server'
  | 'validation'
  | 'rateLimit'
  | 'maintenance'
  | 'unknown'
  | 'business'

// ─── Error Codes ───────────────────────────────────────────────────────────
// Developer-facing diagnostics. NEVER displayed to users.
export type ErrorCode =
  | 'NETWORK_OFFLINE'
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_FETCH_FAILED'
  | 'SERVER_ERROR'
  | 'SERVER_MAINTENANCE'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN'

// ─── Error Severity ────────────────────────────────────────────────────────
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// ─── Error State Machine ───────────────────────────────────────────────────
export type PageErrorState = 'idle' | 'loading' | 'error' | 'retrying' | 'success'

// ─── Error Container Variant ───────────────────────────────────────────────
// All variants render identically today. Future phases will differentiate.
export type ErrorContainerVariant = 'page' | 'inline'

// ─── Canonical Page Error ──────────────────────────────────────────────────
export interface PageError {
  category: ErrorCategory
  code: ErrorCode
  severity: ErrorSeverity
  title: string
  message: string
  retryable: boolean
  timestamp: number
  debugMessage?: string
  fingerprint?: string
}

// ─── Error Normalization Input ─────────────────────────────────────────────
export type ErrorInput = unknown

// ─── Capture Options ───────────────────────────────────────────────────────
export interface CaptureOptions {
  retryable?: boolean
  retryFn?: () => void | Promise<void>
  severity?: ErrorSeverity
  category?: ErrorCategory
  code?: ErrorCode
  fallbackMessage?: string
}

// ─── Specialized Capture Helpers ───────────────────────────────────────────
// Each helper pre-fills category + code defaults. Pages never choose categories.
export interface CaptureHelpers {
  captureNetworkError: (input?: ErrorInput, options?: CaptureOptions) => void
  captureServerError: (input?: ErrorInput, options?: CaptureOptions) => void
  captureUnknownError: (input?: ErrorInput, options?: CaptureOptions) => void
  captureValidationError: (input?: ErrorInput, options?: CaptureOptions) => void
  captureAuthenticationError: (input?: ErrorInput, options?: CaptureOptions) => void
  captureAuthorizationError: (input?: ErrorInput, options?: CaptureOptions) => void
}

// ─── Hook Return Type ──────────────────────────────────────────────────────
export interface UsePageErrorReturn extends CaptureHelpers {
  state: PageErrorState
  error: PageError | null
  retry: () => void
  dismiss: () => void
  reset: () => void
}
