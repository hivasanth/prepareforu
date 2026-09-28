import { useMemo, type ReactNode } from 'react'
import {
  Avatar, Card, FloatingList, FloatingListHeader, FloatingListItem, Pill, SectionHeader,
} from '../../../components/common/AntigravityUI'
import { RankBadge } from '../../../components/admin/leaderboard/RankBadge'
import { useExamResponsive } from './useExamResponsive'
import { Award, ChevronUp, ChevronDown } from 'lucide-react'
import { toAdminLeaderboardEntries, type AttemptRow } from './types'
import type { AdminLeaderboardEntry } from '../../../types/leaderboard.types'

interface ExamPerformersProps {
  attempts: AttemptRow[]
  examId: string
  examTitle: string
}

/* Compact Rank · Participant · Score boards (same wrapper container as the
 * Leaderboard section) for the Top 5 and Bottom 5 performer groups. Ranks are
 * the exam-wide ranks produced by toAdminLeaderboardEntries (per-student best
 * score), so the score shown is that student's score in this particular exam. */
export function ExamPerformers({ attempts, examId, examTitle }: ExamPerformersProps) {
  const { isMobile } = useExamResponsive()
  const entries = useMemo(
    () => toAdminLeaderboardEntries(attempts, examId, examTitle),
    [attempts, examId, examTitle],
  )
  const top = entries.slice(0, 5)
  const bottom = [...entries.slice(-5)].reverse()

  return (
    <section aria-label="Top and bottom performers">
      <SectionHeader title="Top & Bottom Performers" icon={Award} />
      <div className={`mt-3 ${isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}`}>
        <PerformerBoard title="Top 5" icon={<ChevronUp size={14} className="text-green-500" />} entries={top} />
        <PerformerBoard title="Bottom 5" icon={<ChevronDown size={14} className="text-red-400" />} entries={bottom} />
      </div>
    </section>
  )
}

const PERFORMER_GRID = 'grid w-full min-w-0 grid-cols-[48px_minmax(0,1fr)_88px] items-center gap-x-2.5'

function PerformerBoard({ title, icon, entries }: { title: string; icon: ReactNode; entries: AdminLeaderboardEntry[] }) {
  return (
    <Card variant="elevated" className="animate-in">
      <FloatingList gap="sm">
        <FloatingListHeader padding="none">
          <div className="flex items-center gap-2 py-4">
            {icon}
            <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">{title}</span>
          </div>
        </FloatingListHeader>
        {entries.map((entry) => (
          <FloatingListItem
            key={`${entry.user_id}-${entry.exam_id}-${entry.paper_id || ''}`}
            padding="none"
          >
            <div className={`${PERFORMER_GRID} py-3 md:py-4`}>
              <RankBadge rank={entry.rank || 0} />
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={entry.user_name} size="sm" shape="square" decorative />
                <p className="text-sm md:text-base font-bold uppercase tracking-tight truncate text-text-primary">
                  {entry.user_name}
                </p>
              </div>
              <div className="flex justify-end">
                <Pill variant="success">{entry.best_score}</Pill>
              </div>
            </div>
          </FloatingListItem>
        ))}
      </FloatingList>
    </Card>
  )
}