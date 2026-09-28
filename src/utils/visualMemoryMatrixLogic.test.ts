import { describe, it, expect } from 'vitest'
import {
  LEVEL_BONUS,
  STAGE_SCORE,
  STAGES_PER_LEVEL,
  STARTING_LIVES,
  VMM_MAX_LEVELS,
  VMM_STARTING_TARGETS,
  getStageTimerSeconds,
  getVmmPreviewSeconds,
} from '../config/memoryGames'
import {
  buildVmmMetrics,
  countCells,
  createInitialVisualMemoryMatrixState,
  createPatternPositions,
  getVmmLevelConfig,
  getVmmMaxLevel,
  getVmmStageDescriptor,
  visualMemoryMatrixReducer,
  type VisualMemoryMatrixAction,
  type VisualMemoryMatrixState,
} from './visualMemoryMatrixLogic'

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

function reduce(
  state: VisualMemoryMatrixState,
  ...actions: VisualMemoryMatrixAction[]
): VisualMemoryMatrixState {
  return actions.reduce(visualMemoryMatrixReducer, state)
}

function startGame(seed = 1): VisualMemoryMatrixState {
  const descriptor = getVmmStageDescriptor(1, 1)
  const positions = createPatternPositions(descriptor.targets, descriptor.gridSize, seededRng(seed))
  return reduce(createInitialVisualMemoryMatrixState(), {
    type: 'START_GAME',
    positions,
    now: 1000,
  })
}

/** Hide the pattern so the recall phase (and its timer) begins. */
function beginRecall(state: VisualMemoryMatrixState): VisualMemoryMatrixState {
  return reduce(state, { type: 'PREVIEW_END' })
}

/** Recall every target tile of the current pattern (set-based, any order). */
function completeCurrentStage(state: VisualMemoryMatrixState, startAt = 2000): VisualMemoryMatrixState {
  let next = state
  state.positions.forEach((cell, index) => {
    next = reduce(next, { type: 'SELECT_TILE', cellIndex: cell, now: startAt + index * 100 })
  })
  return next
}

describe('Visual Memory Matrix — configuration', () => {
  it('A. a fresh game starts on Level 1 with 4 targets on a 4×4 board — no 3×3 stage', () => {
    const state = createInitialVisualMemoryMatrixState()
    expect(state.status).toBe('idle')
    expect(state.level).toBe(1)
    expect(state.stage).toBe(1)
    expect(state.numbers).toBe(VMM_STARTING_TARGETS)
    expect(state.numbers).toBe(4)
    expect(state.gridSize).toBe(4)
    expect(state.gridSize).not.toBe(3)
    expect(state.lives).toBe(STARTING_LIVES)
    expect(state.score).toBe(0)
    expect(state.phase).toBe('show')
  })

  it('B. the level table grows targets one per level and expands the grid 4→5→6', () => {
    expect(getVmmLevelConfig(1).targets).toBe(4)
    expect(getVmmLevelConfig(1).gridSize).toBe(4)
    expect(getVmmLevelConfig(2).targets).toBe(5)
    expect(getVmmLevelConfig(2).gridSize).toBe(4)
    expect(getVmmLevelConfig(3).gridSize).toBe(5)
    expect(getVmmLevelConfig(5).gridSize).toBe(5)
    expect(getVmmLevelConfig(6).gridSize).toBe(6)
    expect(getVmmLevelConfig(VMM_MAX_LEVELS).targets).toBe(
      VMM_STARTING_TARGETS + VMM_MAX_LEVELS - 1,
    )
    expect(getVmmLevelConfig(VMM_MAX_LEVELS).gridSize).toBe(6)
    expect(getVmmMaxLevel()).toBe(VMM_MAX_LEVELS)
  })

  it('C. every configured level fits its board and clamps out-of-range levels', () => {
    for (let level = 1; level <= VMM_MAX_LEVELS; level += 1) {
      const config = getVmmLevelConfig(level)
      expect(config.targets).toBeLessThanOrEqual(config.gridSize * config.gridSize)
      expect(config.stagesRequired).toBe(STAGES_PER_LEVEL)
      // The shipped game starts at 4×4 — a 3×3 (or 3-target) stage never exists.
      expect(config.gridSize).toBeGreaterThanOrEqual(4)
    }
    expect(getVmmLevelConfig(0).level).toBe(1)
    expect(getVmmLevelConfig(999).level).toBe(VMM_MAX_LEVELS)
  })

  it('C2. every configured level keeps targets below the board capacity', () => {
    for (let level = 1; level <= VMM_MAX_LEVELS; level += 1) {
      const config = getVmmLevelConfig(level)
      expect(config.targets).toBeLessThanOrEqual(config.gridSize * config.gridSize)
    }
  })

  it('D. preview dwell grows with the pattern and respects the 3–8s clamp', () => {
    // Level 1 preview shows exactly 4 highlights → ceil(2 + 4 · 0.5) = 4s.
    expect(getVmmPreviewSeconds(4)).toBe(4)
    expect(getVmmPreviewSeconds(1)).toBe(3)
    expect(getVmmPreviewSeconds(17)).toBe(8)
    expect(getVmmPreviewSeconds(0)).toBe(3)
  })

  it('E. pattern placement is distinct, on-board and exactly target-sized', () => {
    const { targets, gridSize } = getVmmStageDescriptor(6, 1)
    const positions = createPatternPositions(targets, gridSize, seededRng(42))
    expect(positions).toHaveLength(targets)
    expect(new Set(positions).size).toBe(targets)
    positions.forEach((cell) => {
      expect(cell).toBeGreaterThanOrEqual(0)
      expect(cell).toBeLessThan(countCells(gridSize))
    })
  })
})

describe('Visual Memory Matrix — reducer', () => {
  it('A. START_GAME serves Level 1 with 4 highlights, preview visible, timer cleared', () => {
    const state = startGame()
    expect(state.status).toBe('showingNumbers')
    expect(state.phase).toBe('show')
    expect(state.positions).toHaveLength(4)
    expect(state.gridSize).toBe(4)
    expect(new Set(state.positions).size).toBe(4)
    expect(state.stageTimerSeconds).toBe(getStageTimerSeconds(1))
    expect(state.previewSeconds).toBe(getVmmPreviewSeconds(4))
  })

  it('B. an EMPTY tile tapped during the preview is fully inert — no transition at all', () => {
    const state = startGame()
    const empty = Array.from({ length: countCells(4) }, (_, i) => i).find(
      (cell) => !state.positions.includes(cell),
    )!
    const tapped = reduce(state, { type: 'SELECT_TILE', cellIndex: empty, now: 1100 })
    expect(tapped).toBe(state)
    expect(tapped.phase).toBe('show')
    expect(tapped.status).toBe('showingNumbers')
    expect(tapped.lives).toBe(STARTING_LIVES)
  })

  it('B2. tapping a HIGHLIGHTED target during preview ends it immediately', () => {
    const state = startGame()
    const target = state.positions[0]
    const tapped = reduce(state, { type: 'SELECT_TILE', cellIndex: target, now: 1100 })
    // Preview is gone (phase 'recall' → revealed glow drops off)…
    expect(tapped.phase).toBe('recall')
    expect(tapped.status).toBe('showingNumbers')
    // …the tapped tile is the first found green tile…
    expect(tapped.correctTiles).toEqual([target])
    expect(tapped.expected).toBe(2)
    expect(tapped.correctSelections).toBe(1)
    // …the recall button countdown keeps its full budget…
    expect(tapped.stageTimerSeconds).toBe(getStageTimerSeconds(1))
    // …and live play continues without a restart.
    expect(tapped.positions).toEqual(state.positions)
    expect(tapped.lives).toBe(STARTING_LIVES)
  })

  it('B3. a preview-end tap is announced as the pattern being hidden', () => {
    const state = startGame()
    const tapped = reduce(state, { type: 'SELECT_TILE', cellIndex: state.positions[0], now: 1100 })
    expect(tapped.announcement).toBe('Pattern hidden. 1 of 4 pattern tiles found.')
  })

  it('B4. a LATE PREVIEW_END arriving after an early termination is inert', () => {
    // "Preview timeout cannot mutate state after the preview already ended"
    // — both reducer-level (guard) and timer-level (hook cleanup) hold.
    const early = reduce(startGame(), {
      type: 'SELECT_TILE',
      cellIndex: startGame().positions[0],
      now: 1100,
    })
    const afterLateTick = reduce(early, { type: 'PREVIEW_END' })
    expect(afterLateTick).toBe(early)
    expect(afterLateTick.phase).toBe('recall')
  })

  it('C. PREVIEW_END hides the pattern and hands over to recall', () => {
    const state = beginRecall(startGame())
    expect(state.phase).toBe('recall')
    expect(state.status).toBe('showingNumbers')
  })

  it('D. recalling every target clears the stage for stage points', () => {
    const state = completeCurrentStage(beginRecall(startGame()))
    expect(state.status).toBe('stageComplete')
    expect(state.correctSelections).toBe(4)
    expect(state.stagesCompleted).toBe(1)
    expect(state.score).toBe(STAGE_SCORE)
    expect(state.lastStagePoints).toBe(STAGE_SCORE)
  })

  it('E. a correct tile stays found and locks out a repeat tap', () => {
    const state = beginRecall(startGame())
    const first = reduce(state, { type: 'SELECT_TILE', cellIndex: state.positions[0], now: 2000 })
    expect(first.correctTiles).toEqual([state.positions[0]])
    const repeat = reduce(first, { type: 'SELECT_TILE', cellIndex: state.positions[0], now: 2100 })
    expect(repeat).toBe(first)
  })

  it('F. a non-target tile fails the stage, costs a life and flags emptyTile', () => {
    const state = beginRecall(startGame())
    const wrongCell = Array.from({ length: countCells(4) }, (_, i) => i).find(
      (cell) => !state.positions.includes(cell),
    )!
    const failed = reduce(state, { type: 'SELECT_TILE', cellIndex: wrongCell, now: 2000 })
    expect(failed.status).toBe('stageFailed')
    expect(failed.lastFailureReason).toBe('emptyTile')
    expect(failed.lives).toBe(STARTING_LIVES - 1)
    expect(failed.mistakes).toBe(1)
    expect(failed.stagesFailed).toBe(1)
    expect(failed.lastStagePoints).toBe(0)
    // The same pattern survives until the stage is re-served.
    expect(failed.positions).toEqual(state.positions)
  })

  it('G. clearing the fourth stage adds the level bonus and level-completes', () => {
    let state = beginRecall(startGame())
    state = completeCurrentStage(state)
    state = reduce(state, {
      type: 'ADVANCE_STAGE',
      positions: createPatternPositions(
        getVmmStageDescriptor(1, 2).targets,
        getVmmStageDescriptor(1, 2).gridSize,
        seededRng(2),
      ),
    })
    state = beginRecall(state)
    state = completeCurrentStage(state)
    state = reduce(state, {
      type: 'ADVANCE_STAGE',
      positions: createPatternPositions(
        getVmmStageDescriptor(1, 3).targets,
        getVmmStageDescriptor(1, 3).gridSize,
        seededRng(3),
      ),
    })
    state = beginRecall(state)
    state = completeCurrentStage(state)
    state = reduce(state, {
      type: 'ADVANCE_STAGE',
      positions: createPatternPositions(
        getVmmStageDescriptor(1, 4).targets,
        getVmmStageDescriptor(1, 4).gridSize,
        seededRng(4),
      ),
    })
    state = beginRecall(state)
    state = completeCurrentStage(state)

    expect(state.status).toBe('levelComplete')
    expect(state.stagesCompleted).toBe(4)
    expect(state.levelsCompleted).toBe(1)
    expect(state.score).toBe(4 * STAGE_SCORE + LEVEL_BONUS)
    expect(state.lastLevelBonus).toBe(LEVEL_BONUS)
  })

  it('H. RETRY_STAGE re-serves the same level/stage with a fresh pattern and budget', () => {
    const state = beginRecall(startGame())
    const failed = reduce(state, {
      type: 'SELECT_TILE',
      cellIndex: Array.from({ length: countCells(4) }, (_, i) => i).find((c) => !state.positions.includes(c))!,
      now: 2000,
    })
    const retried = reduce(failed, {
      type: 'RETRY_STAGE',
      positions: createPatternPositions(4, 4, seededRng(9)),
    })
    expect(retried.status).toBe('showingNumbers')
    expect(retried.level).toBe(1)
    expect(retried.stage).toBe(1)
    expect(retried.phase).toBe('show')
    expect(retried.stageTimerSeconds).toBe(getStageTimerSeconds(1))
  })

  it('I. the timer only bites during recall — expiry costs a life without a mistake', () => {
    const showing = reduce(startGame(), { type: 'TIMER_EXPIRED' })
    expect(showing.status).toBe('showingNumbers')

    const expired = reduce(beginRecall(startGame()), { type: 'TIMER_EXPIRED' })
    expect(expired.status).toBe('stageFailed')
    expect(expired.lastFailureReason).toBe('timeout')
    expect(expired.lives).toBe(STARTING_LIVES - 1)
    expect(expired.mistakes).toBe(0)
  })

  it('J. LIVES_EXHAUSTED ends the run after the final failure', () => {
    const state = beginRecall(startGame())
    const failed = reduce(state, {
      type: 'SELECT_TILE',
      cellIndex: Array.from({ length: countCells(4) }, (_, i) => i).find((c) => !state.positions.includes(c))!,
      now: 2000,
    })
    const over = reduce(failed, { type: 'LIVES_EXHAUSTED' })
    expect(over.status).toBe('gameComplete')
    expect(over.gameOverReason).toBe('lives')
  })

  it('K. ADVANCE_STAGE beyond the final level ends a completed run', () => {
    const atMax: VisualMemoryMatrixState = {
      ...startGame(),
      level: VMM_MAX_LEVELS,
      stage: STAGES_PER_LEVEL,
      status: 'levelComplete',
    }
    const done = reduce(atMax, { type: 'ADVANCE_STAGE', positions: [] })
    expect(done.status).toBe('gameComplete')
    expect(done.gameOverReason).toBe('completed')
  })

  it('L. FINISH_GAME and RESET produce the finished / fresh states', () => {
    const finished = reduce(startGame(), { type: 'FINISH_GAME' })
    expect(finished.status).toBe('gameComplete')
    expect(finished.gameOverReason).toBe('finished')

    const reset = reduce(finished, { type: 'RESET' })
    expect(reset.status).toBe('idle')
    expect(reset.score).toBe(0)
    expect(reset.lives).toBe(STARTING_LIVES)
  })

  it('M. buildVmmMetrics reports set-based accuracy and pattern size', () => {
    const state = completeCurrentStage(beginRecall(startGame(5)))
    const metrics = buildVmmMetrics(state)
    expect(metrics.score).toBe(state.score)
    expect(metrics.highestLevel).toBe(1)
    expect(metrics.highestNumber).toBe(getVmmLevelConfig(1).targets)
    expect(metrics.stagesCompleted).toBe(1)
    expect(metrics.mistakes).toBe(0)
    expect(metrics.accuracy).toBe(100)
    expect(metrics.averageReactionTimeMs).toBeGreaterThan(0)
  })

  it('N. buildVmmMetrics folds mistakes into accuracy', () => {
    const state = beginRecall(startGame())
    const wrong = Array.from({ length: countCells(4) }, (_, i) => i).find((c) => !state.positions.includes(c))!
    const afterMiss = reduce(state, { type: 'SELECT_TILE', cellIndex: wrong, now: 2000 })
    const metrics = buildVmmMetrics(afterMiss)
    expect(metrics.mistakes).toBe(1)
    expect(metrics.accuracy).toBe(0)
  })
})
