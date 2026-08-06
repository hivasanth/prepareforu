import { lazy, Suspense } from 'react'
import { Search, AlertCircle } from 'lucide-react'
import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import { QuestionsActions } from '../../components/admin/questions/QuestionsActions'
import { QuestionsTable } from '../../components/admin/questions/QuestionsTable'
import { ConfirmModal, EmptyState } from '../../components/common/SharedComponents'
import { H1, PageContainer, Stack, SectionReveal, Alert } from '../../components/common/AntigravityUI'
import { BulkActionBar } from '../../components/admin/common/BulkActionBar'
import { ToastContainer } from '../../hooks/useToast'
import { useAdminQuestions, PAGE_SIZE } from '../../components/admin/questions/useAdminQuestions'

const SingleQuestionModal = lazy(() => import('../../components/admin/questions/modals/SingleQuestionModal').then(m => ({ default: m.SingleQuestionModal })))
const BulkUploadModal = lazy(() => import('../../components/admin/questions/modals/BulkUploadModal').then(m => ({ default: m.BulkUploadModal })))

export default function AdminQuestions() {
  const {
    questions, isLoading, page, setPage, hasMore, totalCount,
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
    error,
    toasts,
    showToast,
  } = useAdminQuestions()

  return (
    <PageContainer>
      <H1 className="sr-only">Manage Questions</H1>

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
            />
          </div>
        </SectionReveal>

        {error && (
          <SectionReveal>
            <Alert variant="error" icon={AlertCircle} title="Something went wrong" className="w-full">
              {error}
            </Alert>
          </SectionReveal>
        )}

        <SectionReveal>
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

        <SectionReveal delay={0.1}>
          <div aria-live="polite" aria-label="Questions list">
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

        <BulkActionBar
          selectedCount={selectedIds.length}
          onDelete={() => setIsDeleteModalOpen(true)}
          onCancel={() => setSelectedIds([])}
        />
      </Stack>

      <Suspense fallback={null}>
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
      </Suspense>

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
      <ToastContainer toasts={toasts} />
    </PageContainer>
  )
}
