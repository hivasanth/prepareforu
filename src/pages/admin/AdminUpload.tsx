import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminFilters } from '../../hooks/useAdminFilters'
import { useAuth } from '../../context/AuthContext'
import { isAdmin } from '../../utils/authUtils'
import { PlusCircle, FileJson, Sparkles, ArrowLeft, Database } from 'lucide-react'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { adminQuestionService } from '../../services/adminQuestionService'
import { GuardLoader } from '../../guards/Guards'
import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import { SingleQuestionModal } from '../../components/admin/questions/modals/SingleQuestionModal'
import { BulkUploadModal } from '../../components/admin/questions/modals/BulkUploadModal'
import {
  Button,
  PageContainer, 
  Stack, 
  SectionReveal, 
  Grid, 
  Card, 
  Body, 
  Badge
} from '../../components/common/AntigravityUI'
import { AdminIconWrap } from '../../components/admin/common/AdminIconWrap'
import { AdminText } from '../../components/admin/common/AdminText'
import { useToast } from '../../hooks/useToast'

export default function AdminUpload() {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const { selectedExam, selectedPaper, selectedSubject, setSelectedExam, setSelectedPaper, setSelectedSubject } = useAdminFilters()

  const [activeModal, setActiveModal] = useState<'single' | 'bulk' | null>(null)
  const [labels, setLabels] = useState({ exam: '', paper: '' })

  const [uploadType, setUploadType] = useState<'single' | 'bulk' | null>(null)

  const isContextValid = selectedExam !== 'all' && selectedExam !== 'APPSC_GROUPS' && selectedPaper !== 'all' && selectedSubject !== 'all'

  const { data: questionCount, refetch: refetchCount } = useSupabaseQuery<number>(async () => {
    if (!isContextValid) return { data: 0, error: null }
    try {
      const count = await adminQuestionService.countQuestions({
        examId: selectedExam,
        paperId: selectedPaper,
        subjectName: selectedSubject,
      })
      return { data: count, error: null }
    } catch (error: any) {
      return { data: 0, error: error.message || 'Failed to count questions.' }
    }
  }, [selectedExam, selectedPaper, selectedSubject, isContextValid])

  if (authLoading) return <GuardLoader />
  if (!isAdmin(user)) return <Navigate to="/unauthorized" replace />

  return (
    <PageContainer>
      <Stack gap="lg">
        <div aria-live="polite" aria-label="Upload content">
        {uploadType === null ? (
          <SectionReveal>
            <Stack gap="xl">
              <div className="flex flex-col items-center text-center max-w-2xl mx-auto py-8">
                <Badge variant="primary" className="mb-4">Upload Method</Badge>
                <AdminText as="h1" variant="cinzel" className="text-3xl font-black mb-4 uppercase tracking-tighter">
                  How do you want to upload?
                </AdminText>
                <Body secondary>
                  Choose a method to add questions to your database.
                </Body>
              </div>

              <Grid cols={2} gap={24} className="max-md:grid-cols-1">
                <Card 
                  variant="elevated" 
                  className={`h-full flex flex-col p-8 group relative overflow-hidden cursor-pointer transition-all hover:border-primary/50`}
                  onClick={() => setUploadType('single')}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setUploadType('single') }}
                >
                  <AdminIconWrap size="lg" rounded="lg" className="mb-6 transition-all group-hover:scale-110 shadow-xl shadow-primary/20">
                    <PlusCircle size={28} />
                  </AdminIconWrap>
                  <div className="flex-1">
                    <AdminText as="h3" variant="cinzel" className="text-xl font-black mb-2 uppercase tracking-tight group-hover:text-primary transition-colors">
                      Add One by One
                    </AdminText>
                    <Body secondary>
                      Type each question manually with full control over formatting.
                    </Body>
                  </div>
                  <div className="mt-8 pt-6 border-t border-border-subtle/30 flex items-center justify-between text-primary font-bold text-xs uppercase tracking-widest">
                    Go to Manual Entry →
                  </div>
                  <div className="absolute -bottom-6 -right-6 opacity-[0.03] text-primary group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <PlusCircle size={140} strokeWidth={1} />
                  </div>
                </Card>

                <Card 
                  variant="elevated" 
                  className={`h-full flex flex-col p-8 group relative overflow-hidden cursor-pointer transition-all hover:border-secondary/50`}
                  onClick={() => setUploadType('bulk')}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setUploadType('bulk') }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <AdminIconWrap size="lg" rounded="lg" className="transition-all group-hover:scale-110 shadow-xl shadow-secondary/20">
                      <FileJson size={28} />
                    </AdminIconWrap>
                    <Badge variant="primary" icon={Sparkles}>AI Optimized</Badge>
                  </div>
                  <div className="flex-1">
                    <AdminText as="h3" variant="cinzel" className="text-xl font-black mb-2 uppercase tracking-tight group-hover:text-secondary transition-colors">
                      Upload Many at Once
                    </AdminText>
                    <Body secondary>
                      Use AI to extract and upload multiple questions instantly from your documents.
                    </Body>
                  </div>
                  <div className="mt-8 pt-6 border-t border-border-subtle/30 flex items-center justify-between text-secondary font-bold text-xs uppercase tracking-widest">
                    Go to Bulk Upload →
                  </div>
                  <div className="absolute -bottom-6 -right-6 opacity-[0.03] text-secondary group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <FileJson size={140} strokeWidth={1} />
                  </div>
                </Card>
              </Grid>
            </Stack>
          </SectionReveal>
        ) : (
          <>
            <SectionReveal>
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="secondary" 
                  onClick={() => setUploadType(null)}
                  className="flex items-center gap-2 !h-auto !shadow-none"
                >
                  <ArrowLeft size={16} /> Back to Selection
                </Button>
                <div className="flex items-center gap-3">
                  <Badge variant={uploadType === 'single' ? 'primary' : 'default'} className="uppercase font-black">
                    {uploadType === 'single' ? 'Manual Entry Mode' : 'Bulk Ingest Mode'}
                  </Badge>
                </div>
              </div>

              <div className="w-full relative">
                <AdminSelectionTabs
                  selectedExam={selectedExam} setSelectedExam={setSelectedExam}
                  selectedPaper={selectedPaper} setSelectedPaper={setSelectedPaper}
                  selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject}
                  onContextUpdate={setLabels}
                  hideAll={true}
                  className="bg-transparent border-none p-0 w-full"
                />
              </div>
            </SectionReveal>


            <SectionReveal delay={0.2}>
              <Card 
                variant={isContextValid ? "elevated" : "subtle"} 
                className={`p-6 border-2 transition-all ${isContextValid ? 'border-primary/20 bg-primary/5' : 'opacity-60 grayscale'}`}
              >
                <Stack direction="row" justify="between" align="center" gap="lg">
                  <Stack gap="xs">
                    <div className="flex items-center gap-2 mb-1">
                      <AdminText as="h4" variant="cinzel" className="text-lg font-black uppercase tracking-tight">
                        {isContextValid ? `Ready for ${selectedSubject}` : 'Select Context'}
                      </AdminText>
                      {isContextValid && (
                        <Badge variant="primary" icon={Database} className="text-[10px] py-0 px-2 opacity-80">
                          {questionCount ?? 0} Questions Available
                        </Badge>
                      )}
                    </div>
                    <Body secondary className="text-xs">
                      {isContextValid 
                        ? `Configured for ${labels.exam} → ${labels.paper}` 
                        : 'Please complete the exam, paper, and subject selection above.'}
                    </Body>
                  </Stack>
                  <Button 
                    variant={uploadType === 'single' ? 'primary' : 'secondary'}
                    disabled={!isContextValid}
                    onClick={() => setActiveModal(uploadType)}
                    className="shadow-xl px-8"
                  >
                    {uploadType === 'single' ? 'Open Manual Form' : 'Launch Bulk Parser'}
                  </Button>
                </Stack>
              </Card>
            </SectionReveal>
          </>
        )}
        </div>
      </Stack>

      {/* Modals */}
      <SingleQuestionModal
        isOpen={activeModal === 'single'}
        onClose={() => setActiveModal(null)}
        mode="add"
        examId={selectedExam}
        paperId={selectedPaper}
        subjectName={selectedSubject}
        question={null}
        onSuccess={() => {
          setActiveModal(null)
          showToast("Question added successfully!", "success")
          refetchCount()
        }}
      />

      <BulkUploadModal
        isOpen={activeModal === 'bulk'}
        onClose={() => setActiveModal(null)}
        examId={selectedExam}
        examLabel={labels.exam}
        paperId={selectedPaper}
        paperLabel={labels.paper}
        subjectName={selectedSubject}
        onSuccess={() => {
          setActiveModal(null)
          showToast("Bulk upload completed successfully!", "success")
          refetchCount()
        }}
        showToast={showToast}
      />
    </PageContainer>
  )
}
