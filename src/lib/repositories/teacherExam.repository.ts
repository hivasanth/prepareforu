import { supabase } from '../supabase'

export async function fetchTeacherExamsWithAttempts(
  subAdminId: string,
  userId: string
): Promise<any[]> {
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
  return data || []
}

export async function findTeacherExamById(examId: string): Promise<any> {
  const { data, error } = await supabase
    .from('teacher_exams')
    .select('sub_admin_id')
    .eq('id', examId)
    .single()
  if (error) throw error
  return data
}

export async function deleteTeacherExamById(examId: string): Promise<void> {
  const { error } = await supabase.from('teacher_exams').delete().eq('id', examId)
  if (error) throw error
}

export async function fetchTeacherExamQuestions(examId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('teacher_exam_questions')
    .select('*')
    .eq('teacher_exam_id', examId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data || []
}
