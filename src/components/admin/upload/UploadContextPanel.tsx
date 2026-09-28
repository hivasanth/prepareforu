import { ArrowLeft, Database } from 'lucide-react'
import { Button, Stack, Card, Body, Badge, SectionReveal, ErrorContainer, RetryButton } from '../../common/AntigravityUI'
import { Skeleton } from '../../common/Skeleton'
import { AdminText } from '../../common/AdminText'
import { AdminSelectionTabs } from '../../admin/shared/AdminSelectionTabs'
import type { ErrorCategory } from '../../../types/error.types'

interface UploadContextPanelProps {
  uploadType: 'single' | 'bulk' | null
  isContextValid: boolean
  questionCount: number | undefined
  countLoading: boolean
  /** H1 — classified failure of the live count query. When set, the count is
   *  UNKNOWN: the panel renders the canonical retryable error surface instead
   *  of a valid-looking "0 questions" badge. */
  countError?: string | null
  countCategory?: ErrorCategory
  onRetryCount?: () => void
  labels: { exam: string; paper: string }
  selectedExam: string
  selectedPaper: string
  selectedSubject: string
  onBack: () => void
  onExamChange: (val: string) => void
  onPaperChange: (val: string) => void
  onSubjectChange: (val: string) => void
  onContextUpdate: (labels: { exam: string; paper: string }) => void
}

export function UploadContextPanel({
  uploadType, isContextValid, questionCount, countLoading,
  countError = null, countCategory = 'unknown', onRetryCount, labels,
  selectedExam, selectedPaper, selectedSubject,
  onBack,
  onExamChange, onPaperChange, onSubjectChange, onContextUpdate,
}: UploadContextPanelProps) {
  const countFailed = !countLoading && !!countError
  return (
    <SectionReveal>
      <div className="flex items-center justify-between mb-4">
        <Button variant="soft" onClick={onBack}>
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
        <Card variant="default" padding={24}>
          <Stack direction="row" justify="between" align="center" gap="lg" className="max-md:flex-col max-md:items-stretch">
            <Stack gap="xs">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <AdminText as="h2" variant="cinzel" className="text-lg font-bold uppercase tracking-tight">
                  {isContextValid ? `Ready for ${selectedSubject}` : 'Select Context'}
                </AdminText>
                {isContextValid && (
                  countLoading ? (
                    <div role="status" aria-label="Loading question count">
                      <Skeleton
                        variant="management"
                        type="text"
                        lines={1}
                        width={180}
                        height={22}
                        borderRadius={9999}
                      />
                    </div>
                  ) : countFailed ? (
                    /* H1 — count is UNKNOWN on failure: no badge, no fake 0.
                       The retryable error surface renders below the card. */
                    null
                  ) : (
                    <Badge variant="primary" icon={Database} className="text-[10px] py-0 px-2 opacity-80">
                      {questionCount ?? 0} Questions Available
                    </Badge>
                  )
                )}
              </div>
              {/* LOW-3: labels resolve asynchronously after mount. Until the
                  canonical labels arrive, show a neutral resolving state —
                  never "Configured for  → " with empty prefixes. */}
              <Body secondary className="text-xs">
                {isContextValid
                  ? (labels.exam && labels.paper
                      ? `Configured for ${labels.exam} → ${labels.paper}`
                      : 'Resolving exam and paper…')
                  : 'Please complete the exam, paper, and subject selection above.'}
              </Body>
            </Stack>
          </Stack>
        </Card>
      </SectionReveal>

      {isContextValid && countFailed && (
        <ErrorContainer category={countCategory} variant="inline">
          <Body className="font-bold">Couldn't load the question count for this context.</Body>
          <Body secondary>{countError}</Body>
          {onRetryCount && (
            <RetryButton onRetry={onRetryCount} loading={countLoading} />
          )}
        </ErrorContainer>
      )}
    </SectionReveal>
  )
}
