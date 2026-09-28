import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import type { Question } from '../../../types/exam.types'
import { adminQuestionService } from '../../../services/adminQuestionService'
import { generateRequestId, logError } from '../../../utils/logger'
import { normalizeError, classifyError } from '../../../utils/errorClassification'
import type { PageError } from '../../../types/error.types'
import { isAdmin } from '../../../utils/authUtils'
import { useAdminFilters } from '../../../hooks/useAdminFilters'
import { hasCanonicalVisual } from '../../../services/questions/visualNormalizer'
import type { QuestionFilter } from './QuestionsActions'

export const PAGE_SIZE = 30

export function useAdminQuestions() {
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<PageError | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const { selectedExam, selectedPaper, selectedSubject, selectedTopic, setSelectedExam, setSelectedPaper, setSelectedSubject, setSelectedTopic } = useAdminFilters()

  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState<QuestionFilter>('all')

  const [activeModal, setActiveModal] = useState<'single' | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view')
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [contextLabels, setContextLabels] = useState({ exam: 'All Exams', paper: 'All Papers' })

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  /* F-2 — deterministic stale-response guard. The latest request wins; every
   * async completion path checks the sequence before touching any state. */
  const requestSeqRef = useRef(0)
  /* F-6 — logical query context of the dataset currently on screen. Selections
   * persist across pagination within one context and are cleared when the
   * context itself changes (exam/paper/subject/search/filter). */
  const selectionContextRef = useRef('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(0)
  }, [selectedExam, selectedPaper, selectedSubject, selectedTopic, debouncedSearch, filter])

  const fetchQuestions = useCallback(async () => {
    const requestSeq = ++requestSeqRef.current
    const isCurrent = () => requestSeq === requestSeqRef.current
    const contextKey = [
      selectedExam, selectedPaper, selectedSubject, selectedTopic, debouncedSearch, filter
    ].join('|')
    const isNewContext = contextKey !== selectionContextRef.current

    /* A9 — no unfiltered question listing. The RPC only ever runs once a real
     * topic is selected; while the topic is still pending (initial load,
     * ancestor cascade, topic list fetching) we hold the loading surface and
     * NEVER issue the all-subject (p_topic_en = null) query. The page renders
     * the resolved no-topics/error empty states itself from the selection
     * hook. In-flight stale responses are invalidated by bumping the seq. */
    if (!selectedTopic) {
      selectionContextRef.current = ''
      setSelectedIds([])
      setQuestions([])
      setTotalCount(0)
      setHasMore(false)
      setIsLoading(true)
      setError(null)
      setLoadError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setLoadError(null)

    try {
      const offset = page * PAGE_SIZE
      const requestId = generateRequestId('list_q')
      const result = await adminQuestionService.listQuestions({
        selectedExam,
        selectedPaper,
        selectedSubject,
        selectedTopic,
        difficultyFilter: filter === 'visuals' ? 'all' : filter,
        visualFilter: filter === 'visuals' ? 'visuals' : 'all',
        searchQuery: debouncedSearch,
        offset,
        pageSize: PAGE_SIZE
      }, { requestId, user })

      if (!isCurrent()) return

      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch questions')
      const rows = result.data || []
      setQuestions(filter === 'visuals'
        ? rows.filter(q => hasCanonicalVisual(q.visual))
        : rows)
      const total = typeof result.meta?.count === 'number' ? result.meta.count : 0
      setTotalCount(total)
      setHasMore(total > offset + PAGE_SIZE)
      if (isNewContext) setSelectedIds([])
      selectionContextRef.current = contextKey
    } catch (err: unknown) {
      if (!isCurrent()) return
      // F-7: raw backend messages stay in the internal log; the UI receives
      // the canonical user-safe classification.
      logError('questions.list_failed', { message: err instanceof Error ? err.message : 'Unknown error' })
      setLoadError(normalizeError(err))
    } finally {
      if (isCurrent()) setIsLoading(false)
    }
  }, [selectedExam, selectedPaper, selectedSubject, selectedTopic, debouncedSearch, filter, page, user])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleContextUpdate = useCallback((labels: { exam: string; paper?: string }) => {
    setContextLabels(prev => {
      if (prev.exam === labels.exam && (prev.paper === (labels.paper || 'All Papers'))) return prev
      return { exam: labels.exam, paper: labels.paper || 'All Papers' }
    })
  }, [])

  const handleDelete = (q: Question) => {
    setQuestionToDelete(q)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      if (!isAdmin(user)) throw new Error("Unauthorized: Admin privileges required")
      if (selectedIds.length === 0 && !questionToDelete) throw new Error("No questions selected for deletion")
      setError(null)
      const requestId = generateRequestId('delete_q')
      let serviceResult
      try {
        if (selectedIds.length > 0) {
          serviceResult = await adminQuestionService.bulkDeleteQuestions(selectedIds, { requestId, user })
        } else if (questionToDelete) {
          serviceResult = await adminQuestionService.deleteQuestion(questionToDelete.id, { requestId, user })
        }
      } catch (serviceErr: unknown) {
        logError('questions.delete_failed', { requestId, message: serviceErr instanceof Error ? serviceErr.message : 'Unknown error' })
        throw new Error(classifyError(serviceErr).message)
      }

      if (serviceResult && !serviceResult.success) {
        logError('questions.delete_failed', { requestId, message: serviceResult.error?.message || 'Operation failed' })
        throw new Error(classifyError(serviceResult.error ?? 'Operation failed').message)
      }

      setIsDeleteModalOpen(false)
      setSelectedIds([])
      setQuestionToDelete(null)
      setActionSuccess('Operation completed successfully')
      fetchQuestions()
    } catch (err: unknown) {
      // F-5: close the modal so the error surface is actually visible; the
      // confirm action is re-enabled via isDeleting below. Nothing pretends
      // the deletion succeeded (no toast, no row removal).
      setIsDeleteModalOpen(false)
      setError(err instanceof Error ? err.message : 'Deletion failed')
    } finally {
      setIsDeleting(false)
    }
  }, [user, selectedIds, questionToDelete, fetchQuestions])

  return {
    questions, isLoading, page, setPage, hasMore, totalCount,
    error, loadError,
    selectedIds, setSelectedIds,
    searchQuery, setSearchQuery, filter, setFilter,
    selectedExam, selectedPaper, selectedSubject, selectedTopic,
    setSelectedExam, setSelectedPaper, setSelectedSubject, setSelectedTopic,
    activeModal, setActiveModal, modalMode, setModalMode,
    selectedQuestion, setSelectedQuestion,
    contextLabels,
    isDeleteModalOpen, setIsDeleteModalOpen,
    isDeleting,
    handleContextUpdate,
    handleDelete,
    handleConfirmDelete,
    fetchQuestions,
    actionSuccess,
    clearActionSuccess: () => setActionSuccess(null),
  }
}
