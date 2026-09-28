import { useCallback, useEffect } from 'react'
import {
  VISUAL_MEMORY_MATRIX_GAME_ID,
} from '../config/memoryGames'
import {
  buildVmmMetrics,
  createInitialVisualMemoryMatrixState,
  createPatternPositions,
  getVmmMaxLevel,
  getVmmStageDescriptor,
  visualMemoryMatrixReducer,
  type VisualMemoryMatrixAction,
  type VisualMemoryMatrixState,
} from '../utils/visualMemoryMatrixLogic'
import {
  useMemoryRunEngine,
  type MemorySoundCue,
} from './useMemoryRunEngine'
import type { MemoryGameMetrics } from '../types/memoryGame.types'

export type { MemorySoundCue }

export interface UseVisualMemoryMatrixOptions {
  /** Called after a score is accepted so the leaderboard can refresh. */
  onSubmitted?: () => void
  /** Optional sound cue sink (no-op when the user has sound disabled). */
  onSound?: (cue: MemorySoundCue) => void
}

export interface UseVisualMemoryMatrixReturn {
  state: VisualMemoryMatrixState
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
 * Visual Memory Matrix adapter over the shared `useMemoryRunEngine`. Game rules
 * live in `visualMemoryMatrixReducer`; this hook adds the pattern PREVIEW →
 * recall auto-hide (the one Matrix-specific transition) and bridges the tap
 * gesture onto the shared timers/submission/sound.
 */
export function useVisualMemoryMatrix(
  options: UseVisualMemoryMatrixOptions = {},
): UseVisualMemoryMatrixReturn {
  const engine = useMemoryRunEngine<VisualMemoryMatrixState, VisualMemoryMatrixAction>(
    {
      initialState: createInitialVisualMemoryMatrixState,
      reduce: visualMemoryMatrixReducer,
      planner: {
        getStageDescriptor: (level, stage) => {
          const descriptor = getVmmStageDescriptor(level, stage)
          return {
            level: descriptor.level,
            stage: descriptor.stage,
            numbers: descriptor.targets,
            gridSize: descriptor.gridSize,
            stagesRequired: descriptor.stagesRequired,
          }
        },
        createStagePositions: createPatternPositions,
        getMaxLevel: getVmmMaxLevel,
      },
      buildMetrics: buildVmmMetrics,
      gameId: VISUAL_MEMORY_MATRIX_GAME_ID,
    },
    options,
  )

  // ── Pattern preview dwell: after `previewSeconds` the pattern hides and the
  //    recall timer (owned by the shared engine) takes over. A tap on a
  //    highlighted target ends the preview IMMEDIATELY in the reducer, which
  //    flips phase → 'recall'; this effect then cleans up its pending timer so
  //    the late PREVIEW_END can never mutate state (the reducer guard is the
  //    second line of defence).
  const { dispatch } = engine
  const previewSeconds = engine.state.previewSeconds
  const showPreview = engine.state.status === 'showingNumbers' && engine.state.phase === 'show'
  useEffect(() => {
    if (!showPreview) return
    const handle = setTimeout(
      () => dispatch({ type: 'PREVIEW_END' }),
      previewSeconds * 1000,
    )
    return () => clearTimeout(handle)
  }, [showPreview, previewSeconds, dispatch])

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