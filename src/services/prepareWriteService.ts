import { supabase } from '../lib/supabase';
import { safeSupabaseCall } from '../utils/safeSupabase';
import { getAllowedExamIds } from '../utils/examUtils';
import { queryCache } from '../utils/queryCache';
import type { Question, ExamSubject } from '../types/exam.types';

export interface PaperDistribution {
  subjects: ExamSubject[];
  totalRequired: number;
}

/**
 * Fetches exams allowed for the user.
 * Cached for 10 minutes.
 */
export async function fetchExams(allowedIds: string[], force = false): Promise<any[]> {
  const cacheKey = `exams_config_${allowedIds.join('_')}`;
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const { data, error } = await safeSupabaseCall(
      supabase
        .from('exam_configs')
        .select('id, exam_id, name')
        .in('exam_id', allowedIds)
        .order('name', { ascending: true })
        .limit(200)
    );

    if (error) throw error;
    return data || [];
  }, 600000, force);
}

/**
 * Fetches papers for a specific exam.
 * Cached for 5 minutes.
 */
export async function fetchPapers(examId: string, allowedIds: string[], force = false): Promise<any[]> {
  const cacheKey = `papers_config_${examId}_${allowedIds.join('_')}`;
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const { data, error } = await safeSupabaseCall(
      supabase
        .from('exam_papers')
        .select('*')
        .eq('exam_id', examId)
        .in('exam_id', allowedIds) 
        .order('display_order', { ascending: true })
        .limit(100)
    );

    if (error) throw error;
    return data || [];
  }, 300000, force);
}

/**
 * Fetches the subject distribution for a given paper.
 * Cached for 5 minutes (300,000ms).
 */
export async function fetchPaperDistribution(paperId: string, force = false): Promise<PaperDistribution> {
  const cacheKey = `paper_dist_${paperId}`;
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const { data, error } = await safeSupabaseCall(
      supabase
        .from('exam_subjects')
        .select('*')
        .eq('paper_id', paperId)
        .order('display_order', { ascending: true })
        .limit(200)
    );

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No distribution found for this paper.');

    return {
      subjects: data,
      totalRequired: (data as ExamSubject[]).reduce((acc: number, sub: ExamSubject) => acc + sub.question_count, 0)
    };
  }, 300000, force);
}

/**
 * Fetches questions based on the paper distribution.
 * Ensures randomized selection and sufficient counts.
 */
export async function fetchPrepareQuestions(
  paperId: string, 
  subjects: ExamSubject[],
  userId?: string
): Promise<Question[]> {
  let attemptedQuestionIds: string[] = [];
  if (userId) {
    const { data: userAttempts } = await supabase
      .from('attempts')
      .select('id')
      .eq('user_id', userId)
      .limit(5000);
    
    if (userAttempts && userAttempts.length > 0) {
      const attemptIds = userAttempts.map(a => a.id);
      const { data: answeredQuestions } = await supabase
        .from('attempt_answers')
        .select('question_id')
        .in('attempt_id', attemptIds);
      
      if (answeredQuestions) {
        attemptedQuestionIds = answeredQuestions.map(q => q.question_id).filter(Boolean);
      }
    }
  }

  const allQuestions: Question[] = [];

  for (const subject of subjects) {
    // 1. Fetch unattempted questions from a larger pool
    let query = supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .eq('paper_id', paperId)
      .eq('subject_name', subject.subject_name)
      .in('exam_id', getAllowedExamIds(subject.exam_id));

    if (attemptedQuestionIds.length > 0) {
      query = query.not('id', 'in', `(${attemptedQuestionIds.join(',')})`);
    }

    const poolLimit = Math.max(subject.question_count * 3, 100);
    query = query.limit(poolLimit);

    const { data: poolData, error } = await safeSupabaseCall(query);

    if (error) {
      console.error(`Supabase error fetching ${subject.subject_name}:`, error.message);
      throw error;
    }
    
    let subjectQuestionsPool = (poolData || []) as Question[];
    
    // Shuffle the pool and take the required count
    let selectedSubjectQuestions = subjectQuestionsPool
      .sort(() => Math.random() - 0.5)
      .slice(0, subject.question_count);

    // 2. If not enough questions, fallback to attempted questions pool
    if (selectedSubjectQuestions.length < subject.question_count && attemptedQuestionIds.length > 0) {
      const remainingNeeded = subject.question_count - selectedSubjectQuestions.length;
      
      let fallbackQuery = supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .eq('paper_id', paperId)
        .eq('subject_name', subject.subject_name)
        .in('exam_id', getAllowedExamIds(subject.exam_id))
        .in('id', attemptedQuestionIds)
        .limit(poolLimit);

      const { data: attemptedPoolData, error: fallbackErr } = await safeSupabaseCall(fallbackQuery);
      if (fallbackErr) {
        console.error(`Supabase fallback error fetching ${subject.subject_name}:`, fallbackErr.message);
        throw fallbackErr;
      }

      if (attemptedPoolData) {
        const shuffledAttempted = (attemptedPoolData as Question[])
          .sort(() => Math.random() - 0.5);
        selectedSubjectQuestions.push(...shuffledAttempted.slice(0, remainingNeeded));
      }
    }

    // Check if we have enough questions for this subject
    if (selectedSubjectQuestions.length < subject.question_count) {
      const msg = `Insufficient questions for subject: ${subject.subject_name}. Required: ${subject.question_count}, Found: ${selectedSubjectQuestions.length}`;
      console.warn(msg);
      throw new Error(msg);
    }

    // Map visual to diagram if needed (consistency with other modules)
    const mappedQuestions = selectedSubjectQuestions.map(q => ({
      ...q,
      diagram: q.visual || null
    }));

    allQuestions.push(...mappedQuestions);
  }

  // Final shuffle to mix subjects using Fisher-Yates
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }
  return allQuestions;
}


