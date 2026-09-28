import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useStableFetch } from '../../../hooks/useStableFetch'
import {
  fetchSubAdminIdByUserId,
  fetchTeacherExamsWithFullFields,
  fetchTeacherExamQuestions,
  fetchAttemptsWithUsersByTeacherExam,
  fetchAttemptAnswersByAttemptIds,
} from '../../../services/teacherExamService'
import { computeSummaryStats, computeScoreDistribution } from '../../../utils/scoreUtils'
import { classifyExamWindow, type ExamViewFilter } from '../../../utils/examWindow'
import { resolveExamSection } from './sections'
import {
  type TeacherExamOption,
  type QuestionStat, type EvalData,
  toAttemptRows, toQuestionRows, toAnswerRows, toExamDetailQuestions,
} from './types'

const EXAM_VIEW_FILTERS: ExamViewFilter[] = ['live', 'upcoming', 'published']

function resolveExamViewFilter(value: string | null): ExamViewFilter {
  return EXAM_VIEW_FILTERS.includes(value as ExamViewFilter) ? (value as ExamViewFilter) : 'live'
}

export function useExamData() {
  const { user } = useAuth()
  const { mountedRef } = useStableFetch()
  const currentExamRef = useRef<string | null>(null)
  const fetchedExamRef = useRef<string | null>(null)
  const userRef = useRef(user)
  userRef.current = user

  // ── URL-owned selection (F9) ───────────────────────────────────────────────
  // `?exam=<id>` is the app-wide detail-selection convention (useAdminFilters,
  // useTopics, useAdminUsers). Browser Back returns list ↔ detail, Forward
  // restores, refresh preserves, and an unknown id safely falls back to list.
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedExamId = searchParams.get('exam') ?? ''
  const activeSection = resolveExamSection(searchParams.get('section'))
  const activeFilter = resolveExamViewFilter(searchParams.get('filter'))

  const [exams, setExams] = useState<TeacherExamOption[]>([])
  const [examsLoading, setExamsLoading] = useState(true)
  const [examsError, setExamsError] = useState<string | null>(null)

  const [selectedExam, setSelectedExam] = useState<TeacherExamOption | null>(null)
  const [evalData, setEvalData] = useState<EvalData | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [yearFilter, setYearFilter] = useState(() => new Date().getFullYear())
  const [monthFilter, setMonthFilter] = useState(() => new Date().getMonth() + 1)

  // LIVE/UPCOMING/PUBLISHED re-evaluates against the wall clock, so keep a
  // refreshed `now` (10 s) to transition tabs without a manual reload. A
  // visibility-gated 30 s re-sync keeps the authoritative list fresh — same
  // cadence as the student educator-exams page — without an aggressive poll.
  const [now, setNow] = useState(() => new Date())
  const [isPageVisible, setIsPageVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleVisibility = () => setIsPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const fetchExams = useCallback(async () => {
    const currentUser = userRef.current
    if (!currentUser?.id) return
    setExamsLoading(true)
    setExamsError(null)
    try {
      const profile = await fetchSubAdminIdByUserId({ user: currentUser }, currentUser.id)
      if (!mountedRef.current) return
      if (!profile) throw new Error('Could not identify your Sub-Admin profile.')
      const data = await fetchTeacherExamsWithFullFields({ user: currentUser }, profile.id)
      if (!mountedRef.current) return
      setExams(data ?? [])
    } catch (err: unknown) {
      if (!mountedRef.current) return
      setExamsError(err instanceof Error ? err.message : 'Failed to load exams.')
    } finally {
      if (mountedRef.current) setExamsLoading(false)
    }
  }, [mountedRef])

  useEffect(() => { fetchExams() }, [fetchExams])

  // Visibility-gated 30 s re-sync of the authoritative list (paused while the
  // tab is hidden; same cadence as the student educator-exams page).
  useEffect(() => {
    if (!isPageVisible) return
    const refreshTimer = setInterval(() => fetchExams(), 30000)
    return () => clearInterval(refreshTimer)
  }, [isPageVisible, fetchExams])

  const monthOptions = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    id: String(i + 1),
    name: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i],
  })), [])

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years = new Set<number>([currentYear])
    for (const exam of exams) {
      const y = exam.created_at ? new Date(exam.created_at).getFullYear() : Number.NaN
      if (Number.isFinite(y)) years.add(y)
    }
    return [...years].sort((a, b) => b - a).map(y => ({ id: String(y), name: String(y) }))
  }, [exams])

  const filteredExams = useMemo(() => exams.filter(exam => {
    const term = searchTerm.trim().toUpperCase()
    const matchesSearch = (exam.title || '').toUpperCase().includes(term)

    if (!exam.created_at) return false
    const d = new Date(exam.created_at)
    if (Number.isNaN(d.getTime())) return false
    const matchesPeriod = d.getFullYear() === yearFilter && d.getMonth() + 1 === monthFilter

    return matchesSearch && matchesPeriod
  }), [exams, searchTerm, yearFilter, monthFilter])

  // LIVE/UPCOMING/PUBLISHED are view filters over the SAME authorized list.
  // Classification is time-window based (start_time/end_time) and is purely a
  // presentation concern — authorization is already enforced by the service
  // (sub_admin_id + ensureRole + RLS), never weakened here.
  //
  // LIVE and UPCOMING always show EVERY exam in that window (no year/month/
  // search filtering — those dropdowns only apply to PUBLISHED). PUBLISHED
  // continues to respect the year/month/search filters as the page does today.
  const allExamsByWindow = useMemo(() => {
    const buckets: Record<ExamViewFilter, TeacherExamOption[]> = { live: [], upcoming: [], published: [] }
    for (const exam of exams) {
      buckets[classifyExamWindow(exam, now)].push(exam)
    }
    return buckets
  }, [exams, now])

  const filteredPublished = useMemo(
    () => filteredExams.filter(exam => classifyExamWindow(exam, now) === 'published'),
    [filteredExams, now],
  )

  const activeFilterResults = useMemo(
    () => (activeFilter === 'published' ? filteredPublished : allExamsByWindow[activeFilter]),
    [activeFilter, filteredPublished, allExamsByWindow],
  )

  const filterCounts = useMemo(() => ({
    live: allExamsByWindow.live.length,
    upcoming: allExamsByWindow.upcoming.length,
    published: filteredPublished.length,
  }), [allExamsByWindow, filteredPublished])

  const handleFilterChange = useCallback((filterId: ExamViewFilter) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      const examId = next.get('exam')
      if (examId) next.set('exam', examId)
      if (filterId === 'live') {
        next.delete('filter')
      } else {
        next.set('filter', filterId)
      }
      return next
    })
  }, [setSearchParams])

  const fetchEvalData = useCallback(async (examId: string) => {
    const currentUser = userRef.current
    currentExamRef.current = examId
    setDataLoading(true)
    setDataError(null)
    setEvalData(null)
    try {
      const attempts = await fetchAttemptsWithUsersByTeacherExam({ user: currentUser }, examId)
      const questions = await fetchTeacherExamQuestions({ user: currentUser }, examId)

      const attemptList = toAttemptRows(attempts)
      const questionList = toQuestionRows(questions)
      const examDetailQuestions = toExamDetailQuestions(questions)

      let questionStats: QuestionStat[] = []
      if (attemptList.length > 0 && questionList.length > 0) {
        const attemptIds = attemptList.map(a => a.id)
        const answers = await fetchAttemptAnswersByAttemptIds({ user: currentUser }, attemptIds)
        const answerList = toAnswerRows(answers)

        questionStats = questionList.map(q => {
          const qAnswers = answerList.filter(a => a.question_id === q.id)
          const total = qAnswers.length
          const correct = qAnswers.filter(a => a.is_correct === true).length
          const incorrect = qAnswers.filter(a => a.is_correct === false && a.selected_option !== null).length
          const skipped = total - correct - incorrect

          const optionCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 }
          for (const ans of qAnswers) {
            const opt = ans.selected_option?.toUpperCase()
            if (opt && optionCounts[opt] !== undefined) optionCounts[opt]++
          }

          const mostSelected = total > 0
            ? Object.entries(optionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
            : '—'

          return {
            question_id: q.id,
            question_text_en: q.question_text_en?.trim() || '',
            display_order: q.display_order,
            total,
            correct,
            incorrect,
            skipped,
            correctPct: total > 0 ? (correct / total) * 100 : 0,
            incorrectPct: total > 0 ? (incorrect / total) * 100 : 0,
            mostSelected,
            optionCounts,
          }
        })
      }

      if (currentExamRef.current !== examId || !mountedRef.current) return
      setEvalData({ attempts: attemptList, questionStats, questions: examDetailQuestions })
    } catch (err: unknown) {
      if (currentExamRef.current !== examId || !mountedRef.current) return
      setDataError(err instanceof Error ? err.message : 'Failed to load evaluation data.')
    } finally {
      if (currentExamRef.current === examId && mountedRef.current) {
        setDataLoading(false)
      }
    }
  }, [mountedRef])

  // Resolve the selected exam once the list is available; an unknown id in the
  // URL falls back to the list view instead of a broken detail view.
  useEffect(() => {
    if (!selectedExamId) {
      setSelectedExam(null)
      currentExamRef.current = null
      return
    }
    const exam = exams.find(e => e.id === selectedExamId) ?? null
    setSelectedExam(exam)
    if (!examsLoading && !exam && !examsError) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.delete('exam')
        next.delete('section')
        return next
      }, { replace: true })
    }
  }, [selectedExamId, exams, examsLoading, examsError, setSearchParams])

  // Fetch evaluation data when the URL-selected exam changes (once per id).
  useEffect(() => {
    if (!selectedExamId) return
    if (fetchedExamRef.current === selectedExamId) return
    if (!selectedExam) return // wait until resolved from the loaded list
    fetchedExamRef.current = selectedExamId
    fetchEvalData(selectedExamId)
  }, [selectedExamId, selectedExam, fetchEvalData])

  const handleExamChange = useCallback((examId: string) => {
    if (examId !== selectedExamId) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        if (examId) {
          next.set('exam', examId)
        } else {
          next.delete('exam')
        }
        next.delete('section')
        return next
      })
    }
  }, [selectedExamId, setSearchParams])

  const handleBack = useCallback(() => {
    if (selectedExamId) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.delete('exam')
        next.delete('section')
        return next
      })
    }
  }, [selectedExamId, setSearchParams])

  const handleSectionChange = useCallback((sectionId: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (selectedExamId) next.set('exam', selectedExamId)
      next.set('section', sectionId)
      return next
    })
  }, [selectedExamId, setSearchParams])

  const summaryStats = useMemo(() => {
    if (!evalData?.attempts.length) return null
    return computeSummaryStats(evalData.attempts.map(a => ({ ...a, duration_seconds: a.duration_seconds ?? undefined })))
  }, [evalData?.attempts])

  const scoreDistribution = useMemo(() => {
    if (!evalData?.attempts.length || !selectedExam) return []
    return computeScoreDistribution(evalData.attempts, Number(selectedExam.total_marks))
  }, [evalData?.attempts, selectedExam])

  return {
    user,
    exams, examsLoading, examsError,
    selectedExamId, selectedExam, activeSection, evalData, dataLoading, dataError,
    searchTerm, setSearchTerm,
    yearFilter, setYearFilter, yearOptions,
    monthFilter, setMonthFilter, monthOptions,
    filteredExams,
    activeFilter, handleFilterChange, filterCounts, activeFilterResults,
    now,
    fetchExams, fetchEvalData, handleExamChange, handleSectionChange, handleBack,
    summaryStats, scoreDistribution,
  }
}
