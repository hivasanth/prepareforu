import { useState, useCallback, useRef } from 'react'
import { useStableFetch } from './useStableFetch'
import type {
  PageError,
  PageErrorState,
  ErrorInput,
  CaptureOptions,
  ErrorCategory,
  ErrorCode,
  UsePageErrorReturn,
} from '../types/error.types'

// ─── Centralized Category Mapping ──────────────────────────────────────────
// Single canonical mapping. No page should ever duplicate detection logic.
// Maps error message patterns → ErrorCategory.

function detectCategory(message: string): ErrorCategory {
  if (!navigator.onLine) return 'offline'
  const lower = message.toLowerCase()
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('fetch'))
    return 'network'
  if (lower.includes('timeout') || lower.includes('timed out'))
    return 'timeout'
  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('session'))
    return 'authentication'
  if (lower.includes('403') || lower.includes('forbidden'))
    return 'authorization'
  if (lower.includes('429') || lower.includes('rate limit'))
    return 'rateLimit'
  if (lower.includes('503') || lower.includes('maintenance'))
    return 'maintenance'
  if (lower.includes('500') || lower.includes('502') || lower.includes('server'))
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

function normalizeError(input: ErrorInput, options?: CaptureOptions): PageError {
  const rawMessage = extractMessage(input)
  const category = options?.category ?? detectCategory(rawMessage)
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

function extractMessage(input: ErrorInput): string {
  if (input instanceof Error) return input.message
  if (typeof input === 'string') return input
  if (input && typeof input === 'object' && 'message' in input) {
    return String((input as { message: unknown }).message)
  }
  return ''
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

// ─── Hook ──────────────────────────────────────────────────────────────────

export function usePageError(): UsePageErrorReturn {
  const [state, setState] = useState<PageErrorState>('idle')
  const [error, setError] = useState<PageError | null>(null)
  const retryFnRef = useRef<(() => void | Promise<void>) | null>(null)
  const { mountedRef } = useStableFetch()

  const capture = useCallback((input: ErrorInput, options?: CaptureOptions) => {
    const normalized = normalizeError(input, options)
    retryFnRef.current = options?.retryFn ?? null
    if (mountedRef.current) {
      setError(normalized)
      setState('error')
    }
  }, [mountedRef])

  const retry = useCallback(async () => {
    if (!retryFnRef.current) return
    if (mountedRef.current) {
      setState('retrying')
      setError(null)
    }
    try {
      await retryFnRef.current()
      if (mountedRef.current) {
        setState('success')
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(normalizeError(err))
        setState('error')
      }
    }
  }, [mountedRef])

  const dismiss = useCallback(() => {
    if (mountedRef.current) {
      setError(null)
      retryFnRef.current = null
      setState('idle')
    }
  }, [mountedRef])

  const reset = useCallback(() => {
    if (mountedRef.current) {
      setError(null)
      retryFnRef.current = null
      setState('idle')
    }
  }, [mountedRef])

  // ─── Specialized Capture Helpers ───────────────────────────────────────
  const captureNetworkError = useCallback(
    (input?: ErrorInput, options?: CaptureOptions) =>
      capture(input ?? 'Network error', { ...options, category: 'network', code: options?.code ?? 'NETWORK_FETCH_FAILED' }),
    [capture],
  )
  const captureServerError = useCallback(
    (input?: ErrorInput, options?: CaptureOptions) =>
      capture(input ?? 'Server error', { ...options, category: 'server', code: options?.code ?? 'SERVER_ERROR' }),
    [capture],
  )
  const captureUnknownError = useCallback(
    (input?: ErrorInput, options?: CaptureOptions) =>
      capture(input ?? 'Unknown error', { ...options, category: 'unknown', code: options?.code ?? 'UNKNOWN' }),
    [capture],
  )
  const captureValidationError = useCallback(
    (input?: ErrorInput, options?: CaptureOptions) =>
      capture(input ?? 'Validation error', { ...options, category: 'validation', code: options?.code ?? 'VALIDATION_ERROR' }),
    [capture],
  )
  const captureAuthenticationError = useCallback(
    (input?: ErrorInput, options?: CaptureOptions) =>
      capture(input ?? 'Authentication error', { ...options, category: 'authentication', code: options?.code ?? 'AUTH_SESSION_EXPIRED' }),
    [capture],
  )
  const captureAuthorizationError = useCallback(
    (input?: ErrorInput, options?: CaptureOptions) =>
      capture(input ?? 'Authorization error', { ...options, category: 'authorization', code: options?.code ?? 'AUTH_FORBIDDEN' }),
    [capture],
  )

  return {
    state,
    error,
    retry,
    dismiss,
    reset,
    captureNetworkError,
    captureServerError,
    captureUnknownError,
    captureValidationError,
    captureAuthenticationError,
    captureAuthorizationError,
  }
}
