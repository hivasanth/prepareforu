/**
 * ─── Tile Matching — SQL contract mirror test ────────────────────────────────
 *
 * A tiny, READ-ONLY contract that asserts the static pairing between the
 * migration that ships the tile_matching game and the client-side canonical
 * config. This does NOT run SQL against the database; it statically reads both
 * files so a drift between server constraints/RPC branches and the client
 * (grid/table, pairs, max level, id) is caught by the unit test suite.
 *
 * Principle: the server is the authority for persistence, the client for
 * difficulty; the two MUST agree on the canonical axes (game id, grid
 * progression → pairs = tiles/2, max level). The contract reads:
 *  - supabase/migrations/20260930000001_memory_games_tile_matching.sql (the
 *    new, single migration that adds tile_matching to the CHECKs and updates
 *    the three RPCs to accept tile_matching while rejecting color_reflex)
 *  - src/config/memoryGames.ts (the client canonical tables for Tile Matching)
 *
 * Allowed in this module: readFileSync + expect. No network calls, no
 * process exec, no DB access. Pure text assertions.
 */

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = resolve(__dirname, '..', '..')

/**
 * Resolve a repo-relative path from this test file. The test stays portable
 * (works in CI, in any checkout path) because all paths are resolved relative
 * to repoRoot.
 */
function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), 'utf8')
}

describe('Tile Matching — SQL contract (static mirror)', () => {
  let migrationSql: string
  let configTs: string

  beforeAll(() => {
    migrationSql = readRepoFile(
      'supabase/migrations/20260930000001_memory_games_tile_matching.sql',
    )
    configTs = readRepoFile('src/config/memoryGames.ts')
  })

  it('migration exists at the expected ledger version', () => {
    expect(migrationSql).toBeDefined()
    // Ledger version must follow the Schulte migration (20260929000001).
    expect(migrationSql).toMatch(
      /^-- 20260930000001_memory_games_tile_matching\.sql$/m,
    )
    expect(migrationSql.length).toBeGreaterThan(100)
  })

  it('migration keeps color_reflex in historical data CHECKs (existing rows) and adds tile_matching to BOTH tables', () => {
    // The data-layer CHECKs must continue to accept historical color_reflex
    // rows (3 dormant CR sessions exist) — the Option B1 constraint-integrity
    // rule — while also admitting the new tile_matching title. The exact same
    // explicit `IN (...)` list must appear on BOTH tables.
    const expectedList =
      "game_id IN ('number_memory_rush', 'visual_memory_matrix', 'color_reflex', 'schulte_trail', 'tile_matching')"
    const occurrences = migrationSql.split(expectedList).length - 1
    expect(occurrences).toBe(2)
    expect(migrationSql).toMatch(/DROP CONSTRAINT IF EXISTS memory_game_sessions_game_id_known/)
    expect(migrationSql).toMatch(/DROP CONSTRAINT IF EXISTS memory_game_scores_game_id_known/)
  })

  it('start_memory_game_session accepts tile_matching and rejects color_reflex via the write-path guard', () => {
    expect(migrationSql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.start_memory_game_session\s*\(/i,
    )
    // The write path accepts tile_matching but EXCLUDES color_reflex — the
    // only way to create a session — so color_reflex falls through to
    // `RAISE EXCEPTION 'Unsupported game'`.
    expect(migrationSql).toMatch(
      /p_game_id NOT IN \('number_memory_rush', 'visual_memory_matrix', 'tile_matching', 'schulte_trail'\)/,
    )
    expect(migrationSql).toMatch(/RAISE EXCEPTION 'Unsupported game'/)
  })

  it('submit_memory_game_score adds the tile_matching pairs parity branch and rejects color_reflex', () => {
    expect(migrationSql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.submit_memory_game_score\s*\(/i,
    )
    expect(migrationSql).toMatch(
      /p_game_id NOT IN \('number_memory_rush', 'visual_memory_matrix', 'tile_matching', 'schulte_trail'\)/,
    )
    // Tile Matching parity: level table pairs 6 → 8 → 10 → 12 → 15 → 18.
    expect(migrationSql).toMatch(/IF p_game_id = 'tile_matching' THEN/i)
    expect(migrationSql).toMatch(/WHEN 1 THEN 6/i)
    expect(migrationSql).toMatch(/WHEN 2 THEN 8/i)
    expect(migrationSql).toMatch(/WHEN 3 THEN 10/i)
    expect(migrationSql).toMatch(/WHEN 4 THEN 12/i)
    expect(migrationSql).toMatch(/WHEN 5 THEN 15/i)
    expect(migrationSql).toMatch(/ELSE 18 END/i)
  })

  it('get_memory_game_leaderboard scopes tile_matching and keeps color_reflex read-only', () => {
    expect(migrationSql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.get_memory_game_leaderboard\s*\(/i,
    )
    expect(migrationSql).toMatch(/WHEN p_game_id = 'tile_matching' THEN 'tile_matching'/i)
    // Historical color_reflex stays readable (its board is empty and can never
    // grow because no write path accepts it).
    expect(migrationSql).toMatch(/WHEN p_game_id = 'color_reflex' THEN 'color_reflex'/i)
  })

  it('migration does NOT create new tables or new RPCs (only alters existing ones)', () => {
    // We must touch only the three RPCs + constraints. No CREATE TABLE.
    expect(migrationSql).not.toMatch(/CREATE TABLE(?! IF NOT EXISTS)/i)
    // Exactly 3 CREATE OR REPLACE FUNCTION statements (start, submit, leaderboard).
    const fnMatches = migrationSql.match(/CREATE OR REPLACE FUNCTION/g) || []
    expect(fnMatches.length).toBe(3)
  })

  it('client config defines TILE_MATCHING with canonical constants, grid, and timer', () => {
    expect(configTs).toMatch(/TILE_MATCHING_GAME_ID\s*=\s*'tile_matching'/)
    expect(configTs).toMatch(/TILE_MATCHING_MAX_LEVELS\s*=\s*12/)
    expect(configTs).toMatch(/TILE_MATCHING_STARTING_LIVES\s*=\s*5/)
    expect(configTs).toMatch(/TILE_MATCHING_MAX_LIVES\s*=\s*8/)
    // Grid progression: Level 1→4×3, 2→4×4, 3→5×4, 4→6×4, 5→6×5, 6+→6×6.
    expect(configTs).toMatch(/minLevel: 1, maxLevel: 1, rows: 4, cols: 3/)
    expect(configTs).toMatch(/minLevel: 2, maxLevel: 2, rows: 4, cols: 4/)
    expect(configTs).toMatch(/minLevel: 3, maxLevel: 3, rows: 5, cols: 4/)
    expect(configTs).toMatch(/minLevel: 4, maxLevel: 4, rows: 6, cols: 4/)
    expect(configTs).toMatch(/minLevel: 5, maxLevel: 5, rows: 6, cols: 5/)
    expect(configTs).toMatch(/minLevel: 6, maxLevel: TILE_MATCHING_MAX_LEVELS, rows: 6, cols: 6/)
    // Timer formula constants.
    expect(configTs).toMatch(/TILE_MATCHING_TIMER_BASE_SECONDS\s*=\s*8/)
    expect(configTs).toMatch(/TILE_MATCHING_TIMER_PER_PAIR_SECONDS\s*=\s*2/)
    expect(configTs).toMatch(/TILE_MATCHING_TIMER_LEVEL_PRESSURE\s*=\s*0\.85/)
    expect(configTs).toMatch(/TILE_MATCHING_TIMER_FLOOR_SECONDS\s*=\s*12/)
  })

  it('client config catalog uses tile_matching id and correct labels', () => {
    expect(configTs).toMatch(/TILE_MATCHING_ENTRY: MemoryGameCatalogEntry = \{/)
    expect(configTs).toMatch(/id:\s*TILE_MATCHING_GAME_ID/)
    expect(configTs).toMatch(/route:\s*'\/memory-games\/tile-matching'/)
    expect(configTs).toMatch(/metricLabel:\s*'Pairs'/)
    expect(configTs).toMatch(/highestMetricLabel:\s*'Pair Count'/)
    // isMemoryGameId must include tile_matching (replaced color_reflex).
    expect(configTs).toMatch(/value === TILE_MATCHING_GAME_ID/)
    expect(configTs).not.toMatch(/value === COLOR_REFLEX_GAME_ID/)
  })

  it('client config catalog contains exactly the 4 shipped games with tile_matching', () => {
    expect(configTs).toMatch(
      /MEMORY_GAME_CATALOG: readonly MemoryGameCatalogEntry\[\] = \[/,
    )
    // Count the shipped entries INSIDE the catalog array only (later code also
    // names some entries, e.g. the getMemoryGameCatalogEntry fallback).
    const catalogStart = configTs.indexOf(
      'MEMORY_GAME_CATALOG: readonly MemoryGameCatalogEntry[] = [',
    )
    const arrayOpen = configTs.indexOf('= [', catalogStart)
    const arrayBody = configTs.slice(arrayOpen + 3, configTs.indexOf(']', arrayOpen))
    const entries =
      arrayBody.match(
        /NUMBER_MEMORY_RUSH_ENTRY|VISUAL_MEMORY_MATRIX_ENTRY|TILE_MATCHING_ENTRY|SCHULTE_TRAIL_ENTRY/g,
      ) || []
    expect(entries).toEqual(
      expect.arrayContaining([
        'NUMBER_MEMORY_RUSH_ENTRY',
        'VISUAL_MEMORY_MATRIX_ENTRY',
        'TILE_MATCHING_ENTRY',
        'SCHULTE_TRAIL_ENTRY',
      ]),
    )
    expect(entries).toHaveLength(4)
  })

  it('client parity: pairs = tiles/2 (single source) matches the migration CASE table', () => {
    // The client MUST derive pairs from the grid (tiles/2), never hardcode them.
    expect(configTs).toMatch(/pairs: tiles \/ 2/)
    expect(configTs).not.toMatch(/pairs:\s*(?:6|8|10|12|15|18)\b/)
    // The server carries the exhaustive level → pair-count CASE (1→6 … 5→15,
    // 6+→18), which is the persisted authority.
    expect(migrationSql).toMatch(/CASE p_highest_level/i)
    // Grid parity: the 6×6 cap yields 18 pairs, which the migration also maps
    // to its ELSE arm (levels 6…12 all share the 6×6 board).
    expect(configTs).toMatch(/minLevel: 6, maxLevel: TILE_MATCHING_MAX_LEVELS, rows: 6, cols: 6/)
    expect(migrationSql).toMatch(/ELSE 18 END/i)
  })
})