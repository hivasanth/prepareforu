import { useState, useEffect, useCallback, useRef } from 'react'
import { getCacheSWR, setCache } from '../services/adminQueryCache'

interface QueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
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
  deps: unknown[] = []
): QueryResult<T> {
  const key = cacheKey(deps)
  const cached = getCacheSWR<T>(key)

  const [data, setData]       = useState<T | null>(cached?.data ?? null)
  const [loading, setLoading] = useState(!cached)
  const [error, setError]     = useState<string | null>(null)
  const mountedRef = useRef(true)
  const queryFnRef = useRef(queryFn)
  const hasDataRef = useRef(!!cached?.data)
  const prevKeyRef = useRef(key)
  queryFnRef.current = queryFn

  // Reset hasDataRef when deps change so fetch() properly reflects loading state
  if (key !== prevKeyRef.current) {
    prevKeyRef.current = key
    hasDataRef.current = !!cached?.data
  }

  const fetch = useCallback(async () => {
    if (!hasDataRef.current) setLoading(true)
    setError(null)
    try {
      const result = await queryFnRef.current()
      if (!mountedRef.current) return
      if (result.error) {
        const e = result.error
        const errorMsg = typeof e === 'string' ? e : (e as { message?: string })?.message || 'Failed to load data.'
        setError(errorMsg)
        if (!hasDataRef.current) setData(null)
      } else {
        hasDataRef.current = true
        setData(result.data)
        setCache(key, result.data)
      }
    } catch (err: unknown) {
      if (!mountedRef.current) return
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('fetch') || msg.includes('network'))
        setError('Network error. Check your connection.')
      else
        setError('Failed to load data. Please try again.')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, deps)

  // Listen for cross-tab cache invalidation events
  useEffect(() => {
    const handler = () => { if (hasDataRef.current) fetch() }
    if (typeof window !== 'undefined') {
      window.addEventListener('admin:cache-invalidated', handler)
      return () => window.removeEventListener('admin:cache-invalidated', handler)
    }
  }, [fetch])

  useEffect(() => {
    mountedRef.current = true
    if (!cached) {
      setLoading(true)
      setData(null)
    }
    fetch()
    return () => { mountedRef.current = false }
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}
