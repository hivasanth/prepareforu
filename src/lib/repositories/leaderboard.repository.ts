import { supabase } from '../supabase'

/** Authoritative cap for the user leaderboard RPC. The UI skeleton derives its
 *  visible row count from this ceiling so the cold→content swap is intentional
 *  (see LEADERBOARD_SKELETON_COUNT in the leaderboard skeleton). */
export const LEADERBOARD_TOP_LIMIT = 50

export async function fetchUserRankRpc(
  examId: string,
  paperId: string | null,
  timeRange: string
): Promise<{
  rank: number
  score: number
  accuracy: number
  duration: number
  submitted_at: string
} | null> {
  const { data, error } = await supabase.rpc('get_user_leaderboard_rank', {
    p_exam_id: examId,
    p_paper_id: paperId,
    p_time_range: timeRange,
  })
  if (error) throw error
  return data as {
    rank: number
    score: number
    accuracy: number
    duration: number
    submitted_at: string
  } | null
}

export async function fetchLeaderboardTopRpc(
  examId: string,
  paperId: string | null,
  timeRange: string,
  limit = LEADERBOARD_TOP_LIMIT
): Promise<Array<Record<string, unknown>> | Record<string, unknown> | null> {
  const { data, error } = await supabase.rpc('get_leaderboard_top', {
    p_exam_id: examId,
    p_paper_id: paperId,
    p_time_range: timeRange,
    p_limit: limit,
  })
  if (error) throw error
  return data as Array<Record<string, unknown>> | Record<string, unknown> | null
}

export interface AdminLeaderboardPageParams {
  /** Exam ids to include. Empty array → no exam filter (all exams). */
  examIds: string[]
  /** Paper id for paper-scoped reads; null → exam-aggregate (MV) reads. */
  paperId: string | null
  limit: number
  offset: number
}

export interface AdminLeaderboardRow extends Record<string, unknown> {
  rank: number
}

/** ONE authoritative admin read path: the admin-guarded `get_admin_leaderboard`
 *  SECURITY DEFINER RPC. The database computes the GLOBAL rank with the same
 *  deterministic ordering used for pagination (score DESC, accuracy DESC,
 *  time ASC, submitted_at ASC, user_id ASC), so ranks are correct and stable
 *  across pages — the client never recomputes them. */
export async function fetchAdminLeaderboardPage(
  params: AdminLeaderboardPageParams
): Promise<{ entries: AdminLeaderboardRow[]; count: number }> {
  const { data, error } = await supabase.rpc('get_admin_leaderboard', {
    p_exam_ids: params.examIds.length > 0 ? params.examIds : null,
    p_paper_id: params.paperId,
    p_limit: params.limit,
    p_offset: params.offset,
  })
  if (error) throw error
  const payload = data as { entries: AdminLeaderboardRow[] | null; count: number | null } | null
  return { entries: payload?.entries ?? [], count: payload?.count ?? 0 }
}
