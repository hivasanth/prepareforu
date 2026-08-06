import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useStableFetch } from '../../../hooks/useStableFetch'
import { useToast } from '../../../hooks/useToast'
import { usePageError } from '../../../hooks/usePageError'
import { getAllowedExamIds } from '../../../utils/examUtils'
import { batchCheckAvailability } from '../../../services/examService'
import {
  fetchExams,
  fetchPapers,
  fetchPaperDistribution,
  fetchPrepareQuestions
} from '../../../services/prepareWriteService'
import type { Question, ExamConfig, ExamPaper } from '../../../types/exam.types'

export type ViewState = 'SELECTION' | 'PREPARATION' | 'EXAM' | 'RESULT' | 'REVIEW'

export interface SessionState {
  view: ViewState
  questions: Question[]
  answers: Record<string, 'A' | 'B' | 'C' | 'D' | null>
  markedForReview: Record<string, boolean>
  selectedPaper: ExamPaper | null
  selectedExamId: string | null
  startTime: number | null
  endTime: number | null
  currentIndex: number
}

const SESSION_KEY = 'prepare_write_active_session'

function getInitialState(): SessionState {
  const saved = sessionStorage.getItem(SESSION_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      console.error('Failed to parse session state')
    }
  }
  return {
    view: 'SELECTION',
    questions: [],
    answers: {},
    markedForReview: {},
    selectedPaper: null,
    selectedExamId: null,
    startTime: null,
    endTime: null,
    currentIndex: 0
  }
}

export function usePrepareWrite() {
  const { user, loading: authLoading } = useAuth()
  const { toasts, showSuccess } = useToast()
  const { state: errorState, error: pageError, captureNetworkError, captureServerError, retry: retryError, reset: resetError } = usePageError()

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [exams, setExams] = useState<ExamConfig[]>([])
  const [papers, setPapers] = useState<ExamPaper[]>([])
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, { valid: boolean; message?: string }>>({})
  const [visibleCount, setVisibleCount] = useState(10)

  const { nextId, isStale } = useStableFetch()

  const [state, setState] = useState<SessionState>(getInitialState())

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
  }, [state])

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setState({
      view: 'SELECTION',
      questions: [],
      answers: {},
      markedForReview: {},
      selectedPaper: null,
      selectedExamId: null,
      startTime: null,
      endTime: null,
      currentIndex: 0
    })
  }, [])

  const loadInitial = useCallback(async (force = false) => {
    if (!user?.id || !user?.exam_selection) return
    const id = nextId()
    setLoading(true)
    resetError()

    try {
      const allowedIds = getAllowedExamIds(user.exam_selection)
      const examsData = await fetchExams(allowedIds, force)

      if (isStale(id)) return
      setExams(examsData)

      let targetExamId = state.selectedExamId
      if (targetExamId && !examsData.some(e => e.exam_id === targetExamId)) {
        targetExamId = null
      }

      if (!targetExamId && examsData.length > 0) {
        targetExamId = examsData[0].exam_id
      }

      if (targetExamId) {
        if (state.selectedExamId !== targetExamId) {
          setState(prev => ({ ...prev, selectedExamId: targetExamId }))
        }
        const papersData = await fetchPapers(targetExamId, allowedIds, force)
        if (isStale(id)) return
        setPapers(papersData)

        if (papersData.length > 0 && (!state.selectedPaper || state.selectedPaper.exam_id !== targetExamId)) {
          setState(prev => ({ ...prev, selectedPaper: papersData[0] }))
        }

        const results = await batchCheckAvailability(papersData.map(p => p.id))
        if (isStale(id)) return
        setAvailabilityMap(results)
      }
    } catch (err: unknown) {
      if (isStale(id)) return
      captureNetworkError(err, { retryFn: () => loadInitial(true) })
    } finally {
      if (!isStale(id)) setLoading(false)
    }
  }, [user?.id, user?.exam_selection])

  useEffect(() => {
    loadInitial()
  }, [user?.exam_selection, loadInitial])

  const handleExamChange = useCallback(async (examId: string) => {
    const id = nextId()
    setState(prev => ({ ...prev, selectedExamId: examId }))
    setLoading(true)
    try {
      const allowedIds = getAllowedExamIds(user?.exam_selection)
      const papersData = await fetchPapers(examId, allowedIds)
      if (isStale(id)) return
      setPapers(papersData)
      if (papersData.length > 0) {
        setState(prev => ({ ...prev, selectedPaper: papersData[0] }))
      }

      const results = await batchCheckAvailability(papersData.map(p => p.id))
      if (isStale(id)) return
      setAvailabilityMap(results)
    } catch (err: unknown) {
      captureNetworkError(err, { retryFn: () => handleExamChange(examId) })
    } finally {
      if (!isStale(id)) setLoading(false)
    }
  }, [user?.exam_selection])

  const startPreparation = useCallback(async () => {
    if (actionLoading || !state.selectedPaper) return
    setActionLoading(true)
    try {
      const { subjects } = await fetchPaperDistribution(state.selectedPaper.id)
      const questions = await fetchPrepareQuestions(state.selectedPaper.id, subjects, user?.id)

      setState(prev => ({
        ...prev,
        view: 'PREPARATION',
        questions,
        answers: {},
        markedForReview: {},
        currentIndex: 0,
        startTime: null,
        endTime: null
      }))
      setVisibleCount(10)
      showSuccess('Preparation mode loaded.')
    } catch (err: unknown) {
      captureServerError(err, { retryFn: startPreparation })
    } finally {
      setActionLoading(false)
    }
  }, [state.selectedPaper, user?.id])

  const startExam = useCallback(() => {
    setState(prev => ({
      ...prev,
      view: 'EXAM',
      startTime: Date.now(),
      currentIndex: 0
    }))
  }, [])

  const handleAnswer = useCallback((questionId: string, option: 'A' | 'B' | 'C' | 'D' | null) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: option }
    }))
  }, [])

  const handleToggleReview = useCallback((questionId: string) => {
    setState(prev => {
      const current = prev.markedForReview[questionId]
      return {
        ...prev,
        markedForReview: { ...prev.markedForReview, [questionId]: !current }
      }
    })
  }, [])

  const submitExam = useCallback(() => {
    setState(prev => ({
      ...prev,
      view: 'RESULT',
      endTime: Date.now()
    }))
    showSuccess('Exam submitted successfully.')
  }, [])

  const exitSession = useCallback(() => {
    if (state.view !== 'SELECTION' && state.view !== 'RESULT') {
      if (!window.confirm('Are you sure you want to exit? Your progress will be lost.')) return
    }
    clearSession()
  }, [state.view, clearSession])

  const handlePaperSelect = useCallback((paper: ExamPaper) => {
    setState(prev => ({ ...prev, selectedPaper: paper }))
  }, [])

  const handleJumpToQuestion = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentIndex: index }))
  }, [])

  const handlePrev = useCallback(() => {
    setState(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 }))
  }, [])

  const handleNextOrSubmit = useCallback(() => {
    setState(prev => {
      if (prev.currentIndex < prev.questions.length - 1) {
        return { ...prev, currentIndex: prev.currentIndex + 1 }
      }
      return {
        ...prev,
        view: 'RESULT',
        endTime: Date.now()
      }
    })
    showSuccess('Exam submitted successfully.')
  }, [])

  const goToReview = useCallback(() => {
    setState(prev => ({ ...prev, view: 'REVIEW', currentIndex: 0 }))
  }, [])

  const goToResult = useCallback(() => {
    setState(prev => ({ ...prev, view: 'RESULT' }))
  }, [])

  return {
    userExamSelection: user?.exam_selection || '',
    authLoading,
    loading,
    actionLoading,
    errorState,
    pageError,
    retryError,
    toasts,
    state,
    exams,
    papers,
    availabilityMap,
    visibleCount,
    setVisibleCount,
    handleExamChange,
    startPreparation,
    startExam,
    handleAnswer,
    handleToggleReview,
    submitExam,
    exitSession,
    handlePaperSelect,
    handleJumpToQuestion,
    handlePrev,
    handleNextOrSubmit,
    goToReview,
    goToResult,
    clearSession,
  }
}
