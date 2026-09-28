import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  PageError,
  PageErrorState,
  ErrorInput,
  CaptureOptions,
  UsePageErrorReturn,
  RetryFn,
} from '../types/error.types'
import { normalizeError } from '../utils/errorClassification'

// ─── Hook ──────────────────────────────────────────────────────────────────

export function usePageError(): UsePageErrorReturn {
  const [state, setState] = useState<PageErrorState>('idle')
  const [error, setError] = useState<PageError | null>(null)
  const retryFnRef = useRef<RetryFn | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

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
      // Keep the current error in place while retrying so a failure can't
      // leave the page with error=null + loading=false (empty/content flash).
    }
    try {
      const result = await retryFnRef.current()
      if (!mountedRef.current) return
      // The retryFn contract: resolve `true` on success, `false` on failure
      // (after capturing). Only a truthful `true` clears the error — a resolved
      // `false` re-asserts the error state (the retryFn's own capture, or the
      // retained error, stays visible). Throws fall back to the catch below.
      if (result !== false) {
        setState('success')
        setError(null)
      } else {
        setState('error')
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
  // Generic capture: lets a page classify via the classifier (network/server/
  // auth are auto-detected) or override the category explicitly for typed
  // domain states (e.g. `category: 'business'`). Additive — retry contract
  // and the specialized helpers above are unchanged.
  const captureError = useCallback(
    (input?: ErrorInput, options?: CaptureOptions) =>
      capture(input ?? 'Unexpected error', options),
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
    captureError,
  }
}
