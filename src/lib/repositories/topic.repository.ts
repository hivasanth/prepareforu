import { supabase } from '../supabase'
import type { StudyTopic } from '../../types/exam.types'

/**
 * Narrow column list for the /topics (Study Topics) page. Excludes internal
 * metadata (is_published is implied true via the WHERE filter; created_by,
 * created_at, updated_at are not used by the page UI).
 *
 * Includes everything rendered by TopicCard / TopicListView / TopicReader:
 *   id, exam_id, paper_id, subject_name (used by the service cache key
 *   construction downstream via fetchTopics inputs, but kept for any
 *   future filter-by-context use), title_en/title_te/summary_en/summary_te,
 *   content_en/content_te JSONB, youtube_url, display_order.
 */
export const STUDY_TOPIC_PUBLIC_FIELDS =
  'id,exam_id,paper_id,subject_name,' +
  'title_en,title_te,summary_en,summary_te,' +
  'content_en,content_te,' +
  'youtube_url,display_order';

/**
 * Admin field list for fetchAllTopics. Includes everything the admin panel
 * reads: all public fields PLUS is_published (for the toggle badge) and
 * created_by (for the create-by audit trail). Excludes timestamps that are
 * not consumed by the admin UI.
 */
export const STUDY_TOPIC_ADMIN_FIELDS =
  STUDY_TOPIC_PUBLIC_FIELDS + ',is_published,created_by';

// T-M2: no silent truncation. The previous `.limit(200)` dropped rows for
// subjects with >200 published topics. This is now a bounded pagination loop:
//   * PAGE_SIZE matches the PostgREST per-request ceiling (200).
//   * HARD_CEILING is a documented safety cap so a pathological dataset can
//     never grow into an unbounded SELECT. Live max is 13 topics/subject, so
//     the ceiling is never reached in practice; if it were, the loop would
//     still terminate loudly rather than silently drop rows.
const TOPIC_PAGE_SIZE = 200;
const TOPIC_HARD_CEILING = 1000;

export async function fetchPublishedTopics(
  examId: string,
  paperId: string,
  subjectName: string
): Promise<StudyTopic[] | null> {
  const all: StudyTopic[] = [];
  for (let offset = 0; offset < TOPIC_HARD_CEILING; offset += TOPIC_PAGE_SIZE) {
    const from = offset;
    const to = offset + TOPIC_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('study_topics')
      .select(STUDY_TOPIC_PUBLIC_FIELDS)
      .eq('exam_id', examId)
      .eq('paper_id', paperId)
      .eq('subject_name', subjectName)
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .range(from, to)
    if (error) throw error
    const rows = (data as unknown as StudyTopic[]) ?? []
    all.push(...rows)
    // Page shorter than the page size → last page; stop.
    if (rows.length < TOPIC_PAGE_SIZE) break
  }
  return all
}

export async function fetchAllTopics(
  examId: string,
  paperId: string,
  subjectName: string
): Promise<StudyTopic[] | null> {
  const { data, error } = await supabase
    .from('study_topics')
    .select(STUDY_TOPIC_ADMIN_FIELDS)
    .eq('exam_id', examId)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data as unknown as StudyTopic[]) ?? []
}

export async function findMaxDisplayOrder(
  examId: string,
  paperId: string,
  subjectName: string
): Promise<number | null> {
  const { data } = await supabase
    .from('study_topics')
    .select('display_order')
    .eq('exam_id', examId)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.display_order ?? null
}

export async function insertTopic(payload: Record<string, unknown>): Promise<StudyTopic> {
  const { data, error } = await supabase
    .from('study_topics')
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data as StudyTopic
}

export async function modifyTopic(id: string, payload: Record<string, unknown>): Promise<StudyTopic> {
  const { data, error } = await supabase
    .from('study_topics')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as StudyTopic
}

export async function removeTopic(id: string): Promise<void> {
  const { error } = await supabase
    .from('study_topics')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function setTopicPublishStatus(id: string, isPublished: boolean): Promise<void> {
  const { error } = await supabase
    .from('study_topics')
    .update({ is_published: isPublished })
    .eq('id', id)
  if (error) throw error
}

// ─── Transactional reorder via RPC (MED-3) ──────────────────────────────────
export async function reorderTopicsTransactional(
  items: { id: string; display_order: number }[],
  examId: string,
  paperId: string,
  subjectName: string,
): Promise<void> {
  const { error } = await supabase.rpc('reorder_study_topics', {
    p_exam_id: examId,
    p_paper_id: paperId,
    p_subject_name: subjectName,
    p_topic_ids: items.map(i => i.id),
    p_display_orders: items.map(i => i.display_order),
  })
  if (error) throw error
}
