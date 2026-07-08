import { supabase } from '../lib/supabase';
import { safeSupabaseCall } from '../utils/safeSupabase';
import { getAllowedExamIds } from '../utils/examUtils';
import { queryCache } from '../utils/queryCache';

const DEFAULT_MIN_QUESTIONS = 30;

/**
 * Fetches the minimum required questions threshold from exam_configs.
 * This is the backend-driven canonical value used across Subject Tests,
 * Topic Exams, and full Exams.
 */
export async function getMinQuestions(examSelection: string, force = false): Promise<number> {
  const cacheKey = `min_questions_${examSelection}`;
  try {
    return await queryCache.fetchWithDedup(cacheKey, async () => {
      const allowedIds = getAllowedExamIds(examSelection);
      if (allowedIds.length === 0) return DEFAULT_MIN_QUESTIONS;

      const { data, error } = await safeSupabaseCall(
        supabase
          .from('exam_configs')
          .select('min_questions')
          .in('exam_id', allowedIds)
          .limit(50)
      );

      if (error) throw error;

      const records = (data as any[]) || [];
      if (records.length === 0) return DEFAULT_MIN_QUESTIONS;

      const values = records
        .map(r => r.min_questions)
        .filter((v): v is number => typeof v === 'number' && v > 0);

      return values.length > 0 ? Math.min(...values) : DEFAULT_MIN_QUESTIONS;
    }, 600000, force);
  } catch {
    return DEFAULT_MIN_QUESTIONS;
  }
}

/**
 * Validates whether a given count meets the minimum requirement.
 */
export async function validateQuestionCount(
  examSelection: string,
  count: number
): Promise<{ valid: boolean; min: number }> {
  const min = await getMinQuestions(examSelection);
  return { valid: count >= min, min };
}

/**
 * Returns the minimum questions for display purposes without fetching.
 * Useful for server-rendered or cached-first scenarios.
 */
export function getDefaultMinQuestions(): number {
  return DEFAULT_MIN_QUESTIONS;
}
