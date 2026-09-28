import { supabase } from '../supabase'
import type { Attempt, AttemptAnswer, SubmitResult, AttemptSource } from '../../types/exam.types'

// ─── Domain row types for subset queries ────────────────────────────────────

type DailyAttemptRow = {
  started_at: string
  exam_id: string
}

type CompletedAttemptRow = {
  user_id: string
  score: number
  accuracy: number
  duration_seconds: number
  submitted_at: string
  users: { full_name: string } | null
}

type AttemptWithUserRow = {
  id: string
  user_id: string
  score: number
  total_marks: number
  correct_count: number
  wrong_count: number
  skipped_count: number
  accuracy: number
  duration_seconds: number
  submitted_at: string
  status: string
  users: { full_name: string; email: string } | null
}

type AttemptAnswerRow = {
  question_id: string
  selected_option: string | null
  is_correct: boolean | null
  attempt_id: string
}

type AttemptWithTeacherExamJoinedRow = Attempt & {
  teacher_exams: {
    title: string
    total_questions: number
    total_marks: number
  }
}

type AttemptWithUserJoinedRow = Attempt & {
  users: { full_name: string } | null
}

type PerformanceAttemptRow = {
  id: string
  paper_id: string
  exam_id: string
  score: number
  accuracy: number
  correct_count: number
  wrong_count: number
  skipped_count: number
  submitted_at: string
  review_accessed: boolean
  exam_papers: { paper_name: string } | null
}

export interface SubjectStatRow {
  subject_name: string
  correct: number
  total: number
  accuracy: number
}

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

export async function fetchAttemptsByUserId(userId: string, limit = 5000): Promise<{ id: string }[] | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select('id')
    .eq('user_id', userId)
    .limit(limit)
  if (error) throw error
  return data as { id: string }[] | null
}

/**
 * Fetches a single page of attempt IDs for a user with offset pagination.
 * Used by prepareWriteService for bounded complete retrieval of attempt IDs.
 */
export async function fetchAttemptsByPage(
  userId: string,
  limit: number,
  offset: number
): Promise<{ id: string }[] | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return data as { id: string }[] | null
}

export async function fetchDailyAttempts(
  range: { start: string; end: string },
  resolvedIds: string[]
): Promise<DailyAttemptRow[] | null> {
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
): Promise<CompletedAttemptRow[] | null> {
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
  return data as unknown as CompletedAttemptRow[] | null
}

export async function fetchAttemptsWithUsersByTeacherExam(
  examId: string,
  limit = 200
): Promise<AttemptWithUserRow[] | null> {
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
  return data as unknown as AttemptWithUserRow[] | null
}

// Exact aggregate count across the sub-admin's teacher exams. Deliberately
// separate from any list query: totals must never be derived from a limited
// recent-attempts page.
export async function countAttemptsByTeacherExamIds(examIds: string[]): Promise<number | null> {
  const { count, error } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .in('teacher_exam_id', examIds)
  if (error) throw error
  return count
}

export async function countAuthorizedAttempts(): Promise<number | null> {
  const { count, error } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count
}

export async function fetchAttemptsForStudents(
  studentIds: string[],
  subAdminId: string,
  limit = 10000
): Promise<AttemptWithTeacherExamJoinedRow[] | null> {
  // Note on scale: callers pass bounded student-id chunks (CHUNK_SIZE = 100 in
  // userService). `limit` is a per-query safety cap on a single school's exams,
  // NOT a pagination strategy; per-request boundedness comes from the id chunks.
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
        total_questions,
        total_marks
      )
    `)
    .in('user_id', studentIds)
    .eq('teacher_exams.sub_admin_id', subAdminId)
    .limit(limit)
  if (error) throw error
  return data as unknown as AttemptWithTeacherExamJoinedRow[] | null
}

// Shared base query for performance attempts (exam_tab, completed)
function buildPerformanceAttemptsQuery(userId: string) {
  return supabase
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
      review_accessed,
      exam_papers ( paper_name )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .eq('source', 'exam_tab')
}

export async function fetchPerformanceAttempts(
  userId: string
): Promise<PerformanceAttemptRow[] | null> {
  const { data, error } = await buildPerformanceAttemptsQuery(userId)
    .order('submitted_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return data as unknown as PerformanceAttemptRow[] | null
}

export async function fetchRecentAttempts(
  userId: string,
  examIds: string[],
  limit = 5
): Promise<PerformanceAttemptRow[] | null> {
  let query = buildPerformanceAttemptsQuery(userId)
    .order('submitted_at', { ascending: false })
    .limit(limit)

  if (examIds.length) {
    query = query.in('exam_id', examIds)
  }

  const { data, error } = await query
  if (error) throw error
  return data as unknown as PerformanceAttemptRow[] | null
}

export async function fetchTeacherExamAttempts(
  examId: string,
  limit = 50
): Promise<AttemptWithUserJoinedRow[] | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select('*, users(full_name)')
    .eq('teacher_exam_id', examId)
    .eq('status', 'completed')
    .order('score', { ascending: false })
    .order('duration_seconds', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data as unknown as AttemptWithUserJoinedRow[] | null
}

// ─── attempt_answers table ──────────────────────────────────────────────────

export async function findAnswersByAttemptId(attemptId: string): Promise<AttemptAnswer[] | null> {
  // F-01: only exam-state columns are readable via REST. is_correct /
  // marks_awarded are completion-gated behind get_attempt_review_answers.
  const { data, error } = await supabase
    .from('attempt_answers')
    .select('question_id, selected_option, time_spent_secs, visited, marked_for_review, last_visited_at')
    .eq('attempt_id', attemptId)
  if (error) throw error
  return data as AttemptAnswer[] | null
}

/**
 * Resolves answered question ids for the given attempt ids.
 *
 * The `attempt_id` set is chunked into bounded `.in()` batches so a user with
 * a large number of attempts never produces an oversized REST URL (HTTP 414).
 * Chunks do not overlap, so the merged result is exactly the union of rows
 * (no duplicates introduced here; upstream consumers dedupe via Set).
 * Ownership/RLS semantics are unchanged — the attempt ids are already scoped
 * to the calling user by `fetchAttemptsByUserId`.
 */
const ANSWER_ID_CHUNK_SIZE = 200;

export async function findAnsweredQuestionIds(attemptIds: string[]): Promise<{ question_id: string }[] | null> {
  if (!attemptIds.length) return [];
  const results: { question_id: string }[] = [];

  for (let i = 0; i < attemptIds.length; i += ANSWER_ID_CHUNK_SIZE) {
    const chunk = attemptIds.slice(i, i + ANSWER_ID_CHUNK_SIZE);
    const { data, error } = await supabase
      .from('attempt_answers')
      .select('question_id')
      .in('attempt_id', chunk)
    if (error) throw error
    if (data) results.push(...(data as { question_id: string }[]))
  }

  return results
}

export async function fetchUserAnswerSubjectStats(
  params: { examId?: string | null; paperId?: string | null; from?: string | null }
): Promise<SubjectStatRow[] | null> {
  const { data, error } = await supabase.rpc('get_user_performance_answer_stats', {
    p_exam_id: params.examId ?? null,
    p_paper_id: params.paperId ?? null,
    p_from: params.from ?? null,
  })
  if (error) throw error
  return data as SubjectStatRow[] | null
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
  questionId: string
): Promise<void> {
  const { error } = await supabase.rpc('touch_question_visit', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
  })
  if (error) throw error
}

export async function setQuestionAnswerRpc(
  attemptId: string,
  questionId: string,
  selectedOption: string | null
): Promise<void> {
  // Marks/negative are NOT client-supplied (R-2): the server derives them
  // authoritatively inside set_question_answer from exam_subjects / exam_papers
  // (or teacher_exams), so the RPC call carries only the selection.
  const { error } = await supabase.rpc('set_question_answer', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_selected_option: selectedOption,
  })
  if (error) throw error
}

export async function setQuestionReviewRpc(
  attemptId: string,
  questionId: string,
  marked: boolean
): Promise<void> {
  const { error } = await supabase.rpc('set_question_review', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_marked: marked,
  })
  if (error) throw error
}

export async function addQuestionTimeRpc(
  attemptId: string,
  questionId: string,
  seconds: number
): Promise<void> {
  const { error } = await supabase.rpc('add_question_time', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_seconds: seconds,
  })
  if (error) throw error
}

/**
 * F-01: post-completion per-question correctness. Ownership + completed status
 * are enforced inside get_attempt_review_answers (SECURITY DEFINER); the raw
 * is_correct / marks_awarded columns are revoked from REST.
 */
export async function fetchAttemptReviewAnswersRpc(attemptId: string): Promise<AttemptAnswer[] | null> {
  const { data, error } = await supabase.rpc('get_attempt_review_answers', {
    p_attempt_id: attemptId,
  })
  if (error) throw error
  return (data ?? []) as unknown as AttemptAnswer[] | null
}

/**
 * F-01: sub-admin per-question correctness for their own teacher exams.
 * Mirrors the answers_select_subadmin ownership semantics inside the RPC.
 */
export async function fetchSubadminAttemptAnswersRpc(attemptIds: string[]): Promise<AttemptAnswerRow[] | null> {
  const { data, error } = await supabase.rpc('get_subadmin_attempt_answers', {
    p_attempt_ids: attemptIds,
  })
  if (error) throw error
  return (data ?? []) as unknown as AttemptAnswerRow[] | null
}

// ─── Attempts Mutation RPCs (FIX-04) ─────────────────────────────────────────
// SECURITY DEFINER with ownership guards. One RPC per mutation purpose.

export async function markReviewAccessedRpc(attemptId: string, signal?: AbortSignal): Promise<void> {
  let req = supabase.rpc('mark_review_accessed', { p_attempt_id: attemptId })
  if (signal) req = req.abortSignal(signal)
  const { error } = await req
  if (error) throw error
}

export async function updateAnswersCacheRpc(attemptId: string, answersJson: Record<string, string | null>, signal?: AbortSignal): Promise<void> {
  let req = supabase.rpc('update_attempt_answers_cache', { p_attempt_id: attemptId, p_answers_json: answersJson })
  if (signal) req = req.abortSignal(signal)
  const { error } = await req
  if (error) throw error
}

/**
 * M-03 fix: atomically increments the server-authoritative tab-switch counter
 * and returns the new count. The count can no longer be set or suppressed by
 * the client — it is monotonic and owned by the database, so a user cannot
 * spoof a lower count or reset it to zero. (The previous client-settable
 * update_tab_switch_count RPC was removed in migration 20260904... because it
 * allowed a caller to arbitrarily set/reset the counter.)
 */
export async function bumpTabSwitchCountRpc(attemptId: string, signal?: AbortSignal): Promise<number> {
  let req = supabase.rpc('bump_tab_switch_count', { p_attempt_id: attemptId })
  if (signal) req = req.abortSignal(signal)
  const { data, error } = await req
  if (error) throw error
  return Number(data ?? 0)
}

/**
 * L-01 fix: records a completed Prepare & Write practice session as a
 * lightweight server-side audit trail. Prepared/Write is otherwise fully
 * client-side with no DB record; this RPC persists the completion
 * (ownership-guarded inside record_practice_session, SECURITY DEFINER) so
 * practice activity is auditable without introducing full attempt semantics.
 */
export async function recordPracticeSessionRpc(input: {
  examId?: string | null
  paperId?: string | null
  questionCount: number
  answeredCount: number
  correctCount: number
  durationSeconds?: number | null
}, signal?: AbortSignal): Promise<string> {
  let req = supabase.rpc('record_practice_session', {
    p_exam_id: input.examId ?? null,
    p_paper_id: input.paperId ?? null,
    p_question_count: input.questionCount,
    p_answered_count: input.answeredCount,
    p_correct_count: input.correctCount,
    p_duration_seconds: input.durationSeconds ?? null,
  })
  if (signal) req = req.abortSignal(signal)
  const { data, error } = await req
  if (error) throw error
  return String(data ?? '')
}
