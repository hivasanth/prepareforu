import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import type { Question } from '../../../types/exam.types'
import { adminQuestionService } from '../../../services/adminQuestionService'
import { generateRequestId } from '../../../utils/logger'
import { isAdmin } from '../../../utils/authUtils'
import { useToast } from '../../../hooks/useToast'
import { useAdminFilters } from '../../../hooks/useAdminFilters'

export const PAGE_SIZE = 30

export function useAdminQuestions() {
  const { user } = useAuth()
  const { toasts, showToast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const { selectedExam, selectedPaper, selectedSubject, setSelectedExam, setSelectedPaper, setSelectedSubject } = useAdminFilters()

  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')

  const [activeModal, setActiveModal] = useState<'single' | 'bulk' | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view')
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [contextLabels, setContextLabels] = useState({ exam: 'All Exams', paper: 'All Papers' })

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(0)
  }, [selectedExam, selectedPaper, selectedSubject, debouncedSearch, difficultyFilter])

  const fetchQuestions = useCallback(async () => {
    try {
      setIsLoading(true)
      const offset = page * PAGE_SIZE
      const requestId = generateRequestId('list_q')
      const result = await adminQuestionService.listQuestions({
        selectedExam,
        selectedPaper,
        selectedSubject,
        difficultyFilter,
        searchQuery: debouncedSearch,
        offset,
        pageSize: PAGE_SIZE
      }, { requestId, user })

      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch questions')
      setQuestions(result.data || [])
      const total = typeof result.meta?.count === 'number' ? result.meta.count : 0
      setTotalCount(total)
      setHasMore(total > offset + PAGE_SIZE)
      setSelectedIds([])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch questions")
    } finally {
      setIsLoading(false)
    }
  }, [selectedExam, selectedPaper, selectedSubject, debouncedSearch, difficultyFilter, page, user])

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
      if (selectedIds.length > 0) {
        serviceResult = await adminQuestionService.bulkDeleteQuestions(selectedIds, { requestId, user })
      } else if (questionToDelete) {
        serviceResult = await adminQuestionService.deleteQuestion(questionToDelete.id, { requestId, user })
      }

      if (serviceResult && !serviceResult.success) throw new Error(serviceResult.error?.message || 'Operation failed')

      setIsDeleteModalOpen(false)
      setSelectedIds([])
      setQuestionToDelete(null)
      showToast("Operation completed successfully", "success")
      fetchQuestions()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Deletion failed")
    } finally {
      setIsDeleting(false)
    }
  }, [user, selectedIds, questionToDelete, fetchQuestions, showToast])

  return {
    questions, isLoading, page, setPage, hasMore, totalCount,
    error,
    selectedIds, setSelectedIds,
    searchQuery, setSearchQuery, difficultyFilter, setDifficultyFilter,
    selectedExam, selectedPaper, selectedSubject,
    setSelectedExam, setSelectedPaper, setSelectedSubject,
    activeModal, setActiveModal, modalMode, setModalMode,
    selectedQuestion, setSelectedQuestion,
    contextLabels,
    isDeleteModalOpen, setIsDeleteModalOpen,
    isDeleting,
    handleContextUpdate,
    handleDelete,
    handleConfirmDelete,
    fetchQuestions,
    toasts,
    showToast,
  }
}
