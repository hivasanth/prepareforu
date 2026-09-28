import { memo } from 'react'
import {
  Avatar,
  Pill,
  FloatingList,
  FloatingListHeader,
  FloatingListItem,
  ErrorContainer,
  RetryButton,
} from '../../common/AntigravityUI'
import { Skeleton } from '../../common/Skeleton'
import { EmptyState } from '../../common/SharedComponents'
import { RankBadge } from '../../admin/leaderboard/RankBadge'
import type { MemoryLeaderboardEntry } from '../../../types/memoryGame.types'
import type { PageError, PageErrorState, RetryFn } from '../../../types/error.types'

/* Three-column daily leaderboard grid: RANK | PARTICIPANT | SCORE. Mirrors the
   certified admin leaderboard grid contract (fixed semantic track sizes +
   one shared horizontal inset) so the header and every row share an identical
   content-box origin by construction. */
const MEMORY_LB_GRID = [
  'grid w-full min-w-0 items-center',
  'grid-cols-[56px_minmax(0,1fr)_96px]',
  'md:grid-cols-[64px_minmax(0,1fr)_112px]',
  'gap-x-3',
].join(' ')

const MEMORY_LB_INSET = 'px-1'

const MEMORY_LB_CELL = {
  rank: 'text-center',
  name: 'min-w-0',
  score: 'text-center',
} as const

export interface MemoryLeaderboardProps {
  leaderboard: MemoryLeaderboardEntry[]
  loading: boolean
  errorState: PageErrorState
  pageError: PageError | null
  retryError: RetryFn
  topLimit: number
  /** Used solely to highlight the signed-in user's own row via the "You" pill. */
  currentUserId: string
}

/**
 * Today's Top Scores — the daily Number Memory Rush board. Reuses the Admin
 * leaderboard presentation (RankBadge, Avatar, Pill, FloatingList) and the
 * same three-column grid contract the dialog consumed, without any overlay.
 * State is distinct and explicit: loading → error → empty → data. An empty
 * board is an empty state, never an error.
 */
export const MemoryLeaderboard = memo(function MemoryLeaderboard({
  leaderboard,
  loading,
  errorState,
  pageError,
  retryError,
  topLimit,
  currentUserId,
}: MemoryLeaderboardProps) {
  const showError = errorState === 'error' && pageError !== null
  const showEmpty = !loading && !showError && leaderboard.length === 0
  const skeletonCount = Math.min(6, topLimit)

  return (
    <div
      className="flex flex-col gap-4"
      role="status"
      aria-live="polite"
      aria-label="Leaderboard status"
      aria-busy={loading}
    >
      {showError && pageError ? (
        <ErrorContainer
          category={pageError.category}
          severity={pageError.severity}
          variant="inline"
          padding={16}
        >
          <p className="text-sm font-black text-text-primary">{pageError.title}</p>
          <p className="text-xs font-semibold text-text-secondary">{pageError.message}</p>
          <RetryButton onRetry={retryError} size="sm" />
        </ErrorContainer>
      ) : loading && leaderboard.length === 0 ? (
        <FloatingList gap="sm" className="w-full">
          {Array.from({ length: skeletonCount }, (_, index) => (
            <FloatingListItem key={index} padding="md" className="pointer-events-none">
              <div className={`${MEMORY_LB_GRID} ${MEMORY_LB_INSET}`}>
                <div className={MEMORY_LB_CELL.rank}>
                  <Skeleton width={40} height={24} borderRadius={999} decorative />
                </div>
                <div className={`${MEMORY_LB_CELL.name} flex items-center gap-3 pl-2 md:pl-3`}>
                  <Skeleton width={36} height={36} borderRadius={8} decorative />
                  <Skeleton width="55%" height={14} borderRadius={4} decorative />
                </div>
                <div className={MEMORY_LB_CELL.score}>
                  <Skeleton width={38} height={20} borderRadius={999} decorative />
                </div>
              </div>
            </FloatingListItem>
          ))}
        </FloatingList>
      ) : showEmpty ? (
        <EmptyState
          variant="management"
          icon="🏆"
          title="No scores yet today"
          subtitle="No one has cleared a run today yet. Play a round and take the top spot."
        />
      ) : (
        <FloatingList gap="sm" className="w-full">
          <FloatingListHeader variant="management" padding="none">
            <div className={`${MEMORY_LB_GRID} ${MEMORY_LB_INSET} py-3 text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-widest`}>
              <span className={MEMORY_LB_CELL.rank}>Rank</span>
              <span className={`${MEMORY_LB_CELL.name} pl-2 md:pl-3`}>Player</span>
              <span className={MEMORY_LB_CELL.score}>Score</span>
            </div>
          </FloatingListHeader>

          {leaderboard.map((entry) => {
            const isSelf = currentUserId !== '' && entry.userId === currentUserId
            const key = `${entry.rank}-${entry.userId || entry.displayName}`
            return (
              <FloatingListItem key={key} padding="none" selected={isSelf}>
                <div className={`${MEMORY_LB_GRID} ${MEMORY_LB_INSET} py-3`}>
                  <div className={MEMORY_LB_CELL.rank}>
                    <RankBadge rank={entry.rank} />
                  </div>
                  <div className={`${MEMORY_LB_CELL.name} flex items-center gap-3 pl-2 md:pl-3 min-w-0`}>
                    <Avatar name={entry.displayName} size="md" shape="square" decorative />
                    <div className="min-w-0 flex-1 flex items-center gap-2 overflow-hidden">
                      <p className="text-sm md:text-base font-bold uppercase tracking-tight truncate text-text-primary">
                        {entry.displayName}
                      </p>
                      {isSelf && (
                        <Pill size="xs" variant="primary" inline>
                          You
                        </Pill>
                      )}
                    </div>
                  </div>
                  <div className={MEMORY_LB_CELL.score}>
                    <Pill variant="success">{entry.score}</Pill>
                  </div>
                </div>
              </FloatingListItem>
            )
          })}
        </FloatingList>
      )}
    </div>
  )
})