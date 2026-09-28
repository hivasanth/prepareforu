import * as examRepo from '../lib/repositories/exam.repository';
import * as leaderboardRepo from '../lib/repositories/leaderboard.repository';
import { getAllowedExamIds } from '../utils/examUtils';
import { queryCache } from '../utils/queryCache';
import type { AdminLeaderboardEntry, LeaderboardEntry, LeaderboardMetadata } from '../types/leaderboard.types';

/** Single authoritative ceiling for the leaderboard RPC — used by the fetch and
 *  referenced by the UI skeleton (LEADERBOARD_SKELETON_COUNT) so the two never
 *  drift apart. */
export const LEADERBOARD_TOP_LIMIT = leaderboardRepo.LEADERBOARD_TOP_LIMIT;

/**
 * Fetches exams and papers for leaderboard filtering.
 */
export async function fetchLeaderboardMetadata(examSelection: string): Promise<LeaderboardMetadata> {
  const cacheKey = `lb_metadata_${examSelection}`;
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    if (!examSelection || examSelection === 'all') return { exams: [], papers: [] };
    const targetSelections = getAllowedExamIds(examSelection);

    const [examsData, papersData] = await Promise.all([
      examRepo.fetchExamConfigNames(targetSelections),
      examRepo.fetchPaperIdsAndNames(targetSelections),
    ]);

    return {
      exams: (examsData || []).map((e: any) => ({ id: e.exam_id, name: e.name })),
      papers: (papersData || []).map((p: any) => ({ id: p.id, exam_id: p.exam_id, name: p.paper_name }))
    };
  }, 600000); // 10 min TTL
}

/**
 * Fetches top 50 ranks for a specific paper and time range.
 */
export async function fetchTopRanks(
  examId: string,
  paperId: string,
  timeRange: '30d' | '7d' | 'today'
): Promise<LeaderboardEntry[]> {
  const cacheKey = `lb_ranks_${examId}_${paperId}_${timeRange}`;

  return queryCache.fetchWithDedup(cacheKey, async () => {
    if (examId === 'all') return [];
    const mappedRange = timeRange === '30d' ? 'month' : (timeRange === '7d' ? 'week' : timeRange);

    // Server-side global ranking (secure RPC). No cross-user attempts are returned to the client.
    const rows = await leaderboardRepo.fetchLeaderboardTopRpc(
      examId,
      paperId === 'all' ? null : paperId,
      mappedRange,
      LEADERBOARD_TOP_LIMIT
    );

    if (!rows || !Array.isArray(rows)) return [];

    return (rows as Array<Record<string, unknown>>).map((r) => ({
      user_id: r.user_id as string,
      full_name: (r.user_name as string) || 'Anonymous Student',
      score: Number(r.score),
      accuracy: Number(r.accuracy),
      rank: Number(r.rank),
      duration_seconds: (r.duration_seconds as number) ?? 0,
      submitted_at: r.submitted_at as string,
    }));
  }, 120000); // 2 min TTL for rankings (shorter than global stats)
}

/**
 * Fetches the specific rank for the current user using the hardened RPC.
 */
export async function fetchUserRank(
  userId: string,
  examId: string, 
  paperId: string, 
  timeRange: '30d' | '7d' | 'today'
): Promise<LeaderboardEntry | null> {
  const cacheKey = `lb_user_rank_${userId}_${examId}_${paperId}_${timeRange}`;
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    if (examId === 'all') return null;
    const mappedRange = timeRange === '30d' ? 'month' : (timeRange === '7d' ? 'week' : timeRange);
    
    const data = await leaderboardRepo.fetchUserRankRpc(
      examId,
      paperId === 'all' ? null : paperId,
      mappedRange
    );

    if (!data || (data as any).rank === null) return null;

    return {
      user_id: userId,
      full_name: 'You',
      score: (data as any).score,
      accuracy: (data as any).accuracy,
      rank: (data as any).rank,
      duration_seconds: (data as any).duration,
      submitted_at: (data as any).submitted_at
    };
  }, 120000); // 2 min TTL
}

/**
 * Manually invalidates the leaderboard cache.
 */
export function getCachedLeaderboardMetadata(examSelection: string): any {
  return queryCache.get(`lb_metadata_${examSelection}`) || { exams: [], papers: [] };
}

export function clearLeaderboardCache() {
  queryCache.invalidateByPrefix('lb_');
}

// ─── Admin Leaderboard ───────────────────────────────────────────────────────

/** Single normalization point for participant display names (U-5): the UI can
 *  assume a safe non-empty string and never guards `user_name` itself. */
function normalizeParticipantName(name: unknown): string {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  return trimmed || 'Unknown';
}

/**
 * Fetches one page of the admin leaderboard through the admin-guarded
 * `get_admin_leaderboard` RPC. The database is the single authority for rank
 * (global ROW_NUMBER over the same deterministic order used for pagination,
 * with submitted_at/user_id tiebreakers) — the client never recomputes ranks.
 * MV refresh is NOT triggered here: it runs server-side via pg_cron
 * ('refresh-materialized-views', every 10 minutes).
 */
export async function fetchAdminLeaderboard(
  selectedExam: string,
  selectedPaper: string,
  page: number,
  pageSize: number
): Promise<{ entries: AdminLeaderboardEntry[]; count: number }> {
  // 'all' → no exam filter; a category such as 'APPSC_GROUPS' → its member exams;
  // otherwise the specific exam id. Resolved through the one shared mapper rather
  // than a second local copy of the APPSC list, which is how the four group ids
  // came to be duplicated in the first place. Both paper-scoped and
  // exam-aggregate reads share it.
  const examIds = getAllowedExamIds(selectedExam);

  const { entries, count } = await leaderboardRepo.fetchAdminLeaderboardPage({
    examIds,
    paperId: selectedPaper === 'all' ? null : selectedPaper,
    limit: pageSize,
    offset: page * pageSize,
  });

  return {
    entries: entries.map((row) => ({
      user_id: String(row.user_id),
      user_name: normalizeParticipantName(row.user_name),
      exam_id: String(row.exam_id ?? ''),
      exam_selection: String(row.exam_selection ?? row.exam_id ?? ''),
      paper_id: (row.paper_id as string | null) ?? null,
      best_score: Number(row.best_score ?? 0),
      best_accuracy: Number(row.best_accuracy ?? 0),
      best_time_secs: Number(row.best_time_secs ?? 0),
      last_attempt_date: String(row.last_attempt_date ?? ''),
      total_attempts: Number(row.total_attempts ?? 0),
      rank: Number(row.rank ?? 0),
    })),
    count,
  };
}
