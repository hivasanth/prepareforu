import { memo } from 'react'
import { Stack, Grid, Input, Label, Badge } from '../../common/AntigravityUI'

interface SubjectCardItemProps {
  subject: { id: string; subject_name: string; question_count: number; marks_per_question: number }
  index: number
  isSelected: boolean
  onQuestionCountChange: (value: number) => void
  onMarksChange: (value: number) => void
  onBlur?: () => void
}

export const SubjectCardItem = memo(function SubjectCardItem({
  subject,
  index,
  isSelected,
  onQuestionCountChange,
  onMarksChange,
  onBlur,
}: SubjectCardItemProps) {
  return (
    <Stack
      gap="sm"
      className={`p-4 rounded-2xl border-2 transition-all duration-300 ancient-3d-lift ${
        isSelected
          ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] scale-[1.03] z-20'
          : 'bg-hover-bg/30 border-border-subtle/50'
      }`}
    >
      <Stack direction="row" justify="between" align="center">
        <Label className={isSelected ? 'text-primary font-bold' : ''}>
          #{index + 1} {subject.subject_name}
        </Label>
        {isSelected && (
          <Badge variant="secondary" className="text-[8px] animate-pulse !bg-secondary !text-text-title">Selected</Badge>
        )}
      </Stack>
      <Grid cols={2} gap={10}>
        <Stack gap="xs">
          <Label htmlFor={`subject-count-${index}`}>Questions</Label>
          <Input
            id={`subject-count-${index}`}
            type="number"
            value={subject.question_count}
            onChange={(e) => onQuestionCountChange(Number(e.target.value))}
            onBlur={onBlur}
            aria-label={`Questions for ${subject.subject_name}`}
          />
        </Stack>
        <Stack gap="xs">
          <Label htmlFor={`subject-marks-${index}`}>Marks/Q</Label>
          <Input
            id={`subject-marks-${index}`}
            type="number"
            value={subject.marks_per_question}
            onChange={(e) => onMarksChange(Number(e.target.value))}
            onBlur={onBlur}
            aria-label={`Marks per question for ${subject.subject_name}`}
          />
        </Stack>
      </Grid>
    </Stack>
  )
})
