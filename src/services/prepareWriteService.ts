import * as attemptRepo from '../lib/repositories/attempt.repository';
import * as examRepo from '../lib/repositories/exam.repository';
import * as questionRepo from '../lib/repositories/question.repository';
import { getAllowedExamIds } from '../utils/examUtils';
import { queryCache } from '../utils/queryCache';
import { logWarn } from '../utils/logger';
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
    const data = await examRepo.fetchExamConfigsByIds(allowedIds);
    return (data || []).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  }, 600000, force);
}

/**
 * Fetches papers for a specific exam.
 * Cached for 5 minutes.
 */
export async function fetchPapers(examId: string, allowedIds: string[], force = false): Promise<any[]> {
  const cacheKey = `papers_config_${examId}_${allowedIds.join('_')}`;
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const data = await examRepo.fetchPapersByExamId(examId);
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
    const data = await examRepo.fetchSubjectsByPaperId(paperId);
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
    const userAttempts = await attemptRepo.fetchAttemptsByUserId(userId);
    
    if (userAttempts && userAttempts.length > 0) {
      const attemptIds = userAttempts.map(a => a.id);
      const answeredQuestions = await attemptRepo.findAnsweredQuestionIds(attemptIds);
      
      if (answeredQuestions) {
        attemptedQuestionIds = answeredQuestions.map(q => q.question_id).filter(Boolean);
      }
    }
  }

  const allQuestions: Question[] = [];

  for (const subject of subjects) {
    const poolLimit = Math.max(subject.question_count * 3, 100);
    const examIds = getAllowedExamIds(subject.exam_id);
    
    // 1. Fetch unattempted questions from a larger pool
    let subjectQuestionsPool: Question[];

    if (attemptedQuestionIds.length > 0) {
      subjectQuestionsPool = ((await questionRepo.fetchQuestionsByPaperAndSubjectExcluding(
        '*', paperId, subject.subject_name, examIds, attemptedQuestionIds, poolLimit
      )) ?? []) as unknown as Question[];
    } else {
      subjectQuestionsPool = ((await questionRepo.fetchQuestionsByPaperAndSubject(
        '*', paperId, subject.subject_name, examIds, poolLimit
      )) ?? []) as unknown as Question[];
    }
    
    // Shuffle the pool and take the required count
    let selectedSubjectQuestions = subjectQuestionsPool
      .sort(() => Math.random() - 0.5)
      .slice(0, subject.question_count);

    // 2. If not enough questions, fallback to attempted questions pool
    if (selectedSubjectQuestions.length < subject.question_count && attemptedQuestionIds.length > 0) {
      const remainingNeeded = subject.question_count - selectedSubjectQuestions.length;
      
      const attemptedPoolData = (await questionRepo.fetchQuestionsByPaperAndSubjectIncluding(
        '*', paperId, subject.subject_name, examIds, attemptedQuestionIds, poolLimit
      )) as unknown as Question[];

      if (attemptedPoolData) {
        const shuffledAttempted = (attemptedPoolData as Question[])
          .sort(() => Math.random() - 0.5);
        selectedSubjectQuestions.push(...shuffledAttempted.slice(0, remainingNeeded));
      }
    }

    // Check if we have enough questions for this subject
    if (selectedSubjectQuestions.length < subject.question_count) {
      const msg = `Insufficient questions for subject: ${subject.subject_name}. Required: ${subject.question_count}, Found: ${selectedSubjectQuestions.length}`;
      logWarn('prepareWriteService.buildPaper.warn', { message: msg });
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


