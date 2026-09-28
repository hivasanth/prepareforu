import { describe, it, expect } from 'vitest'
import {
  MEMORY_ACHIEVEMENTS,
  MEMORY_GAMES_COPY,
  MEMORY_GAME_CATALOG,
  NUMBER_MEMORY_RUSH_ENTRY,
  VISUAL_MEMORY_MATRIX_ENTRY,
  VISUAL_MEMORY_MATRIX_GAME_ID,
  TILE_MATCHING_ENTRY,
  TILE_MATCHING_GAME_ID,
  TILE_MATCHING_MAX_LEVELS,
  SCHULTE_TRAIL_ENTRY,
  SCHULTE_TRAIL_GAME_ID,
  SCHULTE_MAX_LEVELS,
  MAX_LEVELS,
  getMemoryAchievement,
  getMemoryGameCatalogEntry,
  isMemoryGameId,
  getSchulteStageTimerSeconds,
  schulteHighestNumber,
  getTileMatchingStageTimerSeconds,
  tileMatchingHighestNumber,
  getTileMatchingLevelConfig,
  getTileMatchingValueTile,
  TILE_MATCHING_VALUE_TILES,
  TILE_MATCHING_STARTING_LIVES,
  TILE_MATCHING_MAX_LIVES,
} from './memoryGames'

describe('memory achievement tiers', () => {
  it('returns the neutral starter label below level 3', () => {
    expect(getMemoryAchievement(0)).toBe('Memory Starter')
    expect(getMemoryAchievement(1)).toBe('Memory Starter')
    expect(getMemoryAchievement(2)).toBe('Memory Starter')
  })

  it('resolves each tier boundary correctly', () => {
    expect(getMemoryAchievement(3)).toBe('Memory Builder')
    expect(getMemoryAchievement(5)).toBe('Memory Builder')
    expect(getMemoryAchievement(6)).toBe('Memory Explorer')
    expect(getMemoryAchievement(9)).toBe('Memory Challenger')
    expect(getMemoryAchievement(12)).toBe('Memory Master')
  })

  it('never uses diagnostic or primate-themed labels', () => {
    const labels = MEMORY_ACHIEVEMENTS.map((tier) => tier.label).join(' ')
    expect(labels).not.toMatch(/chimp|genius|iq|godlike/i)
  })

  it('exposes neutral copy without diagnostic claims', () => {
    const copy = Object.values(MEMORY_GAMES_COPY).join(' ')
    expect(copy).not.toMatch(/chimp|genius|iq|godlike/i)
    expect(MEMORY_GAMES_COPY.gameSubtitle).toBe('Spatial Working Memory Game')
  })
})

describe('memory game catalog', () => {
  it('ships all four games with unique ids and data-driven routes', () => {
    expect(MEMORY_GAME_CATALOG).toHaveLength(4)
    const ids = MEMORY_GAME_CATALOG.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(4)
expect(NUMBER_MEMORY_RUSH_ENTRY.route).toBe('/memory-games/number-memory-rush')
    expect(VISUAL_MEMORY_MATRIX_ENTRY.route).toBe('/memory-games/visual-memory-matrix')
    expect(TILE_MATCHING_ENTRY.route).toBe('/memory-games/tile-matching')
    expect(TILE_MATCHING_ENTRY.id).toBe(TILE_MATCHING_GAME_ID)
    expect(TILE_MATCHING_ENTRY.maxLevel).toBe(TILE_MATCHING_MAX_LEVELS)
    expect(SCHULTE_TRAIL_ENTRY.route).toBe('/memory-games/schulte-trail')
    expect(SCHULTE_TRAIL_ENTRY.id).toBe(SCHULTE_TRAIL_GAME_ID)
    expect(SCHULTE_TRAIL_ENTRY.maxLevel).toBe(SCHULTE_MAX_LEVELS)
  })

  it('gives Schulte Trail its own visual-search identity and metric labels', () => {
    expect(SCHULTE_TRAIL_ENTRY.metricLabel).toBe('Targets')
    expect(SCHULTE_TRAIL_ENTRY.highestMetricLabel).toBe('Board Tiles')
    expect(SCHULTE_TRAIL_ENTRY.title).toBe('Schulte Trail')
    expect(SCHULTE_TRAIL_ENTRY.subtitle).toBe('Visual Search Memory Game')
    expect(SCHULTE_TRAIL_ENTRY.highestMetricLabel).not.toBe(TILE_MATCHING_ENTRY.highestMetricLabel)
  })

  it('times Schulte stages fairly: more tiles → more seconds, floor preserved', () => {
    expect(getSchulteStageTimerSeconds(1, 16)).toBe(46)
    expect(getSchulteStageTimerSeconds(3, 25)).toBe(59)
    expect(getSchulteStageTimerSeconds(5, 36)).toBe(74)
    expect(schulteHighestNumber(1)).toBe(16)
    expect(schulteHighestNumber(3)).toBe(25)
    expect(schulteHighestNumber(5)).toBe(36)
    expect(schulteHighestNumber(SCHULTE_MAX_LEVELS)).toBe(36)
  })

  it('gives Tile Matching a pair-memory identity and distinct non-diagnostic copy', () => {
    expect(TILE_MATCHING_ENTRY.metricLabel).toBe('Pairs')
    expect(TILE_MATCHING_ENTRY.highestMetricLabel).toBe('Pair Count')
    expect(TILE_MATCHING_ENTRY.title).toBe('Tile Matching')
    expect(TILE_MATCHING_ENTRY.subtitle).toBe('Pair Memory Game')
  })

  it('times Tile Matching stages fairly: more pairs → more seconds, floor preserved', () => {
    // base 8s + 2s/pair − 0.85s level pressure past Level 5, floor 12s.
    expect(getTileMatchingStageTimerSeconds(1, 12)).toBe(20)
    expect(getTileMatchingStageTimerSeconds(6, 36)).toBe(43)
    expect(getTileMatchingStageTimerSeconds(12, 36)).toBe(38)
    expect(getTileMatchingStageTimerSeconds(1, 8)).toBe(16)
    expect(tileMatchingHighestNumber(1)).toBe(6)
    expect(tileMatchingHighestNumber(2)).toBe(8)
    expect(tileMatchingHighestNumber(3)).toBe(10)
    expect(tileMatchingHighestNumber(4)).toBe(12)
    expect(tileMatchingHighestNumber(5)).toBe(15)
    expect(tileMatchingHighestNumber(6)).toBe(18)
    expect(tileMatchingHighestNumber(TILE_MATCHING_MAX_LEVELS)).toBe(18)
  })

  it('grows the Tile Matching grid through 6 levels to the mobile-safe 6×6 cap', () => {
    // Grid/rows×cols expansion: 4×3 → 4×4 → 5×4 → 6×4 → 6×5 → 6×6 (level 6+).
    expect(getTileMatchingLevelConfig(1).pairs).toBe(6)
    expect(getTileMatchingLevelConfig(2).pairs).toBe(8)
    expect(getTileMatchingLevelConfig(3).pairs).toBe(10)
    expect(getTileMatchingLevelConfig(4).pairs).toBe(12)
    expect(getTileMatchingLevelConfig(5).pairs).toBe(15)
    for (let level = 6; level <= TILE_MATCHING_MAX_LEVELS; level += 1) {
      const config = getTileMatchingLevelConfig(level)
      expect(config.rows).toBe(6)
      expect(config.cols).toBe(6)
      expect(config.pairs).toBe(18)
    }
    // clamped lookups do not throw.
    expect(getTileMatchingLevelConfig(0).level).toBe(1)
    expect(getTileMatchingLevelConfig(99).pairs).toBe(18)
  })

  it('keeps the life pool within the 5-start / 8-cap contract', () => {
    expect(TILE_MATCHING_STARTING_LIVES).toBe(5)
    expect(TILE_MATCHING_MAX_LIVES).toBe(8)
    expect(TILE_MATCHING_MAX_LIVES).toBeGreaterThan(TILE_MATCHING_STARTING_LIVES)
  })

  it('ships exactly 18 DISTINCT fruit tiles with named labels', () => {
    expect(TILE_MATCHING_VALUE_TILES).toHaveLength(18)
    const emojis = TILE_MATCHING_VALUE_TILES.map((tile) => tile.emoji)
    expect(new Set(emojis).size).toBe(18)
    expect(getTileMatchingValueTile(0).name).toBe('apple')
    expect(getTileMatchingValueTile(17).name).toBe('green apple')
    expect(TILE_MATCHING_VALUE_TILES.every((tile) => tile.name.trim().length > 0)).toBe(true)
  })

  it('resolves catalog entries by id with a Rush fallback', () => {
    expect(getMemoryGameCatalogEntry(VISUAL_MEMORY_MATRIX_GAME_ID)).toBe(VISUAL_MEMORY_MATRIX_ENTRY)
    expect(getMemoryGameCatalogEntry(TILE_MATCHING_GAME_ID)).toBe(TILE_MATCHING_ENTRY)
    expect(getMemoryGameCatalogEntry(SCHULTE_TRAIL_GAME_ID)).toBe(SCHULTE_TRAIL_ENTRY)
    expect(getMemoryGameCatalogEntry('number_memory_rush')).toBe(NUMBER_MEMORY_RUSH_ENTRY)
    expect(getMemoryGameCatalogEntry(TILE_MATCHING_GAME_ID)).toBe(TILE_MATCHING_ENTRY)
  })

  it('guards shipped game ids for route params', () => {
    expect(isMemoryGameId('number_memory_rush')).toBe(true)
    expect(isMemoryGameId('visual_memory_matrix')).toBe(true)
    expect(isMemoryGameId('tile_matching')).toBe(true)
    expect(isMemoryGameId('schulte_trail')).toBe(true)
    // The legacy Color Reflex id is deliberately no longer a shipped game.
    expect(isMemoryGameId('color_reflex')).toBe(false)
    expect(isMemoryGameId('not_a_game')).toBe(false)
    expect(isMemoryGameId(null)).toBe(false)
  })

  it('caps Tile Matching at 12 levels, matching the daily-group Rush ceiling', () => {
    expect(TILE_MATCHING_MAX_LEVELS).toBe(12)
    expect(TILE_MATCHING_MAX_LEVELS).toBe(MAX_LEVELS) // Rush 12 / Tile Matching 12 / Matrix 15 split
  })
})
