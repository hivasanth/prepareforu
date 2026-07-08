import { format, parseISO } from 'date-fns'
import { formatDuration } from '../../../lib/leaderboardUtils'
import { RankBadge } from './RankBadge'
import type { LeaderboardEntry } from '../../../types/leaderboard.types'

interface LeaderboardTabletCardProps {
  entry: LeaderboardEntry
}

export function LeaderboardTabletCard({ entry }: LeaderboardTabletCardProps) {
  return (
    <div className="bg-card-bg border border-border-subtle rounded-3xl p-5 flex flex-col gap-5 hover:border-primary/40 transition-all shadow-sm">
      <div className="flex items-center gap-4">
        <RankBadge rank={entry.rank || 0} />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-black text-text-primary tracking-tight truncate leading-tight">
            {entry.user_name}
          </span>
          <span className="text-[10px] text-text-secondary font-bold tracking-widest uppercase opacity-70">
            {entry.exam_id.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-4 mt-auto">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-text-secondary font-black uppercase tracking-tighter">Score</span>
          <span className="text-sm font-black text-primary underline decoration-primary/20">{entry.best_score}</span>
        </div>
        <div className="h-8 w-px bg-border-subtle opacity-50" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-text-secondary font-black uppercase tracking-tighter">Acc</span>
          <span className="text-sm font-black text-text-primary">{entry.best_accuracy}%</span>
        </div>
        <div className="h-8 w-px bg-border-subtle opacity-50" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-text-secondary font-black uppercase tracking-tighter">Time</span>
          <span className="text-sm font-black text-text-primary">{formatDuration(entry.best_time_secs)}</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-[10px] text-text-secondary font-bold">
          {format(parseISO(entry.last_attempt_date), 'MMMM dd, yyyy')}
        </span>
      </div>
    </div>
  )
}
