import { supabase } from '../lib/supabase';
import { safeSupabaseCall } from '../utils/safeSupabase';
import { getAllowedExamIds } from '../utils/examUtils';
import { queryCache } from '../utils/queryCache';

export const PERF_ATTEMPTS_PREFIX = 'perf_attempts_';
export const PERF_METADATA_PREFIX = 'perf_metadata_';

export interface PerformanceAttempt {
  id: string;
  paper_id: string;
  exam_id: string;
  score: number;
  accuracy: number;
  submitted_at: string;
}

export interface AttemptAnswerSummary {
  attempt_id: string;
  subject_name: string;
  is_correct: boolean;
}

export interface PerformanceMetadata {
  exams: { id: string; name: string; selection: string }[];
  papers: { id: string; exam_id: string; name: string }[];
  subjects: { paper_id: string; name: string }[];
}

/**
 * Fetches all completed exam attempts for the current user.
 */
export async function fetchPerformanceAttempts(userId: string, force = false): Promise<any[]> {
  const cacheKey = `perf_attempts_${userId}`;
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    // ... existing logic ...
    const { data: attempts, error: attemptsError } = await safeSupabaseCall(
      supabase
        .from('attempts')
        .select(`
          id, 
          paper_id, 
          exam_id, 
          score, 
          accuracy, 
          correct_count,
          wrong_count,
          skipped_count,
          submitted_at,
          exam_papers ( paper_name )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .eq('source', 'exam_tab')
        .order('submitted_at', { ascending: true })
        .limit(500)
    );

    if (attemptsError) {
      throw new Error('Unable to retrieve your exam history. Please verify your connection and try again.');
    }
    if (!attempts || attempts.length === 0) return [];

    const uniqueExamIds = Array.from(new Set((attempts as any[]).map((a: any) => a.exam_id)));
    const { data: configs } = await safeSupabaseCall(
      supabase
        .from('exam_configs')
        .select('exam_id, name')
        .in('exam_id', uniqueExamIds)
    );

    const configMap = new Map((configs as any[])?.map((c: any) => [c.exam_id, c.name]) || []);

    return (attempts as any[]).map((attempt: any) => ({
      ...attempt,
      exam_configs: { name: configMap.get(attempt.exam_id) || attempt.exam_id }
    }));
  }, 300000, force); // 5 min TTL
}

/**
 * Fetches answers for a set of attempts to enable subject-wise analysis.
 * Uses a limited selection of fields to optimize data transfer.
 */
export async function fetchPerformanceAnswers(attemptIds: string[]): Promise<any[]> {
  if (attemptIds.length === 0) return [];

  const cacheKey = `perf_answers_${JSON.stringify(attemptIds.sort())}`;
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const { data, error } = await safeSupabaseCall(
      supabase
        .from('attempt_answers')
        .select(`
          attempt_id, 
          is_correct,
          questions ( subject_name )
        `)
        .in('attempt_id', attemptIds)
        .limit(5000)
    );

    if (error) throw error;
    
    // Flatten the response
    return (data as any[] || []).map((item: any) => ({
      attempt_id: item.attempt_id,
      is_correct: item.is_correct,
      subject_name: (item.questions as any)?.subject_name || 'General'
    }));
  }, 300000); // 5 min TTL
}

/**
 * Fetches all available exams and papers based on the user's exam selection.
 * This allows filters to show all possible options even if not yet attempted.
 */
export async function fetchPerformanceMetadata(examSelection: string): Promise<PerformanceMetadata> {
  const cacheKey = `perf_metadata_${examSelection}`;
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const targetSelections = getAllowedExamIds(examSelection);

    // 1. Fetch relevant exams
    const { data: exams, error: examsError } = await safeSupabaseCall(
      supabase
        .from('exam_configs')
        .select('exam_id, name, exam_selection')
        .in('exam_id', targetSelections)
        .limit(200)
    );
    if (examsError) throw examsError;

    // 2. Fetch relevant papers
    const { data: papers, error: papersError } = await safeSupabaseCall(
      supabase
        .from('exam_papers')
        .select('id, exam_id, paper_name')
        .in('exam_id', targetSelections)
        .limit(200)
    );
    if (papersError) throw papersError;

    // 3. Fetch relevant subjects
    const { data: subjects, error: subjectsError } = await safeSupabaseCall(
      supabase
        .from('exam_subjects')
        .select('paper_id, subject_name')
        .in('exam_id', targetSelections)
        .limit(500)
    );
    if (subjectsError) throw subjectsError;

    return {
      exams: (exams as any[] || [])
        .filter((e: any) => e.exam_id && e.name)
        .map((e: any) => ({ id: e.exam_id, name: e.name, selection: e.exam_selection })),
      papers: (papers as any[] || [])
        .filter((p: any) => p.id && p.paper_name)
        .map((p: any) => ({ id: p.id, exam_id: p.exam_id, name: p.paper_name })),
      subjects: (subjects as any[] || [])
        .filter((s: any) => s.paper_id && s.subject_name)
        .map((s: any) => ({ paper_id: s.paper_id, name: s.subject_name }))
    };
  }, 600000); // 10 min TTL for metadata
}

/**
 * Manually invalidates the performance cache for a user.
 * Call this after a new attempt is submitted to ensure data freshness.
 */
export function getCachedAttempts(userId: string): any[] {
  return queryCache.get(`${PERF_ATTEMPTS_PREFIX}${userId}`) || [];
}

export function getCachedMetadata(examSelection: string): any {
  return queryCache.get(`${PERF_METADATA_PREFIX}${examSelection}`) || { exams: [], papers: [], subjects: [] };
}

export function clearPerformanceCache(userId: string) {
  queryCache.invalidate(`perf_attempts_${userId}`);
  queryCache.invalidateByPrefix(`dash_stats_${userId}`);
}
