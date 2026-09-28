/**
 * ─── Number Memory Rush — pure game logic & state machine ───────────────────
 *
 * Everything here is side-effect free and unit-testable: progression resolution,
 * grid expansion, board generation, scoring, metric derivation and the reducer
 * that owns every status transition. React (timers, sound, submission) is layered
 * on top in `src/hooks/useMemoryGame.ts`; no component re-implements a rule.
 */

import {
  LEVEL_BONUS,
  MAX_LEVELS,
  MEMORY_GRID_THRESHOLDS,
  MEMORY_LEVEL_CONFIG,
  SCHULTE_MAX_LEVELS,
  SCHULTE_TRAIL_GAME_ID,
  STAGE_SCORE,
  STAGES_PER_LEVEL,
  STARTING_LIVES,
  STARTING_NUMBERS,
  TILE_MATCHING_MAX_LEVELS,
  TILE_MATCHING_GAME_ID,
  VMM_LEVEL_CONFIG,
  VMM_MAX_LEVELS,
  VISUAL_MEMORY_MATRIX_GAME_ID,
  getStageTimerSeconds,
  schulteHighestNumber,
  tileMatchingHighestNumber,
  type MemoryLevelConfig,
} from '../config/memoryGames'
import type {
  MemoryGameId,
  MemoryGameMetrics,
  MemoryGameStatus,
  MemoryStagePhase,
} from '../types/memoryGame.types'

// ─── Progression resolution ───────────────────────────────────────────────────

/** Canonical per-level config (clamped to the first/last level). */
export function getLevelConfig(level: number): MemoryLevelConfig {
  const clamped = Math.min(Math.max(Math.trunc(level), 1), MAX_LEVELS)
  return MEMORY_LEVEL_CONFIG[clamped - 1]
}

export function getMaxLevel(): number {
  return MAX_LEVELS
}

export interface StageDescriptor {
  level: number
  stage: number
  numbers: number
  gridSize: number
  stagesRequired: number
}

/** Resolve board size (grid) and number count for a given level/stage. */
export function getStageDescriptor(level: number, stage: number): StageDescriptor {
  const config = getLevelConfig(level)
  return {
    level: config.level,
    stage,
    numbers: config.numbers,
    gridSize: getGridSizeForNumbers(config.numbers),
    stagesRequired: config.stagesRequired,
  }
}

/** Grid side length for a number count — threshold table with a safe fallback. */
export function getGridSizeForNumbers(numbers: number): number {
  const match = MEMORY_GRID_THRESHOLDS.find(
    (threshold) => numbers >= threshold.minNumbers && numbers <= threshold.maxNumbers,
  )
  if (match) return match.size
  // Fallback for counts beyond the explicit table: always strictly more cells
  // than numbers so a unique placement is guaranteed.
  return Math.ceil(Math.sqrt(numbers)) + 1
}

export function countCells(gridSize: number): number {
  return gridSize * gridSize
}

// ─── Board generation ─────────────────────────────────────────────────────────

/**
 * Pick `count` distinct cells from a `gridSize`×`gridSize` board.
 * Uniqueness is guaranteed by the Fisher–Yates slice. `rng` is injectable for
 * deterministic tests. Shared by Number Memory Rush (numbers) and Visual Memory
 * Matrix (pattern tiles) — the ONE canonical grid placement algorithm.
 */
export function createDistinctCells(
  count: number,
  gridSize: number,
  rng: () => number = Math.random,
): number[] {
  const cells = countCells(gridSize)
  if (count < 1) throw new Error('A stage needs at least one cell.')
  if (count > cells) {
    throw new Error(`Cannot place ${count} cells on a ${gridSize}×${gridSize} board.`)
  }
  const pool = Array.from({ length: cells }, (_, index) => index)
  for (let i = 0; i < count; i += 1) {
    const j = i + Math.floor(rng() * (cells - i))
    const tmp = pool[i]
    pool[i] = pool[j]
    pool[j] = tmp
  }
  return pool.slice(0, count)
}

/**
 * Pick `numbers` distinct cells and return them indexed by number:
 * `result[number - 1] === cellIndex`. Uniqueness is guaranteed by the
 * Fisher–Yates slice. `rng` is injectable for deterministic tests.
 */
export function createStagePositions(
  numbers: number,
  gridSize: number,
  rng: () => number = Math.random,
): number[] {
  return createDistinctCells(numbers, gridSize, rng)
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/** Alias kept for readability/tests — one stage is worth a fixed amount. */
export function calculateStageScore(): number {
  return STAGE_SCORE
}

/** Alias kept for readability/tests — one level bonus is fixed. */
export function calculateLevelBonus(): number {
  return LEVEL_BONUS
}

/** Deterministic total: completed stages + completed levels. */
export function computeScore(stagesCompleted: number, levelsCompleted: number): number {
  return stagesCompleted * STAGE_SCORE + levelsCompleted * LEVEL_BONUS
}

/**
 * Highest score theoretically reachable while sitting on `level`: every stage of
 * every level up to and including the current one, plus each level bonus.
 * `maxLevel` bounds the clamp per game (Rush 12, Matrix 15).
 */
export function computeMaxScoreForLevel(level: number, maxLevel: number = MAX_LEVELS): number {
  const clamped = Math.min(Math.max(Math.trunc(level), 1), maxLevel)
  return clamped * (STAGES_PER_LEVEL * STAGE_SCORE + LEVEL_BONUS)
}

export function computeGlobalMaxScore(maxLevel: number = MAX_LEVELS): number {
  return computeMaxScoreForLevel(maxLevel, maxLevel)
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface MemoryGameState {
  status: MemoryGameStatus
  level: number
  stage: number
  numbers: number
  gridSize: number
  /** positions[number - 1] = cell index hosting that number. */
  positions: number[]
  phase: MemoryStagePhase
  /** Next number the player must tap (1-based). */
  expected: number
  /** Count of correct selections (drives accuracy). */
  correctSelections: number
  /** Cell index of the last correct tap (transient visual feedback). */
  correctCell: number | null
  /** Cell index of the last wrong tap (transient visual feedback). */
  wrongCell: number | null
  /**
   * Why the LAST stage failure happened (surfaces the failure copy + the
   * correct audio cue — timeout plays "time up", not "wrong"). Reset whenever
   * a new arrangement is served.
   */
  lastFailureReason: 'wrongNumber' | 'emptyTile' | 'timeout' | null
  /** Lives remaining in this run — exactly 3 at game start. */
  lives: number
  /** Why the run ended (used by the result screen copy). */
  gameOverReason: 'lives' | 'finished' | 'completed' | null
  /** Recall timer budget for the CURRENT stage (seconds, from config). */
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

export function createInitialGameState(): MemoryGameState {
  const descriptor = getStageDescriptor(1, 1)
  return {
    status: 'idle',
    level: 1,
    stage: 1,
    numbers: descriptor.numbers,
    gridSize: descriptor.gridSize,
    positions: [],
    phase: 'show',
    expected: 1,
    correctSelections: 0,
    correctCell: null,
    wrongCell: null,
    lastFailureReason: null,
    lives: STARTING_LIVES,
    gameOverReason: null,
    stageTimerSeconds: getStageTimerSeconds(1),
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

export type MemoryGameAction =
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
  state: MemoryGameState,
  level: number,
  stage: number,
  positions: number[],
): MemoryGameState {
  const descriptor = getStageDescriptor(level, stage)
  return {
    ...state,
    status: 'showingNumbers',
    level: descriptor.level,
    stage,
    numbers: descriptor.numbers,
    gridSize: descriptor.gridSize,
    positions,
    phase: 'show',
    expected: 1,
    correctCell: null,
    wrongCell: null,
    lastFailureReason: null,
    lastStagePoints: 0,
    lastLevelBonus: 0,
    lastSelectionAt: 0,
    /* The global stage number is the count of stages already cleared + 1, so a
       retried stage keeps the same time budget it was originally served. */
    stageTimerSeconds: getStageTimerSeconds(state.stagesCompleted + 1),
    announcement: `Level ${descriptor.level}, Stage ${stage}. Remember ${descriptor.numbers} numbers. Tap number 1 to hide them.`,
  }
}

/** Pure reducer — the ONE place game state changes. */
export function memoryGameReducer(
  state: MemoryGameState,
  action: MemoryGameAction,
): MemoryGameState {
  switch (action.type) {
    case 'START_GAME':
      return beginStage(
        {
          ...createInitialGameState(),
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
      if (!isStageActive(state.status)) {
        return state
      }

      if (state.phase === 'show') {
        // Only number 1 starts the recall phase; other taps are ignored.
        if (state.positions[0] !== action.cellIndex) return state
        return {
          ...state,
          phase: 'recall',
          expected: 2,
          correctSelections: state.correctSelections + 1,
          correctCell: action.cellIndex,
          wrongCell: null,
          lastSelectionAt: action.now,
          announcement: 'Numbers hidden. Find number 2.',
        }
      }

      // Recall phase.
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
            : 'Incorrect. One life lost. New arrangement.',
        }
      }

      const reaction =
        state.lastSelectionAt > 0 ? Math.max(0, action.now - state.lastSelectionAt) : 0
      const reactionTimes = reaction > 0 ? [...state.reactionTimes, reaction] : state.reactionTimes
      const nextExpected = state.expected + 1
      const correctSelections = state.correctSelections + 1

      // Stage cleared — every number found in order.
      if (nextExpected > state.numbers) {
        const levelComplete = state.stage >= STAGES_PER_LEVEL
        const score =
          state.score + STAGE_SCORE + (levelComplete ? LEVEL_BONUS : 0)
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
            : `Stage complete. Plus ${STAGE_SCORE} points.`,
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
        if (state.level >= MAX_LEVELS) {
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
      return createInitialGameState()

    default:
      return state
  }
}

// ─── Derived metrics & validation mirror ─────────────────────────────────────

export function isStageOver(status: MemoryGameStatus): boolean {
  return status === 'stageComplete' || status === 'stageFailed' || status === 'levelComplete'
}

/** A stage is live (tiles clickable, recall timer may run) only in these states. */
export function isStageActive(status: MemoryGameStatus): boolean {
  return status === 'showingNumbers' || status === 'recalling'
}

export function isGameOver(status: MemoryGameStatus): boolean {
  return (
    status === 'gameComplete' ||
    status === 'submittingScore' ||
    status === 'submissionSuccess' ||
    status === 'submissionError'
  )
}

/** Derive the leaderboard-safe metrics from engine state. */
export function buildMetrics(state: MemoryGameState): MemoryGameMetrics {
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
    highestNumber: getLevelConfig(state.level).numbers,
    stagesCompleted: state.stagesCompleted,
    stagesFailed: state.stagesFailed,
    mistakes: state.mistakes,
    accuracy,
    averageReactionTimeMs,
  }
}

export interface MetricsValidation {
  valid: boolean
  reason?: string
}

/** The one maximum level any memory game reaches (per-game parity bounds). */
export function getGameMaxLevel(gameId: MemoryGameId): number {
  if (gameId === VISUAL_MEMORY_MATRIX_GAME_ID) return VMM_MAX_LEVELS
  if (gameId === TILE_MATCHING_GAME_ID) return TILE_MATCHING_MAX_LEVELS
  if (gameId === SCHULTE_TRAIL_GAME_ID) return SCHULTE_MAX_LEVELS
  return MAX_LEVELS
}

/**
 * Resolve the highest "primary metric" (numbers for Rush, pattern targets for
 * Matrix, pairs for Tile Matching, board tiles for Schulte Trail) that sits on
 * the given level. Rush and Matrix grow one per level; Tile Matching and Schulte
 * Trail follow their level tables (`tileMatchingHighestNumber` /
 * `schulteHighestNumber`) because their boards cap at the mobile-safe 6×6 grid.
 */
export function getGameHighestNumber(
  gameId: MemoryGameId,
  level: number,
): number {
  if (gameId === VISUAL_MEMORY_MATRIX_GAME_ID) {
    const clamped = Math.min(Math.max(Math.trunc(level), 1), VMM_MAX_LEVELS)
    return VMM_LEVEL_CONFIG[clamped - 1].targets
  }
  if (gameId === TILE_MATCHING_GAME_ID) {
    return tileMatchingHighestNumber(level)
  }
  if (gameId === SCHULTE_TRAIL_GAME_ID) {
    return schulteHighestNumber(level)
  }
  return getLevelConfig(level).numbers
}

/**
 * Client-side mirror of the server's anti-cheat checks. Used to refuse an
 * obviously impossible payload before it leaves the browser; the SQL RPC is
 * still the authority and re-validates every field. `gameId` bounds the max
 * level and the highest-metric parity to the specific title.
 */
export function validateMemoryMetrics(
  metrics: MemoryGameMetrics,
  gameId: MemoryGameId = 'number_memory_rush',
): MetricsValidation {
  const {
    score,
    highestLevel,
    highestNumber,
    stagesCompleted,
    stagesFailed,
    mistakes,
    accuracy,
    averageReactionTimeMs,
  } = metrics

  const maxLevel = getGameMaxLevel(gameId)

  if (!Number.isFinite(score) || score < 0 || !Number.isInteger(score)) {
    return { valid: false, reason: 'Invalid score.' }
  }
  if (score % STAGE_SCORE !== 0) {
    return { valid: false, reason: 'Score is not a valid multiple.' }
  }
  if (!Number.isInteger(highestLevel) || highestLevel < 1 || highestLevel > maxLevel) {
    return { valid: false, reason: 'Invalid level.' }
  }
  if (highestNumber !== getGameHighestNumber(gameId, highestLevel)) {
    return { valid: false, reason: 'Number count does not match the level.' }
  }
  const completedLevels = highestLevel - 1
  const minStages = completedLevels * STAGES_PER_LEVEL
  const maxStages = minStages + STAGES_PER_LEVEL
  if (
    !Number.isInteger(stagesCompleted) ||
    stagesCompleted < minStages ||
    stagesCompleted > maxStages
  ) {
    return { valid: false, reason: 'Stage count is impossible for this level.' }
  }
  if (score > computeMaxScoreForLevel(highestLevel, maxLevel)) {
    return { valid: false, reason: 'Score exceeds the maximum for this level.' }
  }
  if (score < stagesCompleted * STAGE_SCORE) {
    return { valid: false, reason: 'Score is lower than the completed stages.' }
  }
  const levelBonusPoints = score - stagesCompleted * STAGE_SCORE
  if (levelBonusPoints % LEVEL_BONUS !== 0) {
    return { valid: false, reason: 'Score is not a valid multiple.' }
  }
  const impliedLevelsCompleted = levelBonusPoints / LEVEL_BONUS
  if (impliedLevelsCompleted < 0 || impliedLevelsCompleted > highestLevel) {
    return { valid: false, reason: 'Completed-level count is impossible.' }
  }
  if (!Number.isInteger(stagesFailed) || stagesFailed < 0) {
    return { valid: false, reason: 'Invalid failed-stage count.' }
  }
  if (!Number.isInteger(mistakes) || mistakes < 0 || mistakes > 100000) {
    return { valid: false, reason: 'Invalid mistake count.' }
  }
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) {
    return { valid: false, reason: 'Invalid accuracy.' }
  }
  if (
    !Number.isFinite(averageReactionTimeMs) ||
    averageReactionTimeMs < 0 ||
    averageReactionTimeMs > 600000
  ) {
    return { valid: false, reason: 'Invalid reaction time.' }
  }
  return { valid: true }
}

/** Guard used by tests/components: is this stage number 1 (the reveal tap)? */
export function isRevealTap(state: MemoryGameState, cellIndex: number): boolean {
  return state.positions[0] === cellIndex
}

export {
  LEVEL_BONUS,
  MAX_LEVELS,
  STARTING_LIVES,
  STARTING_NUMBERS,
  STAGES_PER_LEVEL,
  STAGE_SCORE,
  getStageTimerSeconds,
}
