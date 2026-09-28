import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useStableFetch } from '../../../hooks/useStableFetch'
import { usePageError } from '../../../hooks/usePageError'
import {
  fetchLeaderboardMetadata,
  fetchTopRanks,
  fetchUserRank,
  clearLeaderboardCache,
  getCachedLeaderboardMetadata
} from '../../../services/leaderboardService'
import type { LeaderboardEntry, LeaderboardMetadata, TimeRange } from './types'
import { getAllowedExamIds } from '../../../utils/examUtils'

export function useUserLeaderboard() {
  const { user, loading: authLoading } = useAuth()
  const isAppsc = user?.exam_selection === 'APPSC_GROUPS'
  const hasExamSelection = !!user?.exam_selection

  const [metadata, setMetadata] = useState<LeaderboardMetadata>(() => getCachedLeaderboardMetadata(user?.exam_selection ?? '') || { exams: [], papers: [] })
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const { state: errorState, error: pageError, captureNetworkError, retry: retryError, reset: resetError } = usePageError()

  const [selectedExam, setSelectedExam] = useState<string>('all')
  const [selectedPaper, setSelectedPaper] = useState<string>('all')
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30d')
  const [isInitialLoad, setIsInitialLoad] = useState(!getCachedLeaderboardMetadata(user?.exam_selection ?? ''))
  const { nextId, isStale } = useStableFetch()

  const loadMetadata = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false
    if (!user?.exam_selection) {
      if (!isStale(nextId())) setIsInitialLoad(false)
      return true
    }
    const id = nextId()
    try {
      const meta = await fetchLeaderboardMetadata(user.exam_selection)
      if (isStale(id)) return false

      setMetadata(meta || { exams: [], papers: [] })
      if (meta && meta.exams.length > 0) {
        // Canonical allowed-exam order (not alphabetical pinning) drives the default.
        const allowedExamIds = getAllowedExamIds(user.exam_selection)
        const defaultExamId = allowedExamIds.find(eid => meta.exams.some(e => e.id === eid)) ?? meta.exams[0].id
        setSelectedExam(defaultExamId)

        if (isAppsc) {
          const firstExamPapers = meta.papers.filter(p => p.exam_id === defaultExamId).sort((a, b) => a.name.localeCompare(b.name))
          if (firstExamPapers.length > 0) setSelectedPaper(firstExamPapers[0].id)
        } else {
          setSelectedPaper('all')
        }
      }
      return true
    } catch (err: unknown) {
      console.error('Metadata fetch error:', err instanceof Error ? err.message : "Failed to load leaderboard configuration.")
      if (!isStale(id)) captureNetworkError(err, { retryFn: () => loadMetadata() })
      return false
    } finally {
      if (!isStale(id)) setIsInitialLoad(false)
    }
  }, [user?.id, user?.exam_selection, isAppsc, nextId, isStale, captureNetworkError, setSelectedExam, setSelectedPaper, setIsInitialLoad])

  useEffect(() => {
    loadMetadata()
  }, [loadMetadata])

  const examOptions = useMemo(() => {
    return metadata.exams
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(e => ({
        id: e.id,
        label: e.name.replace(/APPSC[\s_]*/gi, '').replace(/_/g, ' ')
      }))
  }, [metadata.exams])

  const paperOptions = useMemo(() => {
    return metadata.papers
      .filter(p => p.exam_id === selectedExam)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(p => ({
        id: p.id,
        label: p.name
      }))
  }, [metadata.papers, selectedExam])

  const loadLeaderboard = useCallback(async (forceRefresh = false): Promise<boolean> => {
    if (selectedExam === 'all') return false

    const id = nextId()

    if (forceRefresh) {
      clearLeaderboardCache()
    }
    setLoading(true)
    resetError()

    try {
      const [ranks, currentRank] = await Promise.all([
        fetchTopRanks(selectedExam, selectedPaper, selectedTimeRange),
        fetchUserRank(user?.id || '', selectedExam, selectedPaper, selectedTimeRange)
      ])
      if (isStale(id)) return false
      setLeaderboard(ranks || [])
      setUserRank(currentRank || null)
      return true
    } catch (err: unknown) {
      if (isStale(id)) return false
      captureNetworkError(err, { retryFn: () => loadLeaderboard(true) })
      return false
    } finally {
      if (!isStale(id)) setLoading(false)
    }
  }, [selectedExam, selectedPaper, selectedTimeRange, user?.id])

  useEffect(() => {
    if (!isInitialLoad) loadLeaderboard()
  }, [user?.id, selectedExam, selectedPaper, selectedTimeRange, isInitialLoad, loadLeaderboard])

  const handleExamChange = useCallback((val: string) => {
    setSelectedExam(val)
    if (isAppsc) {
      const firstPaper = metadata.papers
        .filter(p => p.exam_id === val)
        .sort((a, b) => a.name.localeCompare(b.name))[0]
      if (firstPaper) setSelectedPaper(firstPaper.id)
    } else {
      setSelectedPaper('all')
    }
  }, [metadata.papers, isAppsc])

  return {
    authLoading,
    isInitialLoad,
    isAppsc,
    hasExamSelection,
    metadata,
    leaderboard,
    userRank,
    loading,
    errorState,
    pageError,
    retryError,
    selectedExam,
    handleExamChange,
    selectedPaper,
    setSelectedPaper,
    selectedTimeRange,
    setSelectedTimeRange,
    examOptions,
    paperOptions,
  }
}
