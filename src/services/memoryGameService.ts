import * as memoryGameRepo from '../lib/repositories/memoryGame.repository'
import { NUMBER_MEMORY_RUSH_GAME_ID } from '../config/memoryGames'
import { validateMemoryMetrics } from '../utils/memoryGameLogic'
import type {
  MemoryGameId,
  MemoryLeaderboardEntry,
  MemoryPersonalBest,
  MemoryScoreSubmissionResult,
  SubmitMemoryGameInput,
} from '../types/memoryGame.types'

export { MEMORY_LEADERBOARD_TOP_LIMIT } from '../lib/repositories/memoryGame.repository'
export type { MemoryScoreInsertPayload } from '../lib/repositories/memoryGame.repository'

/** The one shipped title. Kept here so pages never pass a literal. */
export const MEMORY_GAME_ID: MemoryGameId = NUMBER_MEMORY_RUSH_GAME_ID

function toNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function toSafeName(value: unknown): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed || 'Anonymous Student'
}

/** Open/resume the authoritative session used to validate the final score. */
export async function startMemoryGameSession(
  gameId: MemoryGameId = MEMORY_GAME_ID,
): Promise<string> {
  return memoryGameRepo.startMemoryGameSessionRpc(gameId)
}

/**
 * Persist a finished run. The client mirror refuses an obviously impossible
 * payload before it leaves the browser; the RPC still re-validates server-side
 * and is the authority on whether the score is accepted.
 */
export async function submitMemoryGameResult(
  input: SubmitMemoryGameInput,
): Promise<MemoryScoreSubmissionResult> {
  const validation = validateMemoryMetrics(input.metrics, input.gameId)
  if (!validation.valid) {
    throw new Error(validation.reason ?? 'Invalid game result.')
  }
  const result = await memoryGameRepo.submitMemoryGameScoreRpc(input)
  if (!result.accepted) {
    throw new Error('The score was not accepted.')
  }
  return {
    accepted: true,
    duplicate: result.duplicate ?? false,
    score: result.score ?? input.metrics.score,
  }
}

/** Live leaderboard (best run per user, ranked server-side, one game). */
export async function fetchMemoryGameLeaderboard(
  gameId: MemoryGameId = MEMORY_GAME_ID,
  limit = memoryGameRepo.MEMORY_LEADERBOARD_TOP_LIMIT,
): Promise<MemoryLeaderboardEntry[]> {
  const rows = await memoryGameRepo.fetchMemoryGameLeaderboardRpc(limit, gameId)
  if (!Array.isArray(rows)) return []
  return rows.map((row, index) => ({
    rank: toNumber(row.rank, index + 1),
    userId: String(row.user_id ?? ''),
    displayName: toSafeName(row.user_name),
    score: toNumber(row.score),
    highestLevel: toNumber(row.highest_level, 1),
    highestNumber: toNumber(row.highest_number, 0),
    stagesCompleted: toNumber(row.stages_completed),
    accuracy: toNumber(row.accuracy),
    completedAt: String(row.completed_at ?? ''),
  }))
}

/** The signed-in user's personal best, or null when they have not played yet. */
export async function fetchMemoryGamePersonalBest(
  gameId: MemoryGameId = MEMORY_GAME_ID,
): Promise<MemoryPersonalBest | null> {
  const row = await memoryGameRepo.fetchMemoryGamePersonalBestRpc(gameId)
  if (!row || typeof row !== 'object' || row.score === undefined || row.score === null) {
    return null
  }
  return {
    score: toNumber(row.score),
    highestLevel: toNumber(row.highest_level, 1),
    highestNumber: toNumber(row.highest_number, 0),
    stagesCompleted: toNumber(row.stages_completed),
    accuracy: toNumber(row.accuracy),
    completedAt: String(row.completed_at ?? ''),
  }
}

/**
 * Subscribe to new scores. Each INSERT delivers its payload so callers can
 * filter (e.g. today's UTC window) before re-reading the ranked leaderboard.
 * `onStatus` reports channel health. Returns an unsubscribe function.
 */
export function subscribeToMemoryGameLeaderboard(
  onChange: (payload: memoryGameRepo.MemoryScoreInsertPayload | null) => void,
  onStatus?: (available: boolean) => void,
  gameId: MemoryGameId = MEMORY_GAME_ID,
): () => void {
  return memoryGameRepo.subscribeToMemoryGameScores(onChange, onStatus, gameId)
}
