import * as examRepo from '../lib/repositories/exam.repository';
import * as questionRepo from '../lib/repositories/question.repository';
import { getAllowedExamIds } from '../utils/examUtils';
import { queryCache } from '../utils/queryCache';
import { assertValidEnFields } from '../utils/languageUtils';

export {
  fetchSubjectsByExam,
  fetchAppscPapers,
  fetchSubjectsByPaper,
  fetchSubjectCounts,
  mapToQuestion,
  mapQuestionsToStandard,
  type SubjectQuestion as SubjectTestQuestion,
} from './subjectTestService';

export interface SubjectQuestion {
  id: string;
  question_text_en?: string | null;
  question_text_te?: string | null;
  options_en: string[];
  options_te: string[];
  options: string[];
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
  topic_en?: string | null;
  topic_te?: string | null;
}

export interface TopicItem {
  topic_en: string;
  topic_te: string | null;
  display_order: number;
}

// ─── Topic Fetching ──────────────────────────────────────────────────────────

/**
 * Fetches topics for a specific exam + paper + subject from the exam_topics table.
 * Falls back to fetching distinct topic_en from questions if the topics table
 * returns nothing (e.g., before the seed data is applied).
 */
export async function fetchTopicsBySubject(
  examId?: string,
  paperId?: string,
  subjectName?: string,
  force = false
): Promise<TopicItem[]> {
  if (!examId || !subjectName) return [];

  const cacheKey = `topics_${examId}_${paperId || 'none'}_${subjectName}`;
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const allowedIds = getAllowedExamIds(examId);

    // Primary: fetch from canonical exam_topics table
    const data = await examRepo.fetchTopicsBySubject(allowedIds, subjectName, paperId);

    if (data && (data as any[]).length > 0) {
      return (data as any[]).map((t: any) => ({
        topic_en: t.topic_en,
        topic_te: t.topic_te || null,
        display_order: t.display_order ?? 0,
      }));
    }

    // Fallback: derive distinct topics from the questions table
    const fbData = await questionRepo.fetchDistinctTopics(allowedIds, subjectName, paperId);

    const seen = new Set<string>();
    const result: TopicItem[] = [];
    (fbData as any[])?.forEach((q: any) => {
      if (q.topic_en && !seen.has(q.topic_en)) {
        seen.add(q.topic_en);
        result.push({ topic_en: q.topic_en, topic_te: q.topic_te || null, display_order: result.length });
      }
    });
    return result;
  }, 300000, force);
}

/**
 * Fetches question counts per topic for a specific exam + paper + subject.
 */
export async function fetchTopicCounts(
  examId: string,
  paperId?: string,
  subjectName?: string
): Promise<Record<string, number>> {
  if (!examId || !subjectName) return {};

  const allowedIds = getAllowedExamIds(examId);

  const data = await questionRepo.fetchTopicCounts(allowedIds, subjectName, paperId);

  const counts: Record<string, number> = {};
  (data as any[])?.forEach((q: any) => {
    if (q.topic_en) counts[q.topic_en] = (counts[q.topic_en] || 0) + 1;
  });
  return counts;
}

// ─── Test Engine ─────────────────────────────────────────────────────────────

/**
 * Fetches and shuffles questions for a specific topic.
 */
export async function fetchTopicTestQuestions(params: {
  examId: string;
  paperId?: string;
  subjectName: string;
  topicName: string;
  count?: number;
}): Promise<SubjectQuestion[]> {

  const selectFields = `
    id, 
    question_text_en, question_text_te,
    option_a_en, option_a_te,
    option_b_en, option_b_te,
    option_c_en, option_c_te,
    option_d_en, option_d_te,
    correct_option, 
    explanation_en, explanation_te,
    visual, subject_name, topic_en, topic_te
  `;

  const count = params.count || 20;

  const allowedIds = getAllowedExamIds(params.examId);

  const poolLimit = Math.max(count * 3, 100);

  const poolData = await questionRepo.fetchQuestionsByTopic(
    selectFields,
    params.subjectName,
    params.topicName,
    allowedIds,
    params.paperId,
    poolLimit
  );

  let finalPool = (poolData || []) as any[];
  let selectedQuestions = finalPool
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  if (selectedQuestions.length === 0) {
    console.warn('[TopicTestService] No questions found for topic:', params.topicName);
    throw new Error(`No questions available for topic: ${params.topicName}`);
  }

  assertValidEnFields(selectedQuestions, 'fetchTopicTestQuestions');

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
      options: options_en,
      correct_option: correctIndex,
      explanation_en: q.explanation_en,
      explanation_te: q.explanation_te,
      diagram: q.visual,
      visual: q.visual,
      subject_name: q.subject_name,
      topic_en: q.topic_en,
      topic_te: q.topic_te
    };
  });

  return shuffleArray(mappedQuestions);
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function clearTopicTestCache(examSelection: string) {
  if (!examSelection) return;
  queryCache.invalidateByPrefix(`topics_`);
  queryCache.invalidateByPrefix(`subjects_exam_${examSelection}`);
  queryCache.invalidateByPrefix(`appsc_papers_${examSelection}`);
  queryCache.invalidateByPrefix(`subject_counts_${examSelection}`);
}
