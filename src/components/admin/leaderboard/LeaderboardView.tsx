import React from 'react'
import type { LeaderboardEntry } from '../../../types/leaderboard.types'
import { formatDuration } from '../../../utils/timeUtils'
import { RankBadge } from './RankBadge'
import { format, parseISO } from 'date-fns'
import { LeaderboardMobileCard } from './LeaderboardMobileCard'
import { LeaderboardTabletCard } from './LeaderboardTabletCard'
import { Card } from '../../common/AntigravityUI'

interface LeaderboardViewProps {
  data: LeaderboardEntry[]
}

export const LeaderboardView = React.memo(function LeaderboardView({ data }: LeaderboardViewProps) {
  const topThree = data.slice(0, 3)

  return (
    <>
      {/* ── Mobile View (xs) ── */}
      <div className="flex sm:hidden flex-col gap-3">
        {data.map((entry) => (
          <LeaderboardMobileCard key={entry.user_id + entry.exam_id + (entry.paper_id || '')} entry={entry} />
        ))}
      </div>

      {/* ── Small Tablet View (sm) ── */}
      <div className="hidden sm:grid md:hidden grid-cols-2 gap-4">
        {data.map((entry) => (
          <LeaderboardTabletCard key={entry.user_id + entry.exam_id + (entry.paper_id || '')} entry={entry} />
        ))}
      </div>

      {/* ── Tablet+ View (md, lg, xl) ── */}
      <div className="hidden md:block">
        {/* Top 3 Highlights (md only) */}
        <div className="grid grid-cols-3 gap-6 mb-8 xl:hidden">
          {topThree.map((entry) => (
            <div
              key={entry.user_id + entry.exam_id + (entry.paper_id || '')}
              className={`relative bg-card-bg border rounded-[24px] p-6 flex flex-col items-center text-center gap-4 shadow-xl transition-transform hover:scale-105 ${
                entry.rank === 1 ? 'border-warning/40 scale-110 z-10' : 'border-border-subtle'
              }`}
            >
              <div className="absolute -top-4">
                <RankBadge rank={entry.rank || 0} />
              </div>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg ${
                entry.rank === 1 ? 'bg-warning shadow-warning/20' :
                entry.rank === 2 ? 'bg-secondary shadow-secondary/20' :
                'bg-primary shadow-primary/20'
              }`}>
                {entry.user_name[0]}
              </div>
              <div className="min-w-0 w-full px-2">
                <p className="text-sm font-bold text-text-primary truncate uppercase tracking-tighter">{entry.user_name}</p>
                <p className="text-[10px] text-text-secondary font-semibold tracking-wide">{entry.exam_id.split('_').pop()}</p>
              </div>
              <div className="bg-hover-bg/50 px-4 py-2 rounded-2xl border border-border-subtle w-full">
                <span className="text-lg font-black text-primary">{entry.best_score}</span>
                <span className="text-[10px] text-text-muted font-semibold block tracking-wide leading-none">SCORE</span>
              </div>
            </div>
          ))}
        </div>

        {/* Full Table (md+) */}
        <Card className="shadow-2xl overflow-hidden p-0 border-none">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse min-w-[600px] lg:min-w-[800px] xl:min-w-[1000px]">
              <thead className="sticky top-0 z-20">
                <tr className="bg-card-bg/80 border-border-subtle backdrop-blur-xl border-b">
                  <th scope="col" className="px-6 md:px-8 lg:px-10 py-5 md:py-6 text-left text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    <span className="md:hidden">#</span>
                    <span className="hidden md:inline">Rank</span>
                  </th>
                  <th scope="col" className="px-6 md:px-8 lg:px-10 py-5 md:py-6 text-left text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    <span className="md:hidden lg:hidden">User</span>
                    <span className="hidden lg:inline">Participant</span>
                  </th>
                  <th scope="col" className="px-4 md:px-6 lg:px-8 py-5 md:py-6 text-center text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    Score
                  </th>
                  <th scope="col" className="px-4 md:px-6 lg:px-8 py-5 md:py-6 text-center text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    <span className="md:hidden lg:hidden">Acc</span>
                    <span className="hidden lg:inline">Accuracy</span>
                  </th>
                  <th scope="col" className="px-4 md:px-6 lg:px-8 py-5 md:py-6 text-center text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    <span className="md:hidden lg:hidden">Time</span>
                    <span className="hidden lg:inline">Duration</span>
                  </th>
                  <th scope="col" className="hidden xl:table-cell px-8 py-6 text-center text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    Attempts
                  </th>
                  <th scope="col" className="hidden xl:table-cell px-8 py-6 text-right text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/20">
                {data.map((entry) => (
                  <tr key={entry.user_id + entry.exam_id + (entry.paper_id || '')} className="group transition-colors hover:bg-primary/[0.02]">
                    <td className="px-6 md:px-8 lg:px-10 py-4 md:py-5">
                      <RankBadge rank={entry.rank || 0} />
                    </td>
                    <td className="px-6 md:px-8 lg:px-10 py-4 md:py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center text-[10px] lg:text-xs font-black shadow-lg group-hover:rotate-12 transition-transform bg-primary text-white shadow-primary/20">
                          {entry.user_name[0].toUpperCase()}
                        </div>
                        <span className="text-[11px] lg:text-sm font-bold uppercase tracking-tight group-hover:text-primary transition-colors truncate max-w-[120px] lg:max-w-[200px] text-text-primary">
                          {entry.user_name}
                        </span>
                        <span className="hidden xl:inline text-[10px] font-semibold font-mono text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                          ID: {entry.user_id.substring(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 lg:px-8 py-4 md:py-5 text-center">
                      <span className="text-xs lg:text-sm font-black text-primary underline decoration-primary/20 decoration-wavy underline-offset-2 lg:underline-offset-4">{entry.best_score}</span>
                    </td>
                    <td className="px-4 md:px-6 lg:px-8 py-4 md:py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] lg:text-sm font-black text-text-primary">{entry.best_accuracy}%</span>
                        <div className="hidden lg:block w-12 h-1 bg-secondary/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-secondary transition-all" style={{ width: `${entry.best_accuracy}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 lg:px-8 py-4 md:py-5 text-center text-[11px] lg:text-xs font-bold text-text-secondary">
                      {formatDuration(entry.best_time_secs)}
                    </td>
                    <td className="hidden xl:table-cell px-8 py-5 text-center">
                      <span className="text-xs font-black text-text-primary">{entry.total_attempts}</span>
                    </td>
                    <td className="hidden xl:table-cell px-8 py-5 text-right font-mono text-[10px] text-text-muted font-semibold">
                      {format(parseISO(entry.last_attempt_date), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  )
})
