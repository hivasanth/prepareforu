import { describe, it, expect } from 'vitest'
import {
  createInitialTileMatchingState,
  createTileMatchingPositions,
  getTileMatchingMaxLevel,
  getTileMatchingStageDescriptor,
  tileMatchingReducer,
  buildTileMatchingMetrics,
} from './tileMatchingLogic'
import {
  TILE_MATCHING_MAX_LIVES,
  TILE_MATCHING_MAX_LEVELS,
  TILE_MATCHING_STARTING_LIVES,
  STAGE_SCORE,
  STAGES_PER_LEVEL,
  getTileMatchingLevelConfig,
  getTileMatchingStageTimerSeconds,
  tileMatchingHighestNumber,
} from '../config/memoryGames'

function startRun() {
  const initial = createInitialTileMatchingState()
  return tileMatchingReducer(initial, {
    type: 'START_GAME',
    positions: createTileMatchingPositions(6, 3, () => 0),
    now: 0,
  })
}

/** Flipping cells `a` then `b` from a live stage (match or mismatch is the test's call). */
function tapPair(state: ReturnType<typeof createInitialTileMatchingState>, a: number, b: number) {
  let next = tileMatchingReducer(state, { type: 'SELECT_TILE', cellIndex: a, now: 500 })
  expect(next.firstPick).toBe(a)
  next = tileMatchingReducer(next, { type: 'SELECT_TILE', cellIndex: b, now: 900 })
  return next
}

/** A cell that hosts a DIFFERENT pair id than cell `a` (guaranteed mismatch). */
function mismatchingCell(
  state: ReturnType<typeof createInitialTileMatchingState>,
  otherCell: number,
): number {
  const value = state.positions[otherCell]
  return state.positions.findIndex((entry, index) => index !== otherCell && entry !== value) ?? 0
}

/** Clear every pair of the current stage by flipping two matching cells at a time. */
function completeStage(state: ReturnType<typeof createInitialTileMatchingState>) {
  let next = state
  const remaining = [...Array(next.numbers).keys()]
  for (const pairId of remaining) {
    const first = next.positions.findIndex((value, index) => value === pairId && !next.matchedIndices.includes(index))
    const second = next.positions.findIndex(
      (value, index) => index > first && value === pairId && !next.matchedIndices.includes(index),
    )
    expect(first).toBeGreaterThanOrEqual(0)
    expect(second).toBeGreaterThanOrEqual(0)
    next = tapPair(next, first, second)
  }
  return next
}

describe('tileMatchingLogic — pure game state machine', () => {
  it('exposes the configured level cap and life pool', () => {
    expect(getTileMatchingMaxLevel()).toBe(TILE_MATCHING_MAX_LEVELS)
    expect(TILE_MATCHING_MAX_LEVELS).toBe(12)
    expect(TILE_MATCHING_STARTING_LIVES).toBe(5)
    expect(TILE_MATCHING_MAX_LIVES).toBe(8)
  })

  it('resolves the board by level: 4×3 → … → 6×6 with pairs = tiles / 2', () => {
    const level1 = getTileMatchingStageDescriptor(1, 1)
    const level3 = getTileMatchingStageDescriptor(3, 1)
    const level5 = getTileMatchingStageDescriptor(5, 1)
    const level6 = getTileMatchingStageDescriptor(6, 1)
    expect(level1.numbers).toBe(6)
    expect(level1.gridSize).toBe(3)
    expect(level3.numbers).toBe(10)
    expect(level3.gridSize).toBe(4)
    expect(level5.numbers).toBe(15)
    expect(level5.gridSize).toBe(5)
    expect(level6.numbers).toBe(18)
    expect(level6.gridSize).toBe(6)
  })

  it('keeps the grid capped at 6×6 and the metric tables in lockstep', () => {
    for (let level = 1; level <= TILE_MATCHING_MAX_LEVELS; level += 1) {
      const config = getTileMatchingLevelConfig(level)
      expect(config.rows).toBeLessThanOrEqual(6)
      expect(config.cols).toBeLessThanOrEqual(6)
      expect(config.tiles).toBe(config.rows * config.cols)
      expect(config.pairs).toBe(config.tiles / 2)
      expect(tileMatchingHighestNumber(level)).toBe(config.pairs)
    }
    expect(getTileMatchingLevelConfig(TILE_MATCHING_MAX_LEVELS).rows).toBe(6)
    expect(getTileMatchingLevelConfig(TILE_MATCHING_MAX_LEVELS).cols).toBe(6)
    expect(getTileMatchingLevelConfig(TILE_MATCHING_MAX_LEVELS).pairs).toBe(18)
  })

  it('produces a fair, floor-bounded per-stage time budget', () => {
    expect(getTileMatchingStageTimerSeconds(1, 12)).toBe(20)
    expect(getTileMatchingStageTimerSeconds(6, 36)).toBe(43)
    expect(getTileMatchingStageTimerSeconds(12, 36)).toBe(38)
    expect(getTileMatchingStageTimerSeconds(1, 8)).toBe(16)
  })

  it('deals a Fisher-Yates twin deck: every pair id exactly twice', () => {
    const deal = createTileMatchingPositions(6, 3, () => 0)
    expect(deal).toHaveLength(12)
    for (let pairId = 0; pairId < 6; pairId += 1) {
      const occurrences = deal.filter((value) => value === pairId)
      expect(occurrences).toHaveLength(2)
    }
    expect(deal.every((value) => value >= 0 && value < 6)).toBe(true)
  })

  it('A. a fresh run opens idle at Level 1 with 6 pairs and full lives', () => {
    const initial = createInitialTileMatchingState()
    expect(initial.status).toBe('idle')
    expect(initial.level).toBe(1)
    expect(initial.stage).toBe(1)
    expect(initial.numbers).toBe(6)
    expect(initial.phase).toBe('recall')
    expect(initial.lives).toBe(TILE_MATCHING_STARTING_LIVES)
    expect(initial.score).toBe(0)
    expect(initial.positions).toHaveLength(0)
  })

  it('B. START_GAME begins Stage 1 in recall with a fresh deal and the stage timer', () => {
    const next = startRun()
    expect(next.status).toBe('showingNumbers')
    expect(next.phase).toBe('recall')
    expect(next.level).toBe(1)
    expect(next.stage).toBe(1)
    expect(next.numbers).toBe(6)
    expect(next.gridSize).toBe(3)
    expect(next.rows).toBe(4)
    expect(next.stageTimerSeconds).toBe(getTileMatchingStageTimerSeconds(1, 12))
    expect(next.matchedIndices).toHaveLength(0)
    expect(next.firstPick).toBeNull()
  })

  it('C. the first tap reveals a tile and nothing else changes', () => {
    const started = startRun()
    const next = tileMatchingReducer(started, { type: 'SELECT_TILE', cellIndex: 3, now: 100 })
    expect(next.status).toBe('showingNumbers')
    expect(next.firstPick).toBe(3)
    expect(next.lives).toBe(TILE_MATCHING_STARTING_LIVES)
    expect(next.mistakes).toBe(0)
    expect(next.matchedIndices).toHaveLength(0)
  })

  it('D. a mismatch flashes, costs one life, mistakes +1, and the STAGE KEEPS RUNNING', () => {
    const started = startRun()
    const wrong = mismatchingCell(started, 0)
    const next = tapPair(started, 0, wrong)
    expect(next.status).toBe('showingNumbers')
    expect(next.phase).toBe('recall')
    expect(next.lastFailureReason).toBe('wrongNumber')
    expect(next.lives).toBe(TILE_MATCHING_STARTING_LIVES - 1)
    expect(next.mistakes).toBe(1)
    expect(next.mismatchIndices).toEqual([0, wrong])
    expect(next.wrongCell).toBe(wrong)
  })

  it('E. a match locks both tiles, moves expected forward, and keeps every life', () => {
    const started = startRun()
    const first = 0
    const second = started.positions.findIndex(
      (value, index) => index !== first && value === started.positions[first],
    )
    const next = tapPair(started, first, second)
    expect(next.status).toBe('showingNumbers')
    expect(next.expected).toBe(1)
    expect(next.correctSelections).toBe(1)
    expect(next.matchedIndices).toEqual([first, second])
    expect(next.lives).toBe(TILE_MATCHING_STARTING_LIVES)
    expect(next.mistakes).toBe(0)
  })

  it('F. matching a tile already matched, or re-tapping the pending tile, is INERT', () => {
    const started = startRun()
    const first = 0
    const second = started.positions.findIndex(
      (value, index) => index !== first && value === started.positions[first],
    )
    const matched = tapPair(started, first, second)
    // Re-tapping the just-paired cell does nothing.
    const inert = tileMatchingReducer(matched, { type: 'SELECT_TILE', cellIndex: first, now: 1200 })
    expect(inert.matchedIndices).toEqual(matched.matchedIndices)
    expect(inert.expected).toBe(1)
    expect(inert.mistakes).toBe(0)
  })

  it('G. clearing every pair wins the stage: +5 points, +1 life, stagesCompleted', () => {
    let state = startRun()
    state = completeStage(state)
    expect(state.status).toBe('stageComplete')
    expect(state.score).toBe(STAGE_SCORE)
    expect(state.stagesCompleted).toBe(1)
    expect(state.expected).toBe(6)
    expect(state.lives).toBe(TILE_MATCHING_STARTING_LIVES + 1)
  })

  it('H. TIMER_EXPIRED fails the stage without a mistake and loses one life', () => {
    const started = startRun()
    const next = tileMatchingReducer(started, { type: 'TIMER_EXPIRED' })
    expect(next.status).toBe('stageFailed')
    expect(next.lastFailureReason).toBe('timeout')
    expect(next.lives).toBe(TILE_MATCHING_STARTING_LIVES - 1)
    expect(next.mistakes).toBe(0)
    expect(next.stagesFailed).toBe(1)
  })

  it('I. a mismatch on the LAST life ends the run directly (no retry de-route)', () => {
    const started = { ...startRun(), lives: 1 }
    const wrong = mismatchingCell(started, 0)
    const next = tapPair(started, 0, wrong)
    expect(next.status).toBe('gameComplete')
    expect(next.gameOverReason).toBe('lives')
    expect(next.lives).toBe(0)
    expect(next.mistakes).toBe(1)
  })

  it('J. LIVES_EXHAUSTED ends the run once a failed stage leaves no lives', () => {
    let state = { ...startRun(), lives: 1 }
    state = tileMatchingReducer(state, { type: 'TIMER_EXPIRED' })
    expect(state.status).toBe('stageFailed')
    expect(state.lives).toBe(0)
    state = tileMatchingReducer(state, { type: 'LIVES_EXHAUSTED' })
    expect(state.status).toBe('gameComplete')
    expect(state.gameOverReason).toBe('lives')
  })

  it('K. ADVANCE_STAGE opens the next stage after a cleared stage', () => {
    let state = startRun()
    state = completeStage(state)
    expect(state.status).toBe('stageComplete')
    const advanced = tileMatchingReducer(state, {
      type: 'ADVANCE_STAGE',
      positions: createTileMatchingPositions(6, 3, () => 0.5),
    })
    expect(advanced.status).toBe('showingNumbers')
    expect(advanced.stage).toBe(2)
    expect(advanced.numbers).toBe(6)
    expect(advanced.matchedIndices).toHaveLength(0)
  })

  it('clears four stages to finish Level 1 with the level bonus', () => {
    let state = startRun()
    for (let stage = 1; stage <= STAGES_PER_LEVEL; stage += 1) {
      state = completeStage(state)
      state = tileMatchingReducer(state, {
        type: 'ADVANCE_STAGE',
        positions: createTileMatchingPositions(6, 3, () => 0.5),
      })
    }
    expect(state.status).toBe('showingNumbers')
    expect(state.level).toBe(2)
    expect(state.score).toBe(4 * STAGE_SCORE + 10)
    expect(state.levelsCompleted).toBe(1)
  })

  it('L. buildTileMatchingMetrics resolves the leaderboard-safe shape', () => {
    const started = startRun()
    const first = 0
    const second = started.positions.findIndex(
      (value, index) => index !== first && value === started.positions[first],
    )
    const onePair = tapPair(started, first, second)
    // Reveal an unmatched tile, then decide with a guaranteed mismatching one.
    const reveal = started.positions.findIndex(
      (_value, index) => index !== first && index !== second,
    )
    let mixed = tileMatchingReducer(onePair, { type: 'SELECT_TILE', cellIndex: reveal, now: 1200 })
    expect(mixed.firstPick).toBe(reveal)
    const wrong = started.positions.findIndex(
      (value, index) => value !== started.positions[reveal] && index !== first && index !== second,
    )
    mixed = tileMatchingReducer(mixed, { type: 'SELECT_TILE', cellIndex: wrong, now: 1600 })
    expect(mixed.mistakes).toBe(1)
    expect(mixed.correctSelections).toBe(1)
    const metrics = buildTileMatchingMetrics(mixed)
    expect(metrics.score).toBe(0) // no cleared stage yet
    expect(metrics.highestLevel).toBe(1)
    expect(metrics.highestNumber).toBe(6)
    expect(metrics.stagesCompleted).toBe(0)
    expect(metrics.mistakes).toBe(1)
    expect(metrics.accuracy).toBeCloseTo(50)
    const initialMetrics = buildTileMatchingMetrics(createInitialTileMatchingState())
    expect(initialMetrics.accuracy).toBe(100)
    expect(initialMetrics.averageReactionTimeMs).toBe(0)
  })

  it('M. a full clear at Level 12 flips the run to gameComplete', () => {
    let state = startRun()
    for (let level = 1; level <= TILE_MATCHING_MAX_LEVELS; level += 1) {
      for (let stage = 1; stage <= STAGES_PER_LEVEL; stage += 1) {
        state = completeStage(state)
        // The next board must be dealt for the NEXT level when the current stage
        // was the level's final one (the reducer resolves level/stage itself).
        const nextLevel = state.status === 'levelComplete' ? state.level + 1 : state.level
        const descriptor = getTileMatchingStageDescriptor(nextLevel, 1)
        state = tileMatchingReducer(state, {
          type: 'ADVANCE_STAGE',
          positions: createTileMatchingPositions(
            descriptor.numbers,
            descriptor.gridSize,
            () => 0.5,
          ),
        })
      }
    }
    expect(state.status).toBe('gameComplete')
    expect(state.gameOverReason).toBe('completed')
  })
})