import * as attemptRepo from '../lib/repositories/attempt.repository';
import * as dashboardRepo from '../lib/repositories/dashboard.repository';
import { countQuery } from '../lib/repositories/base.repository';
import { fetchPerformanceAttempts } from './performanceService';
import { getAllowedExamIds } from '../utils/examUtils';
import { queryCache } from '../utils/queryCache';
import { format, parseISO } from 'date-fns';
import type { ServiceResult } from '../types/auth.types';
import type { AttemptWithRelations } from '../types/exam.types';
import { logError } from '../utils/logger'

export interface DashboardStats {
  daily_streak: number;
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
    const [users, questions, configs, attempts] = await Promise.allSettled([
      countQuery('users', { is_active: true, role: 'user', ...(selectedExam !== 'all' ? { exam_selection: selectedExam } : {}) }),
      countQuery('questions', { is_active: true, ...(resolvedIds.length ? { exam_id: resolvedIds } : {}) }),
      countQuery('exam_configs', { is_published: true, ...(selectedExam !== 'all' ? { exam_selection: selectedExam } : {}) }),
      countQuery('attempts', { source: 'exam_tab', ...(resolvedIds.length ? { exam_id: resolvedIds } : {}) }),
    ])
    return {
      users: users.status === 'fulfilled' ? users.value : 0,
      questions: questions.status === 'fulfilled' ? questions.value : 0,
      configs: configs.status === 'fulfilled' ? configs.value : 0,
      attempts: attempts.status === 'fulfilled' ? attempts.value : 0,
    }
  },

  // Step 4: Encapsulate cache keys and retrieval
  getCachedStats: (userId: string): DashboardStats | null => {
    return queryCache.get(`dash_stats_${userId}`);
  },
  
  getCachedRecentAttempts: (userId: string, examSelection?: string | null) => {
    const cached = queryCache.get(`perf_attempts_${userId}`);
    if (cached && Array.isArray(cached)) {
      const allowedIds = getAllowedExamIds(examSelection);
      return cached
        .filter(a => allowedIds.includes(a.exam_id))
        .reverse()
        .slice(0, 5);
    }
    return null;
  },

  // Step 1 & 7: Extract API calls into service and wrap in { success, data, error } adapter
  fetchDashboardStats: async (userId: string, force = false): Promise<ServiceResult<DashboardStats>> => {
    try {
      const statsKey = `dash_stats_${userId}`;
      const statsData = await queryCache.fetchWithDedup(statsKey, async () => {
        return await dashboardRepo.fetchDashboardStatsRpc(userId);
      }, 300000, force);
      
      return { 
        success: true, 
        data: statsData || { daily_streak: 0, exams_taken: 0, accuracy: 0, global_rank: 'N/A' } 
      };
    } catch (err: any) {
      logError('dashboardService.fetchDashboardStats.error', { message: err.message });
      return { success: false, error: { source: 'db', code: 'UNKNOWN', message: err.message || 'Failed to fetch dashboard stats' } };
    }
  },

  // Step 2: Extract formatting logic (filter, reverse, slice)
  fetchRecentAttempts: async (userId: string, examSelection?: string | null, force = false): Promise<ServiceResult<AttemptWithRelations[]>> => {
    try {
      const attempts = await fetchPerformanceAttempts(userId, force);
      
      const allowedIds = getAllowedExamIds(examSelection);
      const formatted = (attempts || [])
        .filter(a => allowedIds.includes(a.exam_id))
        .reverse()
        .slice(0, 5);
        
      return { success: true, data: formatted };
    } catch (err: any) {
      logError('dashboardService.fetchRecentAttempts.error', { message: err.message });
      return { success: false, error: { source: 'db', code: 'UNKNOWN', message: err.message || 'Failed to fetch recent attempts' } };
    }
  }
};
