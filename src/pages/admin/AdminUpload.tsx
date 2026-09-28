import { useCallback, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useAdminFilters } from '../../hooks/useAdminFilters'
import { useAdminUpload } from '../../components/admin/upload/useAdminUpload'
import { MethodSelectionView } from '../../components/admin/upload/MethodSelectionView'
import { UploadContextPanel } from '../../components/admin/upload/UploadContextPanel'
import { SubjectTopicsGrid } from '../../components/admin/upload/SubjectTopicsGrid'
import { SingleQuestionModal } from '../../components/admin/questions/modals/SingleQuestionModal'
import { PageContainer, Stack, SectionReveal, Alert } from '../../components/common/AntigravityUI'
import { H1 } from '../../components/common/AntigravityTypography'
import { parseUploadMethodParam, applyUploadMethodParam, type UploadMethod } from '../../lib/utils/uploadMethodParam'

export default function AdminUpload() {
  const { selectedExam, selectedPaper, selectedSubject, setSelectedExam, setSelectedPaper, setSelectedSubject } = useAdminFilters()
  const [searchParams, setSearchParams] = useSearchParams()
  // uploadType is URL-driven presentation state (?upload=single|bulk): it
  // survives reload and back/forward, and invalid values normalize to null.
  const uploadType = parseUploadMethodParam(searchParams.get('upload'))
  const applyUploadType = useCallback((type: UploadMethod | null) => {
    setSearchParams(prev => {
      const next = applyUploadMethodParam(prev, type)
      return next ?? prev
    }, { replace: true })
  }, [setSearchParams])
  const navigate = useNavigate()
  const location = useLocation()
  // Bulk-upload completion arrives via navigation state from the topic-scoped
  // Bulk Parser page — a canonical success Alert on THIS page, not a toast.
  // It also force-refreshes the per-topic counts after the sync.
  const [bulkUploadSuccess, setBulkUploadSuccess] = useState(
    Boolean((location.state as { bulkUploadSuccess?: boolean } | null)?.bulkUploadSuccess)
  )
  const h = useAdminUpload(selectedExam, selectedPaper, selectedSubject, uploadType, applyUploadType, bulkUploadSuccess)

  // Bulk topic cards navigate to the topic-specific Bulk Parser page carrying
  // ONLY the canonical topic_id in the path; the exam/paper/subject context
  // travels as filter params. Identity is never a topic name.
  const handleOpenBulkForTopic = useCallback((topic: { id: string | null }) => {
    if (!topic.id) return
    const params = new URLSearchParams({ exam: selectedExam, paper: selectedPaper, subject: selectedSubject })
    navigate(`/admin/upload/bulk-parser/topic/${topic.id}?${params.toString()}`)
  }, [navigate, selectedExam, selectedPaper, selectedSubject])

  return (
    <PageContainer>
      <H1 className="sr-only">Upload Questions</H1>
      <Stack gap="lg">
        {bulkUploadSuccess && (
          <SectionReveal>
            <Alert variant="success" icon={CheckCircle2} title="Bulk upload complete" className="w-full" onDismiss={() => setBulkUploadSuccess(false)}>
              Bulk upload completed successfully!
            </Alert>
          </SectionReveal>
        )}

        {h.feedback?.type === 'success' && (
          <SectionReveal>
            <Alert variant="success" icon={CheckCircle2} title="Question added" className="w-full" onDismiss={h.clearFeedback}>
              {h.feedback.message}
            </Alert>
          </SectionReveal>
        )}
        {/* Plain labelled container — NOT a live region. The nested count/topics
            role="status" regions own their load announcements; an ancestor
            aria-live here would duplicate each of them (nested live regions
            double-fire the same mutation). */}
        <div aria-label="Upload content">
          {h.uploadType === null ? (
            <MethodSelectionView onSelect={h.handleMethodSelect} />
          ) : (
            <>
              <UploadContextPanel
                uploadType={h.uploadType}
                isContextValid={h.isContextValid}
                questionCount={h.questionCount ?? undefined}
                countLoading={h.countLoading}
                countError={h.countError}
                countCategory={h.countCategory}
                onRetryCount={h.refetchCount}
                labels={h.labels}
                selectedExam={selectedExam}
                selectedPaper={selectedPaper}
                selectedSubject={selectedSubject}
                onBack={h.handleBack}
                onExamChange={setSelectedExam}
                onPaperChange={setSelectedPaper}
                onSubjectChange={setSelectedSubject}
                onContextUpdate={h.setLabels}
              />

              {/* SUBJECT is the last filter — live topics of the selected
                  subject render directly below the ready context for BOTH
                  flows, through the ONE shared topic-card implementation. */}
              {h.isContextValid && (
                <SectionReveal delay={0.3}>
                  {h.uploadType === 'single' ? (
                    <SubjectTopicsGrid
                      topics={h.topics}
                      loading={h.topicsLoading}
                      error={h.topicsError}
                      onRetry={h.refetchTopics}
                      actionLabel="Upload Manually"
                      onTopicAction={h.handleOpenManualForTopic}
                      topicCounts={h.topicCounts}
                      countsLoading={h.topicCountsLoading}
                      countsError={h.topicCountsError}
                      onRetryCounts={h.refetchTopicCounts}
                    />
                  ) : (
                    /* Bulk opens only canonical LIVE topics (id present) —
                       navigation identity is exam_topics.id. */
                    <SubjectTopicsGrid
                      topics={h.topics.filter(t => !!t.id)}
                      loading={h.topicsLoading}
                      error={h.topicsError}
                      onRetry={h.refetchTopics}
                      actionLabel="Bulk Upload"
                      onTopicAction={handleOpenBulkForTopic}
                      topicCounts={h.topicCounts}
                      countsLoading={h.topicCountsLoading}
                      countsError={h.topicCountsError}
                      onRetryCounts={h.refetchTopicCounts}
                    />
                  )}
                </SectionReveal>
              )}
            </>
          )}
        </div>
      </Stack>

      <SingleQuestionModal
        isOpen={h.activeModal === 'single'}
        onClose={h.handleModalClose}
        mode="add"
        examId={selectedExam}
        paperId={selectedPaper}
        subjectName={selectedSubject}
        topicId={h.selectedTopic?.id ?? null}
        topicEnglish={h.selectedTopic?.name_en ?? null}
        topicTelugu={h.selectedTopic?.name_te ?? null}
        question={null}
        onSuccess={h.handleSuccess}
      />
    </PageContainer>
  )
}
