/**
 * ─── Memory Games — canonical game configuration ────────────────────────────
 *
 * SINGLE SOURCE OF TRUTH for Number Memory Rush progression, grid expansion and
 * scoring. Game logic, the game engine reducer, the result screen and the
 * security mirror used for pre-submission validation all read from HERE — no
 * progression rule is hardcoded inside a component or a hook. Games 3 (Tile
 * Matching) and 4 (Schulte Trail) keep their own progression knobs in this same
 * module.
 *
 * Server-side parity: the SQL migration (`20260923000001_memory_game_scores.sql`)
 * mirrors STAGE_SCORE / LEVEL_BONUS / STAGES_PER_LEVEL / STARTING_NUMBERS /
 * MAX_LEVELS so the authoritative score bound it enforces cannot drift from
 * the client contract without a deliberate change on both sides. The recall
 * timer and lives are pure client-side difficulty knobs (never persisted to the
 * leaderboard), so they live here as the ONE tunable source and feed the engine
 * through `getStageTimerSeconds`.
 */

import type { MemoryGameId } from '../types/memoryGame.types'

/** Stable identifier for the first Memory Games title. */
export const NUMBER_MEMORY_RUSH_GAME_ID = 'number_memory_rush'

/** Stable identifier for the second Memory Games title. */
export const VISUAL_MEMORY_MATRIX_GAME_ID = 'visual_memory_matrix'

/** Maximum number of levels in a single run. Completing it ends the session. */
export const MAX_LEVELS = 12

/** Numbers shown on the very first stage (Level 1). */
export const STARTING_NUMBERS = 3

/** Stages required to clear a level. */
export const STAGES_PER_LEVEL = 4

/** Points awarded for every successfully completed stage. */
export const STAGE_SCORE = 5

/** Bonus awarded for completing all stages of a level. */
export const LEVEL_BONUS = 10

/** Lives granted at the start of every game (exactly three, never more). */
export const STARTING_LIVES = 3

/** Recall timer on the very first stage, in seconds. */
export const MEMORY_TIMER_START_SECONDS = 7

/** Hard ceiling for the per-stage recall timer, in seconds. */
export const MEMORY_TIMER_MAX_SECONDS = 15

/**
 * Per-stage recall time: 7s on Stage 1, +1s per passed stage, capped at 15s.
 * `globalStageIndex` is the 1-based stage number across the whole run
 * (derived from completed stages), so retries never inflate the clock.
 */
export function getStageTimerSeconds(globalStageIndex: number): number {
  const stage = Math.max(1, Math.trunc(globalStageIndex))
  return Math.min(
    MEMORY_TIMER_START_SECONDS + stage - 1,
    MEMORY_TIMER_MAX_SECONDS,
  )
}

/** Leaderboard read ceiling (mirrors the RPC default p_limit). */
export const MEMORY_LEADERBOARD_TOP_LIMIT = 50

/** Minimum comfortable touch target (px). Used for responsive guidance/tests. */
export const MIN_TILE_TARGET_PX = 44

export interface MemoryLevelConfig {
  /** 1-based level index. */
  level: number
  /** How many numbers appear on the board at this level. */
  numbers: number
  /** Stages required to clear this level. */
  stagesRequired: number
}

/**
 * THE canonical level table. Generated from the four progression constants so
 * the rules live in exactly one place: each level adds one number and requires
 * the same number of stages.
 */
export const MEMORY_LEVEL_CONFIG: readonly MemoryLevelConfig[] = Array.from(
  { length: MAX_LEVELS },
  (_, index) => ({
    level: index + 1,
    numbers: STARTING_NUMBERS + index,
    stagesRequired: STAGES_PER_LEVEL,
  }),
)

/**
 * Grid expansion thresholds. A board must always have strictly more cells than
 * numbers — these ranges guarantee that (e.g. 6 numbers → 16 cells).
 */
export interface MemoryGridThreshold {
  minNumbers: number
  maxNumbers: number
  /** Board is `size` × `size`. */
  size: number
}

export const MEMORY_GRID_THRESHOLDS: readonly MemoryGridThreshold[] = [
  { minNumbers: 3, maxNumbers: 6, size: 4 },
  { minNumbers: 7, maxNumbers: 12, size: 5 },
  { minNumbers: 13, maxNumbers: 20, size: 6 },
  { minNumbers: 21, maxNumbers: 30, size: 7 },
  { minNumbers: 31, maxNumbers: 42, size: 8 },
  { minNumbers: 43, maxNumbers: 56, size: 9 },
]

/* ─── Visual Memory Matrix — progression ────────────────────────────────────
   Game 2 shares the SAME scoring/stage/lives/timer rules as Game 1 (constants
   above), so the only new knobs are the pattern fields: the grid grows with the
   LEVEL (4×4 → 5×5 → 6×6 — no 3×3 stage exists) and the target count grows one
   per level from a 4×4/4-target opening (Level 1). The target formula mirrors
   Number Memory Rush (STARTING + level − 1) with a different STARTING value, so
   the server-side parity check needs the per-game starting number (SQL migration
   20260926000001). All progression lives in VMM_LEVEL_CONFIG below.
   ───────────────────────────────────────────────────────────────────────── */

/** Maximum number of levels in a single Visual Memory Matrix run. */
export const VMM_MAX_LEVELS = 15

/**
 * Pattern targets shown on the very first stage (Level 1). Canonical opening is
 * a 4×4 board with exactly 4 highlighted tiles — there is no 3×3 / 3-target
 * stage. Mirrors the server's per-game starting value for visual_memory_matrix.
 */
export const VMM_STARTING_TARGETS = 4

/** Preview dwell floor/ceiling and growth (seconds) before the pattern hides. */
export const VMM_PREVIEW_MIN_SECONDS = 3
export const VMM_PREVIEW_MAX_SECONDS = 8
export const VMM_PREVIEW_BASE_SECONDS = 2
export const VMM_PREVIEW_PER_TARGET_SECONDS = 0.5

/** How long a pattern stays highlighted for memorising, given its target count. */
export function getVmmPreviewSeconds(targets: number): number {
  const count = Math.max(1, Math.trunc(targets))
  return Math.min(
    Math.max(Math.ceil(VMM_PREVIEW_BASE_SECONDS + count * VMM_PREVIEW_PER_TARGET_SECONDS), VMM_PREVIEW_MIN_SECONDS),
    VMM_PREVIEW_MAX_SECONDS,
  )
}

export interface VmmLevelConfig {
  /** 1-based level index. */
  level: number
  /** Pattern targets on the board at this level. */
  targets: number
  /** Board is `gridSize` × `gridSize` at this level. */
  gridSize: number
  /** Stages required to clear this level. */
  stagesRequired: number
}

/**
 * Grid-side by level — the canonical expansion table. A pattern always has far
 * fewer targets than cells, but the mapping is validated (`targets <= size²`)
 * by `validateVmmLevels` so a config edit can never overshoot the board.
 *
 * Progression: Level 1–2 → 4×4, Level 3–5 → 5×5, Level 6+ → 6×6. There is NO
 * 3×3 stage in the shipped game.
 */
export const VMM_GRID_PROGRESSION: readonly { minLevel: number; maxLevel: number; size: number }[] = [
  { minLevel: 1, maxLevel: 2, size: 4 },
  { minLevel: 3, maxLevel: 5, size: 5 },
  { minLevel: 6, maxLevel: VMM_MAX_LEVELS, size: 6 },
]

/** THE canonical Visual Memory Matrix level table (single source of truth). */
export const VMM_LEVEL_CONFIG: readonly VmmLevelConfig[] = Array.from(
  { length: VMM_MAX_LEVELS },
  (_, index) => {
    const level = index + 1
    const grid = VMM_GRID_PROGRESSION.find(
      (range) => level >= range.minLevel && level <= range.maxLevel,
    ) ?? { size: VMM_GRID_PROGRESSION[VMM_GRID_PROGRESSION.length - 1].size }
    return {
      level,
      targets: VMM_STARTING_TARGETS + index,
      gridSize: grid.size,
      stagesRequired: STAGES_PER_LEVEL,
    }
  },
)

/** Guard every configured level against a pattern that overflows its board. */
export function assertVmmLevelsFit(): void {
  VMM_LEVEL_CONFIG.forEach((entry) => {
    if (entry.targets > entry.gridSize * entry.gridSize) {
      throw new Error(
        `Visual Memory Matrix Level ${entry.level}: ${entry.targets} targets do not fit a ${entry.gridSize}×${entry.gridSize} board.`,
      )
    }
  })
}

/* ─── Tile Matching — progression ────────────────────────────────────────────
   Game 3 (classic Memory): a grid of face-down tiles holds a set of fruit
   symbols, exactly two of each, and the player flips them two at a time to
   clear every pair before the stage timer runs out. One mode, five lives that
   can grow up to a cap, and a whole-stage "recall" phase (every tile is hidden
   from the first tap — mirrors Schulte Trail, so the shared countdown runs the
   entire stage).

   Progression: the GRID is the difficulty axis. Levels 1→2→3→4→5 grow the
   board 4×3 → 4×4 → 5×4 → 6×4 → 6×5 (6/8/10/12/15 pairs), then it caps at
   6×6 (18 pairs) — the mobile-safe cap (a 7×6 grid would shrink tiles below
   the 44px touch target at 320px). Past Level 5 the board stays 6×6 and
   difficulty comes from TIME PRESSURE: the per-stage budget scales with pair
   count and slowly shrinks with the level. highestNumber therefore follows the
   level table (pairs), not a linear formula — mirrored by migration
   20260930000001.
   ───────────────────────────────────────────────────────────────────────── */

/** Stable identifier for the third Memory Games title. */
export const TILE_MATCHING_GAME_ID = 'tile_matching'

/** Maximum number of levels in a single Tile Matching run. */
export const TILE_MATCHING_MAX_LEVELS = 12

/** Lives granted at the start of every Tile Matching run. */
export const TILE_MATCHING_STARTING_LIVES = 5

/** Cap for the life pool: clearing a stage grants +1 up to this ceiling. */
export const TILE_MATCHING_MAX_LIVES = 8

/** Stage timer base (seconds) before pair count + level pressure apply. */
export const TILE_MATCHING_TIMER_BASE_SECONDS = 8

/** Extra seconds per pair on the board (6 → +12s, 18 → +36s). */
export const TILE_MATCHING_TIMER_PER_PAIR_SECONDS = 2

/** Seconds shaved per level past Level 5 (grid no longer grows). */
export const TILE_MATCHING_TIMER_LEVEL_PRESSURE = 0.85

/** Never tighten a stage below this budget, even at Max Level. */
export const TILE_MATCHING_TIMER_FLOOR_SECONDS = 12

/**
 * Fair per-stage time budget: base + 2s per pair, minus 0.85s per level past
 * Level 5, never below the floor. Level 1 = 20s for 6 pairs, Level 6 = 43s for
 * 18 pairs, easing back toward ~38s at Max Level as the pressure grows.
 */
export function getTileMatchingStageTimerSeconds(level: number, tiles: number): number {
  const levelCount = Math.max(1, Math.trunc(level))
  const tileCount = Math.max(4, Math.trunc(tiles))
  const pairs = Math.ceil(tileCount / 2)
  const base = TILE_MATCHING_TIMER_BASE_SECONDS + TILE_MATCHING_TIMER_PER_PAIR_SECONDS * pairs
  const pressure = Math.max(0, levelCount - 5) * TILE_MATCHING_TIMER_LEVEL_PRESSURE
  return Math.max(TILE_MATCHING_TIMER_FLOOR_SECONDS, Math.round(base - pressure))
}

export interface TileMatchingLevelConfig {
  /** 1-based level index. */
  level: number
  /** Board rows at this level. */
  rows: number
  /** Board columns at this level. */
  cols: number
  /** Distinct pairs on the board = tiles / 2. */
  pairs: number
  /** Tiles on the board = rows × cols (always even). */
  tiles: number
  /** Stages required to clear this level. */
  stagesRequired: number
}

/**
 * Grid size by level — the canonical expansion table. Each level adds tiles
 * until the mobile-safe 6×6 cap; every board holds an even number of tiles so
 * each symbol always appears exactly twice.
 */
export const TILE_MATCHING_GRID_PROGRESSION: readonly {
  minLevel: number
  maxLevel: number
  rows: number
  cols: number
}[] = [
  { minLevel: 1, maxLevel: 1, rows: 4, cols: 3 },
  { minLevel: 2, maxLevel: 2, rows: 4, cols: 4 },
  { minLevel: 3, maxLevel: 3, rows: 5, cols: 4 },
  { minLevel: 4, maxLevel: 4, rows: 6, cols: 4 },
  { minLevel: 5, maxLevel: 5, rows: 6, cols: 5 },
  { minLevel: 6, maxLevel: TILE_MATCHING_MAX_LEVELS, rows: 6, cols: 6 },
]

/** THE canonical Tile Matching level table (single source of truth). */
export const TILE_MATCHING_LEVEL_CONFIG: readonly TileMatchingLevelConfig[] = Array.from(
  { length: TILE_MATCHING_MAX_LEVELS },
  (_, index) => {
    const level = index + 1
    const grid = TILE_MATCHING_GRID_PROGRESSION.find(
      (range) => level >= range.minLevel && level <= range.maxLevel,
    ) ?? { rows: 6, cols: 6 }
    const tiles = grid.rows * grid.cols
    return {
      level,
      rows: grid.rows,
      cols: grid.cols,
      pairs: tiles / 2,
      tiles,
      stagesRequired: STAGES_PER_LEVEL,
    }
  },
)

/** Resolve the canonical level config (clamped to the first/last level). */
export function getTileMatchingLevelConfig(level: number): TileMatchingLevelConfig {
  const clamped = Math.min(Math.max(Math.trunc(level), 1), TILE_MATCHING_MAX_LEVELS)
  return TILE_MATCHING_LEVEL_CONFIG[clamped - 1]
}

/** Highest number of pairs shown at a level (mirrors `highestNumber` parity). */
export function tileMatchingHighestNumber(level: number): number {
  return getTileMatchingLevelConfig(level).pairs
}

/** Guard every configured level against a board outside the touch safe range. */
export function assertTileMatchingLevelsFit(): void {
  TILE_MATCHING_LEVEL_CONFIG.forEach((entry) => {
    if (entry.rows < 3 || entry.cols < 3 || entry.rows > 6 || entry.cols > 6) {
      throw new Error(
        `Tile Matching Level ${entry.level} uses a ${entry.rows}×${entry.cols} board — out of the mobile-safe 3…6 range.`,
      )
    }
  })
}

/** A face value tile: the emoji glyph plus a spoken-words name for aria. */
export interface TileMatchingValueTile {
  /** Canonical display glyph shown face-up on the tile. */
  emoji: string
  /** Spoken name used by button labels/aria (e.g. "Tile 5, apple"). */
  name: string
}

/**
 * THE canonical 18-tile value deck: one symbol per possible pair, so every
 * board up to the 6×6/18-pair cap is filled with DISTINCT symbols. Fruits are
 * intentionally concrete (the classic Memory flavour). Single deterministic
 * set — no themed variants.
 */
export const TILE_MATCHING_VALUE_TILES: readonly TileMatchingValueTile[] = [
  { emoji: '🍎', name: 'apple' },
  { emoji: '🍌', name: 'banana' },
  { emoji: '🍇', name: 'grapes' },
  { emoji: '🍊', name: 'orange' },
  { emoji: '🍓', name: 'strawberry' },
  { emoji: '🍒', name: 'cherry' },
  { emoji: '🍐', name: 'pear' },
  { emoji: '🍑', name: 'peach' },
  { emoji: '🍋', name: 'lemon' },
  { emoji: '🍉', name: 'watermelon' },
  { emoji: '🍍', name: 'pineapple' },
  { emoji: '🥝', name: 'kiwi' },
  { emoji: '🥭', name: 'mango' },
  { emoji: '🫐', name: 'blueberry' },
  { emoji: '🥑', name: 'avocado' },
  { emoji: '🥥', name: 'coconut' },
  { emoji: '🍈', name: 'melon' },
  { emoji: '🍏', name: 'green apple' },
]

/** Resolve a value index to its tile (clamped to the deck's bounds). */
export function getTileMatchingValueTile(valueIndex: number): TileMatchingValueTile {
  const index = Math.max(0, Math.min(Math.trunc(valueIndex), TILE_MATCHING_VALUE_TILES.length - 1))
  return TILE_MATCHING_VALUE_TILES[index]
}

/* ─── Schulte Trail — progression ────────────────────────────────────────────
   Game 4 (classic Schulte table): every cell of the grid holds one distinct
   number, 1..N where N is the tile count, and the player taps them in
   ASCENDING order (1, 2, 3 … N) before the stage timer runs out. One mode,
   exactly three lives, full-grid (no empty cells) boards.

   Progression: the GRID is the difficulty axis. Level 1–2 → 4×4 (16 tiles),
   Level 3–4 → 5×5 (25 tiles), Level 5+ → 6×6 (36 tiles, the mobile-safe cap —
   a 7×7 grid would shrink tiles below the 44px touch target at 320px). Each
   stage starts the whole run visible, so the shared "recall" phase begins
   immediately (mirrors Tile Matching). Past Level 6 the board stays 6×6 and
   difficulty comes from TIME PRESSURE: the per-stage budget scales with tile
   count and slowly shrinks with the level above 5. highestNumber therefore
   follows the level table (tiles), not a linear formula — mirrored by the
   20260929000001 migration.
   ───────────────────────────────────────────────────────────────────────── */

/** Stable identifier for the fourth Memory Games title. */
export const SCHULTE_TRAIL_GAME_ID = 'schulte_trail'

/** Maximum number of levels in a single Schulte Trail run. */
export const SCHULTE_MAX_LEVELS = 12

/** Stage timer base (seconds) before tile count + level pressure apply. */
export const SCHULTE_TIMER_BASE_SECONDS = 24

/** Extra seconds per board tile (16 → +22.4s, 36 → +50.4s). */
export const SCHULTE_TIMER_PER_TILE_SECONDS = 1.4

/** Seconds shaved per level past Level 5 (grid no longer grows). */
export const SCHULTE_TIMER_LEVEL_PRESSURE = 1.25

/** Never tighten a stage below this budget, even at Max Level. */
export const SCHULTE_TIMER_FLOOR_SECONDS = 45

/**
 * Fair per-stage time budget: base + 1.4s per tile, minus 1.25s per level past
 * Level 5 (the highest the grid reaches), never below the floor. Level 1 = 46s
 * for 16 tiles, Level 3 = 59s for 25 tiles, Level 5 = 74s for 36 tiles.
 */
export function getSchulteStageTimerSeconds(level: number, tiles: number): number {
  const levelCount = Math.max(1, Math.trunc(level))
  const tileCount = Math.max(4, Math.trunc(tiles))
  const base = SCHULTE_TIMER_BASE_SECONDS + SCHULTE_TIMER_PER_TILE_SECONDS * tileCount
  const pressure = Math.max(0, levelCount - 5) * SCHULTE_TIMER_LEVEL_PRESSURE
  return Math.max(SCHULTE_TIMER_FLOOR_SECONDS, Math.round(base - pressure))
}

export interface SchulteLevelConfig {
  /** 1-based level index. */
  level: number
  /** Distinct numbers on the board = grid cells (gridSize²). */
  tiles: number
  /** Board is `gridSize` × `gridSize` at this level. */
  gridSize: number
  /** Stages required to clear this level. */
  stagesRequired: number
}

/**
 * Grid size by level — the canonical expansion table. The board starts fully
 * covered (tiles == gridSize², no empty cells) and caps at 6×6 to keep every
 * tile comfortably tappable on a 320px viewport.
 */
export const SCHULTE_GRID_PROGRESSION: readonly { minLevel: number; maxLevel: number; size: number }[] = [
  { minLevel: 1, maxLevel: 2, size: 4 },
  { minLevel: 3, maxLevel: 4, size: 5 },
  { minLevel: 5, maxLevel: SCHULTE_MAX_LEVELS, size: 6 },
]

/** THE canonical Schulte Trail level table (single source of truth). */
export const SCHULTE_LEVEL_CONFIG: readonly SchulteLevelConfig[] = Array.from(
  { length: SCHULTE_MAX_LEVELS },
  (_, index) => {
    const level = index + 1
    const grid = SCHULTE_GRID_PROGRESSION.find(
      (range) => level >= range.minLevel && level <= range.maxLevel,
    ) ?? { size: SCHULTE_GRID_PROGRESSION[SCHULTE_GRID_PROGRESSION.length - 1].size }
    const size = grid.size
    return {
      level,
      tiles: size * size,
      gridSize: size,
      stagesRequired: STAGES_PER_LEVEL,
    }
  },
)

/** Resolve the canonical level config (clamped to the first/last level). */
export function getSchulteLevelConfig(level: number): SchulteLevelConfig {
  const clamped = Math.min(Math.max(Math.trunc(level), 1), SCHULTE_MAX_LEVELS)
  return SCHULTE_LEVEL_CONFIG[clamped - 1]
}

/** Highest number of tiles shown at a level (mirrors `highestNumber` parity). */
export function schulteHighestNumber(level: number): number {
  return getSchulteLevelConfig(level).tiles
}

/** Guard every configured level against a board that exceeds the touch safe cap. */
export function assertSchulteLevelsFit(): void {
  SCHULTE_LEVEL_CONFIG.forEach((entry) => {
    if (entry.gridSize < 4 || entry.gridSize > 6) {
      throw new Error(
        `Schulte Trail Level ${entry.level} uses a ${entry.gridSize}×${entry.gridSize} board — out of the mobile-safe 4…6 range.`,
      )
    }
  })
}

export const MEMORY_GAMES_COPY = {
  pageTitle: 'Memory Games',
  gameTitle: 'Number Memory Rush',
  gameSubtitle: 'Spatial Working Memory Game',
  idleHint: 'Press Start Game, then tap number 1 to hide the numbers and recall the order.',
} as const

export interface MemoryAchievement {
  /** Lowest highest-level that earns this label. */
  minLevel: number
  label: string
}

/**
 * Neutral, non-diagnostic achievement tiers shown on the result screen. Ordered
 * from highest to lowest so a single `find` resolves the player's tier. These
 * are game flavour only — never IQ, intelligence or aptitude claims.
 */
export const MEMORY_ACHIEVEMENTS: readonly MemoryAchievement[] = [
  { minLevel: 12, label: 'Memory Master' },
  { minLevel: 9, label: 'Memory Challenger' },
  { minLevel: 6, label: 'Memory Explorer' },
  { minLevel: 3, label: 'Memory Builder' },
  { minLevel: 1, label: 'Memory Starter' },
]

/** Resolve the neutral achievement label for a highest level reached. */
export function getMemoryAchievement(highestLevel: number): string {
  const tier = MEMORY_ACHIEVEMENTS.find((entry) => highestLevel >= entry.minLevel)
  return tier ? tier.label : 'Memory Starter'
}

/* ─── Per-game status copy ──────────────────────────────────────────────────
   The status line and countdown copy are game-worded (numbers vs pattern), so
   each game provides its own text for the SHARED statusMessage consumer. The
   submission / end states read identically and stay in statusMessage itself. */
export interface MemoryRunStatusCopy {
  idle: string
  showingNumbers: string
  recalling: (state: { expected: number; numbers: number }) => string
  stageComplete: (points: number) => string
  levelComplete: (level: number, bonus: number) => string
  stageFailed: (reasonLabel: string, lives: number) => string
  gameComplete: string
  /** Per-game phrasing for `lastFailureReason` (defaults to the shared one). */
  failureLabel?: (reason: 'wrongNumber' | 'emptyTile' | 'timeout' | null) => string
}

export const NUMBER_MEMORY_RUSH_STATUS_COPY: MemoryRunStatusCopy = {
  idle: MEMORY_GAMES_COPY.idleHint,
  showingNumbers: 'Memorize the numbers, then tap 1 to hide them.',
  recalling: (state) => `Find number ${state.expected}.`,
  stageComplete: (points) => `Stage cleared! +${points} points.`,
  levelComplete: (level, bonus) => `Level ${level} cleared! +${bonus} bonus.`,
  stageFailed: (reasonLabel, lives) =>
    lives <= 0
      ? 'Out of lives — the run is over.'
      : `${reasonLabel} — ${lives} ${lives === 1 ? 'life' : 'lives'} left.`,
  gameComplete: 'Run finished. Nice memory!',
}

export const VISUAL_MEMORY_MATRIX_STATUS_COPY: MemoryRunStatusCopy = {
  idle:
    'Press Start Game, then memorize the highlighted pattern before it hides.',
  showingNumbers: 'Memorize the highlighted pattern.',
  recalling: (state) =>
    `Select the tiles you remember — ${state.expected - 1} of ${state.numbers} found.`,
  stageComplete: (points) => `Pattern complete! +${points} points.`,
  levelComplete: (level, bonus) => `Level ${level} cleared! +${bonus} bonus.`,
  stageFailed: (reasonLabel, lives) =>
    lives <= 0
      ? 'Out of lives — the run is over.'
      : `${reasonLabel} — ${lives} ${lives === 1 ? 'life' : 'lives'} left.`,
  gameComplete: 'Run finished. Nice memory!',
}

export const TILE_MATCHING_STATUS_COPY: MemoryRunStatusCopy = {
  idle:
    'Press Start Game, then flip tiles two at a time and match every pair before the timer runs out.',
  showingNumbers: 'Tap any tile to reveal it, then find its matching pair.',
  recalling: (state) =>
    `Match all ${state.numbers} pairs — ${state.expected} matched, ${state.numbers - state.expected} to go.`,
  stageComplete: (points) => `Board cleared! +${points} points.`,
  levelComplete: (level, bonus) => `Level ${level} cleared! +${bonus} bonus.`,
  stageFailed: (reasonLabel, lives) =>
    lives <= 0
      ? 'Out of lives — the run is over.'
      : `${reasonLabel} — ${lives} ${lives === 1 ? 'life' : 'lives'} left.`,
  gameComplete: 'Run finished. Nice memory!',
  failureLabel: (reason) => (reason === 'timeout' ? 'Time expired' : 'Tiles did not match'),
}

export const SCHULTE_TRAIL_STATUS_COPY: MemoryRunStatusCopy = {
  idle:
    'Press Start Game, then tap every number in the grid in ascending order — 1, 2, 3 … — before time runs out.',
  showingNumbers: 'Tap the numbers in order, starting with 1.',
  recalling: (state) => `Find number ${state.expected}.`,
  stageComplete: (points) => `Board cleared! +${points} points.`,
  levelComplete: (level, bonus) => `Level ${level} cleared! +${bonus} bonus.`,
  stageFailed: (reasonLabel, lives) =>
    lives <= 0
      ? 'Out of lives — the run is over.'
      : `${reasonLabel} — ${lives} ${lives === 1 ? 'life' : 'lives'} left.`,
  gameComplete: 'Run finished. Nice searching!',
  failureLabel: (reason) => (reason === 'timeout' ? 'Time expired' : 'Wrong number'),
}

/** Whether a raw string is a shipped memory game id (route/param guard). */
export function isMemoryGameId(value: string | null | undefined): value is MemoryGameId {
  return (
    value === NUMBER_MEMORY_RUSH_GAME_ID ||
    value === VISUAL_MEMORY_MATRIX_GAME_ID ||
    value === TILE_MATCHING_GAME_ID ||
    value === SCHULTE_TRAIL_GAME_ID
  )
}

export interface MemoryGameCatalogEntry {
  id: MemoryGameId
  /** Short title shown on the header line of the game + cards. */
  title: string
  /** One-line subtitle (uppercase header accent). */
  subtitle: string
  /** Data-driven card link under /memory-games. */
  route: string
  /** Emoji glyph used by the header + landing card. */
  icon: string
  /** Landing-card description. */
  description: string
  /** "Numbers" vs "Pattern" — the label for the primary HUD metric. */
  metricLabel: string
  /** "Highest Number" vs "Pattern Size" — result-screen metric label. */
  highestMetricLabel: string
  statusCopy: MemoryRunStatusCopy
  maxLevel: number
}

export const NUMBER_MEMORY_RUSH_ENTRY: MemoryGameCatalogEntry = {
  id: NUMBER_MEMORY_RUSH_GAME_ID,
  title: MEMORY_GAMES_COPY.gameTitle,
  subtitle: MEMORY_GAMES_COPY.gameSubtitle,
  route: '/memory-games/number-memory-rush',
  icon: '🧠',
  description:
    'Memorize an increasing sequence of numbers and recall them in order before the timer runs out.',
  metricLabel: 'Numbers',
  highestMetricLabel: 'Highest Number',
  statusCopy: NUMBER_MEMORY_RUSH_STATUS_COPY,
  maxLevel: MAX_LEVELS,
}

export const VISUAL_MEMORY_MATRIX_ENTRY: MemoryGameCatalogEntry = {
  id: VISUAL_MEMORY_MATRIX_GAME_ID,
  title: 'Visual Memory Matrix',
  subtitle: 'Spatial Pattern Memory Game',
  route: '/memory-games/visual-memory-matrix',
  icon: '🔮',
  description:
    'Memorize where the tiles glow on a growing grid, then recall every highlighted position before time runs out.',
  metricLabel: 'Pattern',
  highestMetricLabel: 'Pattern Size',
  statusCopy: VISUAL_MEMORY_MATRIX_STATUS_COPY,
  maxLevel: VMM_MAX_LEVELS,
}

export const TILE_MATCHING_ENTRY: MemoryGameCatalogEntry = {
  id: TILE_MATCHING_GAME_ID,
  title: 'Tile Matching',
  subtitle: 'Pair Memory Game',
  route: '/memory-games/tile-matching',
  icon: '🧩',
  description:
    'Flip face-down tiles two at a time and clear every matching pair before the timer runs out.',
  metricLabel: 'Pairs',
  highestMetricLabel: 'Pair Count',
  statusCopy: TILE_MATCHING_STATUS_COPY,
  maxLevel: TILE_MATCHING_MAX_LEVELS,
}

export const SCHULTE_TRAIL_ENTRY: MemoryGameCatalogEntry = {
  id: SCHULTE_TRAIL_GAME_ID,
  title: 'Schulte Trail',
  subtitle: 'Visual Search Memory Game',
  route: '/memory-games/schulte-trail',
  icon: '🎯',
  description:
    'Scan a shuffled grid and tap every number in ascending order — 1, 2, 3 … — before the timer runs out. Classic Schulte training.',
  metricLabel: 'Targets',
  highestMetricLabel: 'Board Tiles',
  statusCopy: SCHULTE_TRAIL_STATUS_COPY,
  maxLevel: SCHULTE_MAX_LEVELS,
}

/** All shipped games — drives the landing cards, routes and per-game leaderboard. */
export const MEMORY_GAME_CATALOG: readonly MemoryGameCatalogEntry[] = [
  NUMBER_MEMORY_RUSH_ENTRY,
  VISUAL_MEMORY_MATRIX_ENTRY,
  TILE_MATCHING_ENTRY,
  SCHULTE_TRAIL_ENTRY,
]

export function getMemoryGameCatalogEntry(gameId: MemoryGameId): MemoryGameCatalogEntry {
  return MEMORY_GAME_CATALOG.find((entry) => entry.id === gameId) ?? NUMBER_MEMORY_RUSH_ENTRY
}
