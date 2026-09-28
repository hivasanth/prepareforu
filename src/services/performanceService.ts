import * as attemptRepo from '../lib/repositories/attempt.repository';
import * as examRepo from '../lib/repositories/exam.repository';
import { getAllowedExamIds } from '../utils/examUtils';
import { queryCache } from '../utils/queryCache';
import { dashRecentKey, perfAttemptsKey, perfMetadataKey, perfSubjectStatsKey, DASH_STATS_PREFIX, DASH_RECENT_PREFIX, PERF_SUBJECT_STATS_PREFIX } from '../utils/cacheKeys';
import type { PerformanceAttemptSummary } from '../types/exam.types';

export interface PerformanceMetadata {
  exams: { id: string; name: string; selection: string }[];
  papers: { id: string; exam_id: string; name: string }[];
  subjects: { paper_id: string; name: string }[];
}

export interface SubjectStat {
  subject: string;
  accuracy: number;
  correct: number;
  total: number;
  status: 'Strong' | 'Average' | 'Weak';
  color: string;
}

/**
 * Resolves exam config names for a set of rows and enriches them with
 * `exam_configs.name`. Shared by the full-list and recent dashboard queries.
 */
function enrichWithConfigNames<T extends { exam_id: string }>(
  rows: T[],
  configMap: Map<string, string>
): (T & { exam_configs: { name: string } })[] {
  return rows.map((row) => ({
    ...row,
    exam_configs: { name: configMap.get(row.exam_id) || row.exam_id }
  }));
}

/**
 * Fetches all completed exam attempts for the current user.
 */
export async function fetchPerformanceAttempts(userId: string, force = false): Promise<PerformanceAttemptSummary[]> {
  const cacheKey = perfAttemptsKey(userId);
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const attempts = await attemptRepo.fetchPerformanceAttempts(userId);

    if (!attempts || attempts.length === 0) return [];

    const uniqueExamIds = Array.from(new Set(attempts.map(a => a.exam_id)));
    const configs = await examRepo.fetchExamConfigNames(uniqueExamIds);

    const configMap = new Map((configs ?? []).map(c => [c.exam_id, c.name]));

    return enrichWithConfigNames(attempts, configMap);
  }, 300000, force); // 5 min TTL
}

/**
 * Fetches only the most recent completed attempts (server-side limit 5).
 * Phase 6.XB (USR-PERF-01) — dedicated cache key so the full 500-row
 * performance list (`perf_attempts_*`) is untouched for the Performance/History
 * pages. Ordering (submitted_at desc) + limit are applied in SQL.
 */
export async function fetchDashboardRecentAttempts(
  userId: string,
  examSelection?: string | null,
  force = false
): Promise<PerformanceAttemptSummary[]> {
  const cacheKey = dashRecentKey(userId, examSelection);

  return queryCache.fetchWithDedup(cacheKey, async () => {
    const allowedIds = getAllowedExamIds(examSelection);
    const attempts = await attemptRepo.fetchRecentAttempts(userId, allowedIds, 5);

    if (!attempts || attempts.length === 0) return [];

    const uniqueExamIds = Array.from(new Set(attempts.map(a => a.exam_id)));
    const configs = await examRepo.fetchExamConfigNames(uniqueExamIds);

    const configMap = new Map((configs ?? []).map(c => [c.exam_id, c.name]));

    return enrichWithConfigNames(attempts, configMap);
  }, 300000, force); // 5 min TTL
}

export interface SubjectStatFilter {
  examId?: string | null;
  paperId?: string | null;
  from?: string | null;
}

/**
 * Fetches server-side subject-accuracy aggregation for the current user's
 * completed exam attempts. Aggregation runs in the database
 * (`get_user_performance_answer_stats`) so heavy users are never truncated by
 * a client-side row cap. The result set is small (one row per subject) and is
 * cached for 5 minutes.
 */
export async function fetchPerformanceSubjectStats(
  userId: string,
  filter: SubjectStatFilter,
  force = false
): Promise<SubjectStat[]> {
  const cacheKey = perfSubjectStatsKey(userId, filter);

  return queryCache.fetchWithDedup(cacheKey, async () => {
    const rows = await attemptRepo.fetchUserAnswerSubjectStats(filter);
    if (!rows) return [];

    return rows
      .map((row) => {
        const accuracy = Math.round(Number(row.accuracy));
        return {
          subject: row.subject_name,
          accuracy,
          correct: Number(row.correct),
          total: Number(row.total),
          status: (accuracy >= 70 ? 'Strong' : accuracy <= 50 ? 'Weak' : 'Average') as SubjectStat['status'],
          color: accuracy >= 70 ? '#22C55E' : accuracy <= 50 ? '#EF4444' : '#F59E0B'
        };
      })
      .sort((a, b) => b.accuracy - a.accuracy);
  }, 300000, force); // 5 min TTL
}

/**
 * Fetches all available exams and papers based on the user's exam selection.
 * This allows filters to show all possible options even if not yet attempted.
 * @param includeSubjects - whether to fetch subject metadata (default true for back-compat)
 */
export async function fetchPerformanceMetadata(examSelection: string, includeSubjects = true): Promise<PerformanceMetadata> {
  const cacheKey = perfMetadataKey(examSelection);
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const targetSelections = getAllowedExamIds(examSelection);

    const [exams, papers, subjects] = await Promise.all([
      examRepo.fetchExamConfigNamesWithSelection(targetSelections),
      examRepo.fetchPaperIdsAndNames(targetSelections),
      includeSubjects ? examRepo.fetchSubjectMetadata(targetSelections) : Promise.resolve(null),
    ]);

    return {
      exams: (exams ?? [])
        .filter((e) => e.exam_id && e.name)
        .map((e) => ({ id: e.exam_id, name: e.name, selection: e.exam_selection })),
      papers: (papers ?? [])
        .filter((p) => p.id && p.paper_name)
        .map((p) => ({ id: p.id, exam_id: p.exam_id, name: p.paper_name })),
      subjects: (subjects ?? [])
        .filter((s) => s.paper_id && s.subject_name)
        .map((s) => ({ paper_id: s.paper_id, name: s.subject_name }))
    };
  }, 600000); // 10 min TTL for metadata
}

/**
 * Manually invalidates the performance cache for a user.
 * Call this after a new attempt is submitted to ensure data freshness.
 */
export function getCachedAttempts(userId: string): PerformanceAttemptSummary[] {
  return queryCache.get(perfAttemptsKey(userId)) || [];
}

export function getCachedMetadata(examSelection: string): PerformanceMetadata {
  return queryCache.get(perfMetadataKey(examSelection)) || { exams: [], papers: [], subjects: [] };
}

export function clearPerformanceCache(userId: string) {
  queryCache.invalidate(perfAttemptsKey(userId));
  queryCache.invalidateByPrefix(`${DASH_RECENT_PREFIX}${userId}`);
  queryCache.invalidateByPrefix(`${DASH_STATS_PREFIX}${userId}`);
  queryCache.invalidateByPrefix(`${PERF_SUBJECT_STATS_PREFIX}${userId}`);
}
