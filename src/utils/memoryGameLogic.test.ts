import { describe, it, expect } from 'vitest'
import {
  LEVEL_BONUS,
  MAX_LEVELS,
  MEMORY_GRID_THRESHOLDS,
  MEMORY_LEVEL_CONFIG,
  STAGE_SCORE,
  STAGES_PER_LEVEL,
  STARTING_LIVES,
  STARTING_NUMBERS,
  VISUAL_MEMORY_MATRIX_GAME_ID,
  VMM_MAX_LEVELS,
  getStageTimerSeconds,
} from '../config/memoryGames'
import {
  buildMetrics,
  computeGlobalMaxScore,
  computeMaxScoreForLevel,
  computeScore,
  countCells,
  createInitialGameState,
  createStagePositions,
  getGameHighestNumber,
  getGameMaxLevel,
  getGridSizeForNumbers,
  getLevelConfig,
  getStageDescriptor,
  memoryGameReducer,
  validateMemoryMetrics,
  type MemoryGameAction,
  type MemoryGameState,
} from './memoryGameLogic'

/** Tiny deterministic RNG (mulberry32) so placement tests are reproducible. */
function seededRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function reduce(state: MemoryGameState, ...actions: MemoryGameAction[]): MemoryGameState {
  return actions.reduce(memoryGameReducer, state)
}

function startGame(seed = 1): MemoryGameState {
  const descriptor = getStageDescriptor(1, 1)
  const positions = createStagePositions(descriptor.numbers, descriptor.gridSize, seededRng(seed))
  return memoryGameReducer(createInitialGameState(), { type: 'START_GAME', positions, now: 1000 })
}

/** Play the current stage perfectly (tap 1, then every following number). */
function completeCurrentStage(state: MemoryGameState, startAt = 2000): MemoryGameState {
  let next = reduce(state, { type: 'SELECT_TILE', cellIndex: state.positions[0], now: startAt })
  for (let number = 2; number <= next.numbers; number += 1) {
    next = reduce(next, {
      type: 'SELECT_TILE',
      cellIndex: next.positions[number - 1],
      now: startAt + number * 100,
    })
  }
  return next
}

/** Tap 1 to reveal, then tap out of order so the stage fails. */
function failCurrentStage(state: MemoryGameState, startAt = 2000): MemoryGameState {
  const afterReveal = reduce(state, { type: 'SELECT_TILE', cellIndex: state.positions[0], now: startAt })
  return reduce(afterReveal, {
    type: 'SELECT_TILE',
    cellIndex: afterReveal.positions[afterReveal.numbers - 1],
    now: startAt + 100,
  })
}

describe('Number Memory Rush — configuration', () => {
  it('A. a fresh game starts with 3 numbers on a 4×4 board and 4 stages per level', () => {
    const state = createInitialGameState()
    expect(state.status).toBe('idle')
    expect(state.level).toBe(1)
    expect(state.stage).toBe(1)
    expect(STARTING_NUMBERS).toBe(3)
    expect(STAGES_PER_LEVEL).toBe(4)
    const started = startGame()
    expect(started.numbers).toBe(3)
    expect(started.gridSize).toBe(4)
    expect(getLevelConfig(1)).toEqual({ level: 1, numbers: 3, stagesRequired: 4 })
  })

  it('B. each level adds one number and keeps the stage requirement', () => {
    expect(MEMORY_LEVEL_CONFIG).toHaveLength(MAX_LEVELS)
    MEMORY_LEVEL_CONFIG.forEach((config, index) => {
      expect(config.level).toBe(index + 1)
      expect(config.numbers).toBe(STARTING_NUMBERS + index)
      expect(config.stagesRequired).toBe(STAGES_PER_LEVEL)
    })
  })

  it('C. grid expansion follows the documented thresholds', () => {
    expect(getGridSizeForNumbers(3)).toBe(4)
    expect(getGridSizeForNumbers(6)).toBe(4)
    expect(getGridSizeForNumbers(7)).toBe(5)
    expect(getGridSizeForNumbers(12)).toBe(5)
    expect(getGridSizeForNumbers(13)).toBe(6)
    expect(getGridSizeForNumbers(20)).toBe(6)
    expect(getGridSizeForNumbers(21)).toBe(7)
    expect(getGridSizeForNumbers(30)).toBe(7)
    expect(getGridSizeForNumbers(31)).toBe(8)
    expect(getGridSizeForNumbers(42)).toBe(8)
    expect(getGridSizeForNumbers(43)).toBe(9)
    expect(getGridSizeForNumbers(56)).toBe(9)
    // Fallback stays safe for counts beyond the table.
    expect(countCells(getGridSizeForNumbers(60))).toBeGreaterThan(60)
    MEMORY_GRID_THRESHOLDS.forEach((threshold) => {
      expect(countCells(threshold.size)).toBeGreaterThan(threshold.maxNumbers)
    })
  })
})

describe('Number Memory Rush — board generation', () => {
  it('L. placements are unique and always inside the board', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const positions = createStagePositions(6, 4, seededRng(seed))
      expect(positions).toHaveLength(6)
      expect(new Set(positions).size).toBe(6)
      positions.forEach((cell) => {
        expect(cell).toBeGreaterThanOrEqual(0)
        expect(cell).toBeLessThan(16)
      })
    }
  })

  it('R. refuses to place more numbers than there are cells', () => {
    expect(() => createStagePositions(17, 4)).toThrow()
    expect(() => createStagePositions(0, 4)).toThrow()
  })
})

describe('Number Memory Rush — sequence rules', () => {
  it('D. tapping 1 starts recall and hides every number', () => {
    const state = startGame()
    const afterReveal = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[0],
      now: 2000,
    })
    expect(afterReveal.phase).toBe('recall')
    expect(afterReveal.expected).toBe(2)
    expect(afterReveal.status).toBe('showingNumbers')
  })

  it('E. hidden numbers keep their original positions', () => {
    const state = startGame(7)
    const before = [...state.positions]
    const afterReveal = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[0],
      now: 2000,
    })
    expect(afterReveal.positions).toEqual(before)
  })

  it('ignores taps that are not number 1 while numbers are visible', () => {
    const state = startGame()
    const other = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[1],
      now: 2000,
    })
    expect(other).toBe(state)
  })

  it('F. accepts the correct numbers in ascending order', () => {
    let state = startGame()
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[0],
      now: 2000,
    })
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[1],
      now: 2100,
    })
    expect(state.expected).toBe(3)
    expect(state.stage).toBe(1)
    expect(state.status).toBe('showingNumbers')
    expect(state.correctSelections).toBe(2)
  })

  it('G. a wrong tap records a mistake and fails the stage without advancing', () => {
    let state = startGame()
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[0],
      now: 2000,
    })
    // Tap number 3 while number 2 was expected.
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[2],
      now: 2100,
    })
    expect(state.status).toBe('stageFailed')
    expect(state.mistakes).toBe(1)
    expect(state.stagesFailed).toBe(1)
    expect(state.stage).toBe(1)
    expect(state.level).toBe(1)
    expect(state.score).toBe(0)
  })

  it('H. retrying re-serves the same stage with a fresh arrangement and no score', () => {
    let state = startGame()
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[0],
      now: 2000,
    })
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[2],
      now: 2100,
    })
    const fresh = createStagePositions(state.numbers, state.gridSize, seededRng(99))
    const retried = memoryGameReducer(state, { type: 'RETRY_STAGE', positions: fresh })
    expect(retried.status).toBe('showingNumbers')
    expect(retried.level).toBe(1)
    expect(retried.stage).toBe(1)
    expect(retried.phase).toBe('show')
    expect(retried.score).toBe(0)
    expect(retried.positions).toEqual(fresh)
  })
})

describe('Number Memory Rush — scoring & progression', () => {
  it('I. clearing a stage awards exactly +5', () => {
    const state = completeCurrentStage(startGame())
    expect(state.status).toBe('stageComplete')
    expect(state.score).toBe(STAGE_SCORE)
    expect(state.stagesCompleted).toBe(1)
  })

  it('T. advancing moves to the next stage with the same level', () => {
    const state = completeCurrentStage(startGame())
    const positions = createStagePositions(state.numbers, state.gridSize, seededRng(3))
    const advanced = memoryGameReducer(state, { type: 'ADVANCE_STAGE', positions })
    expect(advanced.stage).toBe(2)
    expect(advanced.level).toBe(1)
    expect(advanced.status).toBe('showingNumbers')
  })

  it('J. clearing all stages of a level awards the +10 bonus and advances a level', () => {
    let state = startGame()
    for (let stage = 1; stage <= STAGES_PER_LEVEL; stage += 1) {
      state = completeCurrentStage(state)
      const positions = createStagePositions(state.numbers, state.gridSize, seededRng(stage + 10))
      state = memoryGameReducer(state, { type: 'ADVANCE_STAGE', positions })
    }
    expect(state.level).toBe(2)
    expect(state.stage).toBe(1)
    expect(state.stagesCompleted).toBe(STAGES_PER_LEVEL)
    expect(state.levelsCompleted).toBe(1)
    expect(state.score).toBe(STAGES_PER_LEVEL * STAGE_SCORE + LEVEL_BONUS)
  })

  it('M. scoring is deterministic from completed stages and levels', () => {
    expect(computeScore(0, 0)).toBe(0)
    expect(computeScore(4, 1)).toBe(4 * STAGE_SCORE + LEVEL_BONUS)
    expect(computeScore(9, 2)).toBe(9 * STAGE_SCORE + 2 * LEVEL_BONUS)
    expect(completeCurrentStage(startGame()).score).toBe(computeScore(1, 0))
  })

  it('S. the level score ceiling cannot be exceeded by a legal run', () => {
    expect(computeMaxScoreForLevel(1)).toBe(30)
    expect(computeMaxScoreForLevel(2)).toBe(60)
    expect(computeGlobalMaxScore()).toBe(MAX_LEVELS * 30)
  })

  it('Q. finishing the game is terminal', () => {
    const state = completeCurrentStage(startGame())
    const finished = memoryGameReducer(state, { type: 'FINISH_GAME' })
    expect(finished.status).toBe('gameComplete')
    expect(finished.gameOverReason).toBe('finished')
    const afterTap = memoryGameReducer(finished, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[1],
      now: 9000,
    })
    expect(afterTap).toBe(finished)
  })

  it('completing the final level ends the run automatically', () => {
    let state = startGame()
    // Move up to the last level by clearing each level in turn.
    while (state.level < MAX_LEVELS) {
      for (let stage = 1; stage <= STAGES_PER_LEVEL; stage += 1) {
        state = completeCurrentStage(state)
        const positions = createStagePositions(state.numbers, state.gridSize, seededRng(stage))
        state = memoryGameReducer(state, { type: 'ADVANCE_STAGE', positions })
      }
    }
    expect(state.level).toBe(MAX_LEVELS)
    for (let stage = 1; stage <= STAGES_PER_LEVEL; stage += 1) {
      state = completeCurrentStage(state)
      const positions = createStagePositions(3, 4, seededRng(stage))
      state = memoryGameReducer(state, { type: 'ADVANCE_STAGE', positions })
    }
    expect(state.status).toBe('gameComplete')
    expect(state.gameOverReason).toBe('completed')
  })
})

describe('Number Memory Rush — lives & recall timer', () => {
  it('V. a fresh run starts with exactly three lives', () => {
    const state = createInitialGameState()
    expect(state.lives).toBe(STARTING_LIVES)
    expect(STARTING_LIVES).toBe(3)
    expect(startGame().lives).toBe(STARTING_LIVES)
  })

  it('W. a wrong tap costs a life and still counts as a mistake', () => {
    const failed = failCurrentStage(startGame())
    expect(failed.status).toBe('stageFailed')
    expect(failed.lives).toBe(STARTING_LIVES - 1)
    expect(failed.mistakes).toBe(1)
    expect(failed.score).toBe(0)
  })

  it('X. an expired timer costs a life but never counts as a mistake', () => {
    const revealed = reduce(startGame(), {
      type: 'SELECT_TILE',
      cellIndex: startGame().positions[0],
      now: 2000,
    })
    const timedOut = memoryGameReducer(revealed, { type: 'TIMER_EXPIRED' })
    expect(timedOut.status).toBe('stageFailed')
    expect(timedOut.lives).toBe(STARTING_LIVES - 1)
    expect(timedOut.mistakes).toBe(0)
    expect(timedOut.stagesFailed).toBe(1)
  })

  it('Y. a timer tick outside the recall phase is inert', () => {
    const idle = memoryGameReducer(createInitialGameState(), { type: 'TIMER_EXPIRED' })
    expect(idle).toMatchObject({ lives: STARTING_LIVES })
    const showing = memoryGameReducer(startGame(), { type: 'TIMER_EXPIRED' })
    expect(showing).toMatchObject({ lives: STARTING_LIVES, status: 'showingNumbers' })
    const done = memoryGameReducer(completeCurrentStage(startGame()), { type: 'TIMER_EXPIRED' })
    expect(done.status).toBe('stageComplete')
  })

  it('Z. losing the third life ends the run with the "lives" reason', () => {
    let state = startGame()
    state = failCurrentStage(state)
    const retryPositions = createStagePositions(state.numbers, state.gridSize, seededRng(4))
    state = memoryGameReducer(state, { type: 'RETRY_STAGE', positions: retryPositions })
    state = failCurrentStage(state)
    state = memoryGameReducer(state, { type: 'RETRY_STAGE', positions: retryPositions })
    state = failCurrentStage(state)
    expect(state.lives).toBe(0)
    const over = memoryGameReducer(state, { type: 'LIVES_EXHAUSTED' })
    expect(over.status).toBe('gameComplete')
    expect(over.gameOverReason).toBe('lives')
    expect(over.score).toBe(0)
  })

  it('LIVES_EXHAUSTED is ignored unless the stage already failed', () => {
    const state = startGame()
    expect(memoryGameReducer(state, { type: 'LIVES_EXHAUSTED' })).toBe(state)
  })

  it('recall timer follows 7s on stage 1, +1s per passed stage, capped at 15s', () => {
    expect(STARTING_LIVES).toBe(3)
    expect(getStageTimerSeconds(1)).toBe(7)
    expect(getStageTimerSeconds(2)).toBe(8)
    expect(getStageTimerSeconds(4)).toBe(10)
    expect(getStageTimerSeconds(9)).toBe(15)
    expect(getStageTimerSeconds(50)).toBe(15)
    expect(getStageTimerSeconds(0)).toBe(7)
  })

  it('every (re)served stage carries the correct time budget', () => {
    const started = startGame()
    expect(started.stageTimerSeconds).toBe(7)

    // Retry re-serves the SAME budget (same global stage index).
    const failed = failCurrentStage(started)
    const retryPositions = createStagePositions(started.numbers, started.gridSize, seededRng(5))
    const retried = memoryGameReducer(failed, { type: 'RETRY_STAGE', positions: retryPositions })
    expect(retried.stageTimerSeconds).toBe(7)

    // A cleared stage moves one global step forward.
    const completed = completeCurrentStage(retried)
    const nextPositions = createStagePositions(retried.numbers, retried.gridSize, seededRng(6))
    const advanced = memoryGameReducer(completed, { type: 'ADVANCE_STAGE', positions: nextPositions })
    expect(advanced.stageTimerSeconds).toBe(8)
  })
})

describe('Number Memory Rush — failure reasons', () => {
  it('marks a wrong-number tap during recall as wrongNumber', () => {
    let state = startGame()
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[0],
      now: 2000,
    })
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[2],
      now: 2100,
    })
    expect(state.status).toBe('stageFailed')
    expect(state.lastFailureReason).toBe('wrongNumber')
  })

  it('marks an empty tile tap during recall as emptyTile (costs a life and a mistake)', () => {
    let state = startGame()
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[0],
      now: 2000,
    })
    const cells = Array.from(
      { length: state.gridSize * state.gridSize },
      (_, index) => index,
    )
    const emptyCell = cells.find((cell) => !state.positions.includes(cell)) ?? -1
    expect(emptyCell).toBeGreaterThanOrEqual(0)
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: emptyCell,
      now: 2100,
    })
    expect(state.status).toBe('stageFailed')
    expect(state.lastFailureReason).toBe('emptyTile')
    expect(state.lives).toBe(STARTING_LIVES - 1)
    expect(state.mistakes).toBe(1)
  })

  it('marks an expired timer as timeout without counting a mistake', () => {
    let state = startGame()
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[0],
      now: 2000,
    })
    const timedOut = memoryGameReducer(state, { type: 'TIMER_EXPIRED' })
    expect(timedOut.status).toBe('stageFailed')
    expect(timedOut.lastFailureReason).toBe('timeout')
    expect(timedOut.mistakes).toBe(0)
  })

  it('clears the failure reason when the stage is re-served', () => {
    let state = startGame()
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[0],
      now: 2000,
    })
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[2],
      now: 2100,
    })
    const retryPositions = createStagePositions(state.numbers, state.gridSize, seededRng(9))
    const retried = memoryGameReducer(state, { type: 'RETRY_STAGE', positions: retryPositions })
    expect(retried.status).toBe('showingNumbers')
    expect(retried.lastFailureReason).toBeNull()
  })
})

describe('Number Memory Rush — metrics & validation mirror', () => {
  it('N. derives accuracy and average reaction time from selections', () => {
    let state = startGame()
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[0],
      now: 2000,
    })
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[1],
      now: 2100,
    })
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[2],
      now: 2400,
    })
    const metrics = buildMetrics(state)
    expect(metrics.score).toBe(STAGE_SCORE)
    expect(metrics.stagesCompleted).toBe(1)
    expect(metrics.highestLevel).toBe(1)
    expect(metrics.highestNumber).toBe(3)
    expect(metrics.mistakes).toBe(0)
    expect(metrics.accuracy).toBe(100)
    expect(metrics.averageReactionTimeMs).toBe(200)
  })

  it('O. accepts metrics produced by a real run', () => {
    const metrics = buildMetrics(completeCurrentStage(startGame()))
    expect(validateMemoryMetrics(metrics)).toEqual({ valid: true })
  })

  it('P. rejects tampered or impossible metrics', () => {
    const base = buildMetrics(completeCurrentStage(startGame()))
    expect(validateMemoryMetrics({ ...base, score: 9999 }).valid).toBe(false)
    expect(validateMemoryMetrics({ ...base, score: -5 }).valid).toBe(false)
    expect(validateMemoryMetrics({ ...base, score: 7 }).valid).toBe(false)
    expect(validateMemoryMetrics({ ...base, highestLevel: 0 }).valid).toBe(false)
    expect(validateMemoryMetrics({ ...base, highestLevel: MAX_LEVELS + 1 }).valid).toBe(false)
    expect(validateMemoryMetrics({ ...base, highestNumber: 99 }).valid).toBe(false)
    expect(validateMemoryMetrics({ ...base, stagesCompleted: 99 }).valid).toBe(false)
    expect(validateMemoryMetrics({ ...base, mistakes: -1 }).valid).toBe(false)
    expect(validateMemoryMetrics({ ...base, accuracy: 150 }).valid).toBe(false)
    expect(validateMemoryMetrics({ ...base, averageReactionTimeMs: -1 }).valid).toBe(false)
  })
})

describe('Number Memory Rush — reducer feedback', () => {
  it('clears transient feedback without touching progress', () => {
    let state = startGame()
    state = memoryGameReducer(state, {
      type: 'SELECT_TILE',
      cellIndex: state.positions[0],
      now: 2000,
    })
    expect(state.correctCell).not.toBeNull()
    const cleared = memoryGameReducer(state, { type: 'CLEAR_FEEDBACK' })
    expect(cleared.correctCell).toBeNull()
    expect(cleared.expected).toBe(2)
  })

  it('RESET returns a pristine idle state', () => {
    const reset = memoryGameReducer(completeCurrentStage(startGame()), { type: 'RESET' })
    expect(reset.status).toBe('idle')
    expect(reset.score).toBe(0)
    expect(reset.positions).toEqual([])
  })
})

describe('shared logic — game-aware bounds', () => {
  it('exposes the per-game maximum level', () => {
    expect(getGameMaxLevel('number_memory_rush')).toBe(MAX_LEVELS)
    expect(getGameMaxLevel(VISUAL_MEMORY_MATRIX_GAME_ID)).toBe(VMM_MAX_LEVELS)
  })

  it('resolves the primary metric per game, clamped to each game max', () => {
    expect(getGameHighestNumber('number_memory_rush', 13)).toBe(14)
    expect(getGameHighestNumber(VISUAL_MEMORY_MATRIX_GAME_ID, 13)).toBe(16)
    expect(getGameHighestNumber(VISUAL_MEMORY_MATRIX_GAME_ID, 1)).toBe(4)
    expect(computeMaxScoreForLevel(15, VMM_MAX_LEVELS)).toBe(450)
    expect(computeGlobalMaxScore(VMM_MAX_LEVELS)).toBe(450)
  })

  it('accepts a level-13 Matrix run that Rush would reject as out of range', () => {
    const vmm = {
      score: 255,
      highestLevel: 13,
      highestNumber: getGameHighestNumber(VISUAL_MEMORY_MATRIX_GAME_ID, 13),
      stagesCompleted: 49,
      stagesFailed: 0,
      mistakes: 0,
      accuracy: 100,
      averageReactionTimeMs: 0,
    }
    expect(validateMemoryMetrics(vmm, VISUAL_MEMORY_MATRIX_GAME_ID)).toEqual({ valid: true })
    expect(validateMemoryMetrics(vmm).valid).toBe(false)
  })

  it('rejects a Matrix run above the Matrix level ceiling', () => {
    const base = {
      score: 10,
      highestLevel: 1,
      highestNumber: 4,
      stagesCompleted: 2,
      stagesFailed: 0,
      mistakes: 0,
      accuracy: 100,
      averageReactionTimeMs: 0,
    }
    expect(validateMemoryMetrics(base, VISUAL_MEMORY_MATRIX_GAME_ID)).toEqual({ valid: true })
    const tooHigh = { ...base, highestLevel: VMM_MAX_LEVELS + 1, highestNumber: 4 + VMM_MAX_LEVELS }
    expect(validateMemoryMetrics(tooHigh, VISUAL_MEMORY_MATRIX_GAME_ID).valid).toBe(false)
  })
})
