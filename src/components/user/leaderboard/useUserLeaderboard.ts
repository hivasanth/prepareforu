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

export function useUserLeaderboard() {
  const { user, loading: authLoading } = useAuth()
  const isAppsc = user?.exam_selection === 'APPSC_GROUPS'

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

  useEffect(() => {
    const init = async () => {
      if (!user?.id || !user?.exam_selection) return
      const id = nextId()
      try {
        const meta = await fetchLeaderboardMetadata(user.exam_selection)
        if (isStale(id)) return

        setMetadata(meta || { exams: [], papers: [] })
        if (meta && meta.exams.length > 0) {
          const firstExam = meta.exams.sort((a, b) => a.name.localeCompare(b.name))[0]
          setSelectedExam(firstExam.id)

          if (isAppsc) {
            const firstExamPapers = meta.papers.filter(p => p.exam_id === firstExam.id).sort((a, b) => a.name.localeCompare(b.name))
            if (firstExamPapers.length > 0) setSelectedPaper(firstExamPapers[0].id)
          } else {
            setSelectedPaper('all')
          }
        }
      } catch (err: unknown) {
        console.error('Metadata fetch error:', err instanceof Error ? err.message : "Failed to load leaderboard configuration.")
        if (!isStale(id)) captureNetworkError(err, { retryFn: () => loadLeaderboard(true) })
      } finally {
        if (!isStale(id)) setIsInitialLoad(false)
      }
    }
    init()
  }, [user?.id, user?.exam_selection, isAppsc])

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

  const loadLeaderboard = useCallback(async (forceRefresh = false) => {
    if (selectedExam === 'all') return

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
      if (isStale(id)) return
      setLeaderboard(ranks || [])
      setUserRank(currentRank || null)
    } catch (err: unknown) {
      if (isStale(id)) return
      captureNetworkError(err, { retryFn: () => loadLeaderboard(true) })
    } finally {
      if (!isStale(id)) setLoading(false)
    }
  }, [selectedExam, selectedPaper, selectedTimeRange, user?.id])

  useEffect(() => {
    if (!isInitialLoad) loadLeaderboard()
  }, [user?.id, selectedExam, selectedPaper, selectedTimeRange, isInitialLoad, loadLeaderboard])

  const handleExamChange = useCallback((val: string) => {
    setSelectedExam(val)
    const firstPaper = metadata.papers
      .filter(p => p.exam_id === val)
      .sort((a, b) => a.name.localeCompare(b.name))[0]
    if (firstPaper) setSelectedPaper(firstPaper.id)
  }, [metadata.papers])

  return {
    authLoading,
    isInitialLoad,
    isAppsc,
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
