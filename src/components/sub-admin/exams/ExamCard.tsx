import { memo, useCallback } from 'react'
import { Badge, Card, Label, Stack } from '../../../components/common/AntigravityUI'
import { AdminText } from '../../../components/common/AdminText'
import { BookOpen, Clock, Radio } from 'lucide-react'

export interface ExamCardExam {
  id: string
  title: string
  status?: string | null
  total_questions: number
  total_marks: number
  created_at: string
}

interface ExamCardProps {
  exam: ExamCardExam
  onSelect: (id: string) => void
  /** Renders a LIVE indicator (used by the My Exams LIVE view only). */
  isLive?: boolean
}

/* The canonical exam container — source of truth for BOTH the My Exams list
 * and the dashboard "Recent Deployments" section so both places stay visually
 * identical. */
export const ExamCard = memo(function ExamCard({ exam, onSelect, isLive = false }: ExamCardProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(exam.id)
    }
  }, [exam.id, onSelect])

  return (
    <Card
      variant="premium-neutral"
      className="p-6 flex flex-col h-full group relative cursor-pointer"
      onClick={() => onSelect(exam.id)}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`View exam: ${exam.title}`}
    >
      <div className="flex flex-wrap items-start justify-end gap-1.5 mb-4">
        <Badge variant={exam.status === 'published' ? 'success' : 'warning'} curved>
          {exam.status || 'Draft'}
        </Badge>
        {isLive && (
          <Badge variant="success" curved className="flex items-center gap-1">
            <Radio size={11} />
            Live
          </Badge>
        )}
      </div>

      <div className="space-y-2 mb-6">
        <AdminText as="h3" variant="cinzel" className="font-bold text-text-primary text-lg leading-tight uppercase group-hover:text-primary transition-interaction duration-fast ease-standard truncate">
          {exam.title}
        </AdminText>
        <div className="flex items-center gap-2 text-[var(--text-muted)] font-bold text-[11px] uppercase tracking-widest">
          <Clock size={12} />
          {new Date(exam.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border-subtle/30 flex items-center justify-between">
        <Stack gap="xs">
          <Label>Questions</Label>
          <span className="text-sm font-black text-text-primary">{exam.total_questions}</span>
        </Stack>
        <div className="w-px h-8 bg-border-subtle/30" />
        <Stack gap="xs" align="end">
          <Label>Total Marks</Label>
          <span className="text-sm font-black text-text-primary">
            {exam.total_marks}
          </span>
        </Stack>
      </div>

      <div className="absolute -bottom-6 -right-6 opacity-[0.03] text-text-primary pointer-events-none">
        <BookOpen size={120} strokeWidth={1} />
      </div>
    </Card>
  )
})