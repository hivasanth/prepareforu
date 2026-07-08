import { supabase } from '../lib/supabase';
import { safeSupabaseCall } from '../utils/safeSupabase';
import type { 
  Question, 
  Attempt, 
  AttemptAnswer, 
  SubmitResult,
  AttemptSource,
  ExamPaper,
  ExamSubject,
  ExamConfig
} from '../types/exam.types';
import { queryCache } from '../utils/queryCache';
import { clearPerformanceCache } from './performanceService';
import { assertValidEnFields } from '../utils/languageUtils';

/**
 * EXAM SERVICE
 * Business logic for question fetching, attempt management, and scoring.
 */

// Helper: Exponential backoff retry


/**
 * Fetches all active exam configurations from Supabase.
 */
export const fetchActiveExams = async (force = false): Promise<ExamConfig[]> => {
  const cacheKey = 'active_exams';
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const { data, error } = await safeSupabaseCall(
      supabase
        .from('exam_configs')
        .select('*')
        .eq('is_published', true)
        .limit(200)
    );
    if (error) throw error;
    return (data || []) as ExamConfig[];
  }, 300000, force); // 5 min TTL
};

/**
 * Fetches all available exam papers for a set of exam IDs.
 * Uses queryCache for performance.
 */
export const fetchUserPapers = async (targetExamIds: string[], force = false): Promise<ExamPaper[]> => {
  if (!targetExamIds.length) return [];
  
  const cacheKey = `user_papers_${JSON.stringify([...targetExamIds].sort())}`;
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const { data: rawPapers, error: papersErr } = await safeSupabaseCall(
      supabase
        .from('exam_papers')
        .select('*')
        .in('exam_id', targetExamIds)
        .order('display_order', { ascending: true })
    );
    if (papersErr) throw papersErr;
    return (rawPapers || []) as ExamPaper[];
  }, 600000, force); // 10 min TTL
};

export const fetchPaperWithSubjects = async (paperId: string) => {
  // NOTE: No cache here — always fetch live paper config so that any admin
  // changes to total_marks, duration_minutes, or negative_mark_value are
  // immediately reflected when a user starts or resumes an exam.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const { data: paper, error: paperErr } = await supabase
      .from('exam_papers')
      .select('*')
      .eq('id', paperId)
      .single();

    if (paperErr) throw paperErr;

    const { data: subjects, error: subErr } = await supabase
      .from('exam_subjects')
      .select('*')
      .eq('paper_id', paperId)
      .order('display_order', { ascending: true });

    if (subErr) throw subErr;

    return { paper: paper as ExamPaper, subjects: (subjects || []) as ExamSubject[] };
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchQuestionsForPaper = async (
  paperId: string, 
  subjects: ExamSubject[],
  userId?: string
): Promise<Question[]> => {
  // Phase 6 Contract: ONLY _en and _te fields exist in the DB.
  // Legacy fields (question_text, option_a/b/c/d, explanation) have been removed.
  // DO NOT add them back.
  const SELECT_FIELDS = [
    'id', 'exam_id', 'paper_id', 'subject_name',
    'correct_option', 'difficulty', 'negative_marks',
    'visual',
    'question_text_en', 'option_a_en', 'option_b_en', 'option_c_en', 'option_d_en', 'explanation_en',
    'question_text_te', 'option_a_te', 'option_b_te', 'option_c_te', 'option_d_te', 'explanation_te',
  ].join(', ');

  try {
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

    let finalQuestions: Question[] = [];

    for (const subject of subjects) {
      // 1. Fetch unattempted questions from a larger pool
      let query = supabase
        .from('questions')
        .select(SELECT_FIELDS)
        .eq('is_active', true)
        .eq('paper_id', paperId)
        .eq('subject_name', subject.subject_name);

      if (attemptedQuestionIds.length > 0) {
        query = query.not('id', 'in', `(${attemptedQuestionIds.join(',')})`);
      }

      // Limit to a pool of up to 3x requested questions to allow random selection
      const poolLimit = Math.max(subject.question_count * 3, 100);
      const { data: poolData, error } = await query.limit(poolLimit);

      if (error) throw error;

      let subjectQuestionsPool = (poolData || []) as unknown as Question[];
      
      // Shuffle the pool and take the required count
      let selectedSubjectQuestions = subjectQuestionsPool
        .sort(() => Math.random() - 0.5)
        .slice(0, subject.question_count);

      // 2. If not enough questions, fallback to attempted questions pool
      if (selectedSubjectQuestions.length < subject.question_count && attemptedQuestionIds.length > 0) {
        const remainingNeeded = subject.question_count - selectedSubjectQuestions.length;
        
        const { data: attemptedPoolData, error: fallbackErr } = await supabase
          .from('questions')
          .select(SELECT_FIELDS)
          .eq('is_active', true)
          .eq('paper_id', paperId)
          .eq('subject_name', subject.subject_name)
          .in('id', attemptedQuestionIds)
          .limit(poolLimit);

        if (fallbackErr) throw fallbackErr;

        if (attemptedPoolData) {
          const shuffledAttempted = (attemptedPoolData as unknown as Question[])
            .sort(() => Math.random() - 0.5);
          selectedSubjectQuestions.push(...shuffledAttempted.slice(0, remainingNeeded));
        }
      }

      finalQuestions.push(...selectedSubjectQuestions);
    }

    if (finalQuestions.length === 0) {
      throw new Error('No questions available for this exam yet.');
    }

    // Guard: verify all fetched questions have valid _en content
    assertValidEnFields(finalQuestions, 'fetchQuestionsForPaper');

    // Map visual to diagram for UI components
    const mappedQuestions = finalQuestions.map((q: any) => ({
      ...q,
      diagram: q.visual || null
    }));

    // Shuffle final set
    return mappedQuestions.sort(() => Math.random() - 0.5);
  } catch (error: any) {
    console.error('fetchQuestionsForPaper Error:', error.message);
    throw error;
  }
};

export const createAttempt = async (params: {
  userId: string;
  examId?: string;
  paperId?: string;
  teacherExamId?: string;
  source: AttemptSource;
  totalMarks: number;
  questionsSnapshot: Question[];
  forceNew?: boolean;
}): Promise<{ attemptId: string; isResumed: boolean; attemptData?: Attempt }> => {
  // 0. Security Gate (Fail-Open for Exams)
  try {
    await supabase.functions.invoke('security-gateway', {
      method: 'POST',
      body: { pathname: '/exams/start' }
    });
  } catch (err) {
    console.warn('[security-gateway] Exam start check bypassed:', err);
  }

  try {
    let existing: Attempt | null = null;

    // 1. Check for existing in_progress attempt (unless forcing new)
    if (!params.forceNew) {
      let query = supabase
        .from('attempts')
        .select('*')
        .eq('user_id', params.userId)
        .eq('status', 'in_progress');

      if (params.paperId) query = query.eq('paper_id', params.paperId);
      if (params.teacherExamId) query = query.eq('teacher_exam_id', params.teacherExamId);
      if (params.examId) query = query.eq('exam_id', params.examId);
      if (params.source) query = query.eq('source', params.source);

      const { data } = await query.maybeSingle();
      existing = data as Attempt;
    }

    // 2. Create or Update attempt
    const { data, error } = await supabase
      .from('attempts')
      .upsert({
        id: params.forceNew ? undefined : existing?.id, // If forceNew, don't pass ID to create NEW
        user_id: params.userId,
        exam_id: params.examId,
        paper_id: params.paperId,
        teacher_exam_id: params.teacherExamId,
        source: params.source,
        total_marks: params.totalMarks,
        questions_snapshot: existing?.questions_snapshot?.length ? existing.questions_snapshot : (params.questionsSnapshot?.length ? params.questionsSnapshot : []),
        status: 'in_progress',
        started_at: (params.forceNew ? undefined : existing?.started_at) || new Date().toISOString()
      }, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      // FIX: Unique constraint violation on "one_active_attempt".
      // Happens when React StrictMode double-invokes the effect, or when the
      // lookup above returns null (race) but a row already exists in the DB.
      // Recovery: fetch the existing in_progress row and treat it as resumed.
      if (error.code === '23505' && error.message?.includes('one_active_attempt')) {
        console.warn('[createAttempt] Constraint hit — recovering existing in_progress attempt');
        let recoveryQuery = supabase
          .from('attempts')
          .select('*')
          .eq('user_id', params.userId)
          .eq('status', 'in_progress');
        if (params.paperId) recoveryQuery = recoveryQuery.eq('paper_id', params.paperId);
        if (params.teacherExamId) recoveryQuery = recoveryQuery.eq('teacher_exam_id', params.teacherExamId);
        if (params.examId) recoveryQuery = recoveryQuery.eq('exam_id', params.examId);
        if (params.source) recoveryQuery = recoveryQuery.eq('source', params.source);
        const { data: recovered, error: recErr } = await recoveryQuery.maybeSingle();
        if (recErr) throw recErr;
        if (!recovered) throw new Error('Failed to recover existing attempt after constraint violation.');
        return { attemptId: recovered.id, isResumed: true, attemptData: recovered as Attempt };
      }
      throw error;
    }
    return { attemptId: data.id, isResumed: !!existing && !params.forceNew, attemptData: data as Attempt };
  } catch (error: any) {
    console.error('createAttempt Error:', error.message);
    throw error;
  }
};

export const syncAnswersCache = async (attemptId: string, answers: Record<string, string | null>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('attempts')
      .update({ answers_json: answers })
      .eq('id', attemptId);
    
    if (error) throw error;
  } catch (error: any) {
    console.error('syncAnswersCache Error:', error.message);
  }
};



export const submitAttempt = async (attemptId: string, userId?: string): Promise<SubmitResult> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s for submission
  try {
    const { data, error } = await supabase.rpc('submit_attempt', { p_attempt_id: attemptId }, { signal: controller.signal });
    if (error) throw error;
    
    // Invalidate performance cache if userId is provided
    if (userId) {
      clearPerformanceCache(userId);
    }
    
    return data as SubmitResult;
  } catch (error: any) {
    console.error('submitAttempt Error:', error.message);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const updateTabSwitchCount = async (attemptId: string, currentCount: number): Promise<number> => {
  try {
    const newCount = currentCount + 1;
    const { error } = await supabase
      .from('attempts')
      .update({ tab_switch_count: newCount })
      .eq('id', attemptId);
    
    if (error) throw error;
    return newCount;
  } catch (error: any) {
    console.error('updateTabSwitchCount Error:', error.message);
    throw error;
  }
};

export const fetchAttemptResult = async (attemptId: string, userId: string): Promise<{ 
  attempt: Attempt; 
  answers: AttemptAnswer[] 
}> => {
  try {
    const { data: attempt, error: attemptErr } = await supabase
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .single();

    if (attemptErr) throw attemptErr;

    const { data: answers, error: answersErr } = await supabase
      .from('attempt_answers')
      .select('*')
      .eq('attempt_id', attemptId);

    if (answersErr) throw answersErr;

    return { attempt: attempt as Attempt, answers: answers as AttemptAnswer[] };
  } catch (error: any) {
    console.error('fetchAttemptResult Error:', error.message);
    throw error;
  }
};

/**
 * Fetch ALL attempt_answer rows for a given attempt.
 * Used on exam resume to reconstruct runtime state from a single source of truth.
 */
export const fetchAttemptAnswers = async (attemptId: string): Promise<AttemptAnswer[]> => {
  try {
    const { data, error } = await supabase
      .from('attempt_answers')
      .select('*')
      .eq('attempt_id', attemptId);

    if (error) throw error;
    return (data || []) as AttemptAnswer[];
  } catch (error: any) {
    console.error('fetchAttemptAnswers Error:', error.message);
    throw error;
  }
};

/**
 * Granular operations for exam state persistence.
 *
 * Each function touches exactly one concern:
 *   touchQuestionVisit  – only visited + last_visited_at
 *   setQuestionAnswer   – only selected_option + is_correct + marks_awarded
 *   setQuestionReview   – only marked_for_review
 *   addQuestionTime     – only time_spent_secs (accumulates)
 *
 * These are called via Postgres RPC (supabase.rpc) which maps directly to
 * the INSERT ... ON CONFLICT functions defined in the migration.
 */

export const touchQuestionVisit = async (
  attemptId: string,
  questionId: string,
  correctOption: string,
): Promise<void> => {
  const { error } = await supabase.rpc('touch_question_visit', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_correct_option: correctOption,
  });
  if (error) throw error;
};

export const setQuestionAnswer = async (
  attemptId: string,
  questionId: string,
  selectedOption: string | null,
  correctOption: string,
  marksPerQuestion: number,
  negativeMarkValue: number,
): Promise<void> => {
  const { error } = await supabase.rpc('set_question_answer', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_selected_option: selectedOption,
    p_correct_option: correctOption,
    p_marks_per_question: marksPerQuestion,
    p_negative_mark_value: negativeMarkValue,
  });
  if (error) throw error;
};

export const setQuestionReview = async (
  attemptId: string,
  questionId: string,
  correctOption: string,
  marked: boolean,
): Promise<void> => {
  const { error } = await supabase.rpc('set_question_review', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_correct_option: correctOption,
    p_marked: marked,
  });
  if (error) throw error;
};

export const addQuestionTime = async (
  attemptId: string,
  questionId: string,
  correctOption: string,
  seconds: number,
): Promise<void> => {
  const { error } = await supabase.rpc('add_question_time', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_correct_option: correctOption,
    p_seconds: seconds,
  });
  if (error) throw error;
};

export const markReviewAccessed = async (attemptId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('attempts')
      .update({ review_accessed: true })
      .eq('id', attemptId);
    if (error) throw error;
  } catch (error: any) {
    console.error('markReviewAccessed Error:', error.message);
    throw error;
  }
};

export const fetchTeacherExamQuestions = async (examId: string): Promise<Question[]> => {
  try {
    const { data, error } = await supabase
      .from('teacher_exam_questions')
      .select('*')
      .eq('teacher_exam_id', examId)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    // Map teacher exam questions to the same Question interface for engine compatibility
    return (data || []).map(q => ({
      ...q,
      exam_id: 'TEACHER_EXAM',
      paper_id: 'TEACHER_PAPER',
      subject_name: 'General',
      difficulty: 'medium',
      negative_marks: 0
    })) as unknown as Question[];
  } catch (error: any) {
    console.error('fetchTeacherExamQuestions Error:', error.message);
    throw error;
  }
};

export const batchCheckAvailability = async (paperIds: string[]): Promise<Record<string, { valid: boolean; message?: string }>> => {
  if (!paperIds.length) return {};
  
  try {
    // 1. Get subjects config for all papers
    const { data: subjects, error: subErr } = await supabase
      .from('exam_subjects')
      .select('paper_id, subject_name, question_count')
      .in('paper_id', paperIds);

    if (subErr) throw subErr;

    // 2. Get counts for all papers in a single query from the question_counts view (to avoid 1000 limit)
    const { data: countsData, error: qErr } = await supabase
      .from('question_counts')
      .select('paper_id, subject_name, count')
      .in('paper_id', paperIds);

    if (qErr) throw qErr;

    // 3. Map counts from database view
    const counts: Record<string, number> = {};
    countsData?.forEach(c => {
      const key = `${c.paper_id}|${c.subject_name}`;
      counts[key] = c.count || 0;
    });

    // 4. Validate each paper
    const results: Record<string, { valid: boolean; message?: string }> = {};
    
    paperIds.forEach(id => {
      const paperSubjects = subjects?.filter(s => s.paper_id === id) || [];
      
      if (paperSubjects.length === 0) {
        results[id] = { valid: false, message: "Configuration error" };
        return;
      }

      let isValid = true;
      for (const sub of paperSubjects) {
        const actual = counts[`${id}|${sub.subject_name}`] || 0;
        if (actual < sub.question_count) {
          isValid = false;
          break;
        }
      }

      results[id] = isValid 
        ? { valid: true } 
        : { valid: false, message: "Not Enough Questions" };
    });

    return results;
  } catch (error) {
    console.error('batchCheckAvailability Error:', error instanceof Error ? error.message : error);
    const fallback: Record<string, { valid: boolean; message?: string }> = {};
    paperIds.forEach(id => fallback[id] = { valid: false, message: "Unable to verify availability." });
    return fallback;
  }
};

