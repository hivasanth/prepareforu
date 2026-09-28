/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* ── MEMORY-GAMES SERVER PARITY (static regression) ──────────────────────────
 * Guards the deployed `submit_memory_game_score` parity for Game 4 (Schulte
 * Trail). Unlike Rush / Matrix / Color Reflex, Schulte's primary metric (board
 * tiles) follows the GRID, not a linear starting value: Level 1–2 → 16 tiles,
 * Level 3–4 → 25 tiles, Level 5+ → 36 tiles. The 20260929000001 migration
 * therefore branches the "Number count does not match the level" check per
 * game, keeping the linear rule for the other three titles.
 * These static reads are deterministic (no DB required); live behaviour is
 * verified during the deploy pass. The client mirror lives in
 * src/config/memoryGames.ts (SCHULTE_LEVEL_CONFIG / schulteHighestNumber) and
 * src/utils/schulteTrailLogic.ts.
 * ─────────────────────────────────────────────────────────────────────────── */

const MIGRATION = `supabase/migrations/20260929000001_memory_games_schulte_trail.sql`
const CLIENT = `src/config/memoryGames.ts`
const sql = readFileSync(resolve(process.cwd(), MIGRATION), 'utf8').replace(/\r\n/g, '\n')
const config = readFileSync(resolve(process.cwd(), CLIENT), 'utf8').replace(/\r\n/g, '\n')

const ALL_GAMES = `('number_memory_rush', 'visual_memory_matrix', 'color_reflex', 'schulte_trail')`

describe('SQL contract: Schulte Trail joins the shared leaderboard-safe model', () => {
  it('persists schulte_trail on both tables via the data-layer guard', () => {
    expect(sql).toContain(`memory_game_sessions_game_id_known`)
    expect(sql).toContain(`memory_game_scores_game_id_known`)
    expect(sql).toContain(`CHECK (game_id IN ${ALL_GAMES})`)
  })

  it('accepts schulte_trail in the session-start RPC', () => {
    expect(sql).toContain(`p_game_id NOT IN ${ALL_GAMES}`)
    expect(sql).toContain(`RAISE EXCEPTION 'Unsupported game';`)
  })

  it('accepts schulte_trail with the shared 12-level cap in the submit RPC', () => {
    expect(sql).toContain(`p_game_id NOT IN ${ALL_GAMES}`)
    expect(sql).toContain(`WHEN p_game_id = 'visual_memory_matrix' THEN 15`)
    expect(sql).toContain('ELSE 12')
    expect(sql).toContain(`p_highest_level > v_max_levels`)
  })

  it('branches the highest-number parity: Schulte tiles vs linear for the rest', () => {
    // Schulte: exhaustive tile-count CASE (16 → 25 → 36, mirror grid growth).
    expect(sql).toContain(`IF p_game_id = 'schulte_trail' THEN`)
    expect(sql).toContain(`WHEN 1 THEN 16`)
    expect(sql).toContain(`WHEN 2 THEN 16`)
    expect(sql).toContain(`WHEN 3 THEN 25`)
    expect(sql).toContain(`WHEN 4 THEN 25`)
    expect(sql).toContain('ELSE 36')
    expect(sql).toContain(`RAISE EXCEPTION 'Number count does not match the level';`)
    // The other three games keep the linear starting-value rule.
    expect(sql).toContain(`p_highest_number <> v_starting_numbers + (p_highest_level - 1)`)
    expect(sql).toContain(`v_starting_numbers := CASE`)
    expect(sql).toContain(`WHEN p_game_id = 'visual_memory_matrix' THEN 4`)
    expect(sql).toContain('ELSE 3')
  })

  it('scopes a dedicated daily leaderboard for schulte_trail', () => {
    expect(sql).toContain(`WHEN p_game_id = 'schulte_trail' THEN 'schulte_trail'`)
    expect(sql).toContain(`WHEN p_game_id = 'color_reflex' THEN 'color_reflex'`)
    expect(sql).toContain(`WHERE s.game_id = v_game_id`)
  })

  it('keeps the tight EXECUTE grants (authenticated only)', () => {
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.submit_memory_game_score\(/g)
    expect(sql).toMatch(/FROM PUBLIC;/)
    expect(sql).toMatch(/FROM anon;/)
    expect(sql).toMatch(/TO authenticated;/)
  })

  it('the client table mirrors the server tile progression (16 → 25 → 36)', () => {
    expect(config).toMatch(/export const SCHULTE_MAX_LEVELS = 12/)
    expect(config).toMatch(/minLevel: 1, maxLevel: 2, size: 4/)
    expect(config).toMatch(/minLevel: 3, maxLevel: 4, size: 5/)
    expect(config).toMatch(/minLevel: 5, maxLevel: SCHULTE_MAX_LEVELS, size: 6/)
    expect(config).toMatch(/tiles: size \* size/)
    expect(config).toMatch(/export const SCHULTE_TRAIL_GAME_ID = 'schulte_trail'/)
  })
})