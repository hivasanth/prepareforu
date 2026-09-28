import React from 'react'
import type { AdminLeaderboardEntry } from '../../../types/leaderboard.types'
import { formatDuration } from '../../../utils/timeUtils'
import { RankBadge } from './RankBadge'
import { LEADERBOARD_GRID, LEADERBOARD_CELL, LEADERBOARD_GRID_INSET } from './leaderboardGrid'
import { format, parseISO } from 'date-fns'
import { Avatar, Card, FloatingList, FloatingListHeader, FloatingListItem, Pill } from '../../common/AntigravityUI'

interface LeaderboardViewProps {
  data: AdminLeaderboardEntry[]
}

export const LeaderboardView = React.memo(function LeaderboardView({ data }: LeaderboardViewProps) {
  return (
    <Card variant="elevated" className="animate-in">
      <FloatingList gap="sm">
        {/* ═══ Header ══════════════════════════════════════════════════════ */}
        <FloatingListHeader padding="none">
          {/* py-4 matches the Admin Users table header height (UsersTable:
              FloatingListHeader padding="md" → p-4 + label line ≈ 49-50px).
              Vertical-only so the shared grid's horizontal origin — and thus
              header ↔ row alignment — is untouched. */}
          <div className={`${LEADERBOARD_GRID} ${LEADERBOARD_GRID_INSET} py-4 text-[11px] md:text-xs font-bold text-text-muted light:text-[var(--gold-300)] uppercase tracking-widest`}>
            <span className={LEADERBOARD_CELL.rank}>Rank</span>
            <span className={`${LEADERBOARD_CELL.name} pl-2 md:pl-3`}>Participant</span>
            <span className={LEADERBOARD_CELL.score}>Score</span>
            <span className={LEADERBOARD_CELL.duration}>Duration</span>
            <span className={LEADERBOARD_CELL.attempts}>Attempts</span>
            <span className={LEADERBOARD_CELL.date}>Last Active</span>
          </div>
        </FloatingListHeader>

        {/* ═══ Rows ═══════════════════════════════════════════════════════ */}
        {data.map((entry) => {
          const key = `${entry.user_id}-${entry.exam_id}-${entry.paper_id || ''}`

          return (
            <FloatingListItem key={key} padding="none">
              <div className={`${LEADERBOARD_GRID} ${LEADERBOARD_GRID_INSET} py-3 md:py-4`}>
                <div className={LEADERBOARD_CELL.rank}>
                  <RankBadge rank={entry.rank || 0} />
                </div>

                <div className={`${LEADERBOARD_CELL.name} flex items-center gap-3 pl-2 md:pl-3`}>
                  <Avatar name={entry.user_name} size="md" shape="square" decorative />
                  <div className="min-w-0">
                    <p className="text-sm md:text-base font-bold uppercase tracking-tight truncate text-text-primary">
                      {entry.user_name}
                    </p>
                  </div>
                </div>

                <div className={`${LEADERBOARD_CELL.score} flex justify-center`}>
                  <Pill variant="success">{entry.best_score}</Pill>
                </div>

                <div className={`${LEADERBOARD_CELL.duration} flex justify-center`}>
                  <Pill variant="info">{formatDuration(entry.best_time_secs)}</Pill>
                </div>

                <div className={`${LEADERBOARD_CELL.attempts} flex justify-center`}>
                  <Pill variant="neutral">{entry.total_attempts}</Pill>
                </div>

                <div className={`${LEADERBOARD_CELL.date} flex justify-center`}>
                  <span className="text-sm md:text-base font-semibold text-text-secondary">
                    {format(parseISO(entry.last_attempt_date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </FloatingListItem>
          )
        })}
      </FloatingList>
    </Card>
  )
})
