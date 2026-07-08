import { supabase } from '../supabase'
import type { ExamConfig, ExamPaper, ExamSubject } from '../../types/exam.types'

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

export async function updateExamConfigById(examId: string, updates: Partial<ExamConfig>): Promise<void> {
  const { error } = await supabase.from('exam_configs').update(updates).eq('exam_id', examId)
  if (error) throw error
}

export async function fetchExamConfigsByIds(ids: string[]): Promise<any[]> {
  const { data, error } = await supabase
    .from('exam_configs')
    .select('*')
    .in('exam_id', ids)
    .limit(200)
  if (error) throw error
  return data || []
}

export async function fetchExamConfigNames(ids: string[]): Promise<any[]> {
  const { data, error } = await supabase
    .from('exam_configs')
    .select('exam_id, name')
    .in('exam_id', ids)
  if (error) throw error
  return data || []
}

export async function fetchExamConfigNamesWithSelection(ids: string[]): Promise<any[]> {
  const { data, error } = await supabase
    .from('exam_configs')
    .select('exam_id, name, exam_selection')
    .in('exam_id', ids)
    .limit(200)
  if (error) throw error
  return data || []
}

export async function fetchExamConfigsByIdsLimited(ids: string[], select: string, limit = 50): Promise<any[]> {
  const { data, error } = await supabase
    .from('exam_configs')
    .select(select)
    .in('exam_id', ids)
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function fetchMinQuestions(examIds: string[]): Promise<any[]> {
  const { data, error } = await supabase
    .from('exam_configs')
    .select('min_questions')
    .in('exam_id', examIds)
    .limit(50)
  if (error) throw error
  return data || []
}

// ─── exam_papers table ───────────────────────────────────────────────────────

export async function fetchPapersByExamIds(examIds: string[]): Promise<ExamPaper[]> {
  const { data, error } = await supabase
    .from('exam_papers')
    .select('*')
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

export async function updatePaperById(paperId: string, updates: Partial<ExamPaper>): Promise<void> {
  const { error } = await supabase.from('exam_papers').update(updates).eq('id', paperId)
  if (error) throw error
}

export async function syncPapersFromConfig(
  examId: string,
  updates: Pick<ExamConfig, 'total_questions' | 'total_marks' | 'duration_minutes' | 'negative_marking' | 'negative_mark_value'>
): Promise<void> {
  const { error } = await supabase
    .from('exam_papers')
    .update({
      total_questions: updates.total_questions,
      total_marks: updates.total_marks,
      duration_minutes: updates.duration_minutes,
      negative_marking: updates.negative_marking,
      negative_mark_value: updates.negative_mark_value,
    })
    .eq('exam_id', examId)
  if (error) throw error
}

export async function fetchPaperIdsAndNames(examIds: string[]): Promise<any[]> {
  const { data, error } = await supabase
    .from('exam_papers')
    .select('id, exam_id, paper_name')
    .in('exam_id', examIds)
  if (error) throw error
  return data || []
}

// ─── exam_subjects table ─────────────────────────────────────────────────────

export async function fetchSubjectsByPaperId(paperId: string): Promise<ExamSubject[]> {
  const { data, error } = await supabase
    .from('exam_subjects')
    .select('*')
    .eq('paper_id', paperId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data || []) as ExamSubject[]
}

export async function fetchSubjectsByExamId(
  examId: string,
  paperId?: string | null
): Promise<ExamSubject[]> {
  let query = supabase
    .from('exam_subjects')
    .select('*')
    .eq('exam_id', examId)
  if (paperId) query = query.eq('paper_id', paperId)
  const { data, error } = await query.order('display_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchSubjectNamesByExam(examIds: string[]): Promise<string[]> {
  const { data, error } = await supabase
    .from('exam_subjects')
    .select('subject_name')
    .in('exam_id', examIds)
    .order('display_order', { ascending: true })
    .limit(200)
  if (error) throw error
  const names = (data as any[])?.map((s: any) => s.subject_name).filter(Boolean)
  return Array.from(new Set(names)) as string[]
}

export async function fetchSubjectNamesByPaper(paperId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('exam_subjects')
    .select('subject_name')
    .eq('paper_id', paperId)
    .order('display_order', { ascending: true })
    .limit(100)
  if (error) throw error
  const names = (data as any[])?.map((s: any) => s.subject_name).filter(Boolean)
  return Array.from(new Set(names)) as string[]
}

export async function fetchSubjectCountsByExam(examIds: string[], paperId?: string): Promise<any[]> {
  let query = supabase
    .from('question_counts')
    .select('subject_name, count')
    .in('exam_id', examIds)
  if (paperId) query = query.eq('paper_id', paperId)
  query = query.limit(200)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchSubjectsWithQuestionCount(paperIds: string[]): Promise<any[]> {
  const { data, error } = await supabase
    .from('exam_subjects')
    .select('paper_id, subject_name, question_count')
    .in('paper_id', paperIds)
  if (error) throw error
  return data || []
}

export async function fetchSubjectMetadata(examIds: string[]): Promise<any[]> {
  const { data, error } = await supabase
    .from('exam_subjects')
    .select('paper_id, subject_name')
    .in('exam_id', examIds)
    .limit(500)
  if (error) throw error
  return data || []
}

// ─── question_counts view ────────────────────────────────────────────────────

export async function fetchQuestionCountsByPapers(paperIds: string[]): Promise<any[]> {
  const { data, error } = await supabase
    .from('question_counts')
    .select('paper_id, subject_name, count')
    .in('paper_id', paperIds)
  if (error) throw error
  return data || []
}

// ─── exam_topics table ──────────────────────────────────────────────────────

export async function upsertTopic(payload: {
  exam_id: string
  paper_id: string | null
  subject_name: string
  topic_en: string
  topic_te: string | null
}): Promise<void> {
  const { error } = await supabase
    .from('exam_topics')
    .upsert([payload], { onConflict: 'exam_id,paper_id,subject_name,topic_en', ignoreDuplicates: true })
  if (error) throw error
}

export async function fetchTopicsBySubject(
  examIds: string[],
  subjectName: string,
  paperId?: string
): Promise<any[]> {
  let query = supabase
    .from('exam_topics')
    .select('topic_en, topic_te, display_order')
    .in('exam_id', examIds)
    .eq('subject_name', subjectName)
    .order('display_order', { ascending: true })
  if (paperId) query = query.eq('paper_id', paperId)
  query = query.limit(200)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

// ─── prompt_templates table ──────────────────────────────────────────────────

export async function fetchPrompts(
  examId: string,
  paperId: string,
  subjectName: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('exam_id', examId)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function upsertPrompt(payload: any): Promise<void> {
  if (payload.id) {
    const { id, ...updatePayload } = payload
    const { error } = await supabase
      .from('prompt_templates')
      .update(updatePayload)
      .eq('id', id)
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

export async function createNewExamRpc(examData: any): Promise<void> {
  const { error } = await supabase.rpc('create_new_exam_rpc', { p_exam: examData })
  if (error) throw error
}

export async function updateExamSubjectsBatchRpc(subjects: { id: string; question_count: number; marks_per_question: number }[]): Promise<void> {
  const { error } = await supabase.rpc('update_exam_subjects_batch', { p_subjects: subjects })
  if (error) throw error
}

// ─── Security Gateway ─────────────────────────────────────────────────────────

export async function invokeSecurityGateway(pathname: string): Promise<any> {
  const invokePromise = supabase.functions.invoke('security-gateway', {
    method: 'POST',
    body: { pathname }
  })
  return invokePromise
}
