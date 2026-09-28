import './memoryGames.css'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameStatusBar, PlaygroundStatus } from './GameStatusBar'
import { VisualMemoryMatrixBoard } from './VisualMemoryMatrixBoard'
import { MemoryGameResultScreen } from './MemoryGameResultScreen'
import { useGameSound } from './useGameSound'
import { useVisualMemoryMatrix } from '../../../hooks/useVisualMemoryMatrix'
import { isGameOver } from '../../../utils/memoryGameLogic'
import { getVmmMaxLevel } from '../../../utils/visualMemoryMatrixLogic'
import { VISUAL_MEMORY_MATRIX_ENTRY, VISUAL_MEMORY_MATRIX_GAME_ID } from '../../../config/memoryGames'
import { Card } from '../../../components/common/AntigravityCard'
import { fetchMemoryGamePersonalBest } from '../../../services/memoryGameService'
import { useAuth } from '../../../context/AuthContext'
import type { MemoryPersonalBest } from '../../../types/memoryGame.types'

/**
 * Visual Memory Matrix — Game 2 (spatial pattern memory). Same shared shell: one
 * elevated PLAYGROUND wrapper holds the LEFT metric column (3 metrics), the
 * CENTRAL pattern board and the RIGHT metric column (3 metrics — Stage, Lives,
 * Best). The flank columns are LAYOUT-ONLY `<div>`s carrying no surface; each of
 * the six metrics renders as its OWN individual card. Reuses the shared
 * engine/sound/persistence layer and game-scoped daily leaderboard as Number
 * Memory Rush, with Matrix-specific wording.
 */
export function VisualMemoryMatrix() {
  const { enabled: soundEnabled, toggle: toggleSound, play: playCue } = useGameSound()
  const { user, loading: authLoading } = useAuth()
  const userReady = !!user && !authLoading
  const navigate = useNavigate()

  const [personalBest, setPersonalBest] = useState<MemoryPersonalBest | null>(null)

  const fetchBest = useCallback(async (): Promise<MemoryPersonalBest | null> => {
    if (!userReady) return null
    try {
      return await fetchMemoryGamePersonalBest(VISUAL_MEMORY_MATRIX_GAME_ID)
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
    useVisualMemoryMatrix({ onSubmitted: handleSubmitted, onSound: playCue })

  const isIdle = state.status === 'idle'
  const isOver = isGameOver(state.status)

  return (
    <div className="nmr-game-stack" aria-label={VISUAL_MEMORY_MATRIX_ENTRY.title}>
      <Card variant="elevated" className="nmr-header-card">
        <div className="nmr-scope nmr-header-body">
          <header className="header">
            <div className="title-group">
              <h1>
                <span className="title-emoji" aria-hidden>
                  {VISUAL_MEMORY_MATRIX_ENTRY.icon}
                </span>
                {VISUAL_MEMORY_MATRIX_ENTRY.title}
              </h1>
              <p className="subtitle">{VISUAL_MEMORY_MATRIX_ENTRY.subtitle}</p>
            </div>
            <div className="nmr-header-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={() => navigate(`/memory-games/leaderboard?game=${VISUAL_MEMORY_MATRIX_GAME_ID}`)}
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
              maxLevel={getVmmMaxLevel()}
              metricLabel={VISUAL_MEMORY_MATRIX_ENTRY.metricLabel}
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
              statusCopy={VISUAL_MEMORY_MATRIX_ENTRY.statusCopy}
            />

            <div className="board-wrapper">
              <VisualMemoryMatrixBoard state={state} onSelect={selectTile} />
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
                highestMetricLabel={VISUAL_MEMORY_MATRIX_ENTRY.highestMetricLabel}
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
              maxLevel={getVmmMaxLevel()}
              metricLabel={VISUAL_MEMORY_MATRIX_ENTRY.metricLabel}
              side="right"
              best={personalBest}
            />
          </div>
        </div>

      </div>
    </div>
  )
}