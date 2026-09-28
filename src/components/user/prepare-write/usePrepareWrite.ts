import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useStableFetch } from '../../../hooks/useStableFetch'
import { usePageError } from '../../../hooks/usePageError'
import { getAllowedExamIds } from '../../../utils/examUtils'
import { batchCheckAvailability } from '../../../services/examService'
import {
  fetchExams,
  fetchPapers,
  prepareExamQuestions,
  startPreparedExam
} from '../../../services/prepareWriteService'
import type { Question, ExamConfig, ExamPaper } from '../../../types/exam.types'
import type { PreparedExamQuestion } from '../../../lib/repositories/question.repository'

export type ViewState = 'SELECTION' | 'PREPARATION'

export interface SessionState {
  view: ViewState
  selectedPaper: ExamPaper | null
  selectedExamId: string | null
  userId: string | null
  preparationId: string | null
  examId: string | null
  expiresAt: string | null
  questionCount: number
  questions: Question[]
}

const SESSION_KEY = 'prepare_write_active_session'

function emptySession(): SessionState {
  return {
    view: 'SELECTION',
    selectedPaper: null,
    selectedExamId: null,
    userId: null,
    preparationId: null,
    examId: null,
    expiresAt: null,
    questionCount: 0,
    questions: []
  }
}

/**
 * Restores a persisted preparation ONLY when it is owned by the current
 * authenticated user and carries a server-issued preparation id. Legacy
 * sessions (no userId) and sessions belonging to a different account are
 * untrusted and discarded. Restoration is safe regardless: launching the exam
 * re-validates ownership + status + expiry server-side in start_prepared_exam.
 */
function getInitialState(userId: string | null): SessionState {
  const saved = sessionStorage.getItem(SESSION_KEY)
  if (!saved) return emptySession()

  try {
    const parsed = JSON.parse(saved) as Partial<SessionState>
    if (!parsed.userId || parsed.userId !== userId) {
      sessionStorage.removeItem(SESSION_KEY)
      return emptySession()
    }
    if (!parsed.preparationId || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      sessionStorage.removeItem(SESSION_KEY)
      return emptySession()
    }
    return {
      ...emptySession(),
      ...parsed,
      userId,
    }
  } catch {
    console.error('Failed to parse session state')
    sessionStorage.removeItem(SESSION_KEY)
    return emptySession()
  }
}

/** Maps the server's student-safe question rows into the UI Question shape. */
function mapPreparedQuestions(rows: PreparedExamQuestion[]): Question[] {
  return rows.map(q => ({
    ...q,
    negative_marks: 0,
    diagram: null,
  }))
}

export function usePrepareWrite() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { state: errorState, error: pageError, captureNetworkError, captureServerError, retry: retryError, reset: resetError } = usePageError()

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [exams, setExams] = useState<ExamConfig[]>([])
  const [papers, setPapers] = useState<ExamPaper[]>([])
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, { valid: boolean; message?: string }>>({})
  const [visibleCount, setVisibleCount] = useState(10)
  const [notice, setNotice] = useState<string | null>(null)

  const { nextId, isStale } = useStableFetch()

  const [state, setState] = useState<SessionState>(() => getInitialState(user?.id ?? null))
  const viewRef = useRef<ViewState>(state.view)
  const stateRef = useRef(state)

  // Keep refs synchronized during render so callbacks read current values
  // without depending on state in their closure.
  viewRef.current = state.view
  stateRef.current = state

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
  }, [state])

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setNotice(null)
    setState(emptySession())
  }, [])

  const loadInitial = useCallback(async (force = false): Promise<boolean> => {
    if (!user?.id || !user?.exam_selection) return false
    const id = nextId()
    setLoading(true)
    resetError()

    try {
      const allowedIds = getAllowedExamIds(user.exam_selection)
      const examsData = await fetchExams(allowedIds, force)

      if (isStale(id)) return false
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
        if (isStale(id)) return false
        setPapers(papersData)

        if (papersData.length > 0 && (!state.selectedPaper || state.selectedPaper.exam_id !== targetExamId)) {
          setState(prev => ({ ...prev, selectedPaper: papersData[0] }))
        }

        const results = await batchCheckAvailability(papersData.map(p => p.id))
        if (isStale(id)) return false
        setAvailabilityMap(results)
      }
      return true
    } catch (err: unknown) {
      if (isStale(id)) return false
      captureNetworkError(err, { retryFn: () => loadInitial(true) })
      return false
    } finally {
      if (!isStale(id)) setLoading(false)
    }
  }, [user?.id, user?.exam_selection])

  useEffect(() => {
    loadInitial()
  }, [user?.exam_selection, loadInitial])

  const handleExamChange = useCallback(async (examId: string): Promise<boolean> => {
    const id = nextId()
    resetError()
    setState(prev => ({ ...prev, selectedExamId: examId }))
    setLoading(true)
    try {
      const allowedIds = getAllowedExamIds(user?.exam_selection)
      const papersData = await fetchPapers(examId, allowedIds)
      if (isStale(id)) return false
      setPapers(papersData)
      if (papersData.length > 0) {
        setState(prev => ({ ...prev, selectedPaper: papersData[0] }))
      }

      const results = await batchCheckAvailability(papersData.map(p => p.id))
      if (isStale(id)) return false
      setAvailabilityMap(results)
      return true
    } catch (err: unknown) {
      if (isStale(id)) return false
      captureNetworkError(err, { retryFn: () => handleExamChange(examId) })
      return false
    } finally {
      if (!isStale(id)) setLoading(false)
    }
  }, [user?.exam_selection])

  /**
   * Prepares the CLICKED paper: the server selects the locked question set,
   * persists it, and returns the student-safe snapshot (no answers).
   */
  const startPreparation = useCallback(async (paper: ExamPaper): Promise<boolean> => {
    if (actionLoading) return false
    if (!paper?.id) return false
    setActionLoading(true)
    setState(prev => ({ ...prev, selectedPaper: paper }))
    try {
      const prep = await prepareExamQuestions(paper.id)

      setState(prev => ({
        ...prev,
        view: 'PREPARATION',
        selectedPaper: paper,
        preparationId: prep.preparation_id,
        examId: prep.exam_id || null,
        expiresAt: prep.expires_at || null,
        questionCount: prep.question_count,
        questions: mapPreparedQuestions(prep.questions),
        userId: user?.id ?? null
      }))
      setVisibleCount(10)
      setNotice('Preparation locked. Your questions are ready to study — answers are revealed only after you take the real exam.')
      return true
    } catch (err: unknown) {
      captureServerError(err, { retryFn: () => startPreparation(paper) })
      return false
    } finally {
      setActionLoading(false)
    }
  }, [actionLoading, user?.id])

  /**
   * Launches the REAL exam from the locked preparation. The server consumes the
   * stored snapshot (same question IDs) into a graded attempt; the active-exam
   * page reads that authoritative set — nothing client-side decides the paper.
   */
  const startRealExam = useCallback(async (): Promise<boolean> => {
    const s = stateRef.current
    if (actionLoading) return false
    if (!s.preparationId) return false
    if (!s.selectedPaper?.id) return false
    setActionLoading(true)
    try {
      const started = await startPreparedExam(s.preparationId)
      navigate(`/active-exam/${s.selectedPaper.id}`, {
        state: {
          source: 'prepare_write',
          preparationId: s.preparationId,
          attemptId: started.attempt_id,
          title: s.selectedPaper.paper_name,
          paperName: s.selectedPaper.paper_name,
          totalMarks: s.selectedPaper.total_marks,
          durationMinutes: s.selectedPaper.duration_minutes,
          negativeMarkValue: s.selectedPaper.negative_mark_value,
        },
      })
      clearSession()
      return true
    } catch (err: unknown) {
      captureServerError(err, { retryFn: () => startRealExam() })
      return false
    } finally {
      setActionLoading(false)
    }
  }, [actionLoading, navigate, clearSession])

  const exitSession = useCallback(() => {
    const currentView = viewRef.current
    if (currentView === 'PREPARATION') {
      if (!window.confirm('Are you sure you want to exit? Your preparation will be discarded.')) return
    }
    clearSession()
  }, [clearSession])

  return {
    userExamSelection: user?.exam_selection || '',
    authLoading,
    loading,
    actionLoading,
    errorState,
    pageError,
    retryError,
    notice,
    state,
    exams,
    papers,
    availabilityMap,
    visibleCount,
    setVisibleCount,
    handleExamChange,
    startPreparation,
    startRealExam,
    exitSession,
    clearSession,
  }
}