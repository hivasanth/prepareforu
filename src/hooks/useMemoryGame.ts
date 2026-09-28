import { useCallback } from 'react'
import { NUMBER_MEMORY_RUSH_GAME_ID } from '../config/memoryGames'
import {
  buildMetrics,
  createInitialGameState,
  createStagePositions,
  getMaxLevel,
  getStageDescriptor,
  memoryGameReducer,
  type MemoryGameAction,
  type MemoryGameState,
} from '../utils/memoryGameLogic'
import {
  STAGE_TRANSITION_MS,
  RETRY_TRANSITION_MS,
  useMemoryRunEngine,
  type MemorySoundCue,
} from './useMemoryRunEngine'
import type { MemoryGameMetrics } from '../types/memoryGame.types'

export { STAGE_TRANSITION_MS, RETRY_TRANSITION_MS }
export type { MemorySoundCue }

export interface UseMemoryGameOptions {
  /** Called after a score is accepted so the leaderboard can refresh. */
  onSubmitted?: () => void
  /** Optional sound cue sink (no-op when the user has sound disabled). */
  onSound?: (cue: MemorySoundCue) => void
}

export interface UseMemoryGameReturn {
  state: MemoryGameState
  metrics: MemoryGameMetrics
  /** Seconds left on the current recall timer (0 when no timer is running). */
  timeRemaining: number
  startGame: () => void
  selectTile: (cellIndex: number) => void
  finishGame: () => void
  resetGame: () => void
  retrySubmit: () => void
}

/**
 * Number Memory Rush adapter over the shared `useMemoryRunEngine`. All rules
 * remain in `memoryGameReducer`; this hook only bridges the Game-1-specific
 * tap gesture onto the engine's shared timers/submission/sound.
 */
export function useMemoryGame(options: UseMemoryGameOptions = {}): UseMemoryGameReturn {
  const engine = useMemoryRunEngine<MemoryGameState, MemoryGameAction>(
    {
      initialState: createInitialGameState,
      reduce: memoryGameReducer,
      planner: {
        getStageDescriptor,
        createStagePositions,
        getMaxLevel,
      },
      buildMetrics,
      gameId: NUMBER_MEMORY_RUSH_GAME_ID,
    },
    options,
  )

  const { dispatch } = engine

  const selectTile = useCallback((cellIndex: number) => {
    dispatch({ type: 'SELECT_TILE', cellIndex, now: Date.now() })
  }, [dispatch])

  return {
    state: engine.state,
    metrics: engine.metrics,
    timeRemaining: engine.timeRemaining,
    startGame: engine.startGame,
    selectTile,
    finishGame: engine.finishGame,
    resetGame: engine.resetGame,
    retrySubmit: engine.retrySubmit,
  }
}