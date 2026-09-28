import { useCallback } from 'react'
import { SCHULTE_TRAIL_GAME_ID } from '../config/memoryGames'
import {
  buildSchulteMetrics,
  createInitialSchulteTrailState,
  createSchultePositions,
  getSchulteMaxLevel,
  getSchulteStageDescriptor,
  schulteTrailReducer,
  type SchulteTrailAction,
  type SchulteTrailState,
} from '../utils/schulteTrailLogic'
import {
  useMemoryRunEngine,
  type MemorySoundCue,
} from './useMemoryRunEngine'
import type { MemoryGameMetrics } from '../types/memoryGame.types'

export type { MemorySoundCue }

export interface UseSchulteTrailOptions {
  /** Called after a score is accepted so the leaderboard can refresh. */
  onSubmitted?: () => void
  /** Optional sound cue sink (no-op when the user has sound disabled). */
  onSound?: (cue: MemorySoundCue) => void
}

export interface UseSchulteTrailReturn {
  state: SchulteTrailState
  metrics: MemoryGameMetrics
  /** Seconds left on the current stage budget (0 when no timer runs). */
  timeRemaining: number
  startGame: () => void
  /** Tap a board cell — only the cell hosting the expected number counts. */
  selectTile: (cellIndex: number) => void
  finishGame: () => void
  resetGame: () => void
  retrySubmit: () => void
}

/**
 * Schulte Trail adapter over the shared `useMemoryRunEngine`. Game rules live in
 * `schulteTrailReducer`; this hook only bridges the tile-tap gesture onto the
 * shared timers/submission/sound. The whole grid is a full permutation and is
 * visible immediately (recall phase from the start), so the engine's default
 * 1-second countdown budget applies with no reveal step.
 */
export function useSchulteTrail(
  options: UseSchulteTrailOptions = {},
): UseSchulteTrailReturn {
  const engine = useMemoryRunEngine<SchulteTrailState, SchulteTrailAction>(
    {
      initialState: createInitialSchulteTrailState,
      reduce: schulteTrailReducer,
      planner: {
        getStageDescriptor: (level, stage) =>
          getSchulteStageDescriptor(level, stage),
        createStagePositions: createSchultePositions,
        getMaxLevel: getSchulteMaxLevel,
      },
      buildMetrics: buildSchulteMetrics,
      gameId: SCHULTE_TRAIL_GAME_ID,
    },
    options,
  )

  const { dispatch } = engine

  const selectTile = useCallback(
    (cellIndex: number) => {
      dispatch({ type: 'SELECT_TILE', cellIndex, now: Date.now() })
    },
    [dispatch],
  )

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