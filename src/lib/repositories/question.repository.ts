import { supabase } from '../supabase'
import type { Question } from '../../types/exam.types'
import { SingleQuestionSchema } from '../../validations/questionSchema'
import { validateOrThrow } from '../utils/validateOrThrow'

// ─── questions table ─────────────────────────────────────────────────────────

export const EXAM_QUESTION_SECURE_FIELDS = [
  'id', 'exam_id', 'paper_id', 'subject_name',
  'difficulty', 'negative_marks',
  'visual',
  'question_text_en', 'option_a_en', 'option_b_en', 'option_c_en', 'option_d_en',
  'question_text_te', 'option_a_te', 'option_b_te', 'option_c_te', 'option_d_te',
].join(', ')

export async function fetchQuestionsByPaperAndSubject(
  selectFields: string,
  paperId: string,
  subjectName: string,
  examIds: string[],
  limit: number
): Promise<Partial<Question>[] | null> {
  let query = supabase
    .from('questions')
    .select(selectFields)
    .eq('is_active', true)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
    .in('exam_id', examIds)
  query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data as Partial<Question>[] | null
}

export async function fetchQuestionsByPaperAndSubjectExcluding(
  selectFields: string,
  paperId: string,
  subjectName: string,
  examIds: string[],
  excludeIds: string[],
  limit: number
): Promise<Partial<Question>[] | null> {
  let query = supabase
    .from('questions')
    .select(selectFields)
    .eq('is_active', true)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
    .in('exam_id', examIds)
  if (excludeIds.length > 0) {
    query = query.notIn('id', excludeIds)
  }
  query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data as Partial<Question>[] | null
}

export async function fetchQuestionsByPaperAndSubjectIncluding(
  selectFields: string,
  paperId: string,
  subjectName: string,
  examIds: string[],
  includeIds: string[],
  limit: number
): Promise<Partial<Question>[] | null> {
  const uniqueIncludeIds = [...new Set(includeIds)]
  const query = supabase
    .from('questions')
    .select(selectFields)
    .eq('is_active', true)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
    .in('exam_id', examIds)
    .in('id', uniqueIncludeIds)
    .limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data as Partial<Question>[] | null
}

export async function fetchQuestionsBySubject(
  selectFields: string,
  subjectName: string,
  examIds: string[],
  paperId: string | undefined,
  excludeIds: string[],
  limit: number
): Promise<Partial<Question>[] | null> {
  let query = supabase
    .from('questions')
    .select(selectFields)
    .eq('is_active', true)
    .eq('subject_name', subjectName)
    .in('exam_id', examIds)
  if (paperId) query = query.eq('paper_id', paperId)
  if (excludeIds.length > 0) {
    query = query.notIn('id', excludeIds)
  }
  query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data as Partial<Question>[] | null
}

export async function fetchQuestionsBySubjectIncluding(
  selectFields: string,
  subjectName: string,
  examIds: string[],
  paperId: string | undefined,
  includeIds: string[],
  limit: number
): Promise<Partial<Question>[] | null> {
  const uniqueIncludeIds = [...new Set(includeIds)]
  let query = supabase
    .from('questions')
    .select(selectFields)
    .eq('is_active', true)
    .eq('subject_name', subjectName)
    .in('exam_id', examIds)
    .in('id', uniqueIncludeIds)
  if (paperId) query = query.eq('paper_id', paperId)
  query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data as Partial<Question>[] | null
}

export async function fetchQuestionsByTopic(
  selectFields: string,
  subjectName: string,
  topicName: string,
  examIds: string[],
  paperId: string | undefined,
  limit: number
): Promise<Partial<Question>[] | null> {
  let query = supabase
    .from('questions')
    .select(selectFields)
    .eq('is_active', true)
    .eq('subject_name', subjectName)
    .eq('topic_en', topicName)
    .in('exam_id', examIds)
  if (paperId) query = query.eq('paper_id', paperId)
  query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data as Partial<Question>[] | null
}

export async function fetchDistinctTopics(
  examIds: string[],
  subjectName: string,
  paperId?: string
): Promise<{ topic_en: string; topic_te: string | null }[] | null> {
  let query = supabase
    .from('questions')
    .select('topic_en, topic_te')
    .in('exam_id', examIds)
    .eq('subject_name', subjectName)
    .eq('is_active', true)
    .not('topic_en', 'is', null)
  if (paperId) query = query.eq('paper_id', paperId)
  query = query.limit(200)
  const { data, error } = await query
  if (error) throw error
  return data
}

// ─── Admin question CRUD ─────────────────────────────────────────────────────

/**
 * Admin/sub-admin question listing via the role-gated SECURITY DEFINER RPC.
 * The answer-bearing `questions` columns are revoked from the authenticated
 * role (F-07), so the admin list reads them through this RPC only.
 */
export async function adminListQuestionsRpc(params: {
  resolvedIds: string[]
  selectedPaper: string
  selectedSubject: string
  /** Canonical exam_topics topic_en to scope the rows to (null/'all' = every topic). */
  selectedTopic: string | null
  difficultyFilter: string
  /** True scopes rows to questions carrying a valid canonical visual (server-side). */
  visualOnly: boolean
  searchQuery: string
  offset: number
  pageSize: number
  sortColumn?: string
  sortAscending?: boolean
}): Promise<{ data: Question[] | null; count: number | null }> {
  const { data, error } = await supabase.rpc('admin_list_questions', {
    p_exam_ids: params.resolvedIds.length > 0 ? params.resolvedIds : null,
    p_paper_id: params.selectedPaper,
    p_subject_name: params.selectedSubject,
    p_topic_en: params.selectedTopic && params.selectedTopic !== 'all' ? params.selectedTopic : null,
    p_difficulty: params.difficultyFilter,
    p_search: params.searchQuery,
    p_sort_column: params.sortColumn ?? 'updated_at',
    p_ascending: params.sortAscending ?? false,
    p_offset: params.offset,
    p_limit: params.pageSize,
    p_visual_only: params.visualOnly,
  })
  if (error) throw error
  const payload = data as unknown as { count?: number | null; rows?: unknown[] | null }
  return { data: (payload?.rows ?? []) as unknown as Question[] | null, count: payload?.count ?? null }
}

export async function upsertQuestion(payload: Record<string, unknown>): Promise<{ inserted: boolean }> {
  validateOrThrow(SingleQuestionSchema, payload, 'upsertQuestion')
  const { data, error } = await supabase
    .from('questions')
    .upsert([payload], { onConflict: 'content_hash', ignoreDuplicates: true })
    .select('id')
  if (error) throw error
  // DEF-5: data is non-empty array if inserted, empty/null if duplicate
  return { inserted: !!(data && data.length > 0) }
}

export async function updateQuestion(id: string, payload: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('questions').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) throw error
}

export async function bulkDeleteQuestions(ids: string[]): Promise<void> {
  const { error } = await supabase.from('questions').delete().in('id', ids)
  if (error) throw error
}

export async function findVelocityReferencedQuestionIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('exam_velocity_logs')
    .select('question_id')
    .in('question_id', ids)
  if (error) throw error
  return [...new Set((data ?? []).map(r => r.question_id).filter((v): v is string => Boolean(v)))]
}

export async function deactivateQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/**
 * Post-completion full question definitions for CONTENT-attempt review.
 * Ownership + completion gated inside get_content_review_questions.
 * The answer-bearing columns are revoked from REST (F-07) — this is the only
 * user-facing read path for them during review.
 */
export async function fetchContentReviewQuestionsRpc(attemptId: string): Promise<Partial<Question>[] | null> {
  const { data, error } = await supabase.rpc('get_content_review_questions', {
    p_attempt_id: attemptId,
  })
  if (error) throw error
  return (data ?? []) as unknown as Partial<Question>[] | null
}

// ─── Prepare & Write locked flow (F-01) ─────────────────────────────────────
// The answer-bearing practice RPC is DROPPED server-side. Prepare & Write now
// uses two server-authoritative SECURITY DEFINER RPCs that never leak answers:
//   • prepare_exam_questions(p_paper_id)   → builds a locked, student-safe
//     question set (no correct_option / explanation_*) and persists it server-side.
//   • start_prepared_exam(p_preparation_id)→ consumes the locked snapshot into a
//     real attempt (source='prepare_write') using the EXACT same stored question
//     IDs. No client-supplied question injection is possible.

export interface PreparedExamQuestion {
  id: string
  exam_id: string
  paper_id: string
  subject_name: string
  difficulty: 'easy' | 'medium' | 'hard'
  question_text_en?: string | null
  question_text_te?: string | null
  topic_en?: string | null
  topic_te?: string | null
  option_a_en?: string | null
  option_a_te?: string | null
  option_b_en?: string | null
  option_b_te?: string | null
  option_c_en?: string | null
  option_c_te?: string | null
  option_d_en?: string | null
  option_d_te?: string | null
  visual?: Question['visual'] | null
  created_at?: string | null
}

export interface PrepareExamQuestionsResult {
  preparation_id: string
  exam_id: string
  paper_id: string
  question_count: number
  expires_at: string
  questions: PreparedExamQuestion[]
}

export interface StartPreparedExamResult {
  attempt_id: string
  is_resumed: boolean
  exam_id: string
  paper_id: string
  question_count: number
  questions: PreparedExamQuestion[]
}

/**
 * Server-selected, locked question set for the preparation phase.
 * Answers and explanations are never returned.
 */
export async function prepareExamQuestionsRpc(paperId: string): Promise<PrepareExamQuestionsResult> {
  const { data, error } = await supabase.rpc('prepare_exam_questions', {
    p_paper_id: paperId,
  })
  if (error) throw error
  return data as PrepareExamQuestionsResult
}

/**
 * Consumes the prepared snapshot into a real graded attempt (source=prepare_write).
 */
export async function startPreparedExamRpc(preparationId: string): Promise<StartPreparedExamResult> {
  const { data, error } = await supabase.rpc('start_prepared_exam', {
    p_preparation_id: preparationId,
  })
  if (error) throw error
  return data as StartPreparedExamResult
}

/**
 * Bulk-path insert with EXPLICIT duplicate detection (M1 decision — Option A).
 *
 * Contract: a content_hash conflict NEVER overwrites the stored question.
 * PostgREST has no "detect but don't touch" resolution, so duplicate
 * accounting uses the supported conflict semantics:
 *   ignoreDuplicates:true → ON CONFLICT DO NOTHING → only NEW rows come back.
 *   Empty result ⇒ the row already existed ⇒ { inserted: false }.
 *
 * The service layer (bulkInsertQuestions) maps inserted:false → duplicated++
 * and reports it to the admin; nothing is silently rewritten last-write-wins.
 */
export async function upsertQuestionNoIgnore(payload: Record<string, unknown>): Promise<{ inserted: boolean }> {
  validateOrThrow(SingleQuestionSchema, payload, 'upsertQuestionNoIgnore')
  const { data, error } = await supabase
    .from('questions')
    .upsert([payload], { onConflict: 'content_hash', ignoreDuplicates: true })
    .select('id')
  if (error) throw error
  // DEF-5: data is non-empty array if inserted, empty/null if duplicate
  return { inserted: !!(data && data.length > 0) }
}

/**
 * F-01 privilege-lockdown contract: the `authenticated` role holds COLUMN-level
 * (not table-level) SELECT on `questions` — answer-bearing columns
 * (correct_option, explanation_*) are revoked. A `select('*')` would request
 * the revoked columns and PostgREST returns 403 (42501) for the whole query,
 * which surfaced as the admin-upload "Couldn't load the question count" error.
 * Like every other head-count here (see exam.repository countActiveQuestionsForTopicSegment),
 * count on an explicitly granted, non-answer column (`id`).
 */
export async function countQuestionsByFilter(params: {
  examId: string
  paperId: string
  subjectName: string
}): Promise<number | null> {
  const { count, error } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', params.examId)
    .eq('paper_id', params.paperId)
    .eq('subject_name', params.subjectName)
    .eq('is_active', true)
  if (error) throw error
  return count
}
