import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useStableFetch } from '../../../hooks/useStableFetch'
import {
  fetchTeacherExamQuestions,
  fetchTeacherExamAttempts,
} from '../../../services/teacherExamService'
import {
  type ExamDetailData,
  toExamDetailQuestions, toExamDetailLeaderboard,
} from './types'

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useExamDetail(examId: string) {
  const { user } = useAuth()
  const { mountedRef } = useStableFetch()
  const fetchIdRef = useRef(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ExamDetailData>({ questions: [], leaderboard: [] })

  const fetchDetail = useCallback(async () => {
    const id = ++fetchIdRef.current
    setLoading(true)
    setError(null)
    try {
      const [questions, leaderboard] = await Promise.all([
        fetchTeacherExamQuestions({ user }, examId),
        fetchTeacherExamAttempts({ user }, examId),
      ])
      if (id !== fetchIdRef.current || !mountedRef.current) return
      setData({
        questions: toExamDetailQuestions(questions),
        leaderboard: toExamDetailLeaderboard(leaderboard),
      })
    } catch {
      if (id !== fetchIdRef.current || !mountedRef.current) return
      setError('Failed to load exam details. Please try again.')
    } finally {
      if (id === fetchIdRef.current && mountedRef.current) setLoading(false)
    }
  }, [examId, user])

  useEffect(() => {
    if (examId) fetchDetail()
  }, [examId, fetchDetail])

  return { data, loading, error, refetch: fetchDetail }
}
