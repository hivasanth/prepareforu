import { format, parseISO } from 'date-fns'
import { formatDuration } from '../../../utils/timeUtils'
import { RankBadge } from './RankBadge'
import { Card } from '../../common/AntigravityUI'
import type { LeaderboardEntry } from '../../../types/leaderboard.types'

interface LeaderboardTabletCardProps {
  entry: LeaderboardEntry
}

export function LeaderboardTabletCard({ entry }: LeaderboardTabletCardProps) {
  return (
    <Card variant="premium-neutral" padding={20} className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <RankBadge rank={entry.rank || 0} />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-text-primary tracking-tight truncate leading-tight">
            {entry.user_name}
          </span>
          <span className="text-[10px] text-text-secondary font-semibold tracking-wide uppercase">
            {entry.exam_id.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-4 mt-auto">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wide">Score</span>
          <span className="text-sm font-black text-primary underline decoration-primary/20">{entry.best_score}</span>
        </div>
        <div className="h-8 w-px bg-border-subtle opacity-50" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wide">Acc</span>
          <span className="text-sm font-black text-text-primary">{entry.best_accuracy}%</span>
        </div>
        <div className="h-8 w-px bg-border-subtle opacity-50" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wide">Time</span>
          <span className="text-sm font-black text-text-primary">{formatDuration(entry.best_time_secs)}</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-[10px] text-text-muted font-semibold">
          {format(parseISO(entry.last_attempt_date), 'MMMM dd, yyyy')}
        </span>
      </div>
    </Card>
  )
}
