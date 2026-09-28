import { lazy, Suspense } from 'react'
import { Search, AlertCircle, CheckCircle2 } from 'lucide-react'
import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import { QuestionsActions } from '../../components/admin/questions/QuestionsActions'
import { QuestionsTable } from '../../components/admin/questions/QuestionsTable'
import { ConfirmModal, EmptyState } from '../../components/common/SharedComponents'
import { H1, H2, PageContainer, Stack, SectionReveal, Alert, ErrorContainer, RetryButton } from '../../components/common/AntigravityUI'
import { BulkActionBar } from '../../components/admin/common/BulkActionBar'
import { useAdminQuestions, PAGE_SIZE } from '../../components/admin/questions/useAdminQuestions'
import { useExamPaperSubjectSelection } from '../../hooks/useExamPaperSubjectSelection'

const SingleQuestionModal = lazy(() => import('../../components/admin/questions/modals/SingleQuestionModal').then(m => ({ default: m.SingleQuestionModal })))

export default function AdminQuestions() {
  const {
    questions, isLoading, page, setPage, hasMore, totalCount,
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
    error,
    loadError,
    actionSuccess,
    clearActionSuccess,
  } = useAdminQuestions()

  /* ONE selection instance owned by the page: it drives AdminSelectionTabs
   * (via externalSelection, so no second hook instance is mounted) and feeds
   * the no-topic states below. The topic auto-select (first live topic) and
   * the URL cascade logic live in this single instance. */
  const selection = useExamPaperSubjectSelection({
    selectedExam, setSelectedExam,
    selectedPaper, setSelectedPaper,
    selectedSubject, setSelectedSubject,
    selectedTopic, setSelectedTopic,
    hideAll: true,
    showPapers: true,
    showSubjects: true,
    showTopics: true,
    onContextUpdate: handleContextUpdate,
  })

  const topicPending = selectedTopic === ''
  const topicsErrorMsg = selection.topicsError
  const topicsResolvedEmpty =
    selection.displayTopics != null &&
    selection.displayTopics.length === 0 &&
    !topicsErrorMsg

  return (
    <PageContainer>
      <H1 className="sr-only">Manage Questions</H1>

      <Stack gap="lg">
        <SectionReveal className="w-full">
          <div className="w-full relative">
            <AdminSelectionTabs
              externalSelection={selection}
              selectedExam={selectedExam}
              setSelectedExam={setSelectedExam}
              selectedPaper={selectedPaper}
              setSelectedPaper={setSelectedPaper}
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              selectedTopic={selectedTopic}
              setSelectedTopic={setSelectedTopic}
              showTopics={true}
              hideAll={true}
            />
          </div>
        </SectionReveal>

        {/* F-1/F-4 — error takes precedence. Initial-load failure (no rows)
            renders the canonical retryable error surface ONLY; a refetch
            failure with stale rows preserves the existing inline Alert above
            the table and adds the retry affordance. EmptyState is gated on
            !error so ERROR + EMPTY never co-render. */}
        {actionSuccess && (
          <SectionReveal>
            <Alert variant="success" icon={CheckCircle2} title="Operation completed" className="w-full" onDismiss={clearActionSuccess}>
              {actionSuccess}
            </Alert>
          </SectionReveal>
        )}

        {loadError && questions.length === 0 && !isLoading && (
          <SectionReveal>
            <ErrorContainer category={loadError.category} severity={loadError.severity}>
              <h2 className="text-sm font-bold text-text-primary">{loadError.title}</h2>
              <p className="text-[11px] text-text-muted">{loadError.message}</p>
              <RetryButton onRetry={fetchQuestions} loading={isLoading} label="RETRY" />
            </ErrorContainer>
          </SectionReveal>
        )}

        {(error || loadError) && questions.length > 0 && (
          <SectionReveal>
            <Alert variant="error" icon={AlertCircle} title={loadError ? loadError.title : 'Something went wrong'} className="w-full">
              <span>{loadError ? loadError.message : error}</span>
              {loadError && (
                <div className="mt-2">
                  <RetryButton onRetry={fetchQuestions} loading={isLoading} label="RETRY" />
                </div>
              )}
            </Alert>
          </SectionReveal>
        )}

        <SectionReveal>
          <QuestionsActions
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filter={filter}
            setFilter={setFilter}
          />
        </SectionReveal>

        <SectionReveal delay={0.1}>
          {/* h2 restores the document outline between the sr-only h1 and the
              rows' h3 titles (sr-only — zero visual impact). */}
          <H2 className="sr-only">Question Bank</H2>
          <div aria-live="polite" aria-label="Questions list">
            {/* A9 — while a topic is pending, questions are NEVER listed
                unfiltered. The list is either (a) a loading surface, or (b)
                once the topic list resolves (empty or failed) the explicit
                no-topic empty state. A real topic selection falls through to
                the normal table flow below. */}
            {topicPending && (topicsResolvedEmpty || topicsErrorMsg) ? (
              <EmptyState
                icon={<Search size={48} />}
                title="No Topics Selected"
                subtitle={topicsErrorMsg
                  ? "Unable to load topics for this subject. Use Retry in the topic selector above."
                  : "No topics available for this subject. Add topics or select a different subject."}
              />
            ) : (
              <>
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

                {!isLoading && !error && !loadError && questions.length === 0 && (
                  <EmptyState
                    icon={<Search size={48} />}
                    title={filter === 'visuals' ? 'No Visual Questions Found' : 'No Questions Found'}
                    subtitle={filter === 'visuals'
                      ? "No questions with visuals found for this topic. To add or upload questions, use the Upload Questions page."
                      : selectedTopic !== ''
                        ? "No questions available for this topic. To add or upload questions, use the Upload Questions page."
                        : "Select a topic to view its questions."}
                  />
                )}
              </>
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
    </PageContainer>
  )
}