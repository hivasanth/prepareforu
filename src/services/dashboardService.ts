import { supabase } from '../lib/supabase';
import { fetchPerformanceAttempts } from './performanceService';
import { getAllowedExamIds } from '../utils/examUtils';
import { queryCache } from '../utils/queryCache';
import type { ServiceResult } from '../types/auth.types';
import type { AttemptWithRelations } from '../types/exam.types';

export interface DashboardStats {
  daily_streak: number;
  exams_taken: number;
  accuracy: number;
  global_rank: string;
}

export const dashboardService = {
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
        const { data, error } = await supabase.rpc('get_user_dashboard_stats', { p_user_id: userId });
        if (error) throw error;
        return data;
      }, 300000, force);
      
      return { 
        success: true, 
        data: statsData || { daily_streak: 0, exams_taken: 0, accuracy: 0, global_rank: 'N/A' } 
      };
    } catch (err: any) {
      console.error('[dashboardService] fetchDashboardStats error:', err.message);
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
      console.error('[dashboardService] fetchRecentAttempts error:', err.message);
      return { success: false, error: { source: 'db', code: 'UNKNOWN', message: err.message || 'Failed to fetch recent attempts' } };
    }
  }
};
