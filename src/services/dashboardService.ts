import * as attemptRepo from '../lib/repositories/attempt.repository';
import * as dashboardRepo from '../lib/repositories/dashboard.repository';
import { countQuery } from '../lib/repositories/base.repository';
import { fetchDashboardRecentAttempts } from './performanceService';
import { getAllowedExamIds } from '../utils/examUtils';
import { queryCache } from '../utils/queryCache';
import { dashStatsKey, dashRecentKey } from '../utils/cacheKeys';
import { format, parseISO } from 'date-fns';
import type { ServiceResult, ServiceErrorSource, AuthError } from '../types/auth.types';
import type { PerformanceAttemptSummary } from '../types/exam.types';
import type { ErrorCategory } from '../types/error.types';
import { logError } from '../utils/logger'
import { classifyError } from '../utils/errorClassification'

export interface DashboardStats {
  daily_streak: number;
  highest_streak: number;
  exams_taken: number;
  accuracy: number;
  global_rank: string;
}

export const dashboardService = {
  fetchDailyAttempts: async (selectedRange: { start: Date; end: Date }, resolvedIds: string[]): Promise<Record<string, number>> => {
    const data = await attemptRepo.fetchDailyAttempts(
      { start: selectedRange.start.toISOString(), end: selectedRange.end.toISOString() },
      resolvedIds
    )
    return (data ?? []).reduce<Record<string, number>>((acc, a) => {
      const date = format(parseISO((a as Record<string, unknown>).started_at as string), 'yyyy-MM-dd')
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})
  },

  fetchOverviewCounts: async (selectedExam: string, resolvedIds: string[]) => {
    // Fail-fast: a failed required count must surface as an error, never as a
    // successful zero (ERROR ≠ valid empty). Legitimate 0 rows still resolve.
    const [users, questions, configs, attempts] = await Promise.all([
      countQuery('users', { is_active: true, role: 'user', ...(selectedExam !== 'all' ? { exam_selection: selectedExam } : {}) }),
      countQuery('questions', { is_active: true, ...(resolvedIds.length ? { exam_id: resolvedIds } : {}) }),
      countQuery('exam_configs', { is_published: true, ...(selectedExam !== 'all' ? { exam_selection: selectedExam } : {}) }),
      countQuery('attempts', { source: 'exam_tab', ...(resolvedIds.length ? { exam_id: resolvedIds } : {}) }),
    ])
    return {
      users,
      questions,
      configs,
      attempts,
    }
  },

  // Step 4: Encapsulate cache keys and retrieval
  getCachedStats: (userId: string): DashboardStats | null => {
    return queryCache.get(dashStatsKey(userId));
  },
  
  getCachedRecentAttempts: (userId: string, examSelection?: string | null) => {
    const cached = queryCache.get(dashRecentKey(userId, examSelection));
    if (cached && Array.isArray(cached)) {
      const allowedIds = getAllowedExamIds(examSelection);
      return cached
        .filter(a => allowedIds.includes(a.exam_id))
        .slice(0, 5);
    }
    return null;
  },

  // Step 1 & 7: Extract API calls into service and wrap in { success, data, error } adapter
  fetchDashboardStats: async (userId: string, force = false): Promise<ServiceResult<DashboardStats>> => {
    try {
      const statsKey = dashStatsKey(userId);
      const statsData = await queryCache.fetchWithDedup(statsKey, async () => {
        const data = await dashboardRepo.fetchDashboardStatsRpc(userId);
        if (data === null) {
          // RPC returns NULL when auth.uid() is missing or does not match
          // p_user_id (identity guard in get_user_dashboard_stats). Surface as
          // an auth/session failure — never as zeroed stats (DASH-4).
          throw new Error('Your session has expired. Please sign in again.');
        }
        return data;
      }, 300000, force);

      return { success: true, data: statsData };
    } catch (err) {
      return buildServiceError('dashboardService.fetchDashboardStats.error', err);
    }
  },

  // Step 2: Recent attempts (server-side desc + limit 5, USR-PERF-01)
  fetchRecentAttempts: async (userId: string, examSelection?: string | null, force = false): Promise<ServiceResult<PerformanceAttemptSummary[]>> => {
    try {
      const attempts = await fetchDashboardRecentAttempts(userId, examSelection, force);

      return { success: true, data: attempts || [] };
    } catch (err) {
      return buildServiceError('dashboardService.fetchRecentAttempts.error', err);
    }
  }
};

function buildServiceError(event: string, err: unknown): { success: false; error: AuthError } {
  const rawMessage = err instanceof Error ? err.message : 'Unknown error';
  logError(event, { message: rawMessage });
  const classified = classifyError(err);
  return { success: false, error: { source: errorSourceFromCategory(classified.category), code: classified.code, message: classified.message } };
}

function errorSourceFromCategory(category: ErrorCategory): ServiceErrorSource {
  if (category === 'authentication' || category === 'authorization') return 'auth';
  if (category === 'network' || category === 'offline' || category === 'timeout') return 'network';
  if (category === 'unknown') return 'unknown';
  return 'db';
}
