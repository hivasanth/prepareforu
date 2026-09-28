import { recordPracticeSessionRpc } from '../lib/repositories/attempt.repository';
import * as examRepo from '../lib/repositories/exam.repository';
import * as questionRepo from '../lib/repositories/question.repository';
import { queryCache } from '../utils/queryCache';
import type { ExamConfig, ExamPaper, ExamSubject, Question } from '../types/exam.types';

export interface PaperDistribution {
  subjects: ExamSubject[];
  totalRequired: number;
}

/**
 * Fetches exams allowed for the user.
 * Cached for 10 minutes.
 */
export async function fetchExams(allowedIds: string[], force = false): Promise<ExamConfig[]> {
  const cacheKey = `exams_config_${allowedIds.join('_')}`;

  return queryCache.fetchWithDedup(cacheKey, async () => {
    const data = await examRepo.fetchExamConfigsByIds(allowedIds);
    return (data || []).sort((a: ExamConfig, b: ExamConfig) => (a.name || '').localeCompare(b.name || ''));
  }, 600000, force);
}

/**
 * Fetches papers for a specific exam.
 * Cached for 5 minutes.
 */
export async function fetchPapers(examId: string, allowedIds: string[], force = false): Promise<ExamPaper[]> {
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
 * Prepare & Write locked flow — preparation phase.
 *
 * Calls prepare_exam_questions(p_paper_id): the server selects the question set,
 * persists it (owner-scoped, RPC-only writes), and returns ONLY student-safe
 * fields — correct_option / explanation_* are never projected (F-01/F-07).
 * Questions are visible for study; answers are revealed only AFTER the real
 * exam is submitted (via the standard review path).
 */
export async function prepareExamQuestions(paperId: string) {
  return questionRepo.prepareExamQuestionsRpc(paperId);
}

/**
 * Prepare & Write locked flow — launch the real exam.
 *
 * Calls start_prepared_exam(p_preparation_id): consumes the locked snapshot
 * into a real attempt (source='prepare_write') using the EXACT same stored
 * question IDs. The client cannot inject its own question set.
 */
export async function startPreparedExam(preparationId: string) {
  return questionRepo.startPreparedExamRpc(preparationId);
}

/**
 * L-01 fix: persists a completed practice session to the server as an audit
 * trail. Practice is otherwise entirely client-side; computing correctness
 * here is safe because practice questions reveal the correct option by design.
 */
export async function recordPracticeSession(input: {
  examId?: string | null
  paperId?: string | null
  questions: Question[]
  answers: Record<string, 'A' | 'B' | 'C' | 'D' | null>
  durationSeconds?: number | null
}): Promise<string> {
  const questionCount = input.questions.length
  let answeredCount = 0
  let correctCount = 0

  for (const q of input.questions) {
    const selected = input.answers[q.id]
    if (!selected) continue
    answeredCount += 1
    if (selected === q.correct_option) correctCount += 1
  }

  return recordPracticeSessionRpc({
    examId: input.examId,
    paperId: input.paperId,
    questionCount,
    answeredCount,
    correctCount,
    durationSeconds: input.durationSeconds,
  })
}