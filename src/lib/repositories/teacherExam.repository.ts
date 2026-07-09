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
  }>
}

type TeacherExamFullRow = {
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

type TeacherExamSummaryRow = {
  title: string
  total_questions: number
  total_marks: number
  created_at: string
}

export async function fetchTeacherExamsWithAttempts(
  subAdminId: string,
  userId: string
): Promise<TeacherExamRow[] | null> {
  const { data, error } = await supabase
    .from('teacher_exams')
    .select(`
      *,
      attempts(
        status, id, score, accuracy
      )
    `)
    .eq('sub_admin_id', subAdminId)
    .eq('attempts.user_id', userId)
    .order('start_time', { ascending: false })
    .limit(500)
  if (error) throw error
  return data
}

export async function findTeacherExamById(examId: string): Promise<{ sub_admin_id: string }> {
  const { data, error } = await supabase
    .from('teacher_exams')
    .select('sub_admin_id')
    .eq('id', examId)
    .single()
  if (error) throw error
  return data as { sub_admin_id: string }
}

export async function deleteTeacherExamById(examId: string): Promise<void> {
  const { error } = await supabase.from('teacher_exams').delete().eq('id', examId)
  if (error) throw error
}

export async function fetchTeacherExamQuestions(examId: string): Promise<Record<string, unknown>[] | null> {
  const { data, error } = await supabase
    .from('teacher_exam_questions')
    .select('*')
    .eq('teacher_exam_id', examId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data
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
  p_source_type: null
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
