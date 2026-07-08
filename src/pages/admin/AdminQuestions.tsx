import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { Question } from '../../types/exam.types'
import { adminQuestionService } from '../../services/adminQuestionService'
import { generateRequestId } from '../../utils/logger'
import { isAdmin } from '../../utils/authUtils'

import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import { QuestionsActions } from '../../components/admin/questions/QuestionsActions'
import { QuestionsTable } from '../../components/admin/questions/QuestionsTable'
import { SingleQuestionModal } from '../../components/admin/questions/modals/SingleQuestionModal'
import { BulkUploadModal } from '../../components/admin/questions/modals/BulkUploadModal'
import { ConfirmModal, EmptyState } from '../../components/common/SharedComponents'
import { 
  PageContainer, 
  Stack, 
  SectionReveal
} from '../../components/common/AntigravityUI'
import { AdminCard } from '../../components/admin/common/AdminCard'
import { BulkActionBar } from '../../components/admin/common/BulkActionBar'
import { GuardLoader } from '../../guards/Guards'
import { Search } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { useAdminFilters } from '../../hooks/useAdminFilters'

const PAGE_SIZE = 30

export default function AdminQuestions() {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const { selectedExam, selectedPaper, selectedSubject, setSelectedExam, setSelectedPaper, setSelectedSubject } = useAdminFilters()

  // Data State
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')

  // Modals
  const [activeModal, setActiveModal] = useState<'single' | 'bulk' | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view')
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [contextLabels, setContextLabels] = useState({ exam: 'All Exams', paper: 'All Papers' })

  // Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)



  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(0)
  }, [selectedExam, selectedPaper, selectedSubject, debouncedSearch, difficultyFilter])

  const fetchQuestions = async () => {
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
      showToast(err instanceof Error ? err.message : "Failed to fetch questions", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [selectedExam, selectedPaper, selectedSubject, debouncedSearch, difficultyFilter, page])

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

  const handleConfirmDelete = async () => {
    if (!isAdmin(user)) return showToast("Unauthorized: Admin privileges required", "error")
    if (selectedIds.length === 0 && !questionToDelete) {
      showToast("No questions selected for deletion", "warning")
      setIsDeleteModalOpen(false)
      return
    }
    setIsDeleting(true)
    try {
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
      showToast(err instanceof Error ? err.message : "Deletion failed", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  if (authLoading) return <GuardLoader />
  if (!isAdmin(user)) return <Navigate to="/unauthorized" replace />

  return (
    <PageContainer>
      <h1 className="sr-only">Manage Questions</h1>

      <Stack gap="lg">
        <SectionReveal className="w-full">
          <div className="w-full relative">
            <AdminSelectionTabs
              selectedExam={selectedExam}
              setSelectedExam={setSelectedExam}
              selectedPaper={selectedPaper}
              setSelectedPaper={setSelectedPaper}
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              hideAll={true}
              onContextUpdate={handleContextUpdate}
              className="bg-transparent border-none p-0 w-full"
            />
          </div>
        </SectionReveal>

        <AdminCard className="p-0 overflow-hidden">
          <SectionReveal delay={0.1} className="relative z-30">
            <QuestionsActions
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              difficultyFilter={difficultyFilter}
              setDifficultyFilter={setDifficultyFilter}
              onAddQuestion={() => { setModalMode('add'); setActiveModal('single'); }}
              onBulkUpload={() => setActiveModal('bulk')}
              isUploadDisabled={selectedExam === 'all' || selectedPaper === 'all' || selectedSubject === 'all'}
            />
          </SectionReveal>

          <SectionReveal delay={0.15}>
            <div className="p-0" aria-live="polite" aria-label="Questions list">
              <QuestionsTable
                questions={questions}
                isLoading={isLoading}
                page={page}
                setPage={setPage}
                hasMore={hasMore}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                selectedIds={selectedIds}
                onSelect={(id) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
                onSelectAll={setSelectedIds}
                onView={(q) => { setSelectedQuestion(q); setModalMode('view'); setActiveModal('single'); }}
                onEdit={(q) => { setSelectedQuestion(q); setModalMode('edit'); setActiveModal('single'); }}
                onDelete={handleDelete}
              />
              
              {!isLoading && questions.length === 0 && (
                <EmptyState
                  icon={<Search size={48} />}
                  title="No Questions Found"
                  subtitle="Adjust your filters or tab selections. If the bank is empty, use the Bulk Upload or add a question manually."
                />
              )}
            </div>
          </SectionReveal>
        </AdminCard>

        <BulkActionBar
          selectedCount={selectedIds.length}
          onDelete={() => setIsDeleteModalOpen(true)}
          onCancel={() => setSelectedIds([])}
        />
      </Stack>

      <SingleQuestionModal
        isOpen={activeModal === 'single'}
        onClose={() => setActiveModal(null)}
        mode={modalMode}
        onModeChange={setModalMode}
        question={selectedQuestion}
        examId={selectedExam}
        examLabel={contextLabels.exam}
        paperId={selectedPaper}
        paperLabel={contextLabels.paper}
        subjectName={selectedSubject}
        onSuccess={fetchQuestions}
      />

      <BulkUploadModal
        isOpen={activeModal === 'bulk'}
        onClose={() => setActiveModal(null)}
        examId={selectedExam}
        paperId={selectedPaper}
        paperLabel={contextLabels.paper}
        subjectName={selectedSubject}
        onSuccess={fetchQuestions}
        showToast={showToast}
      />

      <ConfirmModal 
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Operation"
        message={selectedIds.length > 0 
          ? `Are you sure you want to permanently delete all ${selectedIds.length} selected questions? This cannot be undone.` 
          : "Are you sure you want to permanently delete this question? This cannot be undone."}
        danger
        confirmLabel={isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
      />
    </PageContainer>
  )
}
