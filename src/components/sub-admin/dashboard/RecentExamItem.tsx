import { memo, useCallback } from 'react'
import { LayoutGrid, Clock, ChevronRight } from 'lucide-react'
import { Card, Badge, Stack } from '../../common/AntigravityUI'
import { AdminText } from '../../common/AdminText'
import type { SubAdminRecentExams } from './types'

interface RecentExamItemProps {
  exam: SubAdminRecentExams
  onClick: (exam: SubAdminRecentExams) => void
}

export default memo(function RecentExamItem({ exam, onClick }: RecentExamItemProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(exam)
    }
  }, [exam, onClick])

  return (
    <Card
      variant="premium-neutral"
      className="group cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`${exam.title}, ${exam.total_questions} questions, ${exam.duration_minutes || 0} minutes, status: ${exam.status}`}
      onClick={() => onClick(exam)}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between mb-2">
        <AdminText as="h4" variant="cinzel" className="font-bold text-text-primary uppercase tracking-tight truncate flex-1 mr-4">
          {exam.title}
        </AdminText>
        <Badge variant={exam.status === 'published' ? 'primary' : 'default'}>
          {exam.status}
        </Badge>
      </div>
      <Stack direction="row" gap="md" align="center">
        <Stack direction="row" gap="xs" align="center">
          <LayoutGrid size={12} className="text-primary opacity-60" aria-hidden="true" />
          <span className="text-[10px] font-bold text-[var(--text-muted)]">{exam.total_questions} Qs</span>
        </Stack>
        <Stack direction="row" gap="xs" align="center">
          <Clock size={12} className="text-warning opacity-60" aria-hidden="true" />
          <span className="text-[10px] font-bold text-[var(--text-muted)]">{exam.duration_minutes || 0}m</span>
        </Stack>
        <Stack direction="row" gap="xs" align="center" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-bold uppercase text-primary">Details</span>
          <ChevronRight size={12} className="text-primary" aria-hidden="true" />
        </Stack>
      </Stack>
    </Card>
  )
})
