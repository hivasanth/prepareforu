import * as attemptRepo from '../lib/repositories/attempt.repository';
import * as examRepo from '../lib/repositories/exam.repository';
import * as questionRepo from '../lib/repositories/question.repository';
import { getAllowedExamIds } from '../utils/examUtils';
import { queryCache } from '../utils/queryCache';
import { assertValidEnFields } from '../utils/languageUtils';
import type { Question } from '../types/exam.types';

export interface SubjectQuestion {
  id: string;
  question_text_en?: string | null;
  question_text_te?: string | null;
  options_en: string[];
  options_te: string[];
  options: string[]; // Keep for legacy compatibility if needed, but we'll use options_en/te
  option_a_en?: string | null;
  option_a_te?: string | null;
  option_b_en?: string | null;
  option_b_te?: string | null;
  option_c_en?: string | null;
  option_c_te?: string | null;
  option_d_en?: string | null;
  option_d_te?: string | null;
  correct_option: number;
  explanation_en?: string | null;
  explanation_te?: string | null;
  diagram?: any;
  subject_name: string;
}

export async function fetchSubjectsByExam(examSelection: string, force = false) {
  const cacheKey = `subjects_exam_${examSelection}`;
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const allowedIds = getAllowedExamIds(examSelection);
    return await examRepo.fetchSubjectNamesByExam(allowedIds);
  }, 600000, force); // 10 min TTL
}

/**
 * Fetches papers for APPSC groups
 */
export async function fetchAppscPapers(examSelection: string, force = false) {
  const cacheKey = `appsc_papers_${examSelection}`;
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const allowedIds = getAllowedExamIds(examSelection);
    return await examRepo.fetchPapersByExamIds(allowedIds);
  }, 600000, force);
}

/**
 * Fetches subjects for a specific APPSC paper
 */
export async function fetchSubjectsByPaper(paperId: string, force = false) {
  const cacheKey = `subjects_paper_${paperId}`;
  return queryCache.fetchWithDedup(cacheKey, async () => {
    return await examRepo.fetchSubjectNamesByPaper(paperId);
  }, 600000, force);
}

export async function fetchSubjectCounts(examSelection: string, paperId?: string, force = false): Promise<Record<string, number>> {
  const cacheKey = `subject_counts_${examSelection}_${paperId || 'all'}`;
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const allowedIds = getAllowedExamIds(examSelection);
    const data = await examRepo.fetchSubjectCountsByExam(allowedIds, paperId);

    const counts: Record<string, number> = {};
    (data as any[])?.forEach((q: any) => {
      if (q.subject_name) {
        counts[q.subject_name] = (counts[q.subject_name] || 0) + (q.count || 0);
      }
    });

    return counts;
  }, 300000, force); // 5 min TTL
}

/**
 * Fetches and shuffles questions for a specific subject
 */
export async function fetchSubjectTestQuestions(params: {
  examId: string;
  paperId?: string;
  subjectName: string;
  count?: number;
  userId?: string;
}): Promise<SubjectQuestion[]> {
  
  let attemptedQuestionIds: string[] = [];
  if (params.userId) {
    const userAttempts = await attemptRepo.fetchAttemptsByUserId(params.userId);
    
    if (userAttempts && userAttempts.length > 0) {
      const attemptIds = userAttempts.map(a => a.id);
      const answeredQuestions = await attemptRepo.findAnsweredQuestionIds(attemptIds);
      
      if (answeredQuestions) {
        attemptedQuestionIds = answeredQuestions.map(q => q.question_id).filter(Boolean);
      }
    }
  }

  const selectFields = `
    id, 
    question_text_en, question_text_te,
    option_a_en, option_a_te,
    option_b_en, option_b_te,
    option_c_en, option_c_te,
    option_d_en, option_d_te,
    correct_option, 
    explanation_en, explanation_te,
    visual, subject_name
  `;

  const count = params.count || 20;
  const allowedIds = getAllowedExamIds(params.examId);
  const poolLimit = Math.max(count * 3, 100);

  // 1. Fetch unattempted questions from a larger pool
  let finalPool: any[];

  if (attemptedQuestionIds.length > 0) {
    finalPool = await questionRepo.fetchQuestionsBySubject(
      selectFields, params.subjectName, allowedIds, params.paperId, attemptedQuestionIds, poolLimit
    );
  } else {
    finalPool = await questionRepo.fetchQuestionsBySubject(
      selectFields, params.subjectName, allowedIds, params.paperId, [], poolLimit
    );
  }

  // Shuffle and slice to the requested count
  let selectedQuestions = finalPool
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  // 2. If not enough questions, fallback to attempted questions pool
  if (selectedQuestions.length < count && attemptedQuestionIds.length > 0) {
    const remainingNeeded = count - selectedQuestions.length;

    const fallbackPoolData = await questionRepo.fetchQuestionsBySubjectIncluding(
      selectFields, params.subjectName, allowedIds, params.paperId, attemptedQuestionIds, poolLimit
    );

    if (fallbackPoolData) {
      const shuffledFallback = (fallbackPoolData as any[])
        .sort(() => Math.random() - 0.5);
      selectedQuestions.push(...shuffledFallback.slice(0, remainingNeeded));
    }
  }

  if (selectedQuestions.length === 0) {
    console.warn('[SubjectTestService] No questions found for:', params.subjectName);
    throw new Error(`No questions available for ${params.subjectName}`);
  }

  // Guard: verify all fetched questions have valid _en content
  assertValidEnFields(selectedQuestions, 'fetchSubjectTestQuestions');

  // 2. Map and Transform
  const mappedQuestions = (selectedQuestions as any[]).map((q: any) => {
    const options_en = [
      q.option_a_en?.trim() || '',
      q.option_b_en?.trim() || '',
      q.option_c_en?.trim() || '',
      q.option_d_en?.trim() || ''
    ];

    const options_te = [
      q.option_a_te?.trim() || '',
      q.option_b_te?.trim() || '',
      q.option_c_te?.trim() || '',
      q.option_d_te?.trim() || ''
    ];

    // Support both char 'A' and index 0
    let correctIndex = 0;
    if (typeof q.correct_option === 'string') {
      correctIndex = q.correct_option.charCodeAt(0) - 65;
    } else {
      correctIndex = parseInt(q.correct_option) || 0;
    }

    return {
      id: q.id,
      question_text_en: q.question_text_en,
      question_text_te: q.question_text_te,
      options_en,
      options_te,
      options: options_en, // legacy
      correct_option: correctIndex,
      explanation_en: q.explanation_en,
      explanation_te: q.explanation_te,
      diagram: q.visual,
      visual: q.visual,
      subject_name: q.subject_name
    };
  });

  // 3. Shuffle questions only (disable option shuffling to preserve explanation references)
  return shuffleArray(mappedQuestions);
}



/**
 * Converts a service-layer SubjectQuestion (array-based options, numeric correct_option)
 * to the standard Question type (field-based options, character correct_option)
 * used by the ActiveExamPage engine.
 */
export function mapToQuestion(q: SubjectQuestion): Question {
  const optionKeys = ['a', 'b', 'c', 'd'] as const;
  const question: any = {
    id: q.id,
    exam_id: '',
    paper_id: '',
    subject_name: q.subject_name || '',
    correct_option: (String.fromCharCode(65 + (q.correct_option || 0))) as 'A' | 'B' | 'C' | 'D',
    difficulty: 'medium' as const,
    negative_marks: 0,
    visual: q.visual || q.diagram || null,
    diagram: q.diagram || q.visual || null,
    question_text_en: q.question_text_en || '',
    question_text_te: q.question_text_te || '',
    explanation_en: q.explanation_en || '',
    explanation_te: q.explanation_te || '',
    topic_en: null,
    topic_te: null,
  };

  optionKeys.forEach((key, idx) => {
    question[`option_${key}_en`] = q.options_en?.[idx] || q[`option_${key}_en` as keyof SubjectQuestion] || '';
    question[`option_${key}_te`] = q.options_te?.[idx] || q[`option_${key}_te` as keyof SubjectQuestion] || '';
  });

  return question as Question;
}

export function mapQuestionsToStandard(raw: SubjectQuestion[]): Question[] {
  return raw.map(mapToQuestion);
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}


export function getCachedSubjects(examSelection: string): any[] {
  return queryCache.get(`subjects_exam_${examSelection}`) || [];
}

export function getCachedSubjectCounts(examSelection: string): any {
  return queryCache.get(`subject_counts_${examSelection}_all`) || {};
}

export function getCachedPapers(examSelection: string): any[] {
  return queryCache.get(`appsc_papers_${examSelection}`) || [];
}

export async function clearSubjectTestCache(examSelection: string) {
  if (!examSelection) return;
  queryCache.invalidateByPrefix(`subjects_exam_${examSelection}`);
  queryCache.invalidateByPrefix(`appsc_papers_${examSelection}`);
  queryCache.invalidateByPrefix(`subject_counts_${examSelection}`);
}
