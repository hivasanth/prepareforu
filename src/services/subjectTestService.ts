import * as examRepo from '../lib/repositories/exam.repository';
import { supabase } from '../lib/supabase';
import { getAllowedExamIds } from '../utils/examUtils';
import { shuffleArray as shuffleArrayImpl } from '../utils/shuffle';
import { queryCache } from '../utils/queryCache';
import { assertValidEnFields } from '../utils/languageUtils';
import { logWarn } from '../utils/logger';
import type { Question, ExamPaper, QuestionVisual } from '../types/exam.types';
import { NoAvailableQuestionsError } from './errors/NoAvailableQuestionsError';

// Re-exported from the shared domain-error module so existing consumers of
// `subjectTestService.NoAvailableQuestionsError` keep working. Subject Tests
// and Topic Exams both depend on the shared error — never on each other.
export { NoAvailableQuestionsError };

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
  diagram?: QuestionVisual | null;
  subject_name: string;
}

export async function fetchSubjectsByExam(examSelection: string, force = false): Promise<string[]> {
  const cacheKey = `subjects_exam_${examSelection}`;
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const allowedIds = getAllowedExamIds(examSelection);
    const data = await examRepo.fetchSubjectNamesByExam(allowedIds);
    return (data ?? []).map((s: Record<string, unknown>) => String(s.subject_name ?? '')).filter(Boolean);
  }, 600000, force);
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
export async function fetchSubjectsByPaper(paperId: string, force = false): Promise<string[]> {
  const cacheKey = `subjects_paper_${paperId}`;
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const data = await examRepo.fetchSubjectNamesByPaper(paperId);
    return (data ?? []).map((s: Record<string, unknown>) => String(s.subject_name ?? '')).filter(Boolean);
  }, 600000, force);
}

export async function fetchSubjectCounts(examSelection: string, paperId?: string, force = false): Promise<Record<string, number>> {
  const cacheKey = `subject_counts_${examSelection}_${paperId || 'all'}`;
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const allowedIds = getAllowedExamIds(examSelection);
    const data = await examRepo.fetchSubjectCountsByExam(allowedIds, paperId);

    const counts: Record<string, number> = {};
    (data ?? []).forEach((q) => {
      if (q.subject_name) {
        counts[q.subject_name] = (counts[q.subject_name] || 0) + (q.count || 0);
      }
    });

    return counts;
  }, 300000, force); // 5 min TTL
}

/**
 * Maps RPC-delivered question rows (server-authoritative test selection) to the
 * array-based SubjectQuestion shape used by the practice/test engine.
 *
 * correct_option is intentionally UNKNOWN (0): the RPC never ships it to the
 * browser before submission — scoring is authoritative server-side in
 * set_question_answer / submit_attempt.
 */
export function mapRpcRowsToSubjectQuestions(rows: Record<string, unknown>[]): SubjectQuestion[] {
  return rows.map((q) => {
    const options_en = [
      String(q.option_a_en ?? '').trim(),
      String(q.option_b_en ?? '').trim(),
      String(q.option_c_en ?? '').trim(),
      String(q.option_d_en ?? '').trim(),
    ];
    const options_te = [
      String(q.option_a_te ?? '').trim(),
      String(q.option_b_te ?? '').trim(),
      String(q.option_c_te ?? '').trim(),
      String(q.option_d_te ?? '').trim(),
    ];
    return {
      id: String(q.id),
      question_text_en: q.question_text_en == null ? '' : String(q.question_text_en),
      question_text_te: q.question_text_te == null ? '' : String(q.question_text_te),
      options_en,
      options_te,
      options: options_en,
      correct_option: 0,
      explanation_en: q.explanation_en == null ? '' : String(q.explanation_en),
      explanation_te: q.explanation_te == null ? '' : String(q.explanation_te),
      diagram: q.visual == null ? null : (q.visual as QuestionVisual),
      subject_name: String(q.subject_name ?? ''),
    } satisfies SubjectQuestion;
  });
}

/**
 * Fetches and shuffles questions for a specific subject.
 *
 * CT-2: question selection is SERVER-authoritative. The get_subject_test_questions
 * SECURITY DEFINER RPC enforces the Admin-configured exam_subjects.question_count,
 * excludes questions already attempted, and never ships correct_option to the
 * browser. The client-supplied `count` is a display target only and is NOT used
 * as the selection authority.
 */
export async function fetchSubjectTestQuestions(params: {
  examId: string;
  paperId?: string;
  subjectName: string;
  count?: number;
}): Promise<SubjectQuestion[]> {
  // F-02: identity is SERVER-authoritative. get_subject_test_questions
  // resolves the caller via auth.uid() — no user id is sent to the RPC.
  const { data, error } = await supabase.rpc('get_subject_test_questions', {
    p_exam_id: params.examId,
    p_paper_id: params.paperId ?? null,
    p_subject_name: params.subjectName,
  });
  if (error) throw error;

  const rows = ((data ?? []) as Record<string, unknown>[]) ?? [];
  if (rows.length === 0) {
    logWarn('subjectTestService.fetchSubjectTestQuestions.warn', { subjectName: params.subjectName });
    throw new NoAvailableQuestionsError(params.subjectName);
  }

  // Guard: verify all fetched questions have valid _en content.
  const mapped = mapRpcRowsToSubjectQuestions(rows);
  assertValidEnFields(mapped as unknown as Question[], 'fetchSubjectTestQuestions');

  // 3. Shuffle questions only (disable option shuffling to preserve explanation references)
  return shuffleArray(mapped);
}



/**
 * Converts a service-layer SubjectQuestion (array-based options, numeric correct_option)
 * to the standard Question type (field-based options, character correct_option)
 * used by the ActiveExamPage engine.
 */
export function mapToQuestion(q: SubjectQuestion): Question {
  const optionKeys = ['a', 'b', 'c', 'd'] as const;
  const question: Question = {
    id: q.id,
    exam_id: '',
    paper_id: '',
    subject_name: q.subject_name || '',
    correct_option: (String.fromCharCode(65 + (q.correct_option || 0))) as 'A' | 'B' | 'C' | 'D',
    difficulty: 'medium' as const,
    negative_marks: 0,
    visual: q.diagram ?? undefined,
    diagram: null,
    question_text_en: q.question_text_en || '',
    question_text_te: q.question_text_te || '',
    explanation_en: q.explanation_en || '',
    explanation_te: q.explanation_te || '',
    topic_en: null,
    topic_te: null,
  };

  optionKeys.forEach((key, idx) => {
    const enKey = `option_${key}_en` as keyof SubjectQuestion;
    const teKey = `option_${key}_te` as keyof SubjectQuestion;
    question[`option_${key}_en`] = (q.options_en?.[idx] as string) || (q[enKey] as string) || '';
    question[`option_${key}_te`] = (q.options_te?.[idx] as string) || (q[teKey] as string) || '';
  });

  return question as Question;
}

export function mapQuestionsToStandard(raw: SubjectQuestion[]): Question[] {
  return raw.map(mapToQuestion);
}

export function shuffleArray<T>(array: T[]): T[] {
  return shuffleArrayImpl(array);
}


/* Cache-read helpers (FIX-4, subject-tests audit): getters MUST read the exact
   key the corresponding fetcher writes, and MUST return `null` on a cache miss
   so the loading gates (`!getCachedSubjects(...)`) distinguish "not cached"
   (→ skeleton) from "cached empty" (→ EmptyState). */
export function getCachedSubjects(examSelection: string): string[] | null {
  const raw = queryCache.get(`subjects_exam_${examSelection}`);
  if (raw === null || raw === undefined) return null;
  const cached: unknown[] = raw as unknown[];
  const normalized = cached.map((s: unknown) => typeof s === 'string' ? s : String((s as Record<string, unknown>)?.subject_name ?? '')).filter(Boolean);
  // Normalize cache if it contained objects from previous schema
  if (normalized.some((_s, i) => typeof cached[i] !== 'string')) {
    queryCache.set(`subjects_exam_${examSelection}`, normalized);
  }
  return normalized;
}

export function getCachedSubjectsByPaper(paperId: string): string[] | null {
  if (!paperId) return null;
  const raw = queryCache.get(`subjects_paper_${paperId}`);
  if (raw === null || raw === undefined) return null;
  const cached: unknown[] = raw as unknown[];
  const normalized = cached.map((s: unknown) => typeof s === 'string' ? s : String((s as Record<string, unknown>)?.subject_name ?? '')).filter(Boolean);
  return normalized;
}

export function getCachedSubjectCounts(examSelection: string): Record<string, number> | null {
  const raw = queryCache.get(`subject_counts_${examSelection}_all`);
  return (raw === null || raw === undefined) ? null : (raw as Record<string, number>);
}

export function getCachedSubjectCountsByPaper(examSelection: string, paperId: string): Record<string, number> | null {
  if (!paperId) return null;
  const raw = queryCache.get(`subject_counts_${examSelection}_${paperId}`);
  return (raw === null || raw === undefined) ? null : (raw as Record<string, number>);
}

export function getCachedPapers(examSelection: string): ExamPaper[] {
  return queryCache.get(`appsc_papers_${examSelection}`) || [];
}

export async function clearSubjectTestCache(examSelection: string) {
  if (!examSelection) return;
  // FIND-4: capture the exam's paper IDs BEFORE invalidating the papers cache
  // (getCachedPapers reads appsc_papers_*), so every per-paper subject cache
  // (subjects_paper_{id}) is a clear target. Only THIS exam's papers are
  // invalidated — unrelated exams' subjects_paper_* keys are preserved.
  const paperIds = getCachedPapers(examSelection).map(p => p.id).filter(Boolean);
  queryCache.invalidateByPrefix(`subjects_exam_${examSelection}`);
  queryCache.invalidateByPrefix(`appsc_papers_${examSelection}`);
  // subject_counts_{exam}_all AND subject_counts_{exam}_{paperId} share the
  // same prefix, so one invalidateByPrefix clears both.
  queryCache.invalidateByPrefix(`subject_counts_${examSelection}`);
  // Exact-key invalidation for the backend-driven min-question threshold.
  queryCache.invalidate(`min_questions_${examSelection}`);
  for (const id of paperIds) {
    queryCache.invalidate(`subjects_paper_${id}`);
  }
}
