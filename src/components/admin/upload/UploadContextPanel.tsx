import { ArrowLeft, Database } from 'lucide-react'
import { Button, Stack, Card, Body, Badge, SectionReveal } from '../../common/AntigravityUI'
import { AdminText } from '../../common/AdminText'
import { AdminSelectionTabs } from '../../admin/shared/AdminSelectionTabs'

interface UploadContextPanelProps {
  uploadType: 'single' | 'bulk' | null
  isContextValid: boolean
  questionCount: number | undefined
  labels: { exam: string; paper: string }
  selectedExam: string
  selectedPaper: string
  selectedSubject: string
  onBack: () => void
  onLaunch: () => void
  onExamChange: (val: string) => void
  onPaperChange: (val: string) => void
  onSubjectChange: (val: string) => void
  onContextUpdate: (labels: { exam: string; paper: string }) => void
}

export function UploadContextPanel({
  uploadType, isContextValid, questionCount, labels,
  selectedExam, selectedPaper, selectedSubject,
  onBack, onLaunch,
  onExamChange, onPaperChange, onSubjectChange, onContextUpdate,
}: UploadContextPanelProps) {
  return (
    <SectionReveal>
      <div className="flex items-center justify-between mb-4">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Selection
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant={uploadType === 'single' ? 'primary' : 'default'} className="uppercase font-semibold">
            {uploadType === 'single' ? 'Manual Entry Mode' : 'Bulk Ingest Mode'}
          </Badge>
        </div>
      </div>

      <div className="w-full relative">
        <AdminSelectionTabs
          selectedExam={selectedExam} setSelectedExam={onExamChange}
          selectedPaper={selectedPaper} setSelectedPaper={onPaperChange}
          selectedSubject={selectedSubject} setSelectedSubject={onSubjectChange}
          onContextUpdate={onContextUpdate}
          hideAll={true}
        />
      </div>

      <SectionReveal delay={0.2}>
        <Card
          variant={isContextValid ? 'elevated' : 'subtle'}
          className={`p-6 border-2 transition-all ${isContextValid ? 'border-primary/20 bg-primary/5' : 'opacity-60 grayscale'}`}
        >
          <Stack direction="row" justify="between" align="center" gap="lg">
            <Stack gap="xs">
              <div className="flex items-center gap-2 mb-1">
                <AdminText as="h4" variant="cinzel" className="text-lg font-bold uppercase tracking-tight">
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
              size="lg"
              disabled={!isContextValid}
              onClick={onLaunch}
            >
              {uploadType === 'single' ? 'Open Manual Form' : 'Launch Bulk Parser'}
            </Button>
          </Stack>
        </Card>
      </SectionReveal>
    </SectionReveal>
  )
}
