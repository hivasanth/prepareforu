import { supabase } from '../supabase'

type TeacherExamRow = Record<string, unknown> & {
  title: string
  total_questions: number
  total_marks: number
  created_at: string
  attempts?: Array<{
    status: string
    id: string
    score: number
    accuracy: number
    source: string
    started_at: string
    submitted_at: string | null
  }>
}

export type TeacherExamFullRow = {
  id: string
  title: string
  total_questions: number
  total_marks: number
  marks_per_question: number
  start_time: string
  end_time: string
  created_at: string
  status: string
}

export type TeacherExamSummaryRow = {
  title: string
  total_questions: number
  total_marks: number
  created_at: string
}

type UserAttemptRow = {
  id: string
  teacher_exam_id: string
  status: string
  score: number
  accuracy: number
  source: string
  started_at: string
  submitted_at: string | null
  created_at: string
}

function selectBestAttempt(attempts: UserAttemptRow[]): UserAttemptRow | null {
  if (!attempts || attempts.length === 0) return null
  const inProgress = attempts.find(a => a.status === 'in_progress')
  if (inProgress) return inProgress
  return attempts[0]
}

export async function fetchTeacherExamsWithAttempts(
  subAdminId: string,
  userId: string
): Promise<TeacherExamRow[] | null> {
  // Query 1: Fetch all authorized teacher_exams for this sub_admin.
  // No attempt filter — avoids the PostgREST INNER-JOIN behavior that
  // previously excluded exams where the student had no attempts.
  const { data: exams, error: examsError } = await supabase
    .from('teacher_exams')
    .select('*')
    .eq('sub_admin_id', subAdminId)
    .order('start_time', { ascending: false })
    .limit(500)

  if (examsError) throw examsError
  if (!exams || exams.length === 0) return []

  // Query 2: Fetch ONLY the current user's attempts for these exams.
  // Scoped by user_id (RLS enforces auth.uid()) + source = 'teacher_exam'.
  // This ensures no other student's attempt data is ever transferred.
  const { data: attempts, error: attemptsError } = await supabase
    .from('attempts')
    .select('id, teacher_exam_id, status, score, accuracy, source, started_at, submitted_at, created_at')
    .eq('user_id', userId)
    .eq('source', 'teacher_exam')
    .in('teacher_exam_id', exams.map(e => e.id))
    .order('created_at', { ascending: false })

  if (attemptsError) throw attemptsError

  // Merge: group attempts by exam_id, then select the best attempt per exam.
  // Priority order: in_progress → latest completed/auto_submitted.
  const attemptsByExamId = new Map<string, UserAttemptRow[]>()
  for (const attempt of (attempts || [])) {
    const arr = attemptsByExamId.get(attempt.teacher_exam_id) || []
    arr.push(attempt)
    attemptsByExamId.set(attempt.teacher_exam_id, arr)
  }

  return (exams || []).map(exam => {
    const examAttempts = attemptsByExamId.get(exam.id)
    const best = selectBestAttempt(examAttempts || [])
    return {
      ...exam,
      attempts: best ? [best] : []
    }
  })
}

export async function countTeacherExamsBySubAdminId(subAdminId: string): Promise<number | null> {
  const { count, error } = await supabase
    .from('teacher_exams')
    .select('*', { count: 'exact', head: true })
    .eq('sub_admin_id', subAdminId)
  if (error) throw error
  return count
}

export async function countActiveTeacherExamsBySubAdminId(
  subAdminId: string,
  nowIso: string
): Promise<number | null> {
  const { count, error } = await supabase
    .from('teacher_exams')
    .select('*', { count: 'exact', head: true })
    .eq('sub_admin_id', subAdminId)
    .eq('status', 'published')
    .lte('start_time', nowIso)
    .gte('end_time', nowIso)
  if (error) throw error
  return count
}

export async function findTeacherExamById(examId: string): Promise<{ sub_admin_id: string; title: string; created_at: string }> {
  const { data, error } = await supabase
    .from('teacher_exams')
    .select('sub_admin_id, title, created_at')
    .eq('id', examId)
    .single()
  if (error) throw error
  return data as { sub_admin_id: string; title: string; created_at: string }
}

export async function deleteTeacherExamById(examId: string): Promise<void> {
  const { error } = await supabase.from('teacher_exams').delete().eq('id', examId)
  if (error) throw error
}

export async function fetchTeacherExamQuestions(examId: string): Promise<Record<string, unknown>[] | null> {
  // H-1: question delivery is RPC-only now. The student RLS SELECT policy on
  // teacher_exam_questions is dropped (new migration), so a direct table read
  // returns zero rows for students; even the sub-admin path must go through
  // the SECURITY DEFINER RPC, which returns FULL fields to the owning
  // sub-admin/admin and only SAFE fields (no correct_option / explanation_*)
  // to linked students. Never restore `.select('*')` here.
  const { data, error } = await supabase.rpc('get_teacher_exam_questions', {
    p_teacher_exam_id: examId,
  })
  if (error) throw error
  return data as Record<string, unknown>[] | null
}

// H-1: post-exam review definitions for teacher attempts. Gated by attempt
// ownership + completion inside the RPC. Restores correct_option + explanations
// that the in-session snapshot intentionally no longer carries.
export async function fetchTeacherExamReviewQuestionsRpc(attemptId: string): Promise<Record<string, unknown>[] | null> {
  const { data, error } = await supabase.rpc('get_teacher_exam_review_questions', {
    p_attempt_id: attemptId,
  })
  if (error) throw error
  return data as Record<string, unknown>[] | null
}

// M-1: server-ranked leaderboard via SECURITY DEFINER RPC (ownership-gated,
// no email/PII). Replaces the former client-side attempts query that RLS
// truncated to the caller's own rows.
export interface TeacherExamLeaderboardRow {
  rank: number
  name: string
  score: number
  accuracy: number
  duration_seconds: number
}

export async function fetchTeacherExamLeaderboardRpc(examId: string): Promise<TeacherExamLeaderboardRow[] | null> {
  const { data, error } = await supabase.rpc('get_teacher_exam_leaderboard', {
    p_teacher_exam_id: examId,
  })
  if (error) throw error
  return data as TeacherExamLeaderboardRow[] | null
}

export async function fetchTeacherExamsBySubAdminId(subAdminId: string): Promise<TeacherExamSummaryRow[] | null> {
  const { data, error } = await supabase
    .from('teacher_exams')
    .select('title, total_questions, total_marks, created_at')
    .eq('sub_admin_id', subAdminId)
    .limit(1000)
  if (error) throw error
  return data
}

/**
 * Complete paginated exam export for a sub-admin. Fetches the exact total
 * first, then pages through every exam — never silently truncates the CSV at
 * the former hard limit. `truncated` is only a safety net when the loop
 * returns fewer rows than the exact count.
 */
export async function fetchAllTeacherExamsBySubAdminId(
  subAdminId: string,
  pageSize = 1000
): Promise<{ rows: TeacherExamSummaryRow[]; truncated: boolean }> {
  const { count, error: countError } = await supabase
    .from('teacher_exams')
    .select('*', { count: 'exact', head: true })
    .eq('sub_admin_id', subAdminId)
  if (countError) throw countError
  const total = count ?? 0

  const rows: TeacherExamSummaryRow[] = []
  for (let from = 0; from < total; from += pageSize) {
    const { data, error } = await supabase
      .from('teacher_exams')
      .select('title, total_questions, total_marks, created_at')
      .eq('sub_admin_id', subAdminId)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1)
    if (error) throw error
    rows.push(...(data ?? []))
  }

  return { rows, truncated: rows.length < total }
}

export async function fetchTeacherExamsWithFullFields(subAdminId: string, limit = 100): Promise<TeacherExamFullRow[] | null> {
  const { data, error } = await supabase
    .from('teacher_exams')
    .select('id, title, total_questions, total_marks, marks_per_question, start_time, end_time, created_at, status')
    .eq('sub_admin_id', subAdminId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function createTeacherExamAtomicRpc(params: {
  p_title: string
  p_sub_admin_id: string
  p_start_time: string
  p_end_time: string
  p_duration_minutes: number
  p_marks_per_question: number
  p_negative_mark_value: number
  p_source_type: string
  p_request_key: string
  p_questions: unknown[]
}): Promise<void> {
  const { error } = await supabase.rpc('create_teacher_exam_atomic', params)
  if (error) throw error
}

export async function fetchSubAdminIdByUserId(userId: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('sub_admins')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}
