import './../../components/user/memory-games/memoryGames.css'
import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, WifiOff } from 'lucide-react'
import { Card } from '../../components/common/AntigravityCard'
import { Alert, Button, Pill } from '../../components/common/AntigravityUI'
import { MemoryLeaderboard } from '../../components/user/memory-games/MemoryLeaderboard'
import { useAuth } from '../../context/AuthContext'
import { useMemoryGameLeaderboard } from '../../hooks/useMemoryGameLeaderboard'
import {
  getMemoryGameCatalogEntry,
  isMemoryGameId,
  NUMBER_MEMORY_RUSH_GAME_ID,
} from '../../config/memoryGames'

/**
 * Memory Games — Today's Daily Leaderboard (`/memory-games/leaderboard?game=<id>`).
 *
 * Dedicated user-panel route. The page owns the ONLY realtime subscription —
 * scoped to BOTH the current game (`game_id=eq.<id>` server filter) AND today's
 * UTC window — `useMemoryGameLeaderboard` runs while this route is mounted and
 * tears down (`unsubscribe`) on unmount or route change. The board body is
 * shared through the certified Admin leaderboard presentation primitives.
 */
export default function UserMemoryGamesLeaderboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const userReady = !!user && !authLoading

  const param = searchParams.get('game')
  const gameId = isMemoryGameId(param) ? param : NUMBER_MEMORY_RUSH_GAME_ID
  const entry = getMemoryGameCatalogEntry(gameId)

  const {
    leaderboard,
    loading,
    realtimeAvailable,
    errorState,
    pageError,
    retryError,
    topLimit,
    dayLabel,
  } = useMemoryGameLeaderboard({ gameId, active: true, userReady })

  const goBack = useCallback(() => {
    navigate(entry.route)
  }, [navigate, entry.route])

  return (
    <div className="nmr-page">
      <div className="nmr-column">
        <div className="flex items-center justify-between gap-3">
          <Button variant="soft" onClick={goBack}>
            <ArrowLeft size={16} /> Back to {entry.title}
          </Button>
        </div>

        <Card variant="elevated" className="animate-in">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-4">
              <div className="min-w-0 flex flex-col gap-1">
                <h1 className="text-xl font-black uppercase tracking-tight text-text-primary m-0">
                  🏆 {entry.title}
                </h1>
                <p className="text-xs font-semibold text-text-secondary m-0">
                  Daily Leaderboard · Best run per player · {dayLabel}
                </p>
              </div>
              <Pill size="xs" inline variant={realtimeAvailable ? 'success' : 'neutral'} pulse={realtimeAvailable}>
                {realtimeAvailable ? 'Live' : 'Paused'}
              </Pill>
            </div>

            {!realtimeAvailable && (
              <Alert variant="warning" icon={WifiOff} title="Live updates paused" className="w-full">
                Showing the latest saved scores. You can still refresh manually.
              </Alert>
            )}

            <MemoryLeaderboard
              leaderboard={leaderboard}
              loading={loading}
              errorState={errorState}
              pageError={pageError}
              retryError={retryError}
              topLimit={topLimit}
              currentUserId={user?.id ?? ''}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}