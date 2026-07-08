import { useState, useEffect, useRef, useCallback } from 'react'
import { dashboardService } from '../services/dashboardService'
import type { DashboardStats } from '../services/dashboardService'
import type { AttemptWithRelations } from '../components/common/AttemptCardBase'

export function useDashboardData(userId?: string, examSelection?: string) {
  const [stats, setStats] = useState<DashboardStats | null>(() => {
    if (userId) return dashboardService.getCachedStats(userId)
    return null
  })
  const [recentActivity, setRecentActivity] = useState<AttemptWithRelations[]>(() => {
    if (userId) return dashboardService.getCachedRecentAttempts(userId, examSelection) || []
    return []
  })
  const [loadingStats, setLoadingStats] = useState(() => !stats)
  const [loadingActivity, setLoadingActivity] = useState(() => recentActivity.length === 0)
  const [errorStats, setErrorStats] = useState<string | null>(null)
  const [errorActivity, setErrorActivity] = useState<string | null>(null)
  const requestId = useRef(0)
  const mountedRef = useRef(true)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  const fetchData = useCallback(async (force = false) => {
    if (!userId) return
    const id = ++requestId.current
    setLoadingStats(true)
    setLoadingActivity(true)
    setErrorStats(null)
    setErrorActivity(null)

    const [statsRes, attemptsRes] = await Promise.allSettled([
      dashboardService.fetchDashboardStats(userId, force),
      dashboardService.fetchRecentAttempts(userId, examSelection, force)
    ])

    if (id !== requestId.current || !mountedRef.current) return

    if (statsRes.status === 'fulfilled') {
      const res = statsRes.value
      if (res.success && res.data) setStats(res.data)
      else setErrorStats(res.error?.message || 'Failed to load dashboard stats.')
    } else {
      setErrorStats('Network error loading dashboard stats.')
    }

    if (attemptsRes.status === 'fulfilled') {
      const res = attemptsRes.value
      if (res.success && res.data) setRecentActivity(res.data as AttemptWithRelations[])
      else setErrorActivity(res.error?.message || 'Failed to load recent activity.')
    } else {
      setErrorActivity('Network error loading recent activity.')
    }

    setLoadingStats(false)
    setLoadingActivity(false)
  }, [userId, examSelection])

  useEffect(() => { fetchData() }, [fetchData])

  return { stats, recentActivity, loadingStats, loadingActivity, errorStats, errorActivity, fetchData }
}
