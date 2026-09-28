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

// ─── Domain Error Codes ────────────────────────────────────────────────────
// Backend-originated canonical business codes (Edge Function `error` field or
// RPC `code`). The UI maps these to specific, actionable messages and
// navigation actions (sub-admin/provisioning domain). Distinct from the
// normalized `ErrorCode` transport set above.
export type DomainErrorCode =
  | 'EDUCATOR_EXISTS'
  | 'COUPON_TAKEN'
  | 'INVALID_COMMISSION'
  | 'ALREADY_PROVISIONED'
  | 'SUB_ADMIN_NOT_FOUND'
  | 'CONCURRENT_UPDATE_CONFLICT'
  | 'INVITE_FAILED'
  | 'INVITE_REDIRECT_MISCONFIGURED'
  | 'COUPON_GENERATION_EXHAUSTED'
  | 'PROVISION_FAILED'
  | 'ROLE_GRANT_FAILED'
  | 'USER_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'VALIDATION_FAILED'
  | 'REQUEST_ID_INVALID'
  | 'RATE_LIMIT_UNAVAILABLE'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'
  // ── Educator-exam start-window domain (server-authoritative RPC codes) ──
  | 'UNAUTHORIZED_ACCESS'
  | 'EXAM_NOT_STARTED'
  | 'EXAM_WINDOW_CLOSED'
  | 'TEACHER_EXAM_NOT_AVAILABLE'
  | 'UNKNOWN_DOMAIN'

// ─── Domain Error Info ─────────────────────────────────────────────────────
// Surface-ready rendering for a domain error: a compact title, a specific
// actionable message, an optional navigation target (route), and whether the
// operation can be retried with the SAME request_id.
export interface DomainErrorInfo {
  code: DomainErrorCode
  title: string
  message: string
  category: ErrorCategory
  retryable: boolean
  navigateTo?: string
}

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

// ─── Retry Contract ─────────────────────────────────────────────────────────
// `retryFn` MUST report its own outcome: resolve `true` when the retry
// succeeded, resolve `false` when it failed (after capturing the error), and
// throw only as a fallback. `usePageError.retry` clears the error state ONLY
// on a truthful `true` — a resolved `false` leaves the captured error in place.
export type RetryFn = () => void | boolean | Promise<void | boolean>

// ─── Capture Options ───────────────────────────────────────────────────────
export interface CaptureOptions {
  retryable?: boolean
  retryFn?: RetryFn
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
  // Generic capture — classifies via the classifier unless `category` is
  // explicitly overridden (e.g. `category: 'business'` for typed domain states).
  captureError: (input?: ErrorInput, options?: CaptureOptions) => void
}

// ─── Hook Return Type ──────────────────────────────────────────────────────
export interface UsePageErrorReturn extends CaptureHelpers {
  state: PageErrorState
  error: PageError | null
  retry: () => Promise<void>
  dismiss: () => void
  reset: () => void
}
