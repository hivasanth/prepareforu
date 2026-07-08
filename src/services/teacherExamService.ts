import { supabase } from '../lib/supabase';
import { queryCache } from '../utils/queryCache';
import { ensureRole } from '../utils/authUtils';
import type { UserProfile } from '../types/auth.types';
import type { TeacherExamWithAttempt, TeacherExamLeaderboardEntry } from '../types/exam.types';

export async function fetchTeacherExams(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  subAdminId: string, 
  force = false
): Promise<TeacherExamWithAttempt[]> {
  const { user, requestId } = ctx;
  const cacheKey = `teacher_exams_${subAdminId}_${user?.id ?? 'anon'}`;

  ensureRole({
    user,
    allowedRoles: ['admin', 'sub_admin', 'user'],
    operation: 'fetchTeacherExams',
    requestId,
    resourceOwnerId: subAdminId
  });

  // Short TTL (30 s) so live/upcoming classification stays accurate as time passes.
  return queryCache.fetchWithDedup(cacheKey, async () => {
    const { data: teacherExams, error: examErr } = await supabase
      .from('teacher_exams')
      .select(`
        *,
        attempts(
          status, id, score, accuracy
        )
      `)
      .eq('sub_admin_id', subAdminId)
      // Only fetch the current user's own attempts so attempt status is scoped correctly.
      .eq('attempts.user_id', user?.id ?? '')
      .order('start_time', { ascending: false })
      .limit(500);

    if (examErr) {
      console.error('Error fetching teacher exams:', examErr.message);
      throw new Error('Unable to load your assigned exams. Please verify your connection.');
    }
    return teacherExams || [];
  }, 30000, force); // 30 s TTL — keeps live/upcoming fresh
}

export async function fetchTeacherExamLeaderboard(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examId: string, 
  force = false
): Promise<TeacherExamLeaderboardEntry[]> {
  const { user, requestId } = ctx;
  const cacheKey = `teacher_exam_lb_${examId}`;
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    // 1. Fetch the exam to verify ownership/existence
    const { data: exam, error: examErr } = await supabase
      .from('teacher_exams')
      .select('sub_admin_id')
      .eq('id', examId)
      .single();

    if (examErr || !exam) {
      throw new Error('Exam not found or unauthorized access.');
    }

    // 2. Security Check
    ensureRole({
      user,
      allowedRoles: ['admin', 'sub_admin', 'user'],
      operation: 'fetchTeacherExamLeaderboard',
      requestId,
      resourceOwnerId: exam.sub_admin_id
    });

    const { data: attempts, error: lbErr } = await supabase
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
      .limit(200);

    if (lbErr) {
      console.error('Error fetching teacher exam leaderboard:', lbErr.message);
      throw new Error('Unable to load the rankings for this exam.');
    }

    return (attempts || []).map((a: any, idx: number) => ({
      rank: idx + 1,
      name: a.users?.full_name || 'Anonymous',
      score: a.score,
      accuracy: a.accuracy,
      time: a.duration_seconds != null
        ? Math.floor(a.duration_seconds / 60) + 'm ' + (a.duration_seconds % 60) + 's'
        : '--m --s'
    }));
  }, 60000, force); // 1 min TTL for live leaderboard
}

export async function deleteTeacherExam(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examId: string
): Promise<void> {
  const { user, requestId } = ctx;

  // 1. Fetch exam to verify ownership
  const { data: exam, error: fetchErr } = await supabase
    .from('teacher_exams')
    .select('sub_admin_id')
    .eq('id', examId)
    .single();

  if (fetchErr || !exam) {
    throw new Error('Exam not found or unauthorized access.');
  }

  // 2. Security Check
  ensureRole({
    user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'deleteTeacherExam',
    requestId,
    resourceOwnerId: exam.sub_admin_id
  });

  // 3. Delete
  const { error } = await supabase
    .from('teacher_exams')
    .delete()
    .eq('id', examId);

  if (error) {
    console.error('Error deleting teacher exam:', error.message);
    throw new Error('Failed to delete the exam analysis.');
  }

  // 4. Invalidate cache
  queryCache.invalidateByPrefix(`teacher_exams_${exam.sub_admin_id}`);
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

export async function fetchTeacherExamAttempts(examId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('attempts')
    .select('*, users(full_name)')
    .eq('teacher_exam_id', examId)
    .eq('status', 'completed')
    .order('score', { ascending: false })
    .order('duration_seconds', { ascending: true })
    .limit(50)
  if (error) throw error
  return data || []
}

export function getCachedTeacherExams(subAdminId: string): any[] {
  return queryCache.get(`teacher_exams_${subAdminId}`) || [];
}
