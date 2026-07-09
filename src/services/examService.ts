import { supabase } from '../lib/supabase'
import * as attemptRepo from '../lib/repositories/attempt.repository';
import * as examRepo from '../lib/repositories/exam.repository';
import * as questionRepo from '../lib/repositories/question.repository';
import * as teacherExamRepo from '../lib/repositories/teacherExam.repository';
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
import { logError, logWarn } from '../utils/logger'

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
    const data = await examRepo.fetchActiveExamConfigs();
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
    const rawPapers = await examRepo.fetchPapersByExamIds(targetExamIds);
    return (rawPapers || []) as ExamPaper[];
  }, 600000, force); // 10 min TTL
};

export const fetchPaperWithSubjects = async (paperId: string) => {
  // NOTE: No cache here — always fetch live paper config so that any admin
  // changes to total_marks, duration_minutes, or negative_mark_value are
  // immediately reflected when a user starts or resumes an exam.
  try {
    const paper = await examRepo.findPaperById(paperId);
    const subjects = await examRepo.fetchSubjectsByPaperId(paperId);
    return { paper: paper as ExamPaper, subjects: (subjects || []) as ExamSubject[] };
  } catch (error: any) {
    throw error;
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
      const userAttempts = await attemptRepo.fetchAttemptsByUserId(userId);
      
      if (userAttempts && userAttempts.length > 0) {
        const attemptIds = userAttempts.map(a => a.id);
        const answeredQuestions = await attemptRepo.findAnsweredQuestionIds(attemptIds);
        
        if (answeredQuestions) {
          attemptedQuestionIds = answeredQuestions.map(q => q.question_id).filter(Boolean);
        }
      }
    }

    let finalQuestions: Question[] = [];

    for (const subject of subjects) {
      // 1. Fetch unattempted questions from a larger pool
      const poolLimit = Math.max(subject.question_count * 3, 100);
      let subjectQuestionsPool: Record<string, unknown>[] = [];

      if (attemptedQuestionIds.length > 0) {
        subjectQuestionsPool = (await questionRepo.fetchQuestionsByPaperAndSubjectExcluding(
          SELECT_FIELDS, paperId, subject.subject_name, [], attemptedQuestionIds, poolLimit
        )) ?? [];
      } else {
        subjectQuestionsPool = (await questionRepo.fetchQuestionsByPaperAndSubject(
          SELECT_FIELDS, paperId, subject.subject_name, [], poolLimit
        )) ?? [];
      }
      
      let selectedSubjectQuestions = subjectQuestionsPool
        .sort(() => Math.random() - 0.5)
        .slice(0, subject.question_count);

      // 2. If not enough questions, fallback to attempted questions pool
      if (selectedSubjectQuestions.length < subject.question_count && attemptedQuestionIds.length > 0) {
        const remainingNeeded = subject.question_count - selectedSubjectQuestions.length;
        
        const attemptedPoolData = await questionRepo.fetchQuestionsByPaperAndSubjectIncluding(
          SELECT_FIELDS, paperId, subject.subject_name, [], attemptedQuestionIds, poolLimit
        );

        if (attemptedPoolData) {
          const shuffledAttempted = (attemptedPoolData as unknown as Question[])
            .sort(() => Math.random() - 0.5);
          selectedSubjectQuestions.push(...shuffledAttempted.slice(0, remainingNeeded) as unknown as Record<string, unknown>[]);
        }
      }

      finalQuestions.push(...selectedSubjectQuestions as unknown as Question[]);
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
    logError('examService.fetchQuestionsForPaper.error', { message: error.message });
    throw error;
  }
};

export const findAttemptById = async (attemptId: string, userId: string): Promise<Attempt | null> => {
  try {
    return await attemptRepo.findAttemptById(attemptId, userId)
  } catch (error: any) {
    logError('examService.findAttemptById.error', { message: error.message })
    return null
  }
}

export const findInProgressAttempt = async (params: {
  userId: string
  paperId?: string
  teacherExamId?: string
  examId?: string
  source?: AttemptSource
}): Promise<Attempt | null> => {
  try {
    return await attemptRepo.findInProgressAttempt(params)
  } catch (error: any) {
    logError('examService.findInProgressAttempt.error', { message: error.message })
    return null
  }
}

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
    })
  } catch (err) {
    logWarn('examService.securityGateway.bypassed', { message: err instanceof Error ? err.message : String(err) });
  }

  try {
    let existing: Attempt | null = null;

    // 1. Check for existing in_progress attempt (unless forcing new)
    if (!params.forceNew) {
      existing = await attemptRepo.findInProgressAttempt({
        userId: params.userId,
        paperId: params.paperId,
        teacherExamId: params.teacherExamId,
        examId: params.examId,
        source: params.source,
      });
    }

    // 2. Create or Update attempt
    try {
      const data = await attemptRepo.upsertAttempt({
        id: params.forceNew ? undefined : existing?.id,
        user_id: params.userId,
        exam_id: params.examId,
        paper_id: params.paperId,
        teacher_exam_id: params.teacherExamId,
        source: params.source,
        total_marks: params.totalMarks,
        questions_snapshot: existing?.questions_snapshot?.length ? existing.questions_snapshot : (params.questionsSnapshot?.length ? params.questionsSnapshot : []),
        status: 'in_progress',
        started_at: (params.forceNew ? undefined : existing?.started_at) || new Date().toISOString()
      });
      return { attemptId: data.id, isResumed: !!existing && !params.forceNew, attemptData: data as Attempt };
    } catch (error: any) {
      // FIX: Unique constraint violation on "one_active_attempt".
      // Happens when React StrictMode double-invokes the effect, or when the
      // lookup above returns null (race) but a row already exists in the DB.
      // Recovery: fetch the existing in_progress row and treat it as resumed.
      if (error.code === '23505' && error.message?.includes('one_active_attempt')) {
        logWarn('examService.createAttempt.constraintRecovery', {});
        const recovered = await attemptRepo.findInProgressAttempt({
          userId: params.userId,
          paperId: params.paperId,
          teacherExamId: params.teacherExamId,
          examId: params.examId,
          source: params.source,
        });
        if (!recovered) throw new Error('Failed to recover existing attempt after constraint violation.');
        return { attemptId: recovered.id, isResumed: true, attemptData: recovered as Attempt };
      }
      throw error;
    }
  } catch (error: any) {
    logError('examService.createAttempt.error', { message: error.message });
    throw error;
  }
};

export const syncAnswersCache = async (attemptId: string, answers: Record<string, string | null>): Promise<void> => {
  try {
    await attemptRepo.updateAttempt(attemptId, { answers_json: answers } as any);
  } catch (error: any) {
    logError('examService.syncAnswersCache.error', { message: error.message });
  }
};



export const submitAttempt = async (attemptId: string, userId?: string): Promise<SubmitResult> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s for submission
  try {
    const data = await attemptRepo.submitAttemptRpc(attemptId, controller.signal);
    
    // Invalidate performance cache if userId is provided
    if (userId) {
      clearPerformanceCache(userId);
    }
    
    return data as SubmitResult;
  } catch (error: any) {
    logError('examService.submitAttempt.error', { message: error.message });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const updateTabSwitchCount = async (attemptId: string, currentCount: number): Promise<number> => {
  try {
    const newCount = currentCount + 1;
    await attemptRepo.updateAttempt(attemptId, { tab_switch_count: newCount } as any);
    return newCount;
  } catch (error: any) {
    logError('examService.updateTabSwitchCount.error', { message: error.message });
    throw error;
  }
};

export const fetchAttemptResult = async (attemptId: string, userId: string): Promise<{ 
  attempt: Attempt; 
  answers: AttemptAnswer[] 
}> => {
  try {
    const attempt = await attemptRepo.findAttemptById(attemptId, userId);
    if (!attempt) throw new Error('Attempt not found');
    const answers = await attemptRepo.findAnswersByAttemptId(attemptId);
    return { attempt: attempt as Attempt, answers: answers as AttemptAnswer[] };
  } catch (error: any) {
    logError('examService.fetchAttemptResult.error', { message: error.message });
    throw error;
  }
};

/**
 * Fetch ALL attempt_answer rows for a given attempt.
 * Used on exam resume to reconstruct runtime state from a single source of truth.
 */
export const fetchAttemptAnswers = async (attemptId: string): Promise<AttemptAnswer[]> => {
  try {
    return (await attemptRepo.findAnswersByAttemptId(attemptId)) ?? [];
  } catch (error: any) {
    logError('examService.fetchAttemptAnswers.error', { message: error.message });
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
  await attemptRepo.touchQuestionVisitRpc(attemptId, questionId, correctOption);
};

export const setQuestionAnswer = async (
  attemptId: string,
  questionId: string,
  selectedOption: string | null,
  correctOption: string,
  marksPerQuestion: number,
  negativeMarkValue: number,
): Promise<void> => {
  await attemptRepo.setQuestionAnswerRpc(attemptId, questionId, selectedOption, correctOption, marksPerQuestion, negativeMarkValue);
};

export const setQuestionReview = async (
  attemptId: string,
  questionId: string,
  correctOption: string,
  marked: boolean,
): Promise<void> => {
  await attemptRepo.setQuestionReviewRpc(attemptId, questionId, correctOption, marked);
};

export const addQuestionTime = async (
  attemptId: string,
  questionId: string,
  correctOption: string,
  seconds: number,
): Promise<void> => {
  await attemptRepo.addQuestionTimeRpc(attemptId, questionId, correctOption, seconds);
};

export const markReviewAccessed = async (attemptId: string): Promise<void> => {
  try {
    await attemptRepo.updateAttempt(attemptId, { review_accessed: true } as any);
  } catch (error: any) {
    logError('examService.markReviewAccessed.error', { message: error.message });
    throw error;
  }
};

export const fetchTeacherExamQuestions = async (examId: string): Promise<Question[]> => {
  try {
    const data = await teacherExamRepo.fetchTeacherExamQuestions(examId);
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
    logError('examService.fetchTeacherExamQuestions.error', { message: error.message });
    throw error;
  }
};

export const batchCheckAvailability = async (paperIds: string[]): Promise<Record<string, { valid: boolean; message?: string }>> => {
  if (!paperIds.length) return {};
  
  try {
    // 1. Get subjects config for all papers
    const subjects = await examRepo.fetchSubjectsWithQuestionCount(paperIds);

    // 2. Get counts for all papers in a single query from the question_counts view (to avoid 1000 limit)
    const countsData = await examRepo.fetchQuestionCountsByPapers(paperIds);

    // 3. Map counts from database view
    const counts: Record<string, number> = {};
    countsData?.forEach(c => {
      const key = `${c.paper_id}|${c.subject_name}`;
      counts[key] = (c.count as number) || 0;
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
        if (actual < (sub.question_count as number)) {
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
    logError('examService.batchCheckAvailability.error', { message: error instanceof Error ? error.message : String(error) });
    const fallback: Record<string, { valid: boolean; message?: string }> = {};
    paperIds.forEach(id => fallback[id] = { valid: false, message: "Unable to verify availability." });
    return fallback;
  }
};

