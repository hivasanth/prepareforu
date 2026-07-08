import { supabase } from '../supabase'

// ─── questions table ─────────────────────────────────────────────────────────

export async function fetchQuestionsByPaperAndSubject(
  selectFields: string,
  paperId: string,
  subjectName: string,
  examIds: string[],
  limit: number
): Promise<any[]> {
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
  return data || []
}

export async function fetchQuestionsByPaperAndSubjectExcluding(
  selectFields: string,
  paperId: string,
  subjectName: string,
  examIds: string[],
  excludeIds: string[],
  limit: number
): Promise<any[]> {
  let query = supabase
    .from('questions')
    .select(selectFields)
    .eq('is_active', true)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
    .in('exam_id', examIds)
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }
  query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchQuestionsByPaperAndSubjectIncluding(
  selectFields: string,
  paperId: string,
  subjectName: string,
  examIds: string[],
  includeIds: string[],
  limit: number
): Promise<any[]> {
  let query = supabase
    .from('questions')
    .select(selectFields)
    .eq('is_active', true)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
    .in('exam_id', examIds)
    .in('id', includeIds)
    .limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchQuestionsBySubject(
  selectFields: string,
  subjectName: string,
  examIds: string[],
  paperId: string | undefined,
  excludeIds: string[],
  limit: number
): Promise<any[]> {
  let query = supabase
    .from('questions')
    .select(selectFields)
    .eq('is_active', true)
    .eq('subject_name', subjectName)
    .in('exam_id', examIds)
  if (paperId) query = query.eq('paper_id', paperId)
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }
  query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchQuestionsBySubjectIncluding(
  selectFields: string,
  subjectName: string,
  examIds: string[],
  paperId: string | undefined,
  includeIds: string[],
  limit: number
): Promise<any[]> {
  let query = supabase
    .from('questions')
    .select(selectFields)
    .eq('is_active', true)
    .eq('subject_name', subjectName)
    .in('exam_id', examIds)
    .in('id', includeIds)
  if (paperId) query = query.eq('paper_id', paperId)
  query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchQuestionsByTopic(
  selectFields: string,
  subjectName: string,
  topicName: string,
  examIds: string[],
  paperId: string | undefined,
  limit: number
): Promise<any[]> {
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
  return data || []
}

export async function fetchDistinctTopics(
  examIds: string[],
  subjectName: string,
  paperId?: string
): Promise<any[]> {
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
  return data || []
}

export async function fetchTopicCounts(
  examIds: string[],
  subjectName: string,
  paperId?: string
): Promise<any[]> {
  let query = supabase
    .from('questions')
    .select('topic_en')
    .in('exam_id', examIds)
    .eq('subject_name', subjectName)
    .eq('is_active', true)
    .not('topic_en', 'is', null)
  if (paperId) query = query.eq('paper_id', paperId)
  query = query.limit(200)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

// ─── Admin question CRUD ─────────────────────────────────────────────────────

export async function listQuestions(params: {
  resolvedIds: string[]
  selectedPaper: string
  selectedSubject: string
  difficultyFilter: string
  searchQuery: string
  offset: number
  pageSize: number
}): Promise<{ data: any[]; count: number }> {
  let q = supabase.from('questions').select('*', { count: 'exact' })
  if (params.resolvedIds.length > 0) q = q.in('exam_id', params.resolvedIds)
  if (params.selectedPaper !== 'all') q = q.eq('paper_id', params.selectedPaper)
  if (params.selectedSubject !== 'all') q = q.eq('subject_name', params.selectedSubject)
  if (params.difficultyFilter !== 'all') q = q.eq('difficulty', params.difficultyFilter)
  if (params.searchQuery.trim()) {
    q = q.ilike('question_text_en', `%${params.searchQuery.trim()}%`)
  }
  q = q.order('updated_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
  q = q.range(params.offset, params.offset + params.pageSize - 1)
  const { data, count, error } = await q
  if (error) throw error
  return { data: (data as any[]) || [], count: count || 0 }
}

export async function upsertQuestion(payload: any): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .upsert([payload], { onConflict: 'content_hash', ignoreDuplicates: true })
  if (error) throw error
}

export async function updateQuestion(id: string, payload: any): Promise<void> {
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

export async function upsertQuestionBulk(payload: any[]) {
  for (const q of payload) {
    const { error } = await supabase
      .from('questions')
      .upsert(q, { onConflict: 'content_hash' })
    if (error) throw error
  }
}

export async function upsertQuestionNoIgnore(payload: any): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .upsert(payload, { onConflict: 'content_hash' })
  if (error) throw error
}

export async function fetchQuestionMeta(id: string): Promise<any> {
  const { data, error } = await supabase
    .from('questions')
    .select('exam_id, paper_id, subject_name, topic_en, topic_te')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}
