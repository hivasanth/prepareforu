import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useStableFetch } from '../../../hooks/useStableFetch'
import { usePageError } from '../../../hooks/usePageError'
import { getCachedTeacherExams, fetchTeacherExams } from '../../../services/teacherExamService'
import { createAttempt, fetchTeacherExamQuestions } from '../../../services/examService'
import type { TeacherExamStatus, TeacherExamWithAttempt, Question, AttemptSource } from '../../../types/exam.types'

interface TeacherExamNavigationState {
  attemptId: string
  questions: Question[]
  examTitle: string
  paperName: string
  durationMinutes: number
  marksPerQuestion: number
  negativeMarkValue: number
  source: AttemptSource
}

function getTeacherId(user: { sub_admin_id?: string | null; educator_id?: string | null } | null): string | null {
  return user?.sub_admin_id || user?.educator_id || null
}

export function useTeacherExams() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { state: errorState, error: pageError, captureNetworkError, captureServerError, retry: retryError, reset: resetError } = usePageError()

  const [activeTab, setActiveTab] = useState<TeacherExamStatus>('live')
  const [isStarting, setIsStarting] = useState(false)
  const [selectedLeaderboardExam, setSelectedLeaderboardExam] = useState<TeacherExamWithAttempt | null>(null)
  const [now, setNow] = useState(new Date())

  const monthsList = useMemo(() => {
    const list: { id: string; name: string }[] = []
    const current = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(current.getFullYear(), current.getMonth() - i, 1)
      const monthName = d.toLocaleString('default', { month: 'long' })
      const year = d.getFullYear()
      const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      list.push({ id, name: `${monthName} ${year}` })
    }
    return list
  }, [])

  const [selectedMonth, setSelectedMonth] = useState<string>(() => monthsList[0].id)

  const teacherId = useMemo(() => getTeacherId(user), [user])
  const userId = user?.id ?? ''
  const cacheKey = useMemo(() => {
    if (!teacherId || !userId) return ''
    return `teacher_exams_${teacherId}_${userId}`
  }, [teacherId, userId])

  const [exams, setExams] = useState<TeacherExamWithAttempt[]>(() => {
    if (!cacheKey) return []
    return getCachedTeacherExams({ user }, teacherId || '') || []
  })
  const [loading, setLoading] = useState(() => {
    if (!cacheKey) return false
    return !getCachedTeacherExams({ user }, teacherId || '')
  })

  const { nextId, isStale } = useStableFetch()

  const loadExams = useCallback(async (force = false) => {
    if (!teacherId) return
    const id = nextId()
    const cached = getCachedTeacherExams({ user }, teacherId)
    if (!cached) setLoading(true)
    resetError()
    try {
      const data = await fetchTeacherExams({ user }, teacherId, force)
      if (isStale(id)) return
      setExams(data)
    } catch (err: unknown) {
      if (isStale(id)) return
      captureNetworkError(err, { retryFn: () => loadExams(force) })
    } finally {
      if (!isStale(id)) setLoading(false)
    }
  }, [teacherId, user, cacheKey])

  useEffect(() => {
    if (teacherId) loadExams(true)
  }, [teacherId, activeTab, loadExams])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(timer)
  }, [])

  const [isPageVisible, setIsPageVisible] = useState(true)
  useEffect(() => {
    const handleVisibility = () => setIsPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    if (!teacherId || activeTab === 'ended' || !isPageVisible) return
    const refreshTimer = setInterval(() => loadExams(true), 30000)
    return () => clearInterval(refreshTimer)
  }, [teacherId, activeTab, isPageVisible, loadExams])

  const filteredExams = useMemo(() => exams.filter(e => {
    const start = new Date(e.start_time)
    const end = new Date(e.end_time)
    if (activeTab === 'live') return now >= start && now <= end
    if (activeTab === 'upcoming') return now < start
    if (activeTab === 'ended') {
      if (!(now > end)) return false
      const examMonthVal = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`
      return examMonthVal === selectedMonth
    }
    return true
  }), [exams, activeTab, selectedMonth, now])

  const handleStartTeacherExam = useCallback(async (exam: TeacherExamWithAttempt) => {
    if (!user || isStarting) return
    const existingAttempt = exam.attempts?.[0]
    if (existingAttempt?.status === 'completed') {
      navigate(`/review/${existingAttempt.id}`, {
        state: { source: 'teacher_exam', examTitle: exam.title }
      })
      return
    }
    setIsStarting(true)
    try {
      const questions = await fetchTeacherExamQuestions(exam.id)
      const { attemptId } = await createAttempt({
        userId: user.id,
        teacherExamId: exam.id,
        source: 'teacher_exam',
        totalMarks: exam.total_marks,
        questionsSnapshot: questions
      })
      navigate(`/active-exam/teacher-${exam.id}`, {
        state: {
          attemptId,
          questions,
          examTitle: exam.title,
          paperName: 'Assigned Exam',
          durationMinutes: exam.duration_minutes ?? Math.floor(
            (new Date(exam.end_time).getTime() - new Date(exam.start_time).getTime()) / 60000
          ),
          marksPerQuestion: exam.marks_per_question,
          negativeMarkValue: exam.negative_mark_value,
          source: 'teacher_exam',
        } satisfies TeacherExamNavigationState
      })
    } catch (err: unknown) {
      captureServerError(err, { retryFn: () => handleStartTeacherExam(exam) })
      setIsStarting(false)
    }
  }, [user, isStarting, navigate])

  return {
    user,
    authLoading,
    activeTab, setActiveTab,
    filteredExams,
    loading,
    errorState, pageError, retryError,
    now,
    selectedMonth, setSelectedMonth,
    monthsList,
    selectedLeaderboardExam, setSelectedLeaderboardExam,
    isStarting,
    handleStartTeacherExam,
  }
}
