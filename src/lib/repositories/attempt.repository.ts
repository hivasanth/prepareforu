import { supabase } from '../supabase'
import type { Attempt, AttemptAnswer, SubmitResult, AttemptSource } from '../../types/exam.types'

// ─── attempts table ──────────────────────────────────────────────────────────

export async function findAttemptById(attemptId: string, userId: string): Promise<Attempt | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return data as Attempt
}

export async function findInProgressAttempt(params: {
  userId: string
  paperId?: string
  teacherExamId?: string
  examId?: string
  source?: AttemptSource
}): Promise<Attempt | null> {
  let query = supabase
    .from('attempts')
    .select('*')
    .eq('user_id', params.userId)
    .eq('status', 'in_progress')
  if (params.paperId) query = query.eq('paper_id', params.paperId)
  if (params.teacherExamId) query = query.eq('teacher_exam_id', params.teacherExamId)
  if (params.examId) query = query.eq('exam_id', params.examId)
  if (params.source) query = query.eq('source', params.source)
  const { data } = await query.maybeSingle()
  return data as Attempt | null
}

export async function upsertAttempt(attempt: {
  id?: string
  user_id: string
  exam_id?: string
  paper_id?: string
  teacher_exam_id?: string
  source: AttemptSource
  total_marks: number
  questions_snapshot: unknown[]
  status: string
  started_at: string
}): Promise<Attempt> {
  const { data, error } = await supabase
    .from('attempts')
    .upsert(attempt, { onConflict: 'id' })
    .select('*')
    .single()
  if (error) throw error
  return data as Attempt
}

export async function updateAttempt(id: string, updates: Partial<Attempt>): Promise<void> {
  const { error } = await supabase.from('attempts').update(updates).eq('id', id)
  if (error) throw error
}

export async function fetchAttemptsByUserId(userId: string, limit = 5000): Promise<{ id: string }[] | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select('id')
    .eq('user_id', userId)
    .limit(limit)
  if (error) throw error
  return data as { id: string }[] | null
}

export async function fetchDailyAttempts(
  range: { start: string; end: string },
  resolvedIds: string[]
): Promise<Record<string, unknown>[] | null> {
  let query = supabase
    .from('attempts')
    .select('started_at, exam_id')
    .eq('source', 'exam_tab')
    .gte('started_at', range.start)
    .lte('started_at', range.end)
  if (resolvedIds.length > 0) query = query.in('exam_id', resolvedIds)
  const { data, error } = await query.order('started_at', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchCompletedAttemptsByPaper(
  examId: string,
  paperId: string | undefined,
  threshold: string | null,
  limit = 2000
): Promise<Record<string, unknown>[] | null> {
  let query = supabase
    .from('attempts')
    .select(`
      user_id,
      score,
      accuracy,
      duration_seconds,
      submitted_at,
      users ( full_name )
    `)
    .eq('exam_id', examId)
    .eq('status', 'completed')
    .eq('source', 'exam_tab')
  if (paperId && paperId !== 'all') query = query.eq('paper_id', paperId)
  if (threshold) query = query.gte('submitted_at', threshold)
  const { data, error } = await query.limit(limit)
  if (error) throw error
  return data
}

export async function fetchCompletedAttemptsByTeacherExam(
  examId: string,
  limit = 200
): Promise<Record<string, unknown>[] | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select(`
      user_id,
      score,
      accuracy,
      duration_seconds,
      submitted_at,
      users ( full_name )
    `)
    .eq('teacher_exam_id', examId)
    .eq('status', 'completed')
    .order('score', { ascending: false })
    .order('duration_seconds', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data
}

export async function fetchAttemptsWithUsersByTeacherExam(
  examId: string,
  limit = 200
): Promise<Record<string, unknown>[] | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select(`
      id,
      user_id,
      score,
      total_marks,
      correct_count,
      wrong_count,
      skipped_count,
      accuracy,
      duration_seconds,
      submitted_at,
      status,
      users ( full_name, email )
    `)
    .eq('teacher_exam_id', examId)
    .in('status', ['completed', 'auto_submitted'])
    .order('score', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function fetchAttemptAnswersByAttemptIds(attemptIds: string[]): Promise<Record<string, unknown>[] | null> {
  const { data, error } = await supabase
    .from('attempt_answers')
    .select('question_id, selected_option, is_correct, attempt_id')
    .in('attempt_id', attemptIds)
  if (error) throw error
  return data
}

export async function fetchAttemptsByTeacherExamIds(examIds: string[], limit = 50): Promise<Record<string, unknown>[] | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select('*, users(full_name)')
    .in('teacher_exam_id', examIds)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function fetchAttemptsForStudents(
  studentIds: string[],
  subAdminId: string,
  limit = 10000
): Promise<Record<string, unknown>[] | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select(`
      id,
      score,
      duration_seconds,
      submitted_at,
      user_id,
      teacher_exams!inner (
        title,
        total_questions
      )
    `)
    .in('user_id', studentIds)
    .eq('teacher_exams.sub_admin_id', subAdminId)
    .limit(limit)
  if (error) throw error
  return data
}

export async function fetchPerformanceAttempts(
  userId: string
): Promise<Record<string, unknown>[] | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select(`
      id,
      paper_id,
      exam_id,
      score,
      accuracy,
      correct_count,
      wrong_count,
      skipped_count,
      submitted_at,
      exam_papers ( paper_name )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .eq('source', 'exam_tab')
    .order('submitted_at', { ascending: true })
    .limit(500)
  if (error) throw error
  return data
}

export async function fetchTeacherExamAttempts(
  examId: string,
  limit = 50
): Promise<Record<string, unknown>[] | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select('*, users(full_name)')
    .eq('teacher_exam_id', examId)
    .eq('status', 'completed')
    .order('score', { ascending: false })
    .order('duration_seconds', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data
}

// ─── attempt_answers table ──────────────────────────────────────────────────

export async function findAnswersByAttemptId(attemptId: string): Promise<AttemptAnswer[] | null> {
  const { data, error } = await supabase
    .from('attempt_answers')
    .select('*')
    .eq('attempt_id', attemptId)
  if (error) throw error
  return data as AttemptAnswer[] | null
}

export async function findAnsweredQuestionIds(attemptIds: string[]): Promise<{ question_id: string }[] | null> {
  const { data, error } = await supabase
    .from('attempt_answers')
    .select('question_id')
    .in('attempt_id', attemptIds)
  if (error) throw error
  return data as { question_id: string }[] | null
}

export async function fetchPerformanceAnswers(attemptIds: string[]): Promise<Record<string, unknown>[] | null> {
  const { data, error } = await supabase
    .from('attempt_answers')
    .select(`
      attempt_id,
      is_correct,
      questions ( subject_name )
    `)
    .in('attempt_id', attemptIds)
    .limit(5000)
  if (error) throw error
  return data
}

// ─── RPCs ────────────────────────────────────────────────────────────────────

export async function submitAttemptRpc(attemptId: string, signal?: AbortSignal): Promise<SubmitResult> {
  let req = supabase.rpc('submit_attempt', { p_attempt_id: attemptId })
  if (signal) req = req.abortSignal(signal)
  const { data, error } = await req
  if (error) throw error
  return data as SubmitResult
}

export async function touchQuestionVisitRpc(
  attemptId: string,
  questionId: string,
  correctOption: string
): Promise<void> {
  const { error } = await supabase.rpc('touch_question_visit', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_correct_option: correctOption,
  })
  if (error) throw error
}

export async function setQuestionAnswerRpc(
  attemptId: string,
  questionId: string,
  selectedOption: string | null,
  correctOption: string,
  marksPerQuestion: number,
  negativeMarkValue: number
): Promise<void> {
  const { error } = await supabase.rpc('set_question_answer', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_selected_option: selectedOption,
    p_correct_option: correctOption,
    p_marks_per_question: marksPerQuestion,
    p_negative_mark_value: negativeMarkValue,
  })
  if (error) throw error
}

export async function setQuestionReviewRpc(
  attemptId: string,
  questionId: string,
  correctOption: string,
  marked: boolean
): Promise<void> {
  const { error } = await supabase.rpc('set_question_review', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_correct_option: correctOption,
    p_marked: marked,
  })
  if (error) throw error
}

export async function addQuestionTimeRpc(
  attemptId: string,
  questionId: string,
  correctOption: string,
  seconds: number
): Promise<void> {
  const { error } = await supabase.rpc('add_question_time', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_correct_option: correctOption,
    p_seconds: seconds,
  })
  if (error) throw error
}
