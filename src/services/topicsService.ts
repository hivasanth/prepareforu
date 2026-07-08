import * as topicRepo from '../lib/repositories/topic.repository'
import { ensureRole } from '../utils/authUtils'
import { queryCache } from '../utils/queryCache'
import type { UserProfile } from '../types/auth.types'
import type { StudyTopic, TopicSection } from '../types/exam.types'

const TOPICS_PREFIX = 'topics_data_';

// ─── Fetch published topics for a given context (user-facing) ───────────────
export async function fetchTopics(
  examId: string,
  paperId: string,
  subjectName: string,
  force = false
): Promise<StudyTopic[]> {
  const cacheKey = `${TOPICS_PREFIX}${examId}_${paperId}_${subjectName}`;
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const data = await topicRepo.fetchPublishedTopics(examId, paperId, subjectName);
    return (data as StudyTopic[]) ?? []
  }, 300000, force); // 5 min TTL
}

export function clearTopicCache(): void {
  queryCache.invalidateByPrefix(TOPICS_PREFIX);
}

// ─── Fetch all topics (published + unpublished) for admin ───────────────────
export async function fetchTopicsAdmin(
  examId: string,
  paperId: string,
  subjectName: string
): Promise<StudyTopic[]> {
  const data = await topicRepo.fetchAllTopics(examId, paperId, subjectName);
  return (data as StudyTopic[]) ?? []
}

// ─── Get next display_order for a given subject ───────────────────────────────
export async function getNextDisplayOrder(
  examId: string,
  paperId: string,
  subjectName: string
): Promise<number> {
  return await topicRepo.findMaxDisplayOrder(examId, paperId, subjectName);
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
  ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'topics:create' })
  const data = await topicRepo.insertTopic(payload)
  return data as StudyTopic
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

export async function updateTopic(id: string, payload: UpdateTopicPayload, user?: UserProfile | null): Promise<StudyTopic> {
  ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'topics:update' })
  const data = await topicRepo.modifyTopic(id, payload)
  return data as StudyTopic
}

// ─── Delete a topic ───────────────────────────────────────────────────────────
export async function deleteTopic(id: string, user?: UserProfile | null): Promise<void> {
  ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'topics:delete' })
  await topicRepo.removeTopic(id)
}

// ─── Toggle publish status ────────────────────────────────────────────────────
export async function toggleTopicPublish(id: string, isPublished: boolean, user?: UserProfile | null): Promise<void> {
  ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'topics:toggle' })
  await topicRepo.setTopicPublishStatus(id, isPublished)
}
