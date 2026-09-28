import { useState, useEffect, useCallback } from 'react'
import { fetchTeacherExams, fetchDashboardAggregates } from '../services/teacherExamService'
import { findSubAdminProfileSimple, countUsersByEducatorId } from '../services/userService'
import { useStableFetch } from './useStableFetch'
import { normalizeError } from '../utils/errorClassification'
import type { PageError } from '../types/error.types'
import type { UserProfile } from '../types/auth.types'
import type { SubAdminDashboardData } from '../components/sub-admin/dashboard/types'

// ─── Re-export types for backward compatibility ─────────────────────────────
export type { SubAdminDashboardStats, SubAdminRecentExams, SubAdminDashboardData } from '../components/sub-admin/dashboard/types'

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useSubAdminDashboard(user: UserProfile | null) {
  const [data, setData] = useState<SubAdminDashboardData>({
    stats: null,
    recentExams: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<PageError | null>(null)

  const { mountedRef, nextId, isStale } = useStableFetch()

  const fetchData = useCallback(async (force = false) => {
    if (!user?.id) return

    const id = nextId()
    setLoading(true)
    setError(null)

    try {
      // 1 & 2. Parallel — sub-admin identity + cohort size.
      // Both services propagate technical failures (no swallowed defaults):
      // a thrown error lands in the canonical ERROR branch below; only a
      // successful query with no matching profile row yields `null`.
      const [profileData, studentCount] = await Promise.all([
        findSubAdminProfileSimple(user.id),
        countUsersByEducatorId(user.id),
      ])

      if (!profileData) {
        if (!mountedRef.current || isStale(id)) return
        // Genuine no-row result — setup-required business state, not an error.
        setError(normalizeError(new Error('Educator profile not found'), {
          category: 'business',
          severity: 'medium',
          fallbackMessage: 'Educator profile not found. Please contact admin.',
        }))
        return
      }

      const saId = profileData.id

      // 3 & 4. Parallel — capped exams list (display only) + exact backend
      // aggregates. Every stat (totalExams, activeExams, totalAttempts) is an
      // exact server COUNT over the FULL authorized cohort, NEVER derived from
      // the 500-row exams list. The list only feeds the "Recent" section.
      const [exams, aggregates] = await Promise.all([
        fetchTeacherExams(
          { user, requestId: `dash_exams_${Date.now()}` },
          saId,
          force,
        ),
        fetchDashboardAggregates(
          { user, requestId: `dash_aggregates_${Date.now()}` },
          saId,
        ),
      ])

      if (isStale(id)) return

      // 5. Transform
      setData({
        stats: {
          totalExams: aggregates.totalExams,
          activeExams: aggregates.activeExams,
          totalStudents: studentCount,
          totalAttempts: aggregates.totalAttempts,
        },
        recentExams: exams.slice(0, 4).map(e => ({
          id: e.id,
          title: e.title,
          status: e.status,
          total_questions: e.total_questions,
          total_marks: e.total_marks,
          duration_minutes: e.duration_minutes,
          created_at: e.created_at,
        })),
      })
    } catch (err: unknown) {
      if (!mountedRef.current || isStale(id)) return
      setError(normalizeError(err, { severity: 'high' }))
    } finally {
      // A superseded request must never clear the loading flag owned by the
      // newest request (rapid-refresh race).
      if (mountedRef.current && !isStale(id)) setLoading(false)
    }
  }, [user, nextId, mountedRef, isStale])

  useEffect(() => { fetchData() }, [fetchData])

  return {
    stats: data.stats,
    recentExams: data.recentExams,
    loading,
    error,
    refresh: () => fetchData(true),
  }
}
