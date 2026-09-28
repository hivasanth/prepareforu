import { useState, useEffect, useCallback, useRef } from 'react'
import { getCacheSWR, setCache } from '../services/adminQueryCache'
import { classifyError } from '../utils/errorClassification'
import type { ErrorCategory } from '../types/error.types'

interface QueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** Canonical classification of the active failure ('unknown' when none). */
  category: ErrorCategory
  refetch: () => void
}

function cacheKey(deps: unknown[]): string {
  return deps.map(d => {
    if (typeof d === 'string' || typeof d === 'number' || typeof d === 'boolean')
      return String(d)
    try { return JSON.stringify(d) } catch { return '' }
  }).join('::')
}

export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  deps: unknown[] = [],
  keyNamespace?: string
): QueryResult<T> {
  // Namespace-qualified cache keys: two queries with identical deps but
  // different result types MUST own distinct cache entries, otherwise a warm
  // remount can hydrate one query's data into the other's state.
  const baseKey = cacheKey(deps)
  const key = keyNamespace ? `${keyNamespace}::${baseKey}` : baseKey
  const cached = getCacheSWR<T>(key)

  const [data, setData]       = useState<T | null>(cached?.data ?? null)
  const [loading, setLoading] = useState(!cached)
  const [error, setError]     = useState<string | null>(null)
  const [category, setCategory] = useState<ErrorCategory>('unknown')
  const mountedRef = useRef(true)
  // Monotonic request sequence — the ONLY authority on which response may
  // mutate state/cache. Prevents FILTER A → CONTENT FOR FILTER B when a slow
  // response for a previous context resolves after a newer one.
  const seqRef = useRef(0)
  const queryFnRef = useRef(queryFn)
  const hasDataRef = useRef(!!cached?.data)
  const prevKeyRef = useRef(key)
  const keyRef = useRef(key)
  const cachedRef = useRef(cached)
  queryFnRef.current = queryFn
  keyRef.current = key
  cachedRef.current = cached

  // Reset hasDataRef when deps change so fetch() properly reflects loading state
  if (key !== prevKeyRef.current) {
    prevKeyRef.current = key
    hasDataRef.current = !!cached?.data
  }

  // `fetch` reads every reactive value through a ref (keyRef, queryFnRef,
  // hasDataRef, cachedRef) so its identity is STABLE. Query re-fires are driven
  // by the mount effect keyed on `key`/deps below — never by fetch identity.
  // This makes the dependency/authority relationship explicit and lint-safe
  // while preserving the sequence guard, SWR hydration and refetch semantics.
  const fetch = useCallback(async () => {
    if (!hasDataRef.current) setLoading(true)
    setError(null)
    const seq = ++seqRef.current
    const isCurrent = () => seq === seqRef.current && mountedRef.current
    try {
      const result = await queryFnRef.current()
      if (!isCurrent()) return
      if (result.error) {
        const classified = classifyError(result.error)
        setCategory(classified.category)
        setError(classified.message)
        if (!hasDataRef.current) setData(null)
      } else {
        hasDataRef.current = true
        setData(result.data)
        setCache(keyRef.current, result.data)
      }
    } catch (err: unknown) {
      if (!isCurrent()) return
      const classified = classifyError(err instanceof Error ? err : String(err))
      setCategory(classified.category)
      setError(classified.message)
    } finally {
      if (isCurrent()) setLoading(false)
    }
  }, [])

  // Listen for cross-tab cache invalidation events (stable-fetch listener).
  useEffect(() => {
    const handler = () => { if (hasDataRef.current) fetch() }
    if (typeof window !== 'undefined') {
      window.addEventListener('admin:cache-invalidated', handler)
      return () => window.removeEventListener('admin:cache-invalidated', handler)
    }
  }, [fetch])

  // Re-fires whenever the context key changes (equivalent to the previous
  // fetch-identity-driven re-run). cachedRef mirrors the latest render's
  // cache probe so the SWR gate sees the value for the CURRENT key.
  useEffect(() => {
    mountedRef.current = true
    if (!cachedRef.current) {
      setLoading(true)
      setData(null)
    }
    fetch()
    return () => { mountedRef.current = false }
  }, [fetch, key])

  return { data, loading, error, category, refetch: fetch }
}
