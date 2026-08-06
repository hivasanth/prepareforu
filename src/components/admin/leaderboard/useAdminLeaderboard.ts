import { useState, useRef, useEffect, useCallback } from 'react'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { useAdminFilters } from '../../../hooks/useAdminFilters'
import { refreshLeaderboardView, fetchAdminLeaderboard } from '../../../services/leaderboardService'
import type { LeaderboardEntry } from '../../../types/leaderboard.types'

const PAGE_SIZE = 50
const REFRESH_COOLDOWN = 30000

interface LeaderboardResult {
  entries: LeaderboardEntry[]
  count: number
}

export function useAdminLeaderboard() {
  const { selectedExam, selectedPaper, setSelectedExam, setSelectedPaper } = useAdminFilters()
  const [page, setPage] = useState(0)

  useEffect(() => {
    setPage(0)
  }, [selectedExam, selectedPaper])

  const lastRefreshRef = useRef<number>(0)

  const fetcher = useCallback(async () => {
    try {
      const isValidExam = selectedExam === 'all' || selectedExam === 'APPSC_GROUPS' || selectedExam.startsWith('APPSC_GROUP_')
      if (!isValidExam) {
        return { data: { entries: [], count: 0 } as LeaderboardResult, error: null }
      }

      const now = Date.now()
      if (now - lastRefreshRef.current > REFRESH_COOLDOWN) {
        lastRefreshRef.current = now
        await refreshLeaderboardView()
      }

      const result = await fetchAdminLeaderboard(selectedExam, selectedPaper, page, PAGE_SIZE)
      return { data: { entries: result.entries, count: result.count } as LeaderboardResult, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  }, [selectedExam, selectedPaper, page])

  const { data, loading, error, refetch } = useSupabaseQuery(fetcher, [selectedExam, selectedPaper, page])

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
