import { memo } from 'react'
import { ExamCard, MetricBlock } from './AntigravityUI'
import type { ExamPaper } from '../../types/exam.types'

interface ExamPaperCardProps {
  paper: ExamPaper;
  isStarting: boolean;
  isValid: boolean;
  availabilityMessage?: string;
  onClick: () => void;
}

export const ExamPaperCard = memo(function ExamPaperCard({
  paper,
  isStarting,
  isValid,
  availabilityMessage,
  onClick
}: ExamPaperCardProps) {
  return (
    <ExamCard
      title={paper.paper_name}
      status={paper.stage || 'Live'}
      isStarting={isStarting}
      disabled={!isValid}
      disabledMessage={availabilityMessage}
      onClick={onClick}
    >
      <MetricBlock variant="metric" label="Questions" value={paper.total_questions} />
      <MetricBlock variant="metric" label="Duration" value={`${paper.duration_minutes}m`} />
      <MetricBlock variant="metric" label="Marks" value={paper.total_marks} />
      <MetricBlock
        variant="metric"
        label="Negative"
        value={paper.negative_marking ? `-${paper.negative_mark_value}` : 'None'}
        color={paper.negative_marking ? 'var(--danger)' : undefined}
      />
    </ExamCard>
  )
})
