import { useAdminFilters } from '../../hooks/useAdminFilters'
import { ToastContainer } from '../../hooks/useToast'
import { useAdminUpload } from '../../components/admin/upload/useAdminUpload'
import { MethodSelectionView } from '../../components/admin/upload/MethodSelectionView'
import { UploadContextPanel } from '../../components/admin/upload/UploadContextPanel'
import { SingleQuestionModal } from '../../components/admin/questions/modals/SingleQuestionModal'
import { BulkUploadModal } from '../../components/admin/questions/modals/BulkUploadModal'
import { PageContainer, Stack } from '../../components/common/AntigravityUI'

export default function AdminUpload() {
  const { selectedExam, selectedPaper, selectedSubject, setSelectedExam, setSelectedPaper, setSelectedSubject } = useAdminFilters()
  const h = useAdminUpload(selectedExam, selectedPaper, selectedSubject)

  return (
    <PageContainer>
      <Stack gap="lg">
        <div aria-live="polite" aria-label="Upload content">
          {h.uploadType === null ? (
            <MethodSelectionView onSelect={h.handleMethodSelect} />
          ) : (
            <UploadContextPanel
              uploadType={h.uploadType}
              isContextValid={h.isContextValid}
              questionCount={h.questionCount ?? undefined}
              labels={h.labels}
              selectedExam={selectedExam}
              selectedPaper={selectedPaper}
              selectedSubject={selectedSubject}
              onBack={h.handleBack}
              onLaunch={h.handleLaunch}
              onExamChange={setSelectedExam}
              onPaperChange={setSelectedPaper}
              onSubjectChange={setSelectedSubject}
              onContextUpdate={h.setLabels}
            />
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
        question={null}
        onSuccess={h.handleSuccess}
      />

      <BulkUploadModal
        isOpen={h.activeModal === 'bulk'}
        onClose={h.handleModalClose}
        examId={selectedExam}
        examLabel={h.labels.exam}
        paperId={selectedPaper}
        paperLabel={h.labels.paper}
        subjectName={selectedSubject}
        onSuccess={h.handleSuccess}
        showToast={h.showToast}
      />
      <ToastContainer toasts={h.toasts} />
    </PageContainer>
  )
}
