import { format, parseISO } from 'date-fns'
import { Clock, BarChart2, Target, Calendar } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'
import { Badge } from '../../common/AntigravityUI'
import { formatDuration } from '../../../lib/leaderboardUtils'
import { RankBadge } from './RankBadge'
import type { LeaderboardEntry } from '../../../types/leaderboard.types'

interface LeaderboardMobileCardProps {
  entry: LeaderboardEntry
}

export function LeaderboardMobileCard({ entry }: LeaderboardMobileCardProps) {
  const { isDark } = useTheme()

  return (
    <div
      className={`${!isDark ? 'ancient-card shadow-md border-[var(--ancient-gold)]/10' : 'bg-card-bg border border-border-subtle shadow-sm'} rounded-2xl p-4 flex flex-col gap-4 active:scale-[0.98] transition-all`}
    >
      <div className={`flex items-center justify-between border-b pb-3 ${!isDark ? 'border-[var(--ancient-gold)]/10' : 'border-border-subtle'}`}>
        <div className="flex items-center gap-3">
          <RankBadge rank={entry.rank || 0} />
          <span className={`text-sm font-black uppercase tracking-tight truncate max-w-[150px] ${!isDark ? 'font-garamond text-base text-[var(--ancient-brown-deep)]' : 'text-text-primary'}`}>
            {entry.user_name}
          </span>
        </div>
        <Badge variant="primary" className="!h-6 !px-2 !text-[9px]">
          {entry.exam_id.split('_').slice(-1)}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-hover-bg/40">
          <BarChart2 size={14} className="text-primary" />
          <div className="flex flex-col">
            <span className="text-[9px] text-text-secondary font-black uppercase tracking-tighter">Score</span>
            <span className="text-xs font-black text-text-primary underline decoration-primary/30 decoration-2 underline-offset-2">{entry.best_score}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-xl bg-hover-bg/40">
          <Target size={14} className="text-secondary" />
          <div className="flex flex-col">
            <span className="text-[9px] text-text-secondary font-black uppercase tracking-tighter">Accuracy</span>
            <span className="text-xs font-black text-text-primary">{entry.best_accuracy}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-xl bg-hover-bg/40">
          <Clock size={14} className="text-warning" />
          <div className="flex flex-col">
            <span className="text-[9px] text-text-secondary font-black uppercase tracking-tighter">Time</span>
            <span className="text-xs font-black text-text-primary">{formatDuration(entry.best_time_secs)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-xl bg-hover-bg/40">
          <Calendar size={14} className="text-text-secondary" />
          <div className="flex flex-col">
            <span className="text-[9px] text-text-secondary font-black uppercase tracking-tighter">Date</span>
            <span className="text-[10px] font-black text-text-primary">
              {format(parseISO(entry.last_attempt_date), 'MMM dd')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
