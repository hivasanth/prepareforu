import './memoryGames.css'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameStatusBar, PlaygroundStatus } from './GameStatusBar'
import { SchulteTrailBoard } from './SchulteTrailBoard'
import { MemoryGameResultScreen } from './MemoryGameResultScreen'
import { useGameSound } from './useGameSound'
import { useSchulteTrail } from '../../../hooks/useSchulteTrail'
import { isGameOver, isStageActive } from '../../../utils/memoryGameLogic'
import { SCHULTE_TRAIL_ENTRY, SCHULTE_TRAIL_GAME_ID } from '../../../config/memoryGames'
import { Card } from '../../../components/common/AntigravityCard'
import { fetchMemoryGamePersonalBest } from '../../../services/memoryGameService'
import { useAuth } from '../../../context/AuthContext'
import type { MemoryPersonalBest } from '../../../types/memoryGame.types'

/**
 * Schulte Trail — Game 4 (classic Schulte table). Same shared shell: one
 * elevated PLAYGROUND wrapper holds the LEFT metric column (3 metrics), the
 * CENTRAL full-grid board and the RIGHT metric column (3 metrics — Stage,
 * Lives, Best). The flank columns are LAYOUT-ONLY `<div>`s carrying no surface;
 * each of the six metrics renders as its OWN individual card. Uses the shared
 * engine/sound/persistence layer and game-scoped daily leaderboard as the other
 * three titles. The whole full-grid board is visible from the start; a target
 * indicator ("Next") keeps the player oriented while they tap 1, 2, 3 … N in
 * ascending order before the stage timer runs out.
 */
export function SchulteTrail() {
  const { enabled: soundEnabled, toggle: toggleSound, play: playCue } = useGameSound()
  const { user, loading: authLoading } = useAuth()
  const userReady = !!user && !authLoading
  const navigate = useNavigate()

  const [personalBest, setPersonalBest] = useState<MemoryPersonalBest | null>(null)

  const fetchBest = useCallback(async (): Promise<MemoryPersonalBest | null> => {
    if (!userReady) return null
    try {
      return await fetchMemoryGamePersonalBest(SCHULTE_TRAIL_GAME_ID)
    } catch {
      // Personal best is decorative — fetching again later is harmless.
      return null
    }
  }, [userReady])

  useEffect(() => {
    let ignore = false
    void fetchBest().then((best) => {
      if (!ignore) setPersonalBest(best)
    })
    return () => {
      ignore = true
    }
  }, [fetchBest])

  const handleSubmitted = useCallback(() => {
    void fetchBest().then((best) => {
      if (best) setPersonalBest(best)
    })
  }, [fetchBest])

  const { state, metrics, timeRemaining, startGame, selectTile, finishGame, resetGame, retrySubmit } =
    useSchulteTrail({ onSubmitted: handleSubmitted, onSound: playCue })

  const isIdle = state.status === 'idle'
  const isOver = isGameOver(state.status)
  const active = isStageActive(state.status)
  const nextTarget = state.expected <= state.numbers ? state.expected : null

  return (
    <div className="nmr-game-stack" aria-label={SCHULTE_TRAIL_ENTRY.title}>
      <Card variant="elevated" className="nmr-header-card">
        <div className="nmr-scope nmr-header-body">
          <header className="header">
            <div className="title-group">
              <h1>
                <span className="title-emoji" aria-hidden>
                  {SCHULTE_TRAIL_ENTRY.icon}
                </span>
                {SCHULTE_TRAIL_ENTRY.title}
              </h1>
              <p className="subtitle">{SCHULTE_TRAIL_ENTRY.subtitle}</p>
            </div>
            <div className="nmr-header-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={() => navigate(`/memory-games/leaderboard?game=${SCHULTE_TRAIL_GAME_ID}`)}
                aria-label="View today's leaderboard"
              >
                <span aria-hidden>🏆</span>
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={toggleSound}
                aria-pressed={soundEnabled}
                aria-label={soundEnabled ? 'Turn sound off' : 'Turn sound on'}
              >
                <span aria-hidden>{soundEnabled ? '🔊' : '🔇'}</span>
              </button>
            </div>
          </header>
        </div>
      </Card>

      <div className="nmr-playground">

        <div className="nmr-metric-flank nmr-metric-flank--left">
          <div className="nmr-scope nmr-stats-body">
            <GameStatusBar
              state={state}
              maxLevel={SCHULTE_TRAIL_ENTRY.maxLevel}
              metricLabel={SCHULTE_TRAIL_ENTRY.metricLabel}
              side="left"
              best={personalBest}
            />
          </div>
        </div>

        <Card variant="elevated" className="nmr-play-card">
          <div className="nmr-scope nmr-game-body">
            <PlaygroundStatus
              state={state}
              timeRemaining={timeRemaining}
              statusCopy={SCHULTE_TRAIL_ENTRY.statusCopy}
            />

            {active && nextTarget !== null && (
              <div className="st-target" role="status" aria-live="polite">
                <span className="st-target-label">Next</span>
                <strong className="st-target-value">{nextTarget}</strong>
              </div>
            )}

            <div className="board-wrapper">
              <SchulteTrailBoard state={state} onSelect={selectTile} />
            </div>

            {isIdle && (
              <button type="button" className="main-btn" onClick={startGame}>
                Start Game
              </button>
            )}

            {!isIdle && !isOver && (
              <div className="nmr-controls">
                <button type="button" className="action-btn" onClick={finishGame}>
                  End Run
                </button>
              </div>
            )}

            {isOver && (
              <MemoryGameResultScreen
                state={state}
                metrics={metrics}
                best={personalBest}
                highestMetricLabel={SCHULTE_TRAIL_ENTRY.highestMetricLabel}
                onPlayAgain={startGame}
                onBack={resetGame}
                onRetrySubmit={retrySubmit}
              />
            )}
          </div>
        </Card>

        <div className="nmr-metric-flank nmr-metric-flank--right">
          <div className="nmr-scope nmr-stats-body">
            <GameStatusBar
              state={state}
              maxLevel={SCHULTE_TRAIL_ENTRY.maxLevel}
              metricLabel={SCHULTE_TRAIL_ENTRY.metricLabel}
              side="right"
              best={personalBest}
            />
          </div>
        </div>

      </div>
    </div>
  )
}