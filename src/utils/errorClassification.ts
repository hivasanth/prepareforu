import type {
  PageError,
  ErrorCategory,
  ErrorCode,
  ErrorInput,
  CaptureOptions,
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
  if (lower.includes('500') || lower.includes('502') || lower.includes('internal error'))
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
