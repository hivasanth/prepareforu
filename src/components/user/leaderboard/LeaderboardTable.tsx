import { memo } from 'react'
import { SelectionContainer } from '../../common/AntigravityLayout'
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
    <div className="flex flex-col gap-3">
      {/* Header — SelectionContainer material */}
      <SelectionContainer>
        <div className="flex items-center w-full">
          <th className="px-4 py-2 text-[11px] font-semibold text-text-secondary uppercase tracking-widest text-center w-16 md:w-24">Rank</th>
          <th className="px-4 py-2 text-[11px] font-semibold text-text-secondary uppercase tracking-widest text-left flex-1">Student</th>
          <th className="hidden sm:block px-4 py-2 text-[11px] font-semibold text-text-secondary uppercase tracking-widest text-center w-24">Score</th>
          <th className="hidden md:block px-4 py-2 text-[11px] font-semibold text-text-secondary uppercase tracking-widest text-center w-32">Accuracy</th>
          <th className="hidden lg:block px-4 py-2 text-[11px] font-semibold text-text-secondary uppercase tracking-widest text-center w-24">Time</th>
        </div>
      </SelectionContainer>

      {/* Items — independent floating table rows */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
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
    </div>
  )
})
