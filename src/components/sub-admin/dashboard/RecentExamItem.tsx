import { memo } from 'react'
import { ExamCard } from '../exams/ExamCard'
import type { SubAdminRecentExams } from './types'

interface RecentExamItemProps {
  exam: SubAdminRecentExams
  onClick: (exam: SubAdminRecentExams) => void
}

/* Renders the SAME exam container used on the My Exams page (ExamCard) so the
 * dashboard "Recent Deployments" cards look identical to the exam list. */
export default memo(function RecentExamItem({ exam, onClick }: RecentExamItemProps) {
  return (
    <ExamCard
      exam={{
        id: exam.id,
        title: exam.title,
        status: exam.status,
        total_questions: exam.total_questions,
        total_marks: exam.total_marks,
        created_at: exam.created_at,
      }}
      onSelect={() => onClick(exam)}
    />
  )
})