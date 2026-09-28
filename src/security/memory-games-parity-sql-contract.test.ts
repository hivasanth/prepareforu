/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* ── MEMORY-GAMES SERVER PARITY (static regression) ──────────────────────────
 * Guards the deployed `submit_memory_game_score` parity between the SQL
 * function and src/config/memoryGames.ts. Game 2 (Visual Memory Matrix) opens
 * at 4 pattern targets on a 4×4 board while Game 1 (Number Memory Rush) opens
 * at 3 digits; both grow the primary metric by one per level. The 20260926000001
 * migration made the starting value per-game so a valid Matrix run (Level 1 =
 * highest_number 4) is not rejected by the "Number count does not match the
 * level" check.
 * These static reads are deterministic (no DB required); live behaviour is
 * verified during the deploy pass.
 * ─────────────────────────────────────────────────────────────────────────── */

const MIGRATION = `supabase/migrations/20260926000001_memory_games_per_game_starting_number.sql`
const CLIENT = `src/config/memoryGames.ts`
const sql = readFileSync(resolve(process.cwd(), MIGRATION), 'utf8').replace(/\r\n/g, '\n')
const config = readFileSync(resolve(process.cwd(), CLIENT), 'utf8').replace(/\r\n/g, '\n')

describe('SQL contract: per-game starting number (Rush 3 / Matrix 4)', () => {
  it('computes a per-game starting value instead of a shared constant', () => {
    expect(sql).toContain('v_starting_numbers  INTEGER;')
    expect(sql).toContain('v_starting_numbers := CASE')
    expect(sql).toContain(`WHEN p_game_id = 'visual_memory_matrix' THEN 4`)
    expect(sql).toContain('ELSE 3')
    expect(sql).not.toMatch(/c_starting_numbers\s+CONSTANT/)
  })

  it('parity check stays LEVEL = starting + (level − 1) with the per-game base', () => {
    expect(sql).toContain('p_highest_number <> v_starting_numbers + (p_highest_level - 1)')
  })

  it('keeps the per-game maximum level (Rush 12, Matrix 15) untouched', () => {
    expect(sql).toContain(`WHEN p_game_id = 'visual_memory_matrix' THEN 15`)
    expect(sql).toContain('ELSE 12')
  })

  it('keeps the tight EXECUTE grants (authenticated only)', () => {
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.submit_memory_game_score\(/g)
    expect(sql).toMatch(/FROM PUBLIC;/)
    expect(sql).toMatch(/FROM anon;/)
    expect(sql).toMatch(/TO authenticated;/)
  })

  it('the client starting value resolves to the same per-game base the server checks', () => {
    expect(config).toMatch(/export const VMM_STARTING_TARGETS = 4/)
    expect(config).toMatch(/export const STARTING_NUMBERS = 3/)
  })
})