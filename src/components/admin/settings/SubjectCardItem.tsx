import { useTheme } from '../../../context/ThemeContext'
import { Stack, Grid, Input, Label, Badge } from '../../common/AntigravityUI'

interface SubjectCardItemProps {
  subject: { id: string; subject_name: string; question_count: number; marks_per_question: number }
  index: number
  isSelected: boolean
  onQuestionCountChange: (value: number) => void
  onMarksChange: (value: number) => void
}

export function SubjectCardItem({
  subject,
  index,
  isSelected,
  onQuestionCountChange,
  onMarksChange,
}: SubjectCardItemProps) {
  const { isDark } = useTheme()

  return (
    <Stack
      gap="sm"
      className={`p-4 rounded-2xl border-2 transition-all duration-300 ancient-3d-lift ${
        isSelected
          ? (!isDark
              ? 'bg-[var(--ancient-cream)] border-primary shadow-xl scale-[1.03] z-20'
              : 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]')
          : (!isDark
              ? 'bg-white/40 border-primary/10'
              : 'bg-hover-bg/30 border-border-subtle/50')
      }`}
    >
      <Stack direction="row" justify="between" align="center">
        <Label className={isSelected ? 'text-primary font-black' : ''}>
          #{index + 1} {subject.subject_name}
        </Label>
        {isSelected && (
          <Badge variant="secondary" className="text-[8px] animate-pulse !bg-secondary !text-[#1C0F0A]">Selected</Badge>
        )}
      </Stack>
      <Grid cols={2} gap={10}>
        <Stack gap="xs">
          <Label>Questions</Label>
          <Input type="number" value={subject.question_count} onChange={(e) => onQuestionCountChange(Number(e.target.value))} />
        </Stack>
        <Stack gap="xs">
          <Label>Marks/Q</Label>
          <Input type="number" value={subject.marks_per_question} onChange={(e) => onMarksChange(Number(e.target.value))} />
        </Stack>
      </Grid>
    </Stack>
  )
}
