import { useCallback } from 'react'
import { TILE_MATCHING_GAME_ID } from '../config/memoryGames'
import {
  buildTileMatchingMetrics,
  createInitialTileMatchingState,
  createTileMatchingPositions,
  getTileMatchingMaxLevel,
  getTileMatchingStageDescriptor,
  tileMatchingReducer,
  type TileMatchingAction,
  type TileMatchingState,
} from '../utils/tileMatchingLogic'
import {
  RETRY_TRANSITION_MS,
  useMemoryRunEngine,
  type MemorySoundCue,
} from './useMemoryRunEngine'
import type { MemoryGameMetrics } from '../types/memoryGame.types'

export type { MemorySoundCue }

export interface UseTileMatchingOptions {
  /** Called after a score is accepted so the leaderboard can refresh. */
  onSubmitted?: () => void
  /** Optional sound cue sink (no-op when the user has sound disabled). */
  onSound?: (cue: MemorySoundCue) => void
}

export interface UseTileMatchingReturn {
  state: TileMatchingState
  metrics: MemoryGameMetrics
  /** Seconds left on the current stage budget (0 when no timer runs). */
  timeRemaining: number
  startGame: () => void
  /** Flip a board tile (first tap reveals, second tap decides the pair). */
  selectTile: (cellIndex: number) => void
  finishGame: () => void
  resetGame: () => void
  retrySubmit: () => void
}

/**
 * Tile Matching adapter over the shared `useMemoryRunEngine`. Game rules live in
 * `tileMatchingReducer`; this hook only bridges the tile-tap gesture onto the
 * shared timers/submission/sound. Every tile is face-down from the start
 * (recall phase from the first tap), so the engine's default 1-second countdown
 * budget applies. A mismatched pair stays flashed for RETRY_TRANSITION_MS — the
 * SAME mistake momentum the shared engine uses before a stage retry — instead of
 * the default 450ms feedback dwell, via the engine's `feedbackDwellMs` knob.
 */
export function useTileMatching(
  options: UseTileMatchingOptions = {},
): UseTileMatchingReturn {
  const engine = useMemoryRunEngine<TileMatchingState, TileMatchingAction>(
    {
      initialState: createInitialTileMatchingState,
      reduce: tileMatchingReducer,
      planner: {
        getStageDescriptor: (level, stage) =>
          getTileMatchingStageDescriptor(level, stage),
        createStagePositions: createTileMatchingPositions,
        getMaxLevel: getTileMatchingMaxLevel,
      },
      buildMetrics: buildTileMatchingMetrics,
      gameId: TILE_MATCHING_GAME_ID,
      feedbackDwellMs: RETRY_TRANSITION_MS,
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