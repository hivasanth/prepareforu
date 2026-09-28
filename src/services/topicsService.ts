import * as topicRepo from '../lib/repositories/topic.repository'
import { ensureRole } from '../utils/authUtils'
import { queryCache } from '../utils/queryCache'
import type { UserProfile } from '../types/auth.types'
import type { StudyTopic, TopicSection } from '../types/exam.types'

// Feature-isolated cache namespace. `study_topics_data_` is deliberately
// non-overlapping with the Topic-Exams family (`topics_`, `topic_counts_`) so
// `clearTopicTestCache` can never invalidate the Study Topics cache (and vice
// versa). A topic id can never start with a numeric exam/paper/subject value
// clash because the key embeds the full context tuple.
const TOPICS_PREFIX = 'study_topics_data_';
const TOPICS_TTL_MS = 300_000; // 5 min — matches the subject-count convention

export interface TopicCacheContext {
  exam_id: string
  paper_id: string
  subject_name: string
}

function topicCacheKey(examId: string, paperId: string, subjectName: string): string {
  return `${TOPICS_PREFIX}${examId}_${paperId}_${subjectName}`;
}

// ─── Fetch published topics for a given context (user-facing) ───────────────
export async function fetchTopics(
  examId: string,
  paperId: string,
  subjectName: string,
  force = false
): Promise<StudyTopic[]> {
  const cacheKey = topicCacheKey(examId, paperId, subjectName);
  const data = await queryCache.fetchWithDedup(cacheKey, async () => {
    const rows = await topicRepo.fetchPublishedTopics(examId, paperId, subjectName);
    return (rows as unknown as StudyTopic[]) ?? []
  }, TOPICS_TTL_MS, force);
  // T-M4: never persist a successful-but-empty result. A transient upstream
  // empty must not become a 5-minute false EmptyState; the next load is free
  // to retry the backend. Non-empty results remain cached for the TTL.
  if (Array.isArray(data) && data.length === 0) {
    queryCache.invalidate(cacheKey);
  }
  return data;
}

// ─── Cache invalidation after admin mutations ───────────────────────────────
// Fired ONLY after a successful mutation (never before). Uses the narrowest
// practical key (full context tuple) when available; falls back to the
// feature-scoped prefix — never a global queryCache.clear().
function invalidateTopicCache(context?: TopicCacheContext | null): void {
  if (context?.exam_id && context?.paper_id && context?.subject_name) {
    queryCache.invalidate(topicCacheKey(context.exam_id, context.paper_id, context.subject_name));
    return;
  }
  queryCache.invalidateByPrefix(TOPICS_PREFIX);
}

// ─── Fetch all topics (published + unpublished) for admin ───────────────────
export async function fetchTopicsAdmin(
  examId: string,
  paperId: string,
  subjectName: string
): Promise<StudyTopic[]> {
  const data = await topicRepo.fetchAllTopics(examId, paperId, subjectName);
  return (data as unknown as StudyTopic[]) ?? []
}

// ─── Get next display_order for a given subject ───────────────────────────────
export async function getNextDisplayOrder(
  examId: string,
  paperId: string,
  subjectName: string
): Promise<number> {
  return (await topicRepo.findMaxDisplayOrder(examId, paperId, subjectName)) ?? 0;
}

// ─── Create a new topic ───────────────────────────────────────────────────────
export interface CreateTopicPayload {
  exam_id: string
  paper_id: string
  subject_name: string
  title_en: string
  title_te: string
  summary_en: string
  summary_te: string
  content_en: TopicSection[]
  content_te: TopicSection[]
  youtube_url: string | null
  display_order: number
  is_published: boolean
  created_by: string
}

export async function createTopic(payload: CreateTopicPayload, user?: UserProfile | null): Promise<StudyTopic> {
  ensureRole({ user, allowedRoles: ['admin'], operation: 'topics:create' })
  const data = await topicRepo.insertTopic(payload as unknown as Record<string, unknown>)
  invalidateTopicCache({
    exam_id: payload.exam_id,
    paper_id: payload.paper_id,
    subject_name: payload.subject_name,
  })
  return data as unknown as StudyTopic
}

// ─── Update existing topic ────────────────────────────────────────────────────
export interface UpdateTopicPayload {
  title_en?: string
  title_te?: string
  summary_en?: string
  summary_te?: string
  content_en?: TopicSection[]
  content_te?: TopicSection[]
  youtube_url?: string | null
  display_order?: number
  is_published?: boolean
}

export async function updateTopic(id: string, payload: UpdateTopicPayload, user?: UserProfile | null, cacheContext?: TopicCacheContext | null): Promise<StudyTopic> {
  ensureRole({ user, allowedRoles: ['admin'], operation: 'topics:update' })
  const data = await topicRepo.modifyTopic(id, payload as unknown as Record<string, unknown>)
  invalidateTopicCache(cacheContext)
  return data as unknown as StudyTopic
}

// ─── Delete a topic ───────────────────────────────────────────────────────────
export async function deleteTopic(id: string, user?: UserProfile | null, cacheContext?: TopicCacheContext | null): Promise<void> {
  ensureRole({ user, allowedRoles: ['admin'], operation: 'topics:delete' })
  await topicRepo.removeTopic(id)
  invalidateTopicCache(cacheContext)
}

// ─── Toggle publish status ────────────────────────────────────────────────────
export async function toggleTopicPublish(id: string, isPublished: boolean, user?: UserProfile | null, cacheContext?: TopicCacheContext | null): Promise<void> {
  ensureRole({ user, allowedRoles: ['admin'], operation: 'topics:toggle' })
  await topicRepo.setTopicPublishStatus(id, isPublished)
  invalidateTopicCache(cacheContext)
}

// ─── Transactional reorder (MED-3) ────────────────────────────────────────────
export interface ReorderItem {
  id: string
  display_order: number
}

export async function reorderTopics(
  items: ReorderItem[],
  user?: UserProfile | null,
  cacheContext?: TopicCacheContext | null,
): Promise<void> {
  ensureRole({ user, allowedRoles: ['admin'], operation: 'topics:reorder' })
  await topicRepo.reorderTopicsTransactional(
    items,
    cacheContext?.exam_id ?? '',
    cacheContext?.paper_id ?? '',
    cacheContext?.subject_name ?? '',
  )
  invalidateTopicCache(cacheContext)
}

// ─── Cache getters (for warm-load gating) ─────────────────────────────────────
// Returns null on a true cache MISS. Because T-M4 guarantees empty results are
// never cached, a cached value here is always real data for the exact context
// tuple — never an artifact of a transient upstream empty.
export function getCachedTopics(examId: string, paperId: string, subjectName: string): StudyTopic[] | null {
  const raw = queryCache.get(topicCacheKey(examId, paperId, subjectName));
  if (raw === null || raw === undefined) return null;
  return raw as StudyTopic[];
}
