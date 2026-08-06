import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
import {
  type TeacherExamOption,
  type QuestionStat, type EvalData,
  toAttemptRows, toQuestionRows, toAnswerRows,
} from './types'

export function useExamData() {
  const { user } = useAuth()
  const { mountedRef } = useStableFetch()
  const currentExamRef = useRef<string | null>(null)

  const [exams, setExams] = useState<TeacherExamOption[]>([])
  const [examsLoading, setExamsLoading] = useState(true)
  const [examsError, setExamsError] = useState<string | null>(null)

  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [selectedExam, setSelectedExam] = useState<TeacherExamOption | null>(null)
  const [evalData, setEvalData] = useState<EvalData | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [monthFilter, setMonthFilter] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 7)
  })

  const fetchExams = useCallback(async () => {
    if (!user?.id) return
    setExamsLoading(true)
    setExamsError(null)
    try {
      const profile = await fetchSubAdminIdByUserId({ user }, user.id)
      if (!mountedRef.current) return
      if (!profile) throw new Error('Could not identify your Sub-Admin profile.')
      const data = await fetchTeacherExamsWithFullFields({ user }, profile.id)
      if (!mountedRef.current) return
      setExams(data ?? [])
    } catch (err: unknown) {
      if (!mountedRef.current) return
      setExamsError(err instanceof Error ? err.message : 'Failed to load exams.')
    } finally {
      if (mountedRef.current) setExamsLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchExams() }, [fetchExams])

  const monthOptions = useMemo(() => Array.from({ length: 3 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return {
      id: d.toISOString().slice(0, 7),
      name: d.toLocaleString('default', { month: 'long', year: 'numeric' })
    }
  }), [])

  const filteredExams = useMemo(() => exams.filter(exam => {
    const term = searchTerm.trim().toUpperCase()
    const matchesSearch = (exam.title || '').toUpperCase().includes(term)
    if (term) return matchesSearch
    const matchesMonth = exam.created_at && exam.created_at.startsWith(monthFilter)
    return matchesMonth
  }), [exams, searchTerm, monthFilter])

  const fetchEvalData = useCallback(async (examId: string) => {
    currentExamRef.current = examId
    setDataLoading(true)
    setDataError(null)
    setEvalData(null)
    try {
      const attempts = await fetchAttemptsWithUsersByTeacherExam({ user }, examId)
      const questions = await fetchTeacherExamQuestions({ user }, examId)

      const attemptList = toAttemptRows(attempts)
      const questionList = toQuestionRows(questions)

      let questionStats: QuestionStat[] = []
      if (attemptList.length > 0 && questionList.length > 0) {
        const attemptIds = attemptList.map(a => a.id)
        const answers = await fetchAttemptAnswersByAttemptIds({ user }, attemptIds)
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
      setEvalData({ attempts: attemptList, questionStats })
    } catch (err: unknown) {
      if (currentExamRef.current !== examId || !mountedRef.current) return
      setDataError(err instanceof Error ? err.message : 'Failed to load evaluation data.')
    } finally {
      if (currentExamRef.current === examId && mountedRef.current) {
        setDataLoading(false)
      }
    }
  }, [])

  const handleExamChange = useCallback((examId: string) => {
    setSelectedExamId(examId)
    const exam = exams.find(e => e.id === examId) ?? null
    setSelectedExam(exam)
    if (examId) fetchEvalData(examId)
    else { setEvalData(null) }
  }, [exams, fetchEvalData])

  const summaryStats = useMemo(() => {
    if (!evalData?.attempts.length) return null
    return computeSummaryStats(evalData.attempts.map(a => ({ ...a, duration_seconds: a.duration_seconds ?? undefined })))
  }, [evalData?.attempts])

  const scoreDistribution = useMemo(() => {
    if (!evalData?.attempts.length || !selectedExam) return []
    return computeScoreDistribution(evalData.attempts, Number(selectedExam.total_marks))
  }, [evalData?.attempts, selectedExam])

  const topPerformers = useMemo(() => evalData?.attempts.slice(0, 5) ?? [], [evalData?.attempts])
  const bottomPerformers = useMemo(() => [...(evalData?.attempts ?? [])].reverse().slice(0, 5), [evalData?.attempts])

  return {
    user,
    exams, examsLoading, examsError,
    selectedExamId, selectedExam, evalData, dataLoading, dataError,
    searchTerm, setSearchTerm,
    monthFilter, setMonthFilter,
    monthOptions, filteredExams,
    fetchExams, fetchEvalData, handleExamChange,
    summaryStats, scoreDistribution,
    topPerformers, bottomPerformers,
  }
}
