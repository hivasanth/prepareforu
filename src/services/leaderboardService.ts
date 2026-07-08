import * as attemptRepo from '../lib/repositories/attempt.repository';
import * as examRepo from '../lib/repositories/exam.repository';
import * as leaderboardRepo from '../lib/repositories/leaderboard.repository';
import { getAllowedExamIds } from '../utils/examUtils';
import { queryCache } from '../utils/queryCache';

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  score: number;
  accuracy: number;
  rank: number;
  duration_seconds?: number;
  submitted_at?: string;
}

export interface LeaderboardMetadata {
  exams: { id: string; name: string }[];
  papers: { id: string; exam_id: string; name: string }[];
}

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
  timeRange: 'all' | '30d' | '7d' | 'today'
): Promise<LeaderboardEntry[]> {
  const cacheKey = `lb_ranks_${examId}_${paperId}_${timeRange}`;
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    if (examId === 'all') return [];
    // CASE 1: ALL TIME -> Always use leaderboard table for performance and accuracy
    if (timeRange === 'all') {
      const data = await leaderboardRepo.fetchLeaderboardByPaper(examId, paperId);
      
      if (data && data.length > 0) {
        return data.map((item: any) => ({
          user_id: item.user_id,
          full_name: (item.users as any)?.full_name || 'Anonymous Student',
          score: item.best_score,
          accuracy: item.best_accuracy,
          rank: item.rank,
          duration_seconds: item.best_time_secs,
          submitted_at: item.best_submitted_at
        }));
      }

      // Fallback: If leaderboard table is empty, query attempts table without a date threshold
      // This handles cases where aggregation hasn't run yet.
    }

    // CASE 2: TIME FILTER (or Fallback for 'all') -> Query attempts table
    const days = timeRange === '7d' ? 7 : (timeRange === '30d' ? 30 : 0);
    let threshold: string | null = null;
    
    if (timeRange !== 'all') {
      const date = new Date();
      if (timeRange === 'today') {
        date.setHours(0, 0, 0, 0);
      } else {
        date.setDate(date.getDate() - days);
      }
      threshold = date.toISOString();
    }

    const attempts = await attemptRepo.fetchCompletedAttemptsByPaper(
      examId, paperId, threshold, 2000
    );

    // Process best attempts per user manually (No mixing fields!)
    const userBestMap = new Map<string, any>();
    
    (attempts || []).forEach((att: any) => {
      const existing = userBestMap.get(att.user_id);
      const score = Number(att.score);
      const accuracy = Number(att.accuracy);
      const duration = att.duration_seconds || 0;
      
      // Tie-breaker logic: 1. Score DESC, 2. Accuracy DESC, 3. Duration ASC, 4. Time ASC
      const isBetter = !existing || 
          score > existing.score || 
          (score === existing.score && accuracy > existing.accuracy) ||
          (score === existing.score && accuracy === existing.accuracy && duration < existing.duration) ||
          (score === existing.score && accuracy === existing.accuracy && duration === existing.duration && att.submitted_at < existing.submitted_at);

      if (isBetter) {
        userBestMap.set(att.user_id, {
          user_id: att.user_id,
          full_name: (att.users as any)?.full_name || 'Anonymous Student',
          score,
          accuracy,
          duration,
          submitted_at: att.submitted_at
        });
      }
    });

    // Sort and assign ranks
    return Array.from(userBestMap.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        if (a.duration !== b.duration) return a.duration - b.duration;
        const timeA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
        const timeB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
        return timeA - timeB;
      })
      .slice(0, 50)
      .map((item, index) => ({
        user_id: item.user_id,
        full_name: item.full_name,
        score: item.score,
        accuracy: item.accuracy,
        rank: index + 1,
        duration_seconds: item.duration,
        submitted_at: item.submitted_at
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
  timeRange: 'all' | '30d' | '7d' | 'today'
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
