import { supabase } from '../lib/supabase'
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
    const { data, error } = await supabase
      .from('study_topics')
      .select('*')
      .eq('exam_id', examId)
      .eq('paper_id', paperId)
      .eq('subject_name', subjectName)
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .limit(200)

    if (error) throw error
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
  const { data, error } = await supabase
    .from('study_topics')
    .select('*')
    .eq('exam_id', examId)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
    .order('display_order', { ascending: true })

  if (error) throw error
  return (data as StudyTopic[]) ?? []
}

// ─── Get next display_order for a given subject ───────────────────────────────
export async function getNextDisplayOrder(
  examId: string,
  paperId: string,
  subjectName: string
): Promise<number> {
  const { data } = await supabase
    .from('study_topics')
    .select('display_order')
    .eq('exam_id', examId)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data?.display_order ?? 0) + 1
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
  const { data, error } = await supabase
    .from('study_topics')
    .insert([payload])
    .select()
    .single()

  if (error) throw error
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
  const { data, error } = await supabase
    .from('study_topics')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as StudyTopic
}

// ─── Delete a topic ───────────────────────────────────────────────────────────
export async function deleteTopic(id: string, user?: UserProfile | null): Promise<void> {
  ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'topics:delete' })
  const { error } = await supabase
    .from('study_topics')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Toggle publish status ────────────────────────────────────────────────────
export async function toggleTopicPublish(id: string, isPublished: boolean, user?: UserProfile | null): Promise<void> {
  ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'topics:toggle' })
  const { error } = await supabase
    .from('study_topics')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
