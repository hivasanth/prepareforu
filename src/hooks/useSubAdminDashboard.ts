import { useState, useEffect, useCallback } from 'react'
import { fetchTeacherExams, fetchAttemptsByTeacherExamIds } from '../services/teacherExamService'
import { findSubAdminProfileSimple, countUsersByEducatorId } from '../services/userService'
import { useStableFetch } from './useStableFetch'
import type { UserProfile } from '../types/auth.types'
import type { SubAdminDashboardData, SubAdminRecentAttempt } from '../components/sub-admin/dashboard/types'

// ─── Re-export types for backward compatibility ─────────────────────────────
export type { SubAdminDashboardStats, SubAdminRecentExams, SubAdminRecentAttempt, SubAdminDashboardData } from '../components/sub-admin/dashboard/types'

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useSubAdminDashboard(user: UserProfile | null) {
  const [data, setData] = useState<SubAdminDashboardData>({
    stats: null,
    recentExams: [],
    recentAttempts: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { mountedRef, nextId, isStale } = useStableFetch()

  const fetchData = useCallback(async () => {
    if (!user?.id) return

    const id = nextId()
    setLoading(true)
    setError(null)

    try {
      // 1 & 2. Parallel — get sub-admin identity + student count
      const [profileData, studentCount] = await Promise.all([
        findSubAdminProfileSimple(user.id),
        countUsersByEducatorId(user.id),
      ])

      if (!profileData) {
        if (!mountedRef.current) return
        setError('Educator profile not found. Please contact admin.')
        setLoading(false)
        return
      }

      const saId = profileData.id

      // 3. Fetch Exams
      const exams = await fetchTeacherExams(
        { user, requestId: `dash_exams_${Date.now()}` },
        saId
      )

      // 4. Fetch Attempts (guard against empty exam list)
      let attempts: SubAdminRecentAttempt[] = []
      const examIds = (exams || []).map(e => e.id)
      if (examIds.length > 0) {
        const rawAttempts = await fetchAttemptsByTeacherExamIds({ user }, examIds)
        attempts = rawAttempts.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          score: a.score as number,
          created_at: a.created_at as string,
          users: a.users as { full_name?: string } | undefined,
        }))
      }

      if (isStale(id)) return

      // 5. Transform
      const now = new Date()
      const activeCount = (exams || []).filter(e => {
        const start = new Date(e.start_time)
        const end = new Date(e.end_time)
        return e.status === 'published' && now >= start && now <= end
      }).length

      setData({
        stats: {
          totalExams: exams?.length || 0,
          activeExams: activeCount,
          totalStudents: studentCount || 0,
          totalAttempts: attempts?.length || 0,
        },
        recentExams: (exams || []).slice(0, 4).map(e => ({
          id: e.id,
          title: e.title,
          status: e.status,
          total_questions: e.total_questions,
          duration_minutes: e.duration_minutes ?? e.duration,
          created_at: e.created_at,
        })),
        recentAttempts: (attempts || []).slice(0, 10),
      })
    } catch (err: unknown) {
      if (!mountedRef.current) return
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data.'
      setError(message)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [user, nextId, mountedRef, isStale])

  useEffect(() => { fetchData() }, [fetchData])

  return {
    stats: data.stats,
    recentExams: data.recentExams,
    recentAttempts: data.recentAttempts,
    loading,
    error,
    refresh: fetchData,
  }
}
