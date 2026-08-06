import { memo } from 'react'
import { Card } from '../../common/AntigravityUI'
import { LeaderboardRow } from './LeaderboardComponents'
import type { LeaderboardEntry } from './types'

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  userId: string;
  isMobile: boolean;
  formatDuration: (secs?: number) => string;
}

export const LeaderboardTable = memo(function LeaderboardTable({
  leaderboard,
  userId,
  isMobile,
  formatDuration,
}: LeaderboardTableProps) {
  return (
    <Card className="shadow-2xl overflow-hidden p-0 border-none">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-hover-bg/50 border-b border-border-subtle">
              <th className="px-4 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-widest text-center w-16 md:w-24">Rank</th>
              <th className="px-4 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-widest text-left">Student</th>
              <th className="hidden sm:table-cell px-4 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-widest text-center w-24">Score</th>
              <th className="hidden md:table-cell px-4 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-widest text-center w-32">Accuracy</th>
              <th className="hidden lg:table-cell px-4 py-4 text-[11px] font-semibold text-text-secondary uppercase tracking-widest text-center w-24">Time</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <LeaderboardRow
                key={entry.user_id}
                entry={entry}
                isMe={entry.user_id === userId}
                isMobile={isMobile}
                formatDuration={formatDuration}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
})
