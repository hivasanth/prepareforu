import { useState, useCallback } from 'react'
import { useStableFetch } from './useStableFetch'

export function useAsyncOperation<T = void>(initialLoading = false) {
  const [loading, setLoading] = useState(initialLoading)
  const { mountedRef, nextId, isStale } = useStableFetch()

  const execute = useCallback(async (fn: () => Promise<T>): Promise<T | undefined> => {
    setLoading(true)
    const id = nextId()
    try {
      const result = await fn()
      if (isStale(id)) return undefined
      return result
    } catch (err) {
      if (isStale(id)) return undefined
      throw err
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  return { loading, execute }
}
