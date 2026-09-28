import { useMemo } from 'react'
import { SectionHeader } from '../../../components/common/AntigravityUI'
import { EmptyState } from '../../../components/common/SharedComponents'
import { LeaderboardView as AdminLeaderboardView } from '../../admin/leaderboard/LeaderboardView'
import { Trophy } from 'lucide-react'
import { toAdminLeaderboardEntries, type AttemptRow } from './types'

interface ExamLeaderboardSectionProps {
  attempts: AttemptRow[]
  examId: string
  examTitle: string
}

/* Reuses the shared admin LeaderboardView — the SAME reusable component the
 * admin page and the former Dashboard exam-details flow used: RankBadge pills,
 * monogram avatars, Pill scores/accuracy, FloatingList header and the admin
 * 6-column contract. Data is aggregated per student (best score) so the
 * columns read identically. */
export function ExamLeaderboardSection({ attempts, examId, examTitle }: ExamLeaderboardSectionProps) {
  const entries = useMemo(
    () => toAdminLeaderboardEntries(attempts, examId, examTitle),
    [attempts, examId, examTitle],
  )

  return (
    <section aria-label="Leaderboard">
      <SectionHeader title="Leaderboard" icon={Trophy} />
      <div className="mt-3">
        {entries.length === 0 ? (
          <EmptyState icon={<Trophy size={48} />} title="No Attempts" subtitle="No students have attempted this exam yet." />
        ) : (
          <AdminLeaderboardView data={entries} />
        )}
      </div>
    </section>
  )
}
