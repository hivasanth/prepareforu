import { useState, useCallback } from 'react'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { useAdminFilters } from '../../../hooks/useAdminFilters'
import { fetchActiveExams } from '../../../services/examService'
import { fetchAdminLeaderboard } from '../../../services/leaderboardService'
import type { AdminLeaderboardEntry } from '../../../types/leaderboard.types'

const PAGE_SIZE = 50

/** Platform default exam selection — identical to the default useAdminFilters
 *  already applies when ?exam= is absent ('all' → APPSC_GROUP_1). Unknown URL
 *  values are normalized here instead of being answered with a fabricated
 *  successful empty leaderboard. */
const DEFAULT_EXAM_ID = 'APPSC_GROUP_1'

/** A selection is recognized when it is an aggregate target ('all' /
 *  'APPSC_GROUPS') or a live exam id from the authoritative exam list that
 *  feeds the selection tabs. When the exam list itself cannot be loaded the
 *  check cannot run, so every value is passed through and the admin-guarded
 *  RPC remains the sole authority (it answers real rows / real zero rows /
 *  real errors — never client-fabricated data). */
function isRecognizedSelection(
  selectedExam: string,
  validExamIds: ReadonlySet<string> | null
): boolean {
  if (selectedExam === 'all' || selectedExam === 'APPSC_GROUPS') return true
  if (!validExamIds) return true
  return validExamIds.has(selectedExam)
}

interface LeaderboardResult {
  entries: AdminLeaderboardEntry[]
  count: number
}

/**
 * Admin leaderboard page state. Reads go through the admin-guarded
 * `get_admin_leaderboard` RPC only — the materialized view is refreshed
 * server-side by pg_cron ('refresh-materialized-views', every 10 min), so a
 * browser session never triggers the expensive MV refresh.
 *
 * Every supported exam id the tabs render — including non-APPSC exams such as
 * BANK_EXAMS — reaches the backend; a genuine zero-row response is the ONLY
 * source of the empty state. Unknown ?exam= URL values are validated against
 * the authoritative live exam list and normalized to the platform default;
 * while that normalization round-trips the URL the page holds LOADING, so an
 * unknown input can never resolve into a success-empty render.
 *
 * Page number intentionally lives in component state only (product decision):
 * exam/paper filters persist through the URL, refresh/back returns to page 1.
 */
export function useAdminLeaderboard() {
  const { selectedExam, selectedPaper, setSelectedExam, setSelectedPaper } = useAdminFilters()
  const [page, setPage] = useState(0)

  // Reset to page 1 whenever the filter selection changes. Adjusting state
  // during render (the documented React pattern for derived resets) avoids a
  // cascading-render effect.
  const filterKey = `${selectedExam}|${selectedPaper}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setPage(0)
  }

  const fetcher = useCallback(async () => {
    // Authoritative exam ids — deduped/cached by examService (the same source
    // the selection tabs render). List failure defers entirely to the backend.
    let validExamIds: ReadonlySet<string> | null = null
    try {
      validExamIds = new Set((await fetchActiveExams()).map((exam) => exam.exam_id))
    } catch {
      validExamIds = null
    }

    if (!isRecognizedSelection(selectedExam, validExamIds)) {
      if (selectedExam !== DEFAULT_EXAM_ID) {
        // Unknown URL value: normalize through the existing filter system.
        // The param change recreates this fetcher and a fresh request runs
        // for the corrected context; THIS request never resolves, so the page
        // holds LOADING (no empty/success can flash) and the monotonic
        // sequence guard in useSupabaseQuery retires it once the superseding
        // request starts.
        setSelectedExam(DEFAULT_EXAM_ID)
        return new Promise<{ data: LeaderboardResult | null; error: null }>(() => {})
      }
      // The default id itself is unrecognized (drastic exam-list change):
      // fall through and let the backend decide — never fabricate success.
    }

    try {
      const result = await fetchAdminLeaderboard(selectedExam, selectedPaper, page, PAGE_SIZE)
      return { data: { entries: result.entries, count: result.count } as LeaderboardResult, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  }, [selectedExam, selectedPaper, page, setSelectedExam])

  const { data, loading, error, refetch } = useSupabaseQuery(
    fetcher,
    [selectedExam, selectedPaper, page],
    'admin_leaderboard'
  )

  const hasMore = data ? (page + 1) * PAGE_SIZE < data.count : false

  return {
    entries: data?.entries ?? [],
    count: data?.count ?? 0,
    loading,
    error,
    refetch,
    page,
    setPage,
    hasMore,
    selectedExam,
    selectedPaper,
    setSelectedExam,
    setSelectedPaper,
  }
}
