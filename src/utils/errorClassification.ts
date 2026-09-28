import type {
  PageError,
  ErrorCategory,
  ErrorCode,
  ErrorInput,
  CaptureOptions,
  DomainErrorCode,
  DomainErrorInfo,
} from '../types/error.types'

// ─── Centralized Category Mapping ──────────────────────────────────────────
// Single canonical mapping. No page should ever duplicate detection logic.
//
// BUG-H remediation: classification is STRUCTURED-FIRST. When the error
// object carries transport/PostgREST metadata (status, statusCode, code),
// those fields decide the category and message substrings are never
// consulted. Message matching remains only as a fallback for plain Errors,
// and the ambiguous bare-substring rules ("fetch", "server") were replaced
// with specific phrases so wrapped auth/RLS/server failures can no longer be
// misclassified by an incidental word.

type StructuredErrorLike = {
  status?: unknown
  statusCode?: unknown
  code?: unknown
}

function detectStructuredCategory(input: ErrorInput): ErrorCategory | undefined {
  if (!input || typeof input !== 'object') return undefined
  const rec = input as StructuredErrorLike
  const status =
    typeof rec.status === 'number' ? rec.status :
    typeof rec.statusCode === 'number' ? rec.statusCode :
    undefined
  const code = typeof rec.code === 'string' ? rec.code.toUpperCase() : undefined

  // Postgres / PostgREST structured codes.
  if (code === '42501') return 'authorization'
  if (code === 'PGRST301' || code === 'PGRST302') return 'authentication'

  if (status === 401) return 'authentication'
  if (status === 403) return 'authorization'
  if (status === 429) return 'rateLimit'
  if (status !== undefined && status >= 500) return 'server'
  return undefined
}

function detectCategory(input: ErrorInput, message: string): ErrorCategory {
  if (!navigator.onLine) return 'offline'
  const structured = detectStructuredCategory(input)
  if (structured) return structured

  const lower = message.toLowerCase()
  // Authorization BEFORE authentication: "UNAUTHORIZED_ACCESS" is a role/
  // permission rejection (authorization), not a session expiry.
  if (
    lower.includes('unauthorized_access') ||
    lower.includes('permission denied') ||
    lower.includes('row-level security') ||
    lower.includes('42501') ||
    lower.includes('forbidden') ||
    lower.includes('403')
  )
    return 'authorization'
  if (
    lower.includes('401') ||
    lower.includes('unauthorized') ||
    lower.includes('session expired') ||
    lower.includes('auth session') ||
    lower.includes('invalid session') ||
    lower.includes('jwt') ||
    lower.includes('pgrst301') ||
    lower.includes('wrong key')
  )
    return 'authentication'
  if (lower.includes('timeout') || lower.includes('timed out'))
    return 'timeout'
  if (lower.includes('429') || lower.includes('rate limit'))
    return 'rateLimit'
  if (lower.includes('503') || lower.includes('maintenance'))
    return 'maintenance'
  if (
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed')
  )
    return 'network'
  if (
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('internal server error') ||
    lower.includes('internal error')
  )
    return 'server'
  return 'unknown'
}

// ─── Centralized Code Mapping ──────────────────────────────────────────────
// Category + message → ErrorCode. Single source of truth.

function resolveCode(category: ErrorCategory, message: string): ErrorCode {
  const lower = message.toLowerCase()
  switch (category) {
    case 'network':
      if (!navigator.onLine) return 'NETWORK_OFFLINE'
      if (lower.includes('timeout') || lower.includes('timed out')) return 'NETWORK_TIMEOUT'
      return 'NETWORK_FETCH_FAILED'
    case 'offline':
      return 'NETWORK_OFFLINE'
    case 'timeout':
      return 'NETWORK_TIMEOUT'
    case 'authentication':
      return 'AUTH_SESSION_EXPIRED'
    case 'authorization':
      return 'AUTH_FORBIDDEN'
    case 'server':
      if (lower.includes('503') || lower.includes('maintenance')) return 'SERVER_MAINTENANCE'
      return 'SERVER_ERROR'
    case 'rateLimit':
      return 'RATE_LIMIT_EXCEEDED'
    case 'maintenance':
      return 'SERVER_MAINTENANCE'
    case 'validation':
      return 'VALIDATION_ERROR'
    default:
      return 'UNKNOWN'
  }
}

// ─── Pure Normalization ────────────────────────────────────────────────────
// No hooks, no side effects. Extractable and testable.

function extractMessage(input: ErrorInput): string {
  if (input instanceof Error) return input.message
  if (typeof input === 'string') return input
  if (input && typeof input === 'object' && 'message' in input) {
    return String((input as { message: unknown }).message)
  }
  return ''
}

export function normalizeError(input: ErrorInput, options?: CaptureOptions): PageError {
  const rawMessage = extractMessage(input)
  const category = options?.category ?? detectCategory(input, rawMessage)
  const code = options?.code ?? resolveCode(category, rawMessage)

  return {
    category,
    code,
    severity: options?.severity ?? 'medium',
    title: buildTitle(category),
    message: options?.fallbackMessage ?? buildFriendlyMessage(category),
    retryable: options?.retryable ?? true,
    timestamp: Date.now(),
    debugMessage: rawMessage || undefined,
  }
}

// ─── Classification Summary ────────────────────────────────────────────────
// Lightweight service-layer classification. Reuses the canonical detection
// logic above; returns only what service adapters and the UI need.

export function classifyError(
  input: ErrorInput,
  options?: Pick<CaptureOptions, 'category' | 'code'>
): { category: ErrorCategory; code: ErrorCode; message: string } {
  const rawMessage = extractMessage(input)
  const category = options?.category ?? detectCategory(input, rawMessage)
  const code = options?.code ?? resolveCode(category, rawMessage)
  return { category, code, message: buildFriendlyMessage(category) }
}

// Lightweight structured-field extraction for service-layer catch blocks.
// Supabase/PostgREST errors surface `message` + `code` on the thrown object;
// this avoids `catch (error: any)` without changing logging or throw behaviour.
export function errorFields(err: unknown): { message?: string; code?: string } {
  if (err instanceof Error) return { message: err.message }
  if (err && typeof err === 'object') {
    const rec = err as { message?: unknown; code?: unknown }
    return {
      message: typeof rec.message === 'string' ? rec.message : String(rec.message ?? undefined),
      code: typeof rec.code === 'string' ? rec.code : undefined,
    }
  }
  return err === undefined ? {} : { message: String(err) }
}


// ─── Code → Category ───────────────────────────────────────────────────────
// Canonical reverse mapping so consumers can translate a normalized ErrorCode
// back into the category the UI renders. Accepts a plain string so both the
// service-layer code union and the canonical ErrorCode union are supported.

export function categoryFromCode(code: string): ErrorCategory {
  switch (code) {
    case 'NETWORK_OFFLINE': return 'offline'
    case 'NETWORK_TIMEOUT': return 'timeout'
    case 'NETWORK_FETCH_FAILED': return 'network'
    case 'SERVER_ERROR': return 'server'
    case 'SERVER_MAINTENANCE': return 'maintenance'
    case 'AUTH_SESSION_EXPIRED':
    case 'AUTH_UNAUTHORIZED': return 'authentication'
    case 'AUTH_FORBIDDEN': return 'authorization'
    case 'RATE_LIMIT_EXCEEDED': return 'rateLimit'
    case 'VALIDATION_ERROR': return 'validation'
    default: return 'unknown'
  }
}

// ─── Centralized Copy ──────────────────────────────────────────────────────

function buildTitle(category: ErrorCategory): string {
  const titles: Record<ErrorCategory, string> = {
    network: 'Connection Lost',
    offline: 'You Are Offline',
    timeout: 'Request Timed Out',
    authentication: 'Session Expired',
    authorization: 'Access Denied',
    server: 'Server Error',
    validation: 'Invalid Data',
    rateLimit: 'Too Many Requests',
    maintenance: 'Under Maintenance',
    business: 'Something Went Wrong',
    unknown: 'Unexpected Error',
  }
  return titles[category]
}

function buildFriendlyMessage(category: ErrorCategory): string {
  const messages: Record<ErrorCategory, string> = {
    network: 'Please check your internet connection and try again.',
    offline: 'You appear to be offline. Please reconnect and try again.',
    timeout: 'The request took too long. Please try again.',
    authentication: 'Your session has expired. Please sign in again.',
    authorization: "You don't have permission to access this.",
    server: 'Our servers are having trouble. Please try again shortly.',
    validation: 'The data received was unexpected. Please try again.',
    rateLimit: 'Too many requests. Please wait a moment and try again.',
    maintenance: 'We are currently undergoing maintenance. Please check back soon.',
    business: 'Something went wrong. Please try again.',
    unknown: 'An unexpected error occurred. Please try again.',
  }
  return messages[category]
}

// ─── Domain Error Mapping ───────────────────────────────────────────────────
// Canonical mapping of backend business codes (Edge Function / RPC) to
// surface-ready, actionable UX — including any navigation target. This is the
// single source of truth for the sub-admin provisioning domain; pages consume
// it instead of hand-rolling code→message switch statements.
//
// Retry semantics: `retryable` indicates the operation is safe to retry. For
// idempotent provisioning this is true for any of the transient/stale paths;
// a caller retries with the SAME request_id (the server + DB dedupe).

export function mapDomainError(
  code: string | undefined,
  message: string | undefined,
  status?: number | undefined,
): DomainErrorInfo {
  const normalized = (code ?? '').toUpperCase() as DomainErrorCode
  switch (normalized) {
    case 'EDUCATOR_EXISTS':
      return {
        code: 'EDUCATOR_EXISTS',
        title: 'Account Already Exists',
        message: 'An educator account with this email already exists. Use a different email or edit the existing one.',
        category: 'business',
        retryable: false,
      }
    case 'COUPON_TAKEN':
      return {
        code: 'COUPON_TAKEN',
        title: 'Coupon Code Unavailable',
        message: 'This coupon code is already assigned to an active educator. Choose a different code.',
        category: 'business',
        retryable: false,
      }
    case 'INVALID_COMMISSION':
      return {
        code: 'INVALID_COMMISSION',
        title: 'Invalid Commission',
        message: 'Commission must be a number between 0 and 100.',
        category: 'validation',
        retryable: true,
      }
    case 'ALREADY_PROVISIONED':
      return {
        code: 'ALREADY_PROVISIONED',
        title: 'Already Onboarded',
        message: 'This onboarding was already completed. The educator is active.',
        category: 'business',
        retryable: false,
      }
    case 'SUB_ADMIN_NOT_FOUND':
      return {
        code: 'SUB_ADMIN_NOT_FOUND',
        title: 'Educator Not Found',
        message: 'The requested educator could not be found. Refresh the list and try again.',
        category: 'business',
        retryable: false,
      }
    case 'CONCURRENT_UPDATE_CONFLICT':
      return {
        code: 'CONCURRENT_UPDATE_CONFLICT',
        title: 'Stale Changes Detected',
        message: 'This educator was updated elsewhere. Refresh the list and try again.',
        category: 'business',
        retryable: true,
      }
    case 'INVITE_FAILED':
      return {
        code: 'INVITE_FAILED',
        title: 'Invitation Not Sent',
        message: 'We could not send the invitation email. Please try again shortly.',
        category: 'server',
        retryable: true,
      }
    case 'INVITE_REDIRECT_MISCONFIGURED':
      return {
        code: 'INVITE_REDIRECT_MISCONFIGURED',
        title: 'Invitation Temporarily Unavailable',
        message: 'The invitation service is misconfigured. Please contact support.',
        category: 'server',
        retryable: true,
      }
    case 'COUPON_GENERATION_EXHAUSTED':
      return {
        code: 'COUPON_GENERATION_EXHAUSTED',
        title: 'Could Not Generate Coupon',
        message: 'A unique coupon could not be generated right now. Please try again.',
        category: 'business',
        retryable: true,
      }
    case 'PROVISION_FAILED':
      return {
        code: 'PROVISION_FAILED',
        title: 'Provisioning Failed',
        message: 'The educator was invited but provisioning did not complete. The invitation was revoked — no partial account remains. Try again.',
        category: 'server',
        retryable: true,
      }
    case 'ROLE_GRANT_FAILED':
    case 'USER_NOT_FOUND':
      return {
        code: normalized,
        title: 'Could Not Complete',
        message: 'The educator could not be activated. Refresh and try again, or contact support.',
        category: 'business',
        retryable: true,
      }
    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
      return {
        code: normalized as 'UNAUTHORIZED' | 'FORBIDDEN',
        title: 'Permission Required',
        message: 'Only an administrator can perform this action.',
        category: 'authorization',
        retryable: false,
      }
    case 'UNAUTHENTICATED':
      return {
        code: 'UNAUTHENTICATED',
        title: 'Session Expired',
        message: 'Please sign in again to continue.',
        category: 'authentication',
        retryable: false,
        navigateTo: '/login',
      }
    case 'VALIDATION_FAILED':
      return {
        code: 'VALIDATION_FAILED',
        title: 'Check Your Details',
        message: message || 'Some details are invalid. Review and try again.',
        category: 'validation',
        retryable: true,
      }
    case 'REQUEST_ID_INVALID':
      return {
        code: 'REQUEST_ID_INVALID',
        title: 'Onboarding Session Expired',
        message: 'Your onboarding session expired. Please try again.',
        category: 'business',
        retryable: true,
      }
    case 'RATE_LIMIT_UNAVAILABLE':
      return {
        code: 'RATE_LIMIT_UNAVAILABLE',
        title: 'Security Layer Unavailable',
        message: 'Our security layer is temporarily unavailable. Try again later.',
        category: 'rateLimit',
        retryable: true,
      }
    case 'TOO_MANY_REQUESTS':
      return {
        code: 'TOO_MANY_REQUESTS',
        title: 'Too Many Requests',
        message: message || 'Please wait a moment before trying again.',
        category: 'rateLimit',
        retryable: true,
      }
    case 'INTERNAL_ERROR':
      return {
        code: 'INTERNAL_ERROR',
        title: 'Unexpected Error',
        message: 'Something went wrong on our end. Please try again shortly.',
        category: 'server',
        retryable: true,
      }
    // ── Educator-exam start domain (server-authoritative window/ownership
    //    codes raised by create_attempt). Precondition failures are NOT
    //    retryable — they describe a deterministic state, not a transient one.
    case 'UNAUTHORIZED_ACCESS':
      return {
        code: 'UNAUTHORIZED_ACCESS',
        title: 'Access Denied',
        message: "You don't have access to this exam.",
        category: 'authorization',
        retryable: false,
      }
    case 'EXAM_NOT_STARTED':
      return {
        code: 'EXAM_NOT_STARTED',
        title: 'Exam Not Started Yet',
        message: 'This exam has not started yet. Please come back once it opens.',
        category: 'business',
        retryable: false,
      }
    case 'EXAM_WINDOW_CLOSED':
      return {
        code: 'EXAM_WINDOW_CLOSED',
        title: 'Exam Has Ended',
        message: 'This exam window has closed. You can no longer start it.',
        category: 'business',
        retryable: false,
      }
    case 'TEACHER_EXAM_NOT_AVAILABLE':
      return {
        code: 'TEACHER_EXAM_NOT_AVAILABLE',
        title: 'Exam Unavailable',
        message: 'This exam is not currently available. Please check your schedule and try again.',
        category: 'business',
        retryable: false,
      }
    default: {
      // Fall back to transport classification when no known domain code.
      const categorized: ErrorCategory =
        status === 401 ? 'authentication' :
        status === 403 ? 'authorization' :
        status === 429 ? 'rateLimit' :
        (status ?? 0) >= 500 ? 'server' :
        'business'
      return {
        code: 'UNKNOWN_DOMAIN',
        title: categorized === 'server' ? 'Server Error' : 'Something Went Wrong',
        message: message || 'An unexpected error occurred. Please try again.',
        category: categorized,
        retryable: true,
      }
    }
  }
}

// ─── Educator-Exam Start Flow ───────────────────────────────────────────────
// The create_attempt RPC raises stable, distinct codes as its message text
// (PostgREST surfaces RAISE EXCEPTION text verbatim). This helper scans that
// text for the known-token set and maps the FIRST match through the canonical
// mapDomainError above — the single mapping, consumed by the page hook so it
// never hand-rolls code→message logic.

const TEACHER_EXAM_DOMAIN_TOKENS = [
  'EXAM_NOT_STARTED',
  'EXAM_WINDOW_CLOSED',
  'TEACHER_EXAM_NOT_AVAILABLE',
  'UNAUTHORIZED_ACCESS',
] as const

export function teacherExamErrorInfo(input: ErrorInput): DomainErrorInfo | null {
  const raw = extractMessage(input)
  const upper = raw.toUpperCase()
  for (const token of TEACHER_EXAM_DOMAIN_TOKENS) {
    if (upper.includes(token)) return mapDomainError(token, raw)
  }
  return null
}
