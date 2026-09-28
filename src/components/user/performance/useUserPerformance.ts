import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useStableFetch } from '../../../hooks/useStableFetch'
import { usePageError } from '../../../hooks/usePageError'
import {
  fetchPerformanceAttempts,
  fetchPerformanceSubjectStats,
  fetchPerformanceMetadata,
  clearPerformanceCache,
  getCachedAttempts,
  getCachedMetadata,
  type PerformanceMetadata,
  type SubjectStat,
} from '../../../services/performanceService'
import { perfAttemptsKey, perfMetadataKey } from '../../../utils/cacheKeys'
import type { PerformanceAttemptSummary } from '../../../types/exam.types'
import { getAllowedExamIds } from '../../../utils/examUtils'
import type { TrendDataPoint, DistributionSlice, TimeRange } from './types'

export function useUserPerformance() {
  const { user, loading: authLoading } = useAuth()
  const isAppsc = user?.exam_selection === 'APPSC_GROUPS' || user?.exam_selection === 'APPSC'
  const needsSelection = !authLoading && !!user && !user.exam_selection

  const attemptsCacheKey = useMemo(() => {
    return user?.id ? perfAttemptsKey(user.id) : ''
  }, [user?.id])

  const metaCacheKey = useMemo(() => {
    return user?.exam_selection ? perfMetadataKey(user.exam_selection) : ''
  }, [user?.exam_selection])

  const [allAttempts, setAllAttempts] = useState<PerformanceAttemptSummary[]>(() => {
    if (!attemptsCacheKey || !user) return []
    return getCachedAttempts(user.id) || []
  })
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([])
  /* P-4 — section-level loading/error for the debounced async subject-stats
     fetch, so the card never renders stale data while filters are applied. */
  const [subjectStatsLoading, setSubjectStatsLoading] = useState(false)
  const [subjectStatsError, setSubjectStatsError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<PerformanceMetadata>(() => {
    if (!metaCacheKey || !user) return { exams: [], papers: [], subjects: [] }
    return getCachedMetadata(user.exam_selection ?? '') || { exams: [], papers: [], subjects: [] }
  })

  const [loading, setLoading] = useState(() => {
    if (authLoading) return true
    if (!user) return true
    if (!user.exam_selection) return false
    if (!attemptsCacheKey) return true
    return !(getCachedAttempts(user.id) ?? []).length
  })
  const { mountedRef, nextId, isStale } = useStableFetch()
  const { state: errorState, error: pageError, captureNetworkError, retry: retryError, reset: resetError } = usePageError()

  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [selectedPaperId, setSelectedPaperId] = useState<string>('')
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('all')

  const handleExamChange = useCallback((val: string) => {
    setSelectedExamId(val)
    const firstPaper = metadata.papers
      .filter(p => p.exam_id === val)
      .sort((a, b) => a.name.localeCompare(b.name))[0]
    if (firstPaper) setSelectedPaperId(firstPaper.id)
  }, [metadata.papers])

  const loadInitialData = useCallback(async (force = false): Promise<boolean> => {
    if (authLoading) return false
    if (!user?.id) return false
    if (!user?.exam_selection) {
      setLoading(false)
      return true
    }
    const id = nextId()
    const cachedAttempts = getCachedAttempts(user?.id || '') ?? []

    if (force) {
      clearPerformanceCache(user.id)
      if (!cachedAttempts.length) setLoading(true)
    } else if (!cachedAttempts.length) {
      setLoading(true)
    }

    resetError()
    try {
      const allowedIds = getAllowedExamIds(user.exam_selection)
      const [rawAttempts, meta] = await Promise.all([
        fetchPerformanceAttempts(user.id, force),
        fetchPerformanceMetadata(user.exam_selection, false)
      ])

      if (isStale(id)) return false

      const attempts = (rawAttempts || []).filter(a => a.exam_id && allowedIds.includes(a.exam_id))
      setAllAttempts(attempts)
      const m = meta || { exams: [], papers: [], subjects: [] }
      setMetadata(m)
      return true

    } catch (err: unknown) {
      if (isStale(id)) return false
      console.error('[Performance-Fetch-Error]', err instanceof Error ? err.message : 'The analytics sync was interrupted. Please check your connection and try again.')
      captureNetworkError(err, { retryFn: () => loadInitialData(true) })
      return false
    } finally {
      if (!isStale(id)) setLoading(false)
    }
  }, [authLoading, user?.id, user?.exam_selection, attemptsCacheKey])

  useEffect(() => {
    loadInitialData(true)
  }, [loadInitialData])

  useEffect(() => {
    if (!metadata.exams.length || selectedExamId) return
    const sortedExams = [...metadata.exams].sort((a, b) => a.name.localeCompare(b.name))
    const firstExamId = sortedExams[0].id
    setSelectedExamId(firstExamId)

    if (isAppsc) {
      const firstPaper = metadata.papers
        .filter(p => p.exam_id === firstExamId)
        .sort((a, b) => a.name.localeCompare(b.name))[0]
      if (firstPaper) setSelectedPaperId(firstPaper.id)
    }
  }, [metadata.exams, metadata.papers, selectedExamId, isAppsc])

  const filteredAttempts = useMemo(() => {
    let filtered = [...allAttempts]
    if (selectedExamId) filtered = filtered.filter(a => a.exam_id === selectedExamId)
    if (selectedPaperId) filtered = filtered.filter(a => a.paper_id === selectedPaperId)
    if (selectedTimeRange !== 'all') {
      const days = selectedTimeRange === '7d' ? 7 : 30
      const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(a => a.submitted_at && new Date(a.submitted_at) >= threshold)
    }
    return filtered
  }, [allAttempts, selectedExamId, selectedPaperId, selectedTimeRange])

  useEffect(() => {
    let isCancelled = false
    const from =
      selectedTimeRange === 'all'
        ? null
        : new Date(Date.now() - (selectedTimeRange === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString()

    const loadSubjectStats = async () => {
      if (!user?.id) return
      try {
        const stats = await fetchPerformanceSubjectStats(user.id, {
          examId: selectedExamId || null,
          paperId: selectedPaperId || null,
          from,
        })
        if (!isCancelled && mountedRef.current) {
          setSubjectStats(stats)
          setSubjectStatsError(null)
        }
      } catch (err) {
        console.error('[SubjectStats-Fetch-Error]', err instanceof Error ? err.message : err)
        if (!isCancelled && mountedRef.current) {
          setSubjectStatsError(
            err instanceof Error ? err.message : 'Could not load subject insights. Please try again.'
          )
        }
      } finally {
        if (!isCancelled && mountedRef.current) setSubjectStatsLoading(false)
      }
    }
    setSubjectStatsLoading(true)
    const timer = setTimeout(loadSubjectStats, 300)
    return () => { isCancelled = true; clearTimeout(timer) }
  }, [user?.id, selectedExamId, selectedPaperId, selectedTimeRange, mountedRef])

  const metrics = useMemo(() => {
    const total = filteredAttempts.length
    if (total === 0) return null
    const scores = filteredAttempts.map(a => Number(a.score) || 0)
    const accuracies = filteredAttempts.map(a => Number(a.accuracy) || 0)
    const avgScore = scores.reduce((acc, curr) => acc + curr, 0) / total
    const avgAccuracy = accuracies.reduce((acc, curr) => acc + curr, 0) / total
    const bestScore = Math.max(...scores)
    return {
      total,
      avgScore: Math.round(avgScore * 10) / 10,
      avgAccuracy: Math.round(avgAccuracy),
      bestScore
    }
  }, [filteredAttempts])

  const scopeFilteredAttempts = useMemo(() => {
    return allAttempts.filter(a =>
      (!selectedExamId || a.exam_id === selectedExamId) &&
      (!selectedPaperId || a.paper_id === selectedPaperId)
    )
  }, [allAttempts, selectedExamId, selectedPaperId])

  const filterEmptyReason = useMemo<'scope' | 'time' | null>(() => {
    if (filteredAttempts.length > 0) return null
    if (scopeFilteredAttempts.length > 0) return 'time'
    if (allAttempts.length > 0) return 'scope'
    return null
  }, [filteredAttempts.length, scopeFilteredAttempts.length, allAttempts.length])

  const trendData = useMemo<TrendDataPoint[]>(() => {
    return filteredAttempts
      .filter(a => a.submitted_at)
      .map(a => {
        const d = new Date(a.submitted_at!)
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          sortKey: d.getTime(),
          accuracy: Number(a.accuracy) || 0,
          score: Number(a.score) || 0,
        }
      })
      .sort((a, b) => a.sortKey - b.sortKey)
  }, [filteredAttempts])

  const distribution = useMemo<DistributionSlice[]>(() => {
    const correct = filteredAttempts.reduce((acc, curr) => acc + (Number(curr.correct_count) || 0), 0)
    const wrong = filteredAttempts.reduce((acc, curr) => acc + (Number(curr.wrong_count) || 0), 0)
    const skipped = filteredAttempts.reduce((acc, curr) => acc + (Number(curr.skipped_count) || 0), 0)
    return [
      { name: 'Correct', value: correct, color: '#22C55E' },
      { name: 'Wrong', value: wrong, color: '#EF4444' },
      { name: 'Skipped', value: skipped, color: '#64748b' }
    ].filter(d => d.value > 0)
  }, [filteredAttempts])

  const examOptions = useMemo(() => {
    return metadata.exams
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(e => ({
        ...e,
        displayName: e.name.replace(/APPSC[\s_]*/gi, '').replace(/_/g, ' ')
      }))
  }, [metadata.exams])

  const paperOptions = useMemo(() => {
    const filtered = metadata.papers.filter(p => p.exam_id === selectedExamId)
    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [metadata.papers, selectedExamId])

  return {
    loading,
    needsSelection,
    errorState,
    pageError,
    retryError,
    isAppsc,
    allAttempts,
    filteredAttempts,
    filterEmptyReason,
    metrics,
    subjectStats,
    subjectStatsLoading,
    subjectStatsError,
    trendData,
    distribution,
    selectedExamId,
    handleExamChange,
    selectedPaperId,
    setSelectedPaperId,
    selectedTimeRange,
    setSelectedTimeRange,
    examOptions,
    paperOptions,
  }
}
