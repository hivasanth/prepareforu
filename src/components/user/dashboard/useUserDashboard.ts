import { useState, useEffect, useCallback, useRef } from 'react'
import { dashboardService } from '../../../services/dashboardService'
import type { DashboardStats } from '../../../services/dashboardService'
import type { PerformanceAttemptSummary } from '../../../types/exam.types'
import type { PageError } from '../../../types/error.types'
import { categoryFromCode } from '../../../utils/errorClassification'

export type DashboardError = Pick<PageError, 'category' | 'message'>

export function useUserDashboard(userId?: string, examSelection?: string) {
  const [stats, setStats] = useState<DashboardStats | null>(() => {
    if (userId) return dashboardService.getCachedStats(userId)
    return null
  })
  const [recentActivity, setRecentActivity] = useState<PerformanceAttemptSummary[]>(() => {
    if (userId) return dashboardService.getCachedRecentAttempts(userId, examSelection) || []
    return []
  })
  const [loadingStats, setLoadingStats] = useState(() => !stats)
  const [loadingActivity, setLoadingActivity] = useState(() => recentActivity.length === 0)
  const [errorStats, setErrorStats] = useState<DashboardError | null>(null)
  const [errorActivity, setErrorActivity] = useState<DashboardError | null>(null)
  // DASH-LOW-1: non-destructive refresh-failure notice. Set only when a
  // background (non-force) refresh fails while last-known-good data is already
  // on screen, so the user sees a clear "couldn't refresh" signal instead of a
  // silent (or data-destroying) failure. Cleared on success and on retry.
  const [refreshFailedStats, setRefreshFailedStats] = useState(false)
  const [refreshFailedActivity, setRefreshFailedActivity] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const requestId = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchData = useCallback(async (force = false) => {
    if (!userId) return
    const id = ++requestId.current

    // Skip the loading flash when cached data is already on screen (warm cache).
    // On a force-retry keep the current view mounted (error state stays visible
    // so the RetryButton loading state is observed) until the request settles.
    const hasCachedStats = dashboardService.getCachedStats(userId) !== null
    const hasCachedRecent = (dashboardService.getCachedRecentAttempts(userId, examSelection) || []).length > 0
    // Capture warm-cache availability for the refresh-failure notice: a failure
    // is "non-destructive" only when data was already on screen, so the notice
    // surfaces while preserving last-known-good data.
    const hadWarmStats = hasCachedStats
    const hadWarmRecent = hasCachedRecent
    if (!force) {
      if (!hasCachedStats) setLoadingStats(true)
      if (!hasCachedRecent) setLoadingActivity(true)
      setErrorStats(null)
      setErrorActivity(null)
      setRefreshFailedStats(false)
      setRefreshFailedActivity(false)
    } else {
      // Clear the non-destructive notice immediately when the user clicks Retry;
      // the fresh fetch will re-surface it on failure or keep it cleared on success.
      setRefreshFailedStats(false)
      setRefreshFailedActivity(false)
    }

    // Services always resolve ServiceResult (they catch internally), so
    // Promise.allSettled rejection branches are unreachable (DASH-6).
    const [statsRes, attemptsRes] = await Promise.allSettled([
      dashboardService.fetchDashboardStats(userId, force),
      dashboardService.fetchRecentAttempts(userId, examSelection, force)
    ])

    if (id !== requestId.current || !mountedRef.current) return

    const statsValue = statsRes.status === 'fulfilled' ? statsRes.value : null
    if (statsValue && statsValue.success && statsValue.data) {
      setStats(statsValue.data)
      setErrorStats(null)
      setRefreshFailedStats(false)
    } else if (statsValue) {
      // A background refresh failure with warm data on screen must not blank
      // the panel: surface the non-destructive notice instead of replacing data.
      if (hadWarmStats) {
        setRefreshFailedStats(true)
      } else {
        setErrorStats({
          category: statsValue.error ? categoryFromCode(statsValue.error.code) : 'network',
          message: statsValue.error?.message || 'Failed to load dashboard stats.',
        })
      }
    }

    const attemptsValue = attemptsRes.status === 'fulfilled' ? attemptsRes.value : null
    if (attemptsValue && attemptsValue.success && attemptsValue.data) {
      setRecentActivity(attemptsValue.data)
      setErrorActivity(null)
      setRefreshFailedActivity(false)
    } else if (attemptsValue) {
      if (hadWarmRecent) {
        setRefreshFailedActivity(true)
      } else {
        setErrorActivity({
          category: attemptsValue.error ? categoryFromCode(attemptsValue.error.code) : 'network',
          message: attemptsValue.error?.message || 'Failed to load recent activity.',
        })
      }
    }

    setLoadingStats(false)
    setLoadingActivity(false)
    setIsRetrying(false)
  }, [userId, examSelection])

  const handleRetry = useCallback(() => {
    setIsRetrying(true)
    fetchData(true)
  }, [fetchData])

  useEffect(() => { fetchData() }, [fetchData])

  return {
    stats,
    recentActivity,
    loadingStats,
    loadingActivity,
    errorStats,
    errorActivity,
    refreshFailedStats,
    refreshFailedActivity,
    isRetrying,
    handleRetry,
  }
}
