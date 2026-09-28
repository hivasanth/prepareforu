// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

/* ─────────────────────────────────────────────────────────────────────────────
   BUG-001 — CACHE-KEY NAMESPACE ISOLATION (useSupabaseQuery)

   Contract (remediation §2–§11):
     Two queries with IDENTICAL deps but different result types
     (count: number vs topics: ManualEntryTopic[]) must own distinct cache
     entries via distinct namespaces. A warm remount must hydrate each hook
     with ONLY its own data — never the other query's payload.
   ────────────────────────────────────────────────────────────────────────── */

import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { invalidateCache } from '../services/adminQueryCache'

const SHARED_DEPS = ['APPSC_GROUP_1', '926c7d30-add2-4d03-a040-f011e9282562', 'History and Culture', true]
const TOPICS_PAYLOAD = [
  { id: 'topic-1', name_en: 'Mauryan Empire', name_te: null },
  { id: 'topic-2', name_en: 'Gupta Empire', name_te: null },
]

function useCount() {
  return useSupabaseQuery<number>(
    async () => ({ data: 96, error: null }),
    SHARED_DEPS,
    'admin_upload_count'
  )
}

function useTopics() {
  return useSupabaseQuery<typeof TOPICS_PAYLOAD>(
    async () => ({ data: TOPICS_PAYLOAD, error: null }),
    SHARED_DEPS,
    'admin_upload_topics'
  )
}

beforeEach(() => {
  // Isolate every case from sessionStorage + in-memory SWR state.
  invalidateCache()
})

describe('BUG-001 — namespaced cache keys isolate same-deps queries', () => {
  it('warm remount hydrates count as number and topics as array — no cross-contamination', async () => {
    // 1. Cold mount both queries (same deps, different namespaces).
    const count1 = renderHook(() => useCount())
    await waitFor(() => expect(count1.result.current.data).toBe(96))

    const topics1 = renderHook(() => useTopics())
    await waitFor(() => expect(topics1.result.current.data).toEqual(TOPICS_PAYLOAD))

    count1.unmount()
    topics1.unmount()

    // 2. Warm remount within TTL — hydration happens synchronously from cache.
    const count2 = renderHook(() => useCount())
    const topics2 = renderHook(() => useTopics())

    // Count hydrates ONLY the number payload.
    expect(count2.result.current.loading).toBe(false)
    expect(count2.result.current.data).toBe(96)

    // Topics hydrate ONLY the array payload.
    expect(topics2.result.current.loading).toBe(false)
    expect(topics2.result.current.data).toEqual(TOPICS_PAYLOAD)
    expect(Array.isArray(topics2.result.current.data)).toBe(true)

    // Neither query ever received the other's data type.
    expect(typeof count2.result.current.data).toBe('number')
    expect(Array.isArray(count2.result.current.data)).toBe(false)

    count2.unmount()
    topics2.unmount()
  })

  it('namespaced keys are distinct entries — writing one cannot evict the other', async () => {
    const count = renderHook(() => useCount())
    await waitFor(() => expect(count.result.current.data).toBe(96))

    // Topics resolve AFTER count is cached; the topics write must not
    // overwrite the count entry (the pre-fix collision scenario).
    const topics = renderHook(() => useTopics())
    await waitFor(() => expect(topics.result.current.data).toEqual(TOPICS_PAYLOAD))

    // Re-read count after the topics write landed in the shared cache store.
    const recount = renderHook(() => useCount())
    await waitFor(() => expect(recount.result.current.loading).toBe(false))
    expect(recount.result.current.data).toBe(96)
    expect(typeof recount.result.current.data).toBe('number')

    count.unmount()
    topics.unmount()
    recount.unmount()
  })

  it('omitting the namespace preserves legacy un-namespaced key behavior', async () => {
    function useLegacy() {
      return useSupabaseQuery<string>(
        async () => ({ data: 'legacy-value', error: null }),
        ['legacy-deps']
      )
    }

    const first = renderHook(() => useLegacy())
    await waitFor(() => expect(first.result.current.data).toBe('legacy-value'))
    first.unmount()

    const second = renderHook(() => useLegacy())
    expect(second.result.current.loading).toBe(false)
    expect(second.result.current.data).toBe('legacy-value')
    second.unmount()
  })
})
