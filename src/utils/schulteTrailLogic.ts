/**
 * ─── Schulte Trail — pure game logic & state machine ────────────────────────
 *
 * Game 4 (classic Schulte table): every cell of the `gridSize`×`gridSize` board
 * holds one distinct number, 1..N where N = gridSize², and the player taps them
 * in ASCENDING order (1, 2, 3 … N). One mode, exactly three lives, shared
 * scoring (+5 per cleared board, +10 per level, 4 stages per level). The whole
 * grid is visible from the moment a stage starts, so the shared engine's
 * "recall" phase begins immediately — exactly like Tile Matching, and unlike
 * Rush there is no reveal-tap step and no hide phase.
 *
 * Timer: a fair per-stage budget `24 + 1.4·tiles − level pressure` seconds
 * (see `getSchulteStageTimerSeconds` in src/config/memoryGames.ts). Difficulty
 * grows through the GRID first (4×4 → 6×6, the mobile-safe cap that keeps every
 * tile ≥ 44px) and through TIME PRESSURE past Level 6.
 *
 * highestNumber is NOT linear — it equals the board's tile count (16 → 25 → 36),
 * a pure level-table lookup (see `schulteHighestNumber`), mirrored by the
 * 20260929000001 migration.
 *
 * Everything here is side-effect free and unit-testable. React (the countdown,
 * sound, submission) is layered on top by `src/hooks/useSchulteTrail.ts` using
 * the SAME shared run-engine hook as the other three games.
 */

import {
  LEVEL_BONUS,
  SCHULTE_MAX_LEVELS,
  STAGE_SCORE,
  STAGES_PER_LEVEL,
  STARTING_LIVES,
  getSchulteLevelConfig,
  getSchulteStageTimerSeconds,
  schulteHighestNumber,
} from '../config/memoryGames'
import { createStagePositions, isStageActive } from './memoryGameLogic'
import type {
  MemoryGameMetrics,
  MemoryGameStatus,
  MemoryStagePhase,
} from '../types/memoryGame.types'

// ─── Progression resolution ───────────────────────────────────────────────────

/**
 * Schulte Trail row position = a FULL permutation of the grid: there are no
 * empty cells, so `createStagePositions(tiles, gridSize)` with tiles == gridSize²
 * yields exactly one cell per value (Fisher–Yates from the shared helper).
 * `rng` stays injectable for deterministic tests.
 */
export function createSchultePositions(
  tiles: number,
  gridSize: number,
  rng: () => number = Math.random,
): number[] {
  return createStagePositions(tiles, gridSize, rng)
}

export function getSchulteMaxLevel(): number {
  return SCHULTE_MAX_LEVELS
}

export interface SchulteStageDescriptor {
  level: number
  stage: number
  /** Distinct numbers on the board = tiles (gridSize²) — mirrors Rush "numbers". */
  numbers: number
  /** Board is `gridSize` × `gridSize` at this level. */
  gridSize: number
  stagesRequired: number
}

/** Resolve tile count + grid size for a given level/stage. */
export function getSchulteStageDescriptor(
  level: number,
  stage: number,
): SchulteStageDescriptor {
  const config = getSchulteLevelConfig(level)
  return {
    level: config.level,
    stage,
    numbers: config.tiles,
    gridSize: config.gridSize,
    stagesRequired: STAGES_PER_LEVEL,
  }
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface SchulteTrailState {
  status: MemoryGameStatus
  level: number
  stage: number
  /** Distinct numbers on the board (gridSize²) — the stage's full tile count. */
  numbers: number
  gridSize: number
  /** positions[value - 1] = cell index hosting that value (full permutation). */
  positions: number[]
  /** Always 'recall' — the whole grid is visible the instant a stage begins. */
  phase: MemoryStagePhase
  /** Next number the player must tap (1-based). */
  expected: number
  /** Count of correct selections (drives accuracy). */
  correctSelections: number
  /** Cell index of the last correct tap (transient visual feedback). */
  correctCell: number | null
  /** Cell index of the last wrong tap (transient visual feedback). */
  wrongCell: number | null
  lastFailureReason: 'wrongNumber' | 'emptyTile' | 'timeout' | null
  /** Lives remaining in this run — exactly 3 at game start. */
  lives: number
  /** Why the run ended (used by the result screen copy). */
  gameOverReason: 'lives' | 'finished' | 'completed' | null
  /** Recall timer budget for the CURRENT stage (seconds). */
  stageTimerSeconds: number
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

function createFreshState(): SchulteTrailState {
  const descriptor = getSchulteStageDescriptor(1, 1)
  return {
    status: 'idle',
    level: 1,
    stage: 1,
    numbers: descriptor.numbers,
    gridSize: descriptor.gridSize,
    positions: [],
    /* Phase stays 'recall' even at idle so none of the per-second engine cues
       announce a reveal that does not exist in this game. */
    phase: 'recall',
    expected: 1,
    correctSelections: 0,
    correctCell: null,
    wrongCell: null,
    lastFailureReason: null,
    lives: STARTING_LIVES,
    gameOverReason: null,
    stageTimerSeconds: getSchulteStageTimerSeconds(1, descriptor.numbers),
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

export function createInitialSchulteTrailState(): SchulteTrailState {
  return createFreshState()
}

export type SchulteTrailAction =
  | { type: 'START_GAME'; positions: number[]; now: number }
  | { type: 'SET_SESSION'; sessionId: string | null; loading: boolean }
  | { type: 'SELECT_TILE'; cellIndex: number; now: number }
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
  state: SchulteTrailState,
  level: number,
  stage: number,
  positions: number[],
): SchulteTrailState {
  const descriptor = getSchulteStageDescriptor(level, stage)
  return {
    ...state,
    status: 'showingNumbers',
    level: descriptor.level,
    stage,
    numbers: descriptor.numbers,
    gridSize: descriptor.gridSize,
    positions,
    phase: 'recall',
    expected: 1,
    correctCell: null,
    wrongCell: null,
    lastFailureReason: null,
    lastStagePoints: 0,
    lastLevelBonus: 0,
    lastSelectionAt: 0,
    stageTimerSeconds: getSchulteStageTimerSeconds(descriptor.level, descriptor.numbers),
    announcement: `Level ${descriptor.level}, Stage ${stage}. ${descriptor.numbers} numbers. Tap them in order from 1.`,
  }
}

/** Pure reducer — the ONE place Schulte Trail state changes. */
export function schulteTrailReducer(
  state: SchulteTrailState,
  action: SchulteTrailAction,
): SchulteTrailState {
  switch (action.type) {
    case 'START_GAME':
      return beginStage(
        {
          ...createFreshState(),
          sessionId: state.sessionId,
          sessionLoading: state.sessionLoading,
        },
        1,
        1,
        action.positions,
      )

    case 'SET_SESSION':
      return { ...state, sessionId: action.sessionId, sessionLoading: action.loading }

    case 'SELECT_TILE': {
      if (!isStageActive(state.status) || state.phase !== 'recall') return state

      // The board is a full permutation, so any cell that is not the one hosting
      // the expected number costs a life (emptyTile can never occur, kept for
      // type parity with the shared failure contract).
      if (state.positions[state.expected - 1] !== action.cellIndex) {
        const emptyCell = !state.positions.includes(action.cellIndex)
        return {
          ...state,
          status: 'stageFailed',
          mistakes: state.mistakes + 1,
          stagesFailed: state.stagesFailed + 1,
          lives: state.lives - 1,
          wrongCell: action.cellIndex,
          correctCell: null,
          lastFailureReason: emptyCell ? 'emptyTile' : 'wrongNumber',
          lastStagePoints: 0,
          announcement: emptyCell
            ? 'Incorrect tile. One life lost. New arrangement.'
            : 'Wrong number. One life lost. New arrangement.',
        }
      }

      const reaction =
        state.lastSelectionAt > 0 ? Math.max(0, action.now - state.lastSelectionAt) : 0
      const reactionTimes = reaction > 0 ? [...state.reactionTimes, reaction] : state.reactionTimes
      const nextExpected = state.expected + 1
      const correctSelections = state.correctSelections + 1

      // Stage cleared — every number (1..N, the whole board) tapped in order.
      if (nextExpected > state.numbers) {
        const levelComplete = state.stage >= STAGES_PER_LEVEL
        const score = state.score + STAGE_SCORE + (levelComplete ? LEVEL_BONUS : 0)
        return {
          ...state,
          status: levelComplete ? 'levelComplete' : 'stageComplete',
          expected: nextExpected,
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
            : `Board cleared. Plus ${STAGE_SCORE} points.`,
        }
      }

      return {
        ...state,
        expected: nextExpected,
        correctSelections,
        reactionTimes,
        correctCell: action.cellIndex,
        wrongCell: null,
        lastSelectionAt: action.now,
        announcement: `Number ${state.expected} found. Find number ${nextExpected}.`,
      }
    }

    case 'ADVANCE_STAGE': {
      if (state.status === 'levelComplete') {
        if (state.level >= SCHULTE_MAX_LEVELS) {
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
      // Only a live recall phase can time out — a late tick must be inert.
      if (state.phase !== 'recall' || !isStageActive(state.status)) {
        return state
      }
      return {
        ...state,
        status: 'stageFailed',
        stagesFailed: state.stagesFailed + 1,
        lives: state.lives - 1,
        lastFailureReason: 'timeout',
        lastStagePoints: 0,
        announcement: 'Time expired. One life lost. New arrangement.',
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

/**
 * Derive the leaderboard-safe metrics from engine state (same shape as the
 * other games). highestNumber is the board's tile count for the current level
 * (see `schulteHighestNumber` in src/config/memoryGames.ts — the single source
 * mirrored by migration 20260929000001).
 */
export function buildSchulteMetrics(state: SchulteTrailState): MemoryGameMetrics {
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
    highestNumber: schulteHighestNumber(state.level),
    stagesCompleted: state.stagesCompleted,
    stagesFailed: state.stagesFailed,
    mistakes: state.mistakes,
    accuracy,
    averageReactionTimeMs,
  }
}

export {
  LEVEL_BONUS,
  SCHULTE_MAX_LEVELS,
  STAGES_PER_LEVEL,
  STAGE_SCORE,
  STARTING_LIVES,
  getSchulteStageTimerSeconds,
} from '../config/memoryGames'