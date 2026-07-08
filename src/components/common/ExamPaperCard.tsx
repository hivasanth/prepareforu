import type { FC } from 'react'
import { ExamCard, MetricBlock } from './AntigravityUI'
import type { ExamPaper } from '../../types/exam.types'

interface ExamPaperCardProps {
  paper: ExamPaper;
  isStarting: boolean;
  isValid: boolean;
  availabilityMessage?: string;
  onClick: () => void;
}

export const ExamPaperCard: FC<ExamPaperCardProps> = ({ 
  paper, 
  isStarting, 
  isValid, 
  availabilityMessage, 
  onClick 
}) => {
  return (
    <ExamCard 
      title={paper.paper_name}
      status={paper.stage || 'Live'}
      isStarting={isStarting}
      disabled={!isValid}
      disabledMessage={availabilityMessage}
      onClick={onClick}
    >
      <div className="bg-hover-bg/30 p-3 rounded-[12px] border border-border-subtle/50">
        <MetricBlock label="Questions" value={paper.total_questions} />
      </div>
      <div className="bg-hover-bg/30 p-3 rounded-[12px] border border-border-subtle/50">
        <MetricBlock label="Duration" value={`${paper.duration_minutes}m`} />
      </div>
      <div className="bg-hover-bg/30 p-3 rounded-[12px] border border-border-subtle/50">
        <MetricBlock label="Marks" value={paper.total_marks} />
      </div>
      <div className="bg-hover-bg/30 p-3 rounded-[12px] border border-border-subtle/50">
        <MetricBlock 
          label="Negative" 
          value={paper.negative_marking ? `-${paper.negative_mark_value}` : 'None'} 
          color={paper.negative_marking ? 'var(--danger)' : undefined}
        />
      </div>
    </ExamCard>
  )
}
