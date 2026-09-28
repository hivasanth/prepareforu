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
import { selectedOptionSchema } from '../validations/questionSchema';
import { getAllowedExamIds } from '../utils/examUtils';
import { shuffleArray } from '../utils/shuffle';
import { logDebug, logError, logWarn } from '../utils/logger'
import { errorFields } from '../utils/errorClassification'

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
  const paper = await examRepo.findPaperById(paperId);
  if (!paper) {
    // RLS (content isolation) returns no row when the caller's selection
    // does not grant access to this paper. Surface a clean authorization
    // error instead of a downstream null dereference.
    throw new Error('You are not authorized to access this exam.');
  }
  const subjects = await examRepo.fetchSubjectsByPaperId(paperId);
  return { paper: paper as ExamPaper, subjects: (subjects || []) as ExamSubject[] };
};

export const fetchQuestionsForPaper = async (
  paperId: string,
  subjects: ExamSubject[],
  examId: string,
  userId?: string
): Promise<Question[]> => {
  // Phase 6 Contract: ONLY _en and _te fields exist in the DB.
  // Legacy fields (question_text, option_a/b/c/d, explanation) have been removed.
  // DO NOT add them back.
  // Secure delivery (audit §29): correct_option + explanations are NOT sent to
  // the browser before submission. Scoring is authoritative server-side in
  // set_question_answer / submit_attempt. Review re-reads full definitions
  // after submission via fetchQuestionsForReview.
  const SELECT_FIELDS = questionRepo.EXAM_QUESTION_SECURE_FIELDS;
  // CT-1: never pass an empty examIds array (an `.in('exam_id', [])` predicate
  // returns zero rows). Resolve the concrete allowed exam ids for this paper's
  // exam from the canonical selection mapping, mirroring the prepare-write flow
  // (`getAllowedExamIds(subject.exam_id)`).
  const allowedExamIds = getAllowedExamIds(examId);

  try {
    let attemptedQuestionIds: string[] = [];
    if (userId) {
      const userAttempts = await attemptRepo.fetchAttemptsByUserId(userId);
      
      if (userAttempts && userAttempts.length > 0) {
        const attemptIds = userAttempts.map(a => a.id);
        const answeredQuestions = await attemptRepo.findAnsweredQuestionIds(attemptIds);
        
        if (answeredQuestions) {
          const rawIds = answeredQuestions.map(q => q.question_id).filter(Boolean);
          attemptedQuestionIds = [...new Set(rawIds)];

          logDebug('examService.exclusionMetrics', {
            rawCount: rawIds.length,
            uniqueCount: attemptedQuestionIds.length,
            duplicatesRemoved: rawIds.length - attemptedQuestionIds.length,
            attemptCount: userAttempts.length,
          });
        }
      }
    }

    const finalQuestions: Question[] = [];

    for (const subject of subjects) {
      // M-01 fix: sample the FULL unattempted bank (not just a 3x slice) so
      // fresh-question selection is maximized for repeat test-takers. The pool
      // cap is a safety bound (not a naive 3x multiple) — 1000 is comfortably
      // above any single-subject bank in practice. Only when the unattempted
      // bank is exhausted do we fall back to previously-attempted questions,
      // and only for the exact shortfall.
      const poolLimit = 1000;
      let subjectQuestionsPool: Record<string, unknown>[] = [];

      if (attemptedQuestionIds.length > 0) {
        subjectQuestionsPool = (await questionRepo.fetchQuestionsByPaperAndSubjectExcluding(
          SELECT_FIELDS, paperId, subject.subject_name, allowedExamIds, attemptedQuestionIds, poolLimit
        )) ?? [];
      } else {
        subjectQuestionsPool = (await questionRepo.fetchQuestionsByPaperAndSubject(
          SELECT_FIELDS, paperId, subject.subject_name, allowedExamIds, poolLimit
        )) ?? [];
      }
      
      const selectedSubjectQuestions = shuffleArray(subjectQuestionsPool)
        .slice(0, subject.question_count);

      // 2. If not enough questions, fallback to attempted questions pool
      if (selectedSubjectQuestions.length < subject.question_count && attemptedQuestionIds.length > 0) {
        const remainingNeeded = subject.question_count - selectedSubjectQuestions.length;
        
        const attemptedPoolData = await questionRepo.fetchQuestionsByPaperAndSubjectIncluding(
          SELECT_FIELDS, paperId, subject.subject_name, allowedExamIds, attemptedQuestionIds, poolLimit
        );

        if (attemptedPoolData) {
          const shuffledAttempted = shuffleArray(attemptedPoolData as unknown as Question[]);
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

    // Canonical contract: the fetched Question carries its own `visual` field.
    // No legacy diagram is fabricated from visual data (the type cast is gone) —
    // `diagram` stays at its DB value (null for questions, which have no legacy
    // diagram column). Renderers dispatch on `visual` -> QuestionVisualizer.
    const mappedQuestions = finalQuestions.map((q: Question): Question => ({
      ...q,
      diagram: null
    }));

    // Shuffle final set
    return shuffleArray(mappedQuestions);
  } catch (error) {
    const { message } = errorFields(error);
    logError('examService.fetchQuestionsForPaper.error', { message });
    throw error;
  }
};

export const findAttemptById = async (attemptId: string, userId: string): Promise<Attempt | null> => {
  try {
    return await attemptRepo.findAttemptById(attemptId, userId)
  } catch (error) {
    const { message } = errorFields(error)
    logError('examService.findAttemptById.error', { message })
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
  } catch (error) {
    const { message } = errorFields(error)
    logError('examService.findInProgressAttempt.error', { message })
    return null
  }
}

export const createAttempt = async (params: {
  userId: string;
  examId?: string;
  paperId?: string;
  teacherExamId?: string;
  source: AttemptSource;
  /**
   * P0-01: selection CONTEXT only. The server resolves which questions belong to
   * the attempt from these values and writes the snapshot itself; the client
   * never supplies question content. questionCount is the requested sample size
   * for subject/topic tests and is clamped server-side.
   */
  subjectName?: string;
  topicName?: string;
  questionCount?: number;
}): Promise<{ attemptId: string; isResumed: boolean; attemptData?: Attempt }> => {
  // 0. Security Gate (Exams). A non-2xx response from the security gateway is an
  // explicit rejection (rate limit / gateway denial). Hard-fail so a throttled or
  // flagged caller cannot start an attempt — mirror the check-not-enforce gap the
  // exams audit (SEC-2) called out. Pure transport-level invoke failures (gateway
  // unreachable) remain fail-open: the attempt is still guarded server-side by
  // RLS + the check_availability RPCs, so Availability must not regress on a
  // transient gateway outage.
  try {
    const gatewayResult = await supabase.functions.invoke('security-gateway', {
      method: 'POST',
      body: { pathname: '/exams/start' }
    })
    if (gatewayResult?.error) {
      throw new Error('Exam authorization failed. You are rate limited or blocked from starting exams. Please try again in a moment.')
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Exam authorization failed')) {
      throw err
    }
    logWarn('examService.securityGateway.bypassed', { message: err instanceof Error ? err.message : String(err) });
  }

  try {
    // 1. For teacher exams: enforce server-side time-window validation when
    //    creating a NEW attempt (no in_progress attempt exists). This prevents a
    //    manipulated client from starting an exam outside [start_time, end_time].
    //    The RPC uses PostgreSQL now() — not client time.
    if (params.source === 'teacher_exam' && params.teacherExamId) {
      const existing: Attempt | null = await attemptRepo.findInProgressAttempt({
        userId: params.userId,
        teacherExamId: params.teacherExamId,
        source: params.source,
      });
      if (!existing) {
        const { data: isTimeValid, error: timeErr } = await supabase.rpc('is_teacher_exam_active', {
          p_exam_id: params.teacherExamId,
        });
        if (timeErr) throw new Error('Failed to verify exam availability.');
        if (!isTimeValid) {
          throw new Error('This exam is not currently available. Please check your schedule and try again.');
        }
      }
    }

    // 2. Server-authoritative creation. One-active-attempt idempotency, ownership,
    //    exam-access enforcement, the interim total_marks and — since P0-01 — the
    //    attempt's question snapshot are ALL resolved by the create_attempt
    //    SECURITY DEFINER RPC. The client never supplies question content.
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_attempt', {
      p_exam_id: params.examId ?? null,
      p_paper_id: params.paperId ?? null,
      p_teacher_exam_id: params.teacherExamId ?? null,
      p_source: params.source,
      p_subject_name: params.subjectName ?? null,
      p_topic_en: params.topicName ?? null,
      p_question_count: params.questionCount ?? null,
    });
    if (rpcErr) throw rpcErr;
    const attemptId: string = (rpcResult as { attempt_id: string }).attempt_id;
    const isResumed: boolean = (rpcResult as { is_resumed: boolean }).is_resumed;

    // 3. Return the full attempt row (drives resume/review/timer). The row now
    //    carries the server-authored questions_snapshot, which is the set the
    //    attempt will actually be scored and reviewed against.
    const attemptData = await attemptRepo.findAttemptById(attemptId, params.userId);
    return { attemptId, isResumed, attemptData: attemptData ?? undefined };
  } catch (error) {
    const { message } = errorFields(error);
    logError('examService.createAttempt.error', { message });
    throw error;
  }
};

export const syncAnswersCache = async (attemptId: string, answers: Record<string, string | null>): Promise<void> => {
  try {
    await attemptRepo.updateAnswersCacheRpc(attemptId, answers);
  } catch (error) {
    const { message } = errorFields(error);
    logError('examService.syncAnswersCache.error', { message });
    if (import.meta.env.DEV) throw error;
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
  } catch (error) {
    const { message } = errorFields(error);
    logError('examService.submitAttempt.error', { message });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const updateTabSwitchCount = async (attemptId: string): Promise<number> => {
  try {
    // M-03 fix: the increment is server-side and atomic (bump_tab_switch_count),
    // so the authoritative count can never be spoofed or reset by the client.
    return await attemptRepo.bumpTabSwitchCountRpc(attemptId);
  } catch (error) {
    const { message } = errorFields(error);
    logError('examService.updateTabSwitchCount.error', { message });
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
    // F-01: correctness columns are completion-gated behind the RPC.
    const answers = await attemptRepo.fetchAttemptReviewAnswersRpc(attemptId);
    return { attempt: attempt as Attempt, answers: answers as AttemptAnswer[] };
  } catch (error) {
    const { message } = errorFields(error);
    logError('examService.fetchAttemptResult.error', { message });
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
  } catch (error) {
    const { message } = errorFields(error);
    logError('examService.fetchAttemptAnswers.error', { message });
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
 * the INSERT ... ON CONFLICT functions defined in the migration. Since F-01
 * the mutation RPCs no longer accept a client-supplied correct_option.
 */

export const touchQuestionVisit = async (
  attemptId: string,
  questionId: string,
): Promise<void> => {
  await attemptRepo.touchQuestionVisitRpc(attemptId, questionId);
};

export const setQuestionAnswer = async (
  attemptId: string,
  questionId: string,
  selectedOption: string | null,
): Promise<void> => {
  if (selectedOption !== null && !selectedOptionSchema.safeParse(selectedOption).success) {
    throw new Error('Invalid answer option. Answer options are limited to A-D.');
  }
  await attemptRepo.setQuestionAnswerRpc(attemptId, questionId, selectedOption);
};

export const setQuestionReview = async (
  attemptId: string,
  questionId: string,
  marked: boolean,
): Promise<void> => {
  await attemptRepo.setQuestionReviewRpc(attemptId, questionId, marked);
};

export const addQuestionTime = async (
  attemptId: string,
  questionId: string,
  seconds: number,
): Promise<void> => {
  await attemptRepo.addQuestionTimeRpc(attemptId, questionId, seconds);
};

/**
 * Content-attempt post-exam review: full question definitions (incl.
 * correct_option + explanations) restored through the ownership+completion
 * gated get_content_review_questions RPC. The questions answer columns are
 * revoked from REST (F-07).
 */
export const fetchContentReviewQuestions = async (attemptId: string): Promise<Partial<Question>[]> => {
  try {
    const data = await questionRepo.fetchContentReviewQuestionsRpc(attemptId);
    return (data ?? []) as Partial<Question>[];
  } catch (error: unknown) {
    logError('examService.fetchContentReviewQuestions.error', { message: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

/**
 * H-1: full question definitions for teacher-exam post-exam review.
 * Teacher questions do not live in the content `questions` table, and the
 * in-session snapshot no longer carries answers, so the review restores them
 * through the ownership+completion gated get_teacher_exam_review_questions RPC.
 */
export const fetchTeacherExamReviewQuestions = async (attemptId: string): Promise<Partial<Question>[]> => {
  try {
    const data = await teacherExamRepo.fetchTeacherExamReviewQuestionsRpc(attemptId);
    return (data ?? []) as Partial<Question>[];
  } catch (error: unknown) {
    logError('examService.fetchTeacherExamReviewQuestions.error', { message: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

export const markReviewAccessed = async (attemptId: string): Promise<void> => {
  try {
    await attemptRepo.markReviewAccessedRpc(attemptId);
  } catch (error) {
    const { message } = errorFields(error);
    logError('examService.markReviewAccessed.error', { message });
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
  } catch (error) {
    const { message } = errorFields(error);
    logError('examService.fetchTeacherExamQuestions.error', { message });
    throw error;
  }
};

export const batchCheckAvailability = async (paperIds: string[]): Promise<Record<string, { valid: boolean; message?: string }>> => {
  if (!paperIds.length) return {};
  
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
};

