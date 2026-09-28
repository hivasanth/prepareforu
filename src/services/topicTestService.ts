import * as examRepo from '../lib/repositories/exam.repository';
import * as questionRepo from '../lib/repositories/question.repository';
import { supabase } from '../lib/supabase';
import { getAllowedExamIds } from '../utils/examUtils';
import { queryCache } from '../utils/queryCache';
import { logWarn } from '../utils/logger';
import { NoAvailableQuestionsError } from './errors/NoAvailableQuestionsError';

export {
  fetchSubjectsByExam,
  fetchAppscPapers,
  fetchSubjectsByPaper,
  fetchSubjectCounts,
  mapToQuestion,
  mapQuestionsToStandard,
  shuffleArray,
  type SubjectQuestion,
} from './subjectTestService';
import { clearSubjectTestCache, mapRpcRowsToSubjectQuestions, shuffleArray } from './subjectTestService';
import type { SubjectQuestion } from './subjectTestService';

export { NoAvailableQuestionsError };

export interface TopicItem {
  /** Canonical exam_topics.id — null only for topics derived from questions (no row in exam_topics). */
  id?: string | null;
  topic_en: string;
  topic_te: string | null;
  display_order: number;
}

export type TopicRecord = NonNullable<Awaited<ReturnType<typeof examRepo.fetchTopicById>>>;

// Authoritative TTL for the Topic Exams cache family (topics + topic counts).
// 5 minutes — matches the subject-count cache convention; the README documents
// this exact value. No second cache system is introduced.
const TOPIC_CACHE_TTL_MS = 300_000;

function topicCacheKey(examId: string, paperId: string | undefined, subjectName: string): string {
  return `topics_${examId}_${paperId || 'none'}_${subjectName}`;
}

function topicCountsCacheKey(examId: string, paperId: string | undefined, subjectName: string): string {
  return `topic_counts_${examId}_${paperId || 'none'}_${subjectName}`;
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

  const cacheKey = topicCacheKey(examId, paperId, subjectName);
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const allowedIds = getAllowedExamIds(examId);

    // Primary: fetch from canonical exam_topics table
    const data = await examRepo.fetchTopicsBySubject(allowedIds, subjectName, paperId);

    if (data && data.length > 0) {
      return data.map((t) => ({
        id: t.id ?? null,
        topic_en: t.topic_en,
        topic_te: t.topic_te || null,
        display_order: t.display_order ?? 0,
      }));
    }

    // Fallback: derive distinct topics from the questions table
    const fbData = await questionRepo.fetchDistinctTopics(allowedIds, subjectName, paperId);

    const seen = new Set<string>();
    const result: TopicItem[] = [];
    fbData?.forEach((q) => {
      if (q.topic_en && !seen.has(q.topic_en)) {
        seen.add(q.topic_en);
        result.push({ topic_en: q.topic_en, topic_te: q.topic_te || null, display_order: result.length });
      }
    });
    return result;
  }, TOPIC_CACHE_TTL_MS, force);
}

/**
 * Fetches a single LIVE exam_topics record by canonical id. The topic-specific
 * bulk-parser route supplies ONLY the id; English/Telugu names and segment
 * membership always resolve from this record.
 */
export async function fetchTopicRecord(topicId: string, force = false): Promise<TopicRecord | null> {
  if (!topicId) return null;
  return queryCache.fetchWithDedup(`topic_record_${topicId}`, async () => {
    return examRepo.fetchTopicById(topicId);
  }, TOPIC_CACHE_TTL_MS, force);
}

/**
 * Fetches question counts per topic for a specific exam + paper + subject.
 *
 * Uses the DB-side `topic_counts` aggregate view (security_invoker=on) so
 * counts remain accurate for subjects that exceed the 200-row threshold that
 * the previous client-side aggregation capped at.
 */
export async function fetchTopicCounts(
  examId: string,
  paperId?: string,
  subjectName?: string,
  force = false
): Promise<Record<string, number>> {
  if (!examId || !subjectName) return {};

  const cacheKey = topicCountsCacheKey(examId, paperId, subjectName);
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const allowedIds = getAllowedExamIds(examId);
    const data = await examRepo.fetchTopicCountsByExam(allowedIds, subjectName, paperId);

    const counts: Record<string, number> = {};
    (data ?? []).forEach((q) => {
      if (q.topic_en) counts[q.topic_en] = q.count;
    });
    return counts;
  }, TOPIC_CACHE_TTL_MS, force);
}

/* Warm-cache getters (FIX-7): read the EXACT keys the fetchers write, and
   return `null` on a miss so callers can distinguish "not cached" (→ skeleton)
   from a genuinely cached value. */
export function getCachedTopics(examId: string, paperId: string | undefined, subjectName: string): TopicItem[] | null {
  if (!examId || !subjectName) return null;
  const raw = queryCache.get(topicCacheKey(examId, paperId, subjectName));
  if (raw === null || raw === undefined) return null;
  return raw as TopicItem[];
}

export function getCachedTopicCounts(examId: string, paperId: string | undefined, subjectName: string): Record<string, number> | null {
  if (!examId || !subjectName) return null;
  const raw = queryCache.get(topicCountsCacheKey(examId, paperId, subjectName));
  if (raw === null || raw === undefined) return null;
  return raw as Record<string, number>;
}

// ─── Test Engine ─────────────────────────────────────────────────────────────

/**
 * Fetches and shuffles questions for a specific topic.
 *
 * Identity is ALWAYS the canonical exam_topics id (`topicId`). The English
 * topic name is never accepted as identity from callers: when `topicId` is
 * present it is resolved through the authoritative exam_topics record and the
 * record's canonical topic_en becomes the denormalized query predicate used to
 * match questions (which store topic_en as display data).
 *
 * `legacyTopicName` exists ONLY for id-less topics derived from the questions
 * table (no exam_topics row exists for them); it must not be supplied when a
 * canonical id is known.
 */
export async function fetchTopicTestQuestions(params: {
  examId: string;
  paperId?: string;
  subjectName: string;
  topicId?: string | null;
  legacyTopicName?: string;
  count?: number;
}): Promise<SubjectQuestion[]> {

  let predicateName: string;
  if (params.topicId) {
    const authority = await fetchTopicRecord(params.topicId);
    if (!authority || authority.subject_name !== params.subjectName) {
      logWarn('topicTestService.fetchTopicTestQuestions.unverified_topic', { topicId: params.topicId });
      throw new Error('Selected topic could not be verified. Please go back and choose the topic again.');
    }
    predicateName = authority.topic_en;
  } else if (params.legacyTopicName) {
    predicateName = params.legacyTopicName;
  } else {
    throw new Error('No topic selected for this test.');
  }

  // CT-3: server-authoritative selection. Map the requested test size to the
  // coarse Admin-configured tier (20/30/50); any other size (or 0) falls back to
  // the topic's required_questions. The RPC enforces the authoritative count
  // and excludes already-attempted questions; the client never sets the pool.
  const requested = params.count || 0;
  const testSize = requested === 20 || requested === 30 || requested === 50 ? requested : 0;

  const { data, error } = await supabase.rpc('get_topic_test_questions', {
    p_exam_id: params.examId,
    p_paper_id: params.paperId ?? null,
    p_subject_name: params.subjectName,
    p_topic_name: predicateName,
    p_test_size: testSize,
  });
  if (error) throw error;

  const rows = ((data ?? []) as Record<string, unknown>[]) ?? [];
  if (rows.length === 0) {
    logWarn('topicTestService.fetchTopicTestQuestions.warn', { topicName: predicateName });
    throw new NoAvailableQuestionsError(predicateName);
  }

  return shuffleArray(mapRpcRowsToSubjectQuestions(rows));
}

export async function clearTopicTestCache(examSelection: string) {
  if (!examSelection) return;
  await clearSubjectTestCache(examSelection);
  queryCache.invalidateByPrefix(`topics_`);
  queryCache.invalidateByPrefix(`topic_counts_`);
}
