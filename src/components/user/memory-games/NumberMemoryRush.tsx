import './memoryGames.css'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameStatusBar, PlaygroundStatus } from './GameStatusBar'
import { MemoryGameBoard } from './MemoryGameBoard'
import { MemoryGameResultScreen } from './MemoryGameResultScreen'
import { useGameSound } from './useGameSound'
import { useMemoryGame } from '../../../hooks/useMemoryGame'
import { getMaxLevel, isGameOver } from '../../../utils/memoryGameLogic'
import { MEMORY_GAMES_COPY, NUMBER_MEMORY_RUSH_GAME_ID } from '../../../config/memoryGames'
import { Card } from '../../../components/common/AntigravityCard'
import { fetchMemoryGamePersonalBest } from '../../../services/memoryGameService'
import { useAuth } from '../../../context/AuthContext'
import type { MemoryPersonalBest } from '../../../types/memoryGame.types'

/**
 * Number Memory Rush. The HUD is a shared shell: a header `Card` sits above one
 * elevated PLAYGROUND wrapper that holds the LEFT metric column (3 metrics),
 * the CENTRAL play card and the RIGHT metric column (3 metrics — Stage, Lives,
 * Best). The flank columns are LAYOUT-ONLY `<div>`s — they carry no surface;
 * each of the six metrics renders as its OWN individual card. All surfaces
 * reuse the SAME Admin Leaderboard container system that the app-certified
 * designs consume per the acceptance criteria. The engine, scoring, lives,
 * timer, sound and persistence come from the shared Memory Games layer. The
 * daily leaderboard is a dedicated route (see UserMemoryGamesLeaderboard) that
 * owns the ONLY realtime subscription; here we fetch just the user's personal
 * best — the SAME source the result screen and the Best metric consume — and
 * refresh it after each submitted run.
 */
export function NumberMemoryRush() {
  const { enabled: soundEnabled, toggle: toggleSound, play: playCue } = useGameSound()
  const { user, loading: authLoading } = useAuth()
  const userReady = !!user && !authLoading
  const navigate = useNavigate()

  const [personalBest, setPersonalBest] = useState<MemoryPersonalBest | null>(null)

  const fetchBest = useCallback(async (): Promise<MemoryPersonalBest | null> => {
    if (!userReady) return null
    try {
      return await fetchMemoryGamePersonalBest()
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
    useMemoryGame({ onSubmitted: handleSubmitted, onSound: playCue })

  const isIdle = state.status === 'idle'
  const isOver = isGameOver(state.status)

  return (
    <div className="nmr-game-stack" aria-label={MEMORY_GAMES_COPY.gameTitle}>
      <Card variant="elevated" className="nmr-header-card">
        <div className="nmr-scope nmr-header-body">
          <header className="header">
            <div className="title-group">
              <h1>
                <span className="title-emoji" aria-hidden>
                  🧠
                </span>
                {MEMORY_GAMES_COPY.gameTitle}
              </h1>
              <p className="subtitle">{MEMORY_GAMES_COPY.gameSubtitle}</p>
            </div>
            <div className="nmr-header-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={() => navigate(`/memory-games/leaderboard?game=${NUMBER_MEMORY_RUSH_GAME_ID}`)}
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
            <GameStatusBar state={state} maxLevel={getMaxLevel()} side="left" best={personalBest} />
          </div>
        </div>

        <Card variant="elevated" className="nmr-play-card">
          <div className="nmr-scope nmr-game-body">
            <PlaygroundStatus state={state} timeRemaining={timeRemaining} />

            <div className="board-wrapper">
              <MemoryGameBoard state={state} onSelect={selectTile} />
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
                onPlayAgain={startGame}
                onBack={resetGame}
                onRetrySubmit={retrySubmit}
              />
            )}
          </div>
        </Card>

        <div className="nmr-metric-flank nmr-metric-flank--right">
          <div className="nmr-scope nmr-stats-body">
            <GameStatusBar state={state} maxLevel={getMaxLevel()} side="right" best={personalBest} />
          </div>
        </div>

      </div>
    </div>
  )
}