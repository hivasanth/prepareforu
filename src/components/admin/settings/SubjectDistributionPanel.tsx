import { memo } from 'react'
import { AlertCircle } from 'lucide-react'
import { AdminText } from '../../common/AdminText'
import { Stack, Badge } from '../../common/AntigravityUI'
import { SubjectPieChart } from '../settings/SubjectPieChart'
import { SubjectCardItem } from '../settings/SubjectCardItem'

interface SubjectDistributionPanelProps {
  subjects: any[]
  selectedSubject: string
  configTotalQuestions: number
  onQuestionCountChange: (index: number, value: number) => void
  onMarksChange: (index: number, value: number) => void
  error?: string | null
  onSubjectBlur?: () => void
}

export const SubjectDistributionPanel = memo(function SubjectDistributionPanel({
  subjects, selectedSubject, configTotalQuestions,
  onQuestionCountChange, onMarksChange,
  error, onSubjectBlur,
}: SubjectDistributionPanelProps) {
  const runningTotal = subjects.reduce((s, b) => s + b.question_count, 0)

  return (
    <Stack gap="lg">
      <SubjectPieChart data={subjects} />
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 form-scrollbar">
        {subjects.map((sub, idx) => (
          <div key={sub.id} id={`subject-${sub.subject_name}`}>
            <SubjectCardItem
              subject={sub}
              index={idx}
              isSelected={selectedSubject === sub.subject_name}
              onQuestionCountChange={(value) => onQuestionCountChange(idx, value)}
              onMarksChange={(value) => onMarksChange(idx, value)}
              onBlur={onSubjectBlur}
            />
          </div>
        ))}
      </div>
      <Stack direction="row" justify="between" className="pt-4 border-t border-border-subtle/50">
        <AdminText variant="cinzel" className="text-primary font-semibold text-[12px]">Running Total Questions</AdminText>
        <Badge variant={runningTotal === configTotalQuestions ? 'success' : 'danger'}
          className="!font-semibold !text-[12px]">
          {runningTotal} / {configTotalQuestions}
        </Badge>
      </Stack>
      {error && (
        <span id="subject-sum-error" role="alert" aria-live="polite" className="flex items-center gap-1.5 text-danger text-[10px] font-bold uppercase tracking-wider">
          <AlertCircle size={14} /> {error}
        </span>
      )}
    </Stack>
  )
})
