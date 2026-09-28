import { supabase } from '../supabase'
import type {
  MemoryGameId,
  MemoryLeaderboardRow,
  MemoryPersonalBestRow,
  SubmitMemoryGameInput,
} from '../../types/memoryGame.types'

/** Read ceiling shared with the service/UI (skeleton row count derives from it). */
export const MEMORY_LEADERBOARD_TOP_LIMIT = 50

interface SessionRpcResult {
  session_id?: string
}

interface SubmitRpcResult {
  accepted?: boolean
  duplicate?: boolean
  score?: number
}

/** Create or resume the caller's authoritative game session. */
export async function startMemoryGameSessionRpc(gameId: MemoryGameId): Promise<string> {
  const { data, error } = await supabase.rpc('start_memory_game_session', {
    p_game_id: gameId,
  })
  if (error) throw error
  const payload = data as SessionRpcResult | null
  if (!payload?.session_id) throw new Error('Session could not be created.')
  return payload.session_id
}

/** Submit the final run metrics through the server-validated RPC. */
export async function submitMemoryGameScoreRpc(
  input: SubmitMemoryGameInput,
): Promise<SubmitRpcResult> {
  const { sessionId, gameId, metrics } = input
  const { data, error } = await supabase.rpc('submit_memory_game_score', {
    p_session_id: sessionId,
    p_game_id: gameId,
    p_score: metrics.score,
    p_highest_level: metrics.highestLevel,
    p_highest_number: metrics.highestNumber,
    p_stages_completed: metrics.stagesCompleted,
    p_stages_failed: metrics.stagesFailed,
    p_mistakes: metrics.mistakes,
    p_accuracy: metrics.accuracy,
    p_average_reaction_time: metrics.averageReactionTimeMs,
  })
  if (error) throw error
  const payload = data as SubmitRpcResult | null
  return {
    accepted: payload?.accepted ?? false,
    duplicate: payload?.duplicate ?? false,
    score: payload?.score ?? metrics.score,
  }
}

/** Globally ranked best-run-per-user leaderboard (safe fields only). */
export async function fetchMemoryGameLeaderboardRpc(
  limit = MEMORY_LEADERBOARD_TOP_LIMIT,
  gameId: MemoryGameId = 'number_memory_rush',
): Promise<MemoryLeaderboardRow[]> {
  const { data, error } = await supabase.rpc('get_memory_game_leaderboard', {
    p_game_id: gameId,
    p_limit: limit,
  })
  if (error) throw error
  return (data as MemoryLeaderboardRow[] | null) ?? []
}

/** Caller's personal best (resolved from auth.uid() server-side). */
export async function fetchMemoryGamePersonalBestRpc(
  gameId: MemoryGameId,
): Promise<MemoryPersonalBestRow | null> {
  const { data, error } = await supabase.rpc('get_memory_game_personal_best', {
    p_game_id: gameId,
  })
  if (error) throw error
  return (data as MemoryPersonalBestRow | null) ?? null
}

/**
 * The leaderboard-relevant fields of an INSERT payload. The channel fires for
 * every score insert; consumers decide whether the new row belongs to the
 * leaderboard scope they display (e.g. today's UTC window).
 */
export interface MemoryScoreInsertPayload {
  id: string
  user_id?: string
  game_id?: string
  score?: number
  completed_at?: string
}

/**
 * Subscribe to score inserts. Returns an unsubscribe function; the caller owns
 * the subscription lifecycle and must invoke it on unmount so no channel leaks.
 * Each INSERT delivers its payload so the caller can filter before re-reading
 * the ranked leaderboard through the RPC. `onStatus` reports whether the
 * channel is healthy so the UI can degrade gracefully.
 */
export function subscribeToMemoryGameScores(
  onChange: (payload: MemoryScoreInsertPayload | null) => void,
  onStatus?: (available: boolean) => void,
  gameId: MemoryGameId = 'number_memory_rush',
): () => void {
  const channel = supabase
    .channel(`memory_game_scores_${gameId}_${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'memory_game_scores',
        filter: `game_id=eq.${gameId}`,
      },
      (change) => {
        const payload = change.new as MemoryScoreInsertPayload | null
        onChange(payload && typeof payload === 'object' ? payload : null)
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') onStatus?.(true)
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        onStatus?.(false)
      }
    })

  return () => {
    void supabase.removeChannel(channel)
  }
}
