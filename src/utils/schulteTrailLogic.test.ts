import { describe, it, expect } from 'vitest'
import {
  createInitialSchulteTrailState,
  createSchultePositions,
  getSchulteMaxLevel,
  getSchulteStageDescriptor,
  schulteTrailReducer,
  buildSchulteMetrics,
} from './schulteTrailLogic'
import {
  SCHULTE_MAX_LEVELS,
  STAGE_SCORE,
  STAGES_PER_LEVEL,
  STARTING_LIVES,
  getSchulteLevelConfig,
  getSchulteStageTimerSeconds,
  schulteHighestNumber,
} from '../config/memoryGames'

/** A cell that does NOT host the current expected number (full grid → wrong). */
function wrongCell(state: ReturnType<typeof createInitialSchulteTrailState>): number {
  return (state.positions[state.expected - 1] + 1) % (state.gridSize * state.gridSize)
}

/** Tap every number of the current stage in ascending order (the whole board). */
function completeStage(state: ReturnType<typeof createInitialSchulteTrailState>) {
  let next = state
  const total = next.numbers
  for (let value = 1; value <= total; value += 1) {
    next = schulteTrailReducer(next, {
      type: 'SELECT_TILE',
      cellIndex: next.positions[value - 1],
      now: value * 100,
    })
  }
  return next
}

describe('schulteTrailLogic — pure game state machine', () => {
  it('exposes the configured stage budget and level cap', () => {
    expect(getSchulteMaxLevel()).toBe(SCHULTE_MAX_LEVELS)
    expect(SCHULTE_MAX_LEVELS).toBe(12)
  })

  it('resolves the board by level: 4×4 → 5×5 → 6×6, covering every cell', () => {
    const level1 = getSchulteStageDescriptor(1, 1)
    const level3 = getSchulteStageDescriptor(3, 1)
    const level5 = getSchulteStageDescriptor(5, 1)
    expect(level1.numbers).toBe(16)
    expect(level1.gridSize).toBe(4)
    expect(level3.numbers).toBe(25)
    expect(level3.gridSize).toBe(5)
    expect(level5.numbers).toBe(36)
    expect(level5.gridSize).toBe(6)
  })

  it('keeps the grid capped at 6×6 and the metric tables in lockstep', () => {
    for (let level = 1; level <= SCHULTE_MAX_LEVELS; level += 1) {
      const config = getSchulteLevelConfig(level)
      expect(config.gridSize).toBeLessThanOrEqual(6)
      expect(config.tiles).toBe(config.gridSize * config.gridSize)
      expect(schulteHighestNumber(level)).toBe(config.tiles)
    }
    expect(getSchulteLevelConfig(12).gridSize).toBe(6)
  })

  it('produces a fair, floor-bounded per-stage time budget', () => {
    expect(getSchulteStageTimerSeconds(1, 16)).toBe(46)
    expect(getSchulteStageTimerSeconds(4, 25)).toBe(59)
    expect(getSchulteStageTimerSeconds(5, 36)).toBe(74)
    expect(getSchulteStageTimerSeconds(12, 36)).toBeGreaterThanOrEqual(45)
  })

  it('creates a FULL permutation — every cell used exactly once', () => {
    const permutation = createSchultePositions(16, 4, () => 0.5)
    expect(permutation).toHaveLength(16)
    expect(new Set(permutation).size).toBe(16)
    permutation.forEach((cell) => expect(cell).toBeGreaterThanOrEqual(0))
    permutation.forEach((cell) => expect(cell).toBeLessThan(16))
  })

  it('A. a fresh run opens idle at Level 1 with 16 targets and full lives', () => {
    const initial = createInitialSchulteTrailState()
    expect(initial.status).toBe('idle')
    expect(initial.level).toBe(1)
    expect(initial.stage).toBe(1)
    expect(initial.numbers).toBe(16)
    expect(initial.phase).toBe('recall')
    expect(initial.lives).toBe(STARTING_LIVES)
    expect(initial.score).toBe(0)
  })

  it('B. START_GAME begins Stage 1 in recall with a full board and the stage timer', () => {
    const positions = createSchultePositions(16, 4, () => 0)
    const next = schulteTrailReducer(createInitialSchulteTrailState(), {
      type: 'START_GAME',
      positions,
      now: 0,
    })
    expect(next.status).toBe('showingNumbers')
    expect(next.phase).toBe('recall')
    expect(next.level).toBe(1)
    expect(next.stage).toBe(1)
    expect(next.numbers).toBe(16)
    expect(next.positions).toEqual(positions)
    expect(next.stageTimerSeconds).toBe(getSchulteStageTimerSeconds(1, 16))
  })

  it('C. a wrong number ends the attempt, loses one life and marks a mistake', () => {
    const started = schulteTrailReducer(createInitialSchulteTrailState(), {
      type: 'START_GAME',
      positions: createSchultePositions(16, 4, () => 0),
      now: 0,
    })
    const next = schulteTrailReducer(started, {
      type: 'SELECT_TILE',
      cellIndex: wrongCell(started),
      now: 500,
    })
    expect(next.status).toBe('stageFailed')
    expect(next.lastFailureReason).toBe('wrongNumber')
    expect(next.lives).toBe(STARTING_LIVES - 1)
    expect(next.mistakes).toBe(1)
  })

  it('D. a correct number advances the trail and keeps every life', () => {
    const started = schulteTrailReducer(createInitialSchulteTrailState(), {
      type: 'START_GAME',
      positions: createSchultePositions(16, 4, () => 0),
      now: 0,
    })
    const next = schulteTrailReducer(started, {
      type: 'SELECT_TILE',
      cellIndex: started.positions[0],
      now: 400,
    })
    expect(next.expected).toBe(2)
    expect(next.correctSelections).toBe(1)
    expect(next.lives).toBe(STARTING_LIVES)
    expect(next.correctCell).toBe(started.positions[0])
  })

  it('E. tapping 1…N in order clears the stage and banks +5 points', () => {
    let state = schulteTrailReducer(createInitialSchulteTrailState(), {
      type: 'START_GAME',
      positions: createSchultePositions(16, 4, () => 0.5),
      now: 0,
    })
    state = completeStage(state)
    expect(state.status).toBe('stageComplete')
    expect(state.score).toBe(STAGE_SCORE)
    expect(state.stagesCompleted).toBe(1)
    expect(state.correctSelections).toBe(16)
  })

  it('F. TIMER_EXPIRED fails the stage without a mistake and loses one life', () => {
    const started = schulteTrailReducer(createInitialSchulteTrailState(), {
      type: 'START_GAME',
      positions: createSchultePositions(16, 4, () => 0),
      now: 0,
    })
    const next = schulteTrailReducer(started, { type: 'TIMER_EXPIRED' })
    expect(next.status).toBe('stageFailed')
    expect(next.lastFailureReason).toBe('timeout')
    expect(next.lives).toBe(STARTING_LIVES - 1)
    expect(next.mistakes).toBe(0)
  })

  it('G. LIVES_EXHAUSTED ends the run once no lives remain', () => {
    let state = schulteTrailReducer(createInitialSchulteTrailState(), {
      type: 'START_GAME',
      positions: createSchultePositions(16, 4, () => 0),
      now: 0,
    })
    state = { ...state, lives: 1 }
    state = schulteTrailReducer(state, { type: 'TIMER_EXPIRED' })
    expect(state.status).toBe('stageFailed')
    state = schulteTrailReducer(state, { type: 'LIVES_EXHAUSTED' })
    expect(state.status).toBe('gameComplete')
    expect(state.gameOverReason).toBe('lives')
  })

  it('H. ADVANCE_STAGE opens the next stage after a cleared stage', () => {
    let state = schulteTrailReducer(createInitialSchulteTrailState(), {
      type: 'START_GAME',
      positions: createSchultePositions(16, 4, () => 0.5),
      now: 0,
    })
    state = completeStage(state)
    expect(state.status).toBe('stageComplete')
    const advanced = schulteTrailReducer(state, {
      type: 'ADVANCE_STAGE',
      positions: createSchultePositions(16, 4, () => 0.5),
    })
    expect(advanced.status).toBe('showingNumbers')
    expect(advanced.stage).toBe(2)
    expect(advanced.numbers).toBe(16)
  })

  it('clears four stages to finish Level 1 with the level bonus', () => {
    let state = schulteTrailReducer(createInitialSchulteTrailState(), {
      type: 'START_GAME',
      positions: createSchultePositions(16, 4, () => 0.5),
      now: 0,
    })
    for (let stage = 1; stage <= STAGES_PER_LEVEL; stage += 1) {
      state = completeStage(state)
      state = schulteTrailReducer(state, {
        type: 'ADVANCE_STAGE',
        positions: createSchultePositions(16, 4, () => 0.5),
      })
    }
    expect(state.status).toBe('showingNumbers')
    expect(state.level).toBe(2)
    expect(state.score).toBe(4 * STAGE_SCORE + 10)
    expect(state.levelsCompleted).toBe(1)
  })

  it('I. buildSchulteMetrics resolves the leaderboard-safe shape', () => {
    let state = schulteTrailReducer(createInitialSchulteTrailState(), {
      type: 'START_GAME',
      positions: createSchultePositions(16, 4, () => 0.5),
      now: 0,
    })
    state = completeStage(state)
    const metrics = buildSchulteMetrics(state)
    expect(metrics.score).toBe(STAGE_SCORE)
    expect(metrics.stagesCompleted).toBe(1)
    expect(metrics.highestLevel).toBe(1)
    expect(metrics.highestNumber).toBe(16)
    expect(metrics.mistakes).toBe(0)
    const initialMetrics = buildSchulteMetrics(createInitialSchulteTrailState())
    expect(initialMetrics.accuracy).toBe(100)
  })

  it('J. a full clear at Level 12 flips the run to gameComplete', () => {
    let state = schulteTrailReducer(createInitialSchulteTrailState(), {
      type: 'START_GAME',
      positions: createSchultePositions(16, 4, () => 0.5),
      now: 0,
    })
    for (let level = 1; level <= SCHULTE_MAX_LEVELS; level += 1) {
      for (let stage = 1; stage <= STAGES_PER_LEVEL; stage += 1) {
        state = completeStage(state)
        state = schulteTrailReducer(state, {
          type: 'ADVANCE_STAGE',
          positions: createSchultePositions(
            state.gridSize * state.gridSize,
            state.gridSize,
            () => 0.5,
          ),
        })
      }
    }
    expect(state.status).toBe('gameComplete')
    expect(state.gameOverReason).toBe('completed')
  })
})