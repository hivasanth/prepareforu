/**
 * ─── Visual Memory Matrix — pure game logic & state machine ─────────────────
 *
 * A spatial-pattern sibling of Number Memory Rush: the player memorises which
 * tiles of a growing grid are highlighted during a timed preview, then recalls
 * EVERY highlighted position (any order — tile order is irrelevant). Correct
 * tiles stay green; a wrong tile costs a life and re-serves the same level +
 * stage with a fresh pattern; the recall timer runs only after the preview
 * hides. Scoring is identical to Number Memory Rush (+5 per stage, +10 per
 * level), as are lives (3), the 4-stage levels and the recall timer budget.
 *
 * Everything here is side-effect free and unit-testable. React (preview dwell,
 * timers, sound, submission) is layered on top by `src/hooks/useVisualMemoryMatrix.ts`
 * using the SAME shared run-engine hooks as Number Memory Rush — there is no
 * second timer, sound or submission engine.
 */

import {
  LEVEL_BONUS,
  STAGE_SCORE,
  STAGES_PER_LEVEL,
  STARTING_LIVES,
  VMM_LEVEL_CONFIG,
  VMM_MAX_LEVELS,
  VMM_STARTING_TARGETS,
  getStageTimerSeconds,
  getVmmPreviewSeconds,
  type VmmLevelConfig,
} from '../config/memoryGames'
import {
  countCells,
  createDistinctCells,
  isStageActive,
} from './memoryGameLogic'
import type {
  MemoryGameMetrics,
  MemoryGameStatus,
  MemoryStagePhase,
} from '../types/memoryGame.types'

// ─── Progression resolution ───────────────────────────────────────────────────

/** Canonical per-level config (clamped to the first/last level). */
export function getVmmLevelConfig(level: number): VmmLevelConfig {
  const clamped = Math.min(Math.max(Math.trunc(level), 1), VMM_MAX_LEVELS)
  return VMM_LEVEL_CONFIG[clamped - 1]
}

export function getVmmMaxLevel(): number {
  return VMM_MAX_LEVELS
}

export interface VmmStageDescriptor {
  level: number
  stage: number
  targets: number
  gridSize: number
  stagesRequired: number
}

/** Resolve board size and pattern-target count for a given level/stage. */
export function getVmmStageDescriptor(level: number, stage: number): VmmStageDescriptor {
  const config = getVmmLevelConfig(level)
  return {
    level: config.level,
    stage,
    targets: config.targets,
    gridSize: config.gridSize,
    stagesRequired: config.stagesRequired,
  }
}

/** Pattern placement — the shared distinct-cell algorithm (same as Rush). */
export function createPatternPositions(targets: number, gridSize: number, rng?: () => number): number[] {
  return createDistinctCells(targets, gridSize, rng)
}

export { countCells }

// ─── State ────────────────────────────────────────────────────────────────────

export interface VisualMemoryMatrixState {
  status: MemoryGameStatus
  level: number
  stage: number
  /** Pattern-target count for the current level (== `numbers` view contract). */
  numbers: number
  gridSize: number
  /** Cell indices of the current pattern (target tiles). */
  positions: number[]
  /** Cells already recalled correctly — stay green and locked in. */
  correctTiles: number[]
  phase: MemoryStagePhase
  /** correctTiles.length + 1 — kept for the shared shell copy + metrics. */
  expected: number
  correctSelections: number
  correctCell: number | null
  wrongCell: number | null
  lastFailureReason: 'wrongNumber' | 'emptyTile' | 'timeout' | null
  /** Lives remaining in this run — exactly 3 at game start. */
  lives: number
  /** Why the run ended (used by the result screen copy). */
  gameOverReason: 'lives' | 'finished' | 'completed' | null
  /** Recall timer budget for the CURRENT stage (seconds, from config). */
  stageTimerSeconds: number
  /** Pattern preview dwell for the CURRENT stage (seconds, from config). */
  previewSeconds: number
  mistakes: number
  stagesCompleted: number
  stagesFailed: number
  levelsCompleted: number
  score: number
  /** ms between consecutive correct selections. */
  reactionTimes: number[]
  /** Timestamp (ms) of the last registered selection. */
  lastSelectionAt: number
  lastStagePoints: number
  lastLevelBonus: number
  sessionId: string | null
  sessionLoading: boolean
  announcement: string
  submissionError: string | null
}

function createFreshState(): VisualMemoryMatrixState {
  const descriptor = getVmmStageDescriptor(1, 1)
  return {
    status: 'idle',
    level: 1,
    stage: 1,
    numbers: descriptor.targets,
    gridSize: descriptor.gridSize,
    positions: [],
    correctTiles: [],
    phase: 'show',
    expected: 1,
    correctSelections: 0,
    correctCell: null,
    wrongCell: null,
    lastFailureReason: null,
    lives: STARTING_LIVES,
    gameOverReason: null,
    stageTimerSeconds: getStageTimerSeconds(1),
    previewSeconds: getVmmPreviewSeconds(descriptor.targets),
    mistakes: 0,
    stagesCompleted: 0,
    stagesFailed: 0,
    levelsCompleted: 0,
    score: 0,
    reactionTimes: [],
    lastSelectionAt: 0,
    lastStagePoints: 0,
    lastLevelBonus: 0,
    sessionId: null,
    sessionLoading: false,
    announcement: '',
    submissionError: null,
  }
}

export function createInitialVisualMemoryMatrixState(): VisualMemoryMatrixState {
  return createFreshState()
}

export type VisualMemoryMatrixAction =
  | { type: 'START_GAME'; positions: number[]; now: number }
  | { type: 'SET_SESSION'; sessionId: string | null; loading: boolean }
  | { type: 'SELECT_TILE'; cellIndex: number; now: number }
  | { type: 'PREVIEW_END' }
  | { type: 'ADVANCE_STAGE'; positions: number[] }
  | { type: 'RETRY_STAGE'; positions: number[] }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'LIVES_EXHAUSTED' }
  | { type: 'CLEAR_FEEDBACK' }
  | { type: 'FINISH_GAME' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; message: string }
  | { type: 'RESET' }

function beginStage(
  state: VisualMemoryMatrixState,
  level: number,
  stage: number,
  positions: number[],
): VisualMemoryMatrixState {
  const descriptor = getVmmStageDescriptor(level, stage)
  return {
    ...state,
    status: 'showingNumbers',
    level: descriptor.level,
    stage,
    numbers: descriptor.targets,
    gridSize: descriptor.gridSize,
    positions,
    correctTiles: [],
    phase: 'show',
    expected: 1,
    correctSelections: 0,
    correctCell: null,
    wrongCell: null,
    lastFailureReason: null,
    lastStagePoints: 0,
    lastLevelBonus: 0,
    lastSelectionAt: 0,
    /* Retried stages keep their original budget (global stage index).
       The preview dwell is derived from the pattern size. */
    stageTimerSeconds: getStageTimerSeconds(state.stagesCompleted + 1),
    previewSeconds: getVmmPreviewSeconds(descriptor.targets),
    announcement: `Level ${descriptor.level}, Stage ${stage}. Memorize ${descriptor.targets} highlighted tiles.`,
  }
}

/**
 * Handle a tile tap made during the RECALL phase. The recall guard has already
 * been applied by the caller (`SELECT_TILE` routes both the normal recall tap
 * and the immediate preview-terminating tap here with a `recall` phase).
 */
function selectTileInRecall(
  state: VisualMemoryMatrixState,
  action: Extract<VisualMemoryMatrixAction, { type: 'SELECT_TILE' }>,
): VisualMemoryMatrixState {
  // Already-found tiles are inert (the board also disables them).
  if (state.correctTiles.includes(action.cellIndex)) return state

  // A non-target tile breaks the run: lose a life, fail the stage.
  if (!state.positions.includes(action.cellIndex)) {
    return {
      ...state,
      status: 'stageFailed',
      mistakes: state.mistakes + 1,
      stagesFailed: state.stagesFailed + 1,
      lives: state.lives - 1,
      wrongCell: action.cellIndex,
      correctCell: null,
      lastFailureReason: 'emptyTile',
      lastStagePoints: 0,
      announcement: 'Incorrect tile. One life lost. New pattern.',
    }
  }

  const reaction =
    state.lastSelectionAt > 0 ? Math.max(0, action.now - state.lastSelectionAt) : 0
  const reactionTimes = reaction > 0 ? [...state.reactionTimes, reaction] : state.reactionTimes
  const correctTiles = [...state.correctTiles, action.cellIndex]
  const correctSelections = state.correctSelections + 1

  // Every pattern tile found — the stage is cleared.
  if (correctTiles.length >= state.numbers) {
    const levelComplete = state.stage >= STAGES_PER_LEVEL
    const score = state.score + STAGE_SCORE + (levelComplete ? LEVEL_BONUS : 0)
    return {
      ...state,
      status: levelComplete ? 'levelComplete' : 'stageComplete',
      correctTiles,
      expected: correctTiles.length + 1,
      correctSelections,
      reactionTimes,
      correctCell: action.cellIndex,
      wrongCell: null,
      lastSelectionAt: action.now,
      stagesCompleted: state.stagesCompleted + 1,
      levelsCompleted: state.levelsCompleted + (levelComplete ? 1 : 0),
      score,
      lastStagePoints: STAGE_SCORE,
      lastLevelBonus: levelComplete ? LEVEL_BONUS : 0,
      announcement: levelComplete
        ? `Level ${state.level} complete. Bonus ${LEVEL_BONUS} points.`
        : `Stage complete. Plus ${STAGE_SCORE} points.`,
    }
  }

  return {
    ...state,
    correctTiles,
    expected: correctTiles.length + 1,
    correctSelections,
    reactionTimes,
    correctCell: action.cellIndex,
    wrongCell: null,
    lastSelectionAt: action.now,
    announcement: `Pattern tile found. ${correctTiles.length} of ${state.numbers}.`,
  }
}

/** Pure reducer — the ONE place Visual Memory Matrix state changes. */
export function visualMemoryMatrixReducer(
  state: VisualMemoryMatrixState,
  action: VisualMemoryMatrixAction,
): VisualMemoryMatrixState {
  switch (action.type) {
    case 'START_GAME':
      return beginStage(
        { ...createFreshState(), sessionId: state.sessionId, sessionLoading: state.sessionLoading },
        1,
        1,
        action.positions,
      )

    case 'SET_SESSION':
      return { ...state, sessionId: action.sessionId, sessionLoading: action.loading }

    case 'SELECT_TILE': {
      if (!isStageActive(state.status)) return state

      // PREVIEW phase — the pattern is still glowing. The ONLY valid interaction
      // is tapping a highlighted TARGET: it terminates the preview IMMEDIATELY
      // (full glow removed, no waiting for the preview timeout) and is processed
      // as the player's first recall selection. Empty-tile taps remain inert and
      // must not create any hidden transition.
      if (state.phase === 'show') {
        if (!state.positions.includes(action.cellIndex)) return state
        const recall = { ...state, phase: 'recall' as const }
        const selected = selectTileInRecall(recall, action)
        // A ≥1-target pattern can never complete on a single tap, but guard it.
        if (selected.status === 'stageComplete' || selected.status === 'levelComplete') {
          return selected
        }
        return {
          ...selected,
          announcement: `Pattern hidden. ${selected.correctTiles.length} of ${state.numbers} pattern tiles found.`,
        }
      }

      // Active-status tap with the pattern already hidden → normal recall.
      // The original state reference is passed through so inert taps (repeat
      // taps on already-found tiles) return the SAME state, avoiding re-renders.
      return selectTileInRecall(state, action)
    }

    case 'PREVIEW_END': {
      // Only a live preview can end; a late tick (stage already over) is inert.
      if (!isStageActive(state.status) || state.phase !== 'show') return state
      return {
        ...state,
        phase: 'recall',
        announcement: 'Pattern hidden. Select the tiles you remember.',
      }
    }

    case 'ADVANCE_STAGE': {
      if (state.status === 'levelComplete') {
        if (state.level >= VMM_MAX_LEVELS) {
          return {
            ...state,
            status: 'gameComplete',
            gameOverReason: 'completed',
            announcement: 'Game finished. Every level cleared!',
          }
        }
        return beginStage(state, state.level + 1, 1, action.positions)
      }
      if (state.status === 'stageComplete') {
        return beginStage(state, state.level, state.stage + 1, action.positions)
      }
      return state
    }

    case 'RETRY_STAGE': {
      if (state.status !== 'stageFailed') return state
      return beginStage(state, state.level, state.stage, action.positions)
    }

    case 'TIMER_EXPIRED': {
      if (state.phase !== 'recall' || !isStageActive(state.status)) return state
      return {
        ...state,
        status: 'stageFailed',
        stagesFailed: state.stagesFailed + 1,
        lives: state.lives - 1,
        lastFailureReason: 'timeout',
        lastStagePoints: 0,
        announcement: 'Time expired. One life lost. New pattern.',
      }
    }

    case 'LIVES_EXHAUSTED': {
      if (state.status !== 'stageFailed') return state
      return {
        ...state,
        status: 'gameComplete',
        gameOverReason: 'lives',
        wrongCell: null,
        correctCell: null,
        announcement: 'Game over. All lives used.',
      }
    }

    case 'CLEAR_FEEDBACK':
      return { ...state, correctCell: null, wrongCell: null }

    case 'FINISH_GAME':
      return {
        ...state,
        status: 'gameComplete',
        gameOverReason: 'finished',
        wrongCell: null,
        correctCell: null,
        announcement: 'Game finished.',
      }

    case 'SUBMIT_START':
      return { ...state, status: 'submittingScore', submissionError: null }

    case 'SUBMIT_SUCCESS':
      return { ...state, status: 'submissionSuccess', submissionError: null }

    case 'SUBMIT_ERROR':
      return { ...state, status: 'submissionError', submissionError: action.message }

    case 'RESET':
      return createFreshState()

    default:
      return state
  }
}

// ─── Derived metrics ──────────────────────────────────────────────────────────

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** Derive the leaderboard-safe metrics from engine state (same shape as Rush). */
export function buildVmmMetrics(state: VisualMemoryMatrixState): MemoryGameMetrics {
  const totals = state.correctSelections + state.mistakes
  const accuracy = totals === 0 ? 100 : round((state.correctSelections / totals) * 100, 2)
  const averageReactionTimeMs =
    state.reactionTimes.length === 0
      ? 0
      : Math.round(
          state.reactionTimes.reduce((sum, value) => sum + value, 0) /
            state.reactionTimes.length,
        )

  return {
    score: state.score,
    highestLevel: state.level,
    highestNumber: getVmmLevelConfig(state.level).targets,
    stagesCompleted: state.stagesCompleted,
    stagesFailed: state.stagesFailed,
    mistakes: state.mistakes,
    accuracy,
    averageReactionTimeMs,
  }
}

export {
  LEVEL_BONUS,
  STAGE_SCORE,
  STAGES_PER_LEVEL,
  STARTING_LIVES,
  VMM_MAX_LEVELS,
  VMM_STARTING_TARGETS,
  getStageTimerSeconds,
  getVmmPreviewSeconds,
}