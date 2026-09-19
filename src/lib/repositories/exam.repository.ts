import { supabase } from '../supabase'
import type { ExamConfig, ExamPaper, ExamSubject } from '../../types/exam.types'
import { validateOrThrow } from '../utils/validateOrThrow'

// ─── Domain row types for subset queries ────────────────────────────────────

type SubjectNameRow = {
  subject_name: string
}

type SubjectCountRow = {
  subject_name: string
  count: number
}

type SubjectWithQuestionCountRow = {
  paper_id: string
  subject_name: string
  question_count: number
}

type SubjectMetadataRow = {
  paper_id: string
  subject_name: string
}

type QuestionCountByPaperRow = {
  paper_id: string
  subject_name: string
  count: number
}

export type ExamTopicRow = {
  id: string
  topic_en: string
  topic_te: string | null
  display_order: number | null
}

type TopicCountViewRow = {
  exam_id: string
  paper_id: string
  subject_name: string
  topic_en: string
  count: number
}

type PaperIdAndNameRow = {
  id: string
  exam_id: string
  paper_name: string
}



// ─── exam_configs table ──────────────────────────────────────────────────────

export async function fetchActiveExamConfigs(limit = 200): Promise<ExamConfig[]> {
  const { data, error } = await supabase
    .from('exam_configs')
    .select('*')
    .eq('is_published', true)
    .limit(limit)
  if (error) throw error
  return (data || []) as ExamConfig[]
}

export async function findExamConfigById(examId: string): Promise<ExamConfig | null> {
  const { data, error } = await supabase
    .from('exam_configs')
    .select('*')
    .eq('exam_id', examId)
    .maybeSingle()
  if (error) throw error
  return data as ExamConfig | null
}

export async function fetchExamConfigsByIds(ids: string[]): Promise<ExamConfig[] | null> {
  const { data, error } = await supabase
    .from('exam_configs')
    .select('*')
    .in('exam_id', ids)
    .limit(200)
  if (error) throw error
  return data as ExamConfig[] | null
}

export async function fetchExamConfigNames(ids: string[]): Promise<{ exam_id: string; name: string }[] | null> {
  const { data, error } = await supabase
    .from('exam_configs')
    .select('exam_id, name')
    .in('exam_id', ids)
  if (error) throw error
  return data
}

export async function fetchExamConfigNamesWithSelection(ids: string[]): Promise<Pick<ExamConfig, 'exam_id' | 'name' | 'exam_selection'>[] | null> {
  const { data, error } = await supabase
    .from('exam_configs')
    .select('exam_id, name, exam_selection')
    .in('exam_id', ids)
    .limit(200)
  if (error) throw error
  return data
}

export async function fetchMinQuestions(examIds: string[]): Promise<Pick<ExamConfig, 'min_questions'>[] | null> {
  const { data, error } = await supabase
    .from('exam_configs')
    .select('min_questions')
    .in('exam_id', examIds)
    .limit(50)
  if (error) throw error
  return data
}

// ─── exam_papers table ───────────────────────────────────────────────────────

export async function fetchPapersByExamIds(examIds: string[]): Promise<ExamPaper[]> {
  if (examIds.length === 0) return []
  const { data, error } = await supabase
    .from('exam_papers')
    .select('id, exam_id, paper_name, stage, total_questions, total_marks, duration_minutes, negative_marking, negative_mark_value, display_order')
    .in('exam_id', examIds)
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data || []) as ExamPaper[]
}

export async function findPaperById(paperId: string): Promise<ExamPaper | null> {
  const { data, error } = await supabase
    .from('exam_papers')
    .select('*')
    .eq('id', paperId)
    .single()
  if (error) throw error
  return data as ExamPaper
}

export async function fetchPapersByExamId(examId: string): Promise<ExamPaper[]> {
  const { data, error } = await supabase
    .from('exam_papers')
    .select('*')
    .eq('exam_id', examId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data || []) as ExamPaper[]
}

export async function fetchPaperIdsAndNames(examIds: string[]): Promise<PaperIdAndNameRow[] | null> {
  const { data, error } = await supabase
    .from('exam_papers')
    .select('id, exam_id, paper_name')
    .in('exam_id', examIds)
  if (error) throw error
  return data
}

// ─── exam_subjects table ─────────────────────────────────────────────────────

export async function fetchSubjectsByPaperId(paperId: string): Promise<ExamSubject[] | null> {
  const { data, error } = await supabase
    .from('exam_subjects')
    .select('*')
    .eq('paper_id', paperId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data as ExamSubject[] | null
}

export async function fetchSubjectsByExamId(
  examId: string,
  paperId?: string | null
): Promise<ExamSubject[] | null> {
  let query = supabase
    .from('exam_subjects')
    .select('*')
    .eq('exam_id', examId)
  if (paperId) query = query.eq('paper_id', paperId)
  const { data, error } = await query.order('display_order', { ascending: true })
  if (error) throw error
  return data as ExamSubject[] | null
}

export async function fetchSubjectNamesByExam(examIds: string[]): Promise<SubjectNameRow[] | null> {
  const { data, error } = await supabase
    .from('exam_subjects')
    .select('subject_name')
    .in('exam_id', examIds)
    .order('display_order', { ascending: true })
    .limit(200)
  if (error) throw error
  return data
}

export async function fetchSubjectNamesByPaper(paperId: string): Promise<SubjectNameRow[] | null> {
  const { data, error } = await supabase
    .from('exam_subjects')
    .select('subject_name')
    .eq('paper_id', paperId)
    .order('display_order', { ascending: true })
    .limit(100)
  if (error) throw error
  return data
}

export async function fetchSubjectCountsByExam(examIds: string[], paperId?: string): Promise<SubjectCountRow[] | null> {
  let query = supabase
    .from('question_counts')
    .select('subject_name, count')
    .in('exam_id', examIds)
  if (paperId) query = query.eq('paper_id', paperId)
  query = query.limit(200)
  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * DB-side aggregate of active questions per topic. Uses the `topic_counts`
 * view (security_invoker=on, anon SELECT revoked) — replaces the previous
 * client-side aggregation that capped at 200 rows and could undercount
 * subjects that exceed that limit.
 */
export async function fetchTopicCountsByExam(
  examIds: string[],
  subjectName: string,
  paperId?: string
): Promise<TopicCountViewRow[] | null> {
  if (examIds.length === 0 || !subjectName) return []
  let query = supabase
    .from('topic_counts')
    .select('exam_id, paper_id, subject_name, topic_en, count')
    .in('exam_id', examIds)
    .eq('subject_name', subjectName)
  if (paperId) query = query.eq('paper_id', paperId)
  query = query.limit(200)
  const { data, error } = await query
  if (error) throw error
  return data
}

export type ExamTopicRecordRow = {
  id: string
  exam_id: string
  paper_id: string | null
  subject_name: string
  topic_en: string
  topic_te: string | null
}

// LIVE single-topic lookup keyed by canonical exam_topics.id. Route params may
// only ever supply the id — display names are resolved from this record, never
// trusted from the URL.
export async function fetchTopicById(topicId: string): Promise<ExamTopicRecordRow | null> {
  const { data, error } = await supabase
    .from('exam_topics')
    .select('id, exam_id, paper_id, subject_name, topic_en, topic_te')
    .eq('id', topicId)
    .limit(1)
  if (error) throw error
  return (data?.[0] as ExamTopicRecordRow) ?? null
}

export async function fetchSubjectsWithQuestionCount(paperIds: string[]): Promise<SubjectWithQuestionCountRow[] | null> {
  const { data, error } = await supabase
    .from('exam_subjects')
    .select('paper_id, subject_name, question_count')
    .in('paper_id', paperIds)
  if (error) throw error
  return data
}

export async function fetchSubjectMetadata(examIds: string[]): Promise<SubjectMetadataRow[] | null> {
  const { data, error } = await supabase
    .from('exam_subjects')
    .select('paper_id, subject_name')
    .in('exam_id', examIds)
    .limit(500)
  if (error) throw error
  return data
}

// ─── question_counts view ────────────────────────────────────────────────────

export async function fetchQuestionCountsByPapers(paperIds: string[]): Promise<QuestionCountByPaperRow[] | null> {
  const { data, error } = await supabase
    .from('question_counts')
    .select('paper_id, subject_name, count')
    .in('paper_id', paperIds)
  if (error) throw error
  return data
}

// ─── exam_topics table ──────────────────────────────────────────────────────

import { z } from 'zod'

const topicUpsertSchema = z.object({
  exam_id: z.string().min(1),
  paper_id: z.string().nullable(),
  subject_name: z.string().min(1),
  topic_en: z.string().min(1),
  topic_te: z.string().nullable(),
})

export async function upsertTopic(payload: {
  exam_id: string
  paper_id: string | null
  subject_name: string
  topic_en: string
  topic_te: string | null
}): Promise<void> {
  validateOrThrow(topicUpsertSchema, payload, 'upsertTopic')
  const { error } = await supabase
    .from('exam_topics')
    .upsert([payload], { onConflict: 'exam_id,paper_id,subject_name,topic_en', ignoreDuplicates: true })
  if (error) throw error
}

export async function fetchTopicsBySubject(
  examIds: string[],
  subjectName: string,
  paperId?: string
  ): Promise<ExamTopicRow[] | null> {
  let query = supabase
    .from('exam_topics')
    .select('id, topic_en, topic_te, display_order')
    .in('exam_id', examIds)
    .eq('subject_name', subjectName)
    .order('display_order', { ascending: true })
  if (paperId) query = query.eq('paper_id', paperId)
  query = query.limit(200)
  const { data, error } = await query
  if (error) throw error
  return data
}

// ─── Admin hierarchy management (LIVE tables; RLS is the final authority) ────

export async function insertExamPaper(payload: {
  exam_id: string
  paper_name: string
  stage: 'PRELIMS' | 'MAINS' | 'SINGLE'
  total_questions: number
  total_marks: number
  duration_minutes: number
  negative_marking: boolean
  negative_mark_value: number
  display_order?: number
}): Promise<ExamPaper> {
  const { data, error } = await supabase
    .from('exam_papers')
    .insert(payload)
    .select('id, exam_id, paper_name, stage, total_questions, total_marks, duration_minutes, negative_marking, negative_mark_value, display_order')
    .single()
  if (error) throw error
  return data as ExamPaper
}

export async function insertExamSubject(payload: {
  exam_id: string
  paper_id: string
  subject_name: string
  question_count: number
  marks_per_question: number
  display_order?: number
}): Promise<ExamSubject> {
  const { data, error } = await supabase
    .from('exam_subjects')
    .insert(payload)
    .select('id, exam_id, paper_id, subject_name, question_count, marks_per_question, display_order')
    .single()
  if (error) throw error
  return data as ExamSubject
}

export type CreatedTopicRow = {
  id: string
  exam_id: string
  paper_id: string | null
  subject_name: string
  topic_en: string
  topic_te: string | null
  display_order: number
}

// Strict create (no ignoreDuplicates): the canonical UNIQUE constraint
// uq (exam_id, paper_id, subject_name, topic_en) is the race-safe backstop.
export async function insertTopicStrict(payload: {
  exam_id: string
  paper_id: string | null
  subject_name: string
  topic_en: string
  topic_te: string | null
  display_order?: number
}): Promise<CreatedTopicRow> {
  const { data, error } = await supabase
    .from('exam_topics')
    .insert(payload)
    .select('id, exam_id, paper_id, subject_name, topic_en, topic_te, display_order')
    .single()
  if (error) throw error
  return data as CreatedTopicRow
}

export async function updateTopicNames(
  topicId: string,
  updates: { topic_en?: string; topic_te?: string | null }
): Promise<void> {
  const { error } = await supabase.from('exam_topics').update(updates).eq('id', topicId)
  if (error) throw error
}

export async function countActiveQuestionsForTopicSegment(
  examId: string,
  paperId: string | null,
  subjectName: string,
  topicEn: string
): Promise<number> {
  let query = supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', examId)
    .eq('subject_name', subjectName)
    .eq('topic_en', topicEn)
    .eq('is_active', true)
  query = paperId ? query.eq('paper_id', paperId) : query.is('paper_id', null)
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

export async function countPromptsForTopic(topicId: string): Promise<number> {
  const { count, error } = await supabase
    .from('prompt_templates')
    .select('id', { count: 'exact', head: true })
    .eq('topic_id', topicId)
  if (error) throw error
  return count ?? 0
}

// §37 sanctioned synchronization: when a canonical Telugu name changes and the
// topic has dependent questions, their denormalized display copy follows.
export async function syncQuestionTeluguForTopic(
  examId: string,
  paperId: string | null,
  subjectName: string,
  topicEn: string,
  newTe: string | null
): Promise<number> {
  let query = supabase
    .from('questions')
    .update({ topic_te: newTe })
    .eq('exam_id', examId)
    .eq('subject_name', subjectName)
    .eq('topic_en', topicEn)
  query = paperId ? query.eq('paper_id', paperId) : query.is('paper_id', null)
  const { error, count } = await query.select('id')
  if (error) throw error
  return count ?? 0
}

// ─── prompt_templates table ──────────────────────────────────────────────────
// D3: single reusable guard for prompt/topic segment integrity. Mirrors the
// LIVE composite FK fk_prompt_templates_topic_segment
//   prompt_templates(exam_id, paper_id, subject_name, topic_id)
//     → exam_topics(exam_id, paper_id, subject_name, id)
// so a cross-segment topic is rejected before persistence instead of surfacing
// as a raw constraint violation. Database remains the final authority.
export async function validatePromptTopicContext(ctx: {
  exam_id: string
  paper_id: string
  subject_name: string
  topic_id: string
}): Promise<void> {
  const { data, error } = await supabase
    .from('exam_topics')
    .select('id')
    .eq('id', ctx.topic_id)
    .eq('exam_id', ctx.exam_id)
    .eq('paper_id', ctx.paper_id)
    .eq('subject_name', ctx.subject_name)
    .limit(1)
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('Selected topic does not belong to the selected exam, paper and subject')
  }
}

export async function fetchPrompts(
  examId: string,
  paperId: string,
  subjectName: string,
  topicId?: string | null
): Promise<Record<string, unknown>[] | null> {
  let query = supabase
    .from('prompt_templates')
    .select('*')
    .eq('exam_id', examId)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
  // Topic-aware scoping happens DB-side (prompt_templates.topic_id) — never a
  // client-side filter over the whole subject collection.
  if (topicId) query = query.eq('topic_id', topicId)
  const { data, error } = await query
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function upsertPrompt(payload: Record<string, unknown>): Promise<void> {
  await validatePromptTopicContext({
    exam_id: String(payload.exam_id),
    paper_id: String(payload.paper_id),
    subject_name: String(payload.subject_name),
    topic_id: String(payload.topic_id),
  })
  if (payload.id) {
    const { id, ...updatePayload } = payload
    const { error } = await supabase
      .from('prompt_templates')
      .update(updatePayload)
      .eq('id', id as string)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('prompt_templates')
      .insert([payload])
    if (error) throw error
  }
}

export async function deletePromptById(id: string): Promise<void> {
  const { error } = await supabase
    .from('prompt_templates')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── RPCs ────────────────────────────────────────────────────────────────────

export async function createNewExamRpc(examData: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.rpc('create_new_exam_rpc', { p_exam: examData })
  if (error) throw error
}

// ─── Per-topic configuration RPCs ─────────────────────────────────────────────

export type TopicConfigRow = {
  id: string
  topic_en: string
  topic_te: string | null
  display_order: number
  required_questions: number
  test_20_required: number
  test_30_required: number
  test_50_required: number
  actual_count: number
}

export async function fetchTopicConfiguration(
  examId: string,
  paperId: string,
  subjectName: string
): Promise<TopicConfigRow[]> {
  const { data, error } = await supabase.rpc('fetch_topic_configuration', {
    p_exam_id: examId,
    p_paper_id: paperId,
    p_subject_name: subjectName,
  })
  if (error) throw error
  return (data ?? []) as TopicConfigRow[]
}

export async function saveSubjectTestConfiguration(
  examId: string,
  paperId: string,
  subjectName: string,
  mode: '20' | '30' | '50',
  topics: { topic_id: string; required_questions: number }[]
): Promise<void> {
  const { error } = await supabase.rpc('save_subject_test_configuration', {
    p_exam_id: examId,
    p_paper_id: paperId,
    p_subject_name: subjectName,
    p_mode: mode,
    p_topics: topics,
  })
  if (error) throw error
}

/* ─── Admin Settings atomic full-save (EXAMS mode) ────────────────────────────
 * Single-transaction replacement for the legacy multi-write sequence
 * (paper/config update → papers sync → subjects batch → per-subject topic
 * RPCs). Any failure inside public.save_admin_settings_rpc rolls back the
 * ENTIRE save, eliminating partial persistence. */

export type AdminSettingsSaveResult = {
  ok: boolean
  configs_updated: number
  papers_updated: number
  subjects_updated: number
  topics_updated: number
}

export type AdminSettingsAtomicPayload = {
  examId: string
  /** null → exam-level save (config row + ALL papers synced); otherwise a
   *  single paper row is updated. */
  paperId: string | null
  config: {
    total_questions: number
    total_marks: number
    duration_minutes: number
    negative_marking: boolean
    negative_mark_value: number
    is_published?: boolean
    allow_multiple_attempts?: boolean
  }
  subjects: { id: string; question_count?: number; marks_per_question?: number }[]
  topics: {
    paper_id: string | null
    subject_name: string
    topics: { topic_id: string; required_questions: number }[]
  }[]
}

export async function saveAdminSettingsAtomic(
  payload: AdminSettingsAtomicPayload
): Promise<AdminSettingsSaveResult> {
  const { data, error } = await supabase.rpc('save_admin_settings_rpc', {
    p_mode: 'exams',
    p_exam_id: payload.examId,
    p_paper_id: payload.paperId,
    p_config: payload.config,
    p_subjects: payload.subjects,
    p_topics: payload.topics,
  })
  if (error) throw error
  return data as AdminSettingsSaveResult
}
