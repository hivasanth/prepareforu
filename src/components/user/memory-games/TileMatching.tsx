import './memoryGames.css'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameStatusBar, PlaygroundStatus } from './GameStatusBar'
import { TileMatchingBoard } from './TileMatchingBoard'
import { MemoryGameResultScreen } from './MemoryGameResultScreen'
import { useGameSound } from './useGameSound'
import { useTileMatching } from '../../../hooks/useTileMatching'
import { isGameOver, isStageActive } from '../../../utils/memoryGameLogic'
import {
  TILE_MATCHING_ENTRY,
  TILE_MATCHING_GAME_ID,
  TILE_MATCHING_MAX_LIVES,
} from '../../../config/memoryGames'
import { Card } from '../../../components/common/AntigravityCard'
import { fetchMemoryGamePersonalBest } from '../../../services/memoryGameService'
import { useAuth } from '../../../context/AuthContext'
import type { MemoryPersonalBest } from '../../../types/memoryGame.types'

/**
 * Tile Matching — Game 3 (classic Memory). Same shared shell: one elevated
 * PLAYGROUND wrapper holds the LEFT metric column (3 metrics), the CENTRAL
 * face-down tile grid and the RIGHT metric column (3 metrics — Stage, Lives,
 * Best). The flank columns are LAYOUT-ONLY `<div>`s carrying no surface; each
 * of the six metrics renders as its OWN individual card. Uses the shared
 * engine/sound/persistence layer and game-scoped daily leaderboard as the other
 * three titles. Two taps clear each pair; a mismatched pair flashes for the
 * shared mistake momentum and costs a life, but the stage keeps running.
 */
export function TileMatching() {
  const { enabled: soundEnabled, toggle: toggleSound, play: playCue } = useGameSound()
  const { user, loading: authLoading } = useAuth()
  const userReady = !!user && !authLoading
  const navigate = useNavigate()

  const [personalBest, setPersonalBest] = useState<MemoryPersonalBest | null>(null)

  const fetchBest = useCallback(async (): Promise<MemoryPersonalBest | null> => {
    if (!userReady) return null
    try {
      return await fetchMemoryGamePersonalBest(TILE_MATCHING_GAME_ID)
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
    useTileMatching({ onSubmitted: handleSubmitted, onSound: playCue })

  const isIdle = state.status === 'idle'
  const isOver = isGameOver(state.status)
  const active = isStageActive(state.status)
  const remainingPairs = state.numbers - state.expected

  return (
    <div className="nmr-game-stack" aria-label={TILE_MATCHING_ENTRY.title}>
      <Card variant="elevated" className="nmr-header-card">
        <div className="nmr-scope nmr-header-body">
          <header className="header">
            <div className="title-group">
              <h1>
                <span className="title-emoji" aria-hidden>
                  {TILE_MATCHING_ENTRY.icon}
                </span>
                {TILE_MATCHING_ENTRY.title}
              </h1>
              <p className="subtitle">{TILE_MATCHING_ENTRY.subtitle}</p>
            </div>
            <div className="nmr-header-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={() => navigate(`/memory-games/leaderboard?game=${TILE_MATCHING_GAME_ID}`)}
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
              maxLevel={TILE_MATCHING_ENTRY.maxLevel}
              maxLives={TILE_MATCHING_MAX_LIVES}
              metricLabel={TILE_MATCHING_ENTRY.metricLabel}
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
              statusCopy={TILE_MATCHING_ENTRY.statusCopy}
            />

            {active && (
              <div className="tm-progress" role="status" aria-live="polite">
                <span className="st-target-label">To go</span>
                <strong className="st-target-value">{remainingPairs}</strong>
              </div>
            )}

            <div className="board-wrapper">
              {isIdle && <div className="nmr-idle-slot" aria-hidden="true" />}
              {!isIdle && <TileMatchingBoard state={state} onSelect={selectTile} />}
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
                highestMetricLabel={TILE_MATCHING_ENTRY.highestMetricLabel}
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
              maxLevel={TILE_MATCHING_ENTRY.maxLevel}
              maxLives={TILE_MATCHING_MAX_LIVES}
              metricLabel={TILE_MATCHING_ENTRY.metricLabel}
              side="right"
              best={personalBest}
            />
          </div>
        </div>

      </div>
    </div>
  )
}