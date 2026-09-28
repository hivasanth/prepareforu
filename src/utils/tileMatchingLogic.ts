/**
 * ─── Tile Matching — pure game logic & state machine ────────────────────────
 *
 * Game 3 (classic Memory): a grid of face-down tiles holds a set of fruit
 * symbols, exactly two of each, and the player flips them two at a time to
 * clear every pair before the stage timer runs out. One mode, five lives that
 * grow by one per cleared stage up to a cap of eight, and a whole-stage
 * "recall" phase (every tile is hidden from the first tap — mirrors Schulte
 * Trail, so the shared countdown runs the entire stage).
 *
 * Rules:
 *  - Tiles start face-down (status 'showingNumbers', phase 'recall').
 *  - The first tap reveals a tile (`firstPick`); the second tap decides the
 *    pair. Re-tapping the pending tile is inert.
 *  - A MATCH locks both tiles (`matchedIndices`), grants +5 and moves
 *    `expected` (matched-pair count) forward; clearing every pair completes the
 *    stage (+10 bonus on the level's final stage) and grants +1 life up to
 *    TILE_MATCHING_MAX_LIVES.
 *  - A MISMATCH flashes both tiles for RETRY_TRANSITION_MS (the shared mistake
 *    momentum, surfaced through the engine's `feedbackDwellMs`), costs a life
 *    and increments mistakes, but the STAGE KEEPS RUNNING — it is NOT
 *    'stageFailed'. Hitting zero lives on a mismatched pair ends the run
 *    directly (`gameComplete`) because the shared LIVES_EXHAUSTED path only
 *    fires from the 'stageFailed' retry branch.
 *  - Timing out uses the shared TIMER_EXPIRED path and flips the stage to
 *    'stageFailed' (the classic retry flow, itself costing a life).
 *
 * Timer: a fair per-stage budget `8 + 2·pairs − level pressure` seconds (see
 * `getTileMatchingStageTimerSeconds` in src/config/memoryGames.ts). Difficulty
 * grows through the GRID first (4×3 → 6×6, the mobile-safe cap that keeps every
 * tile ≥ 44px) and through TIME PRESSURE past Level 5.
 *
 * highestNumber is NOT linear — it equals the board's pair count (6 → 8 → 10 →
 * 12 → 15 → 18), a pure level-table lookup (see `tileMatchingHighestNumber`),
 * mirrored by the 20260930000001 migration.
 *
 * Everything here is side-effect free and unit-testable. React (the countdown,
 * sound, submission) is layered on top by `src/hooks/useTileMatching.ts` using
 * the SAME shared run-engine hook as the other three games.
 */

import {
  LEVEL_BONUS,
  STAGE_SCORE,
  STAGES_PER_LEVEL,
  TILE_MATCHING_MAX_LIVES,
  TILE_MATCHING_MAX_LEVELS,
  TILE_MATCHING_STARTING_LIVES,
  getTileMatchingLevelConfig,
  getTileMatchingStageTimerSeconds,
  getTileMatchingValueTile,
  tileMatchingHighestNumber,
} from '../config/memoryGames'
import { isStageActive } from './memoryGameLogic'
import type {
  MemoryGameMetrics,
  MemoryGameStatus,
  MemoryStagePhase,
} from '../types/memoryGame.types'

// ─── Progression resolution ───────────────────────────────────────────────────

/**
 * Tile Matching stage data = an array where EVERY cell is a pair id
 * (0..pairs−1, each appearing exactly twice) — plain Fisher–Yates over the
 * twin deck. `rng` stays injectable for deterministic tests.
 */
export function createTileMatchingPositions(
  pairs: number,
  gridSize: number,
  rng: () => number = Math.random,
): number[] {
  const pairCount = Math.max(1, Math.trunc(pairs))
  const tiles = pairCount * 2
  if (tiles / gridSize < 1) {
    throw new Error(`Cannot fit ${tiles} tiles in ${gridSize} columns.`)
  }
  const values = Array.from({ length: tiles }, (_, index) => Math.floor(index / 2))
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = values[i]
    values[i] = values[j]
    values[j] = tmp
  }
  return values
}

export function getTileMatchingMaxLevel(): number {
  return TILE_MATCHING_MAX_LEVELS
}

export interface TileMatchingStageDescriptor {
  level: number
  stage: number
  /** Distinct pairs on the board = tiles / 2 — mirrors Rush "numbers". */
  numbers: number
  /** Board COLUMNS at this level (`gridSize` in the shared descriptor). */
  gridSize: number
  stagesRequired: number
}

/** Resolve pair count + board columns for a given level/stage. */
export function getTileMatchingStageDescriptor(
  level: number,
  stage: number,
): TileMatchingStageDescriptor {
  const config = getTileMatchingLevelConfig(level)
  return {
    level: config.level,
    stage,
    numbers: config.pairs,
    gridSize: config.cols,
    stagesRequired: STAGES_PER_LEVEL,
  }
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface TileMatchingState {
  status: MemoryGameStatus
  level: number
  stage: number
  /** Distinct pairs on the board (tiles / 2) — mirrors Rush "numbers". */
  numbers: number
  /** Board columns (`gridSize`); rows = positions.length / gridSize. */
  gridSize: number
  /** Board rows for the current stage. */
  rows: number
  /** positions[cell] = pair id hosted by that cell (each id twice). */
  positions: number[]
  /** Always 'recall' — every tile is hidden from the instant a stage begins. */
  phase: MemoryStagePhase
  /** Cell of the single face-up, still-unmatched tile (null = no pending pick). */
  firstPick: number | null
  /** Cells locked as matched (two indexes per cleared pair). */
  matchedIndices: number[]
  /** The two cells currently flashing as a wrong pair (board locks it). */
  mismatchIndices: number[]
  /** Matched-pair count so far — drives the "X matched, Y to go" status copy. */
  expected: number
  /** Count of correct pair selections (drives accuracy). */
  correctSelections: number
  /** Cell of the last matched second pick (transient visual feedback). */
  correctCell: number | null
  /** Cell of the last mismatched second pick (transient visual feedback). */
  wrongCell: number | null
  lastFailureReason: 'wrongNumber' | 'emptyTile' | 'timeout' | null
  /** Lives remaining — reach zero and the run is over. */
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
  /** ms between the two taps of each matched pair (first pick → match). */
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

function createFreshState(): TileMatchingState {
  const descriptor = getTileMatchingStageDescriptor(1, 1)
  return {
    status: 'idle',
    level: 1,
    stage: 1,
    numbers: descriptor.numbers,
    gridSize: descriptor.gridSize,
    rows: Math.trunc((descriptor.numbers * 2) / descriptor.gridSize),
    positions: [],
    /* Phase stays 'recall' even at idle so none of the per-second engine cues
       announce a reveal that does not exist in this game (same as Schulte). */
    phase: 'recall',
    firstPick: null,
    matchedIndices: [],
    mismatchIndices: [],
    expected: 0,
    correctSelections: 0,
    correctCell: null,
    wrongCell: null,
    lastFailureReason: null,
    lives: TILE_MATCHING_STARTING_LIVES,
    gameOverReason: null,
    stageTimerSeconds: getTileMatchingStageTimerSeconds(1, descriptor.numbers * 2),
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

export function createInitialTileMatchingState(): TileMatchingState {
  return createFreshState()
}

export type TileMatchingAction =
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
  state: TileMatchingState,
  level: number,
  stage: number,
  positions: number[],
): TileMatchingState {
  const descriptor = getTileMatchingStageDescriptor(level, stage)
  return {
    ...state,
    status: 'showingNumbers',
    level: descriptor.level,
    stage,
    numbers: descriptor.numbers,
    gridSize: descriptor.gridSize,
    rows: Math.trunc(positions.length / descriptor.gridSize),
    positions,
    phase: 'recall',
    firstPick: null,
    matchedIndices: [],
    mismatchIndices: [],
    expected: 0,
    correctCell: null,
    wrongCell: null,
    lastFailureReason: null,
    lastStagePoints: 0,
    lastLevelBonus: 0,
    lastSelectionAt: 0,
    stageTimerSeconds: getTileMatchingStageTimerSeconds(descriptor.level, positions.length),
    announcement: `Level ${descriptor.level}, Stage ${stage}. Match all ${descriptor.numbers} pairs.`,
  }
}

/** Pure reducer — the ONE place Tile Matching state changes. */
export function tileMatchingReducer(
  state: TileMatchingState,
  action: TileMatchingAction,
): TileMatchingState {
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

      // First tap: reveal the tile and wait for its partner.
      if (state.firstPick === null) {
        return {
          ...state,
          firstPick: action.cellIndex,
          correctCell: null,
          wrongCell: null,
          lastSelectionAt: action.now,
          announcement: 'Tile revealed. Find its matching pair.',
        }
      }

      const first = state.firstPick
      // Re-tapping the pending tile, a locked/mismatched cell, or a live
      // mismatch flash are all inert (the board also disables these).
      if (
        action.cellIndex === first ||
        state.matchedIndices.includes(action.cellIndex) ||
        state.matchedIndices.includes(first) ||
        state.mismatchIndices.length > 0
      ) {
        return state
      }

      // MATCH: two tiles carry the same pair id.
      if (state.positions[action.cellIndex] === state.positions[first]) {
        const matchedIndices = [...state.matchedIndices, first, action.cellIndex]
        const matchedPairs = matchedIndices.length / 2
        const reaction =
          state.lastSelectionAt > 0 ? Math.max(0, action.now - state.lastSelectionAt) : 0
        const reactionTimes = reaction > 0 ? [...state.reactionTimes, reaction] : state.reactionTimes

        // Every pair cleared → the stage is won (and the level on its final stage).
        if (matchedPairs === state.numbers) {
          const levelComplete = state.stage >= STAGES_PER_LEVEL
          return {
            ...state,
            firstPick: null,
            matchedIndices,
            mismatchIndices: [],
            expected: matchedPairs,
            correctSelections: state.correctSelections + 1,
            reactionTimes,
            correctCell: action.cellIndex,
            wrongCell: null,
            lastSelectionAt: action.now,
            stagesCompleted: state.stagesCompleted + 1,
            levelsCompleted: state.levelsCompleted + (levelComplete ? 1 : 0),
            lives: Math.min(state.lives + 1, TILE_MATCHING_MAX_LIVES),
            score: state.score + STAGE_SCORE + (levelComplete ? LEVEL_BONUS : 0),
            lastStagePoints: STAGE_SCORE,
            lastLevelBonus: levelComplete ? LEVEL_BONUS : 0,
            status: levelComplete ? 'levelComplete' : 'stageComplete',
            announcement: levelComplete
              ? `Level ${state.level} complete. Bonus ${LEVEL_BONUS} points.`
              : `All pairs matched. Plus ${STAGE_SCORE} points.`,
          }
        }

        return {
          ...state,
          firstPick: null,
          matchedIndices,
          mismatchIndices: [],
          expected: matchedPairs,
          correctSelections: state.correctSelections + 1,
          reactionTimes,
          correctCell: action.cellIndex,
          wrongCell: null,
          lastSelectionAt: action.now,
          announcement: 'Pair matched.',
        }
      }

      // MISMATCH: costs a life, but the stage keeps running (no RETRY de-route).
      const lives = state.lives - 1
      const mismatchIndices = [first, action.cellIndex]
      if (lives <= 0) {
        return {
          ...state,
          firstPick: null,
          mismatchIndices,
          correctCell: null,
          wrongCell: action.cellIndex,
          mistakes: state.mistakes + 1,
          lives: 0,
          lastFailureReason: 'wrongNumber',
          status: 'gameComplete',
          gameOverReason: 'lives',
          announcement: 'Game over. All lives used.',
        }
      }
      return {
        ...state,
        firstPick: null,
        mismatchIndices,
        correctCell: null,
        wrongCell: action.cellIndex,
        mistakes: state.mistakes + 1,
        lives,
        lastFailureReason: 'wrongNumber',
        announcement: 'Those tiles do not match. One life lost.',
      }
    }

    case 'ADVANCE_STAGE': {
      if (state.status === 'levelComplete') {
        if (state.level >= TILE_MATCHING_MAX_LEVELS) {
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
      return {
        ...state,
        correctCell: null,
        wrongCell: null,
        mismatchIndices: [],
        firstPick: null,
      }

    case 'FINISH_GAME':
      return {
        ...state,
        status: 'gameComplete',
        gameOverReason: 'finished',
        wrongCell: null,
        correctCell: null,
        mismatchIndices: [],
        firstPick: null,
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
 * other games). highestNumber is the board's pair count for the current level
 * (see `tileMatchingHighestNumber` in src/config/memoryGames.ts — the single
 * source mirrored by migration 20260930000001).
 */
export function buildTileMatchingMetrics(state: TileMatchingState): MemoryGameMetrics {
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
    highestNumber: tileMatchingHighestNumber(state.level),
    stagesCompleted: state.stagesCompleted,
    stagesFailed: state.stagesFailed,
    mistakes: state.mistakes,
    accuracy,
    averageReactionTimeMs,
  }
}

export { getTileMatchingValueTile }

export {
  LEVEL_BONUS,
  STAGES_PER_LEVEL,
  STAGE_SCORE,
  TILE_MATCHING_MAX_LIVES,
  TILE_MATCHING_MAX_LEVELS,
  TILE_MATCHING_STARTING_LIVES,
  getTileMatchingStageTimerSeconds,
} from '../config/memoryGames'