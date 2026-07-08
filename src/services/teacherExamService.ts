import * as attemptRepo from '../lib/repositories/attempt.repository';
import * as teacherExamRepo from '../lib/repositories/teacherExam.repository';
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
    try {
      const teacherExams = await teacherExamRepo.fetchTeacherExamsWithAttempts(
        subAdminId,
        user?.id ?? ''
      );
      return teacherExams || [];
    } catch (examErr: any) {
      console.error('Error fetching teacher exams:', examErr.message);
      throw new Error('Unable to load your assigned exams. Please verify your connection.');
    }
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
    const exam = await teacherExamRepo.findTeacherExamById(examId);

    if (!exam) {
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

    const attempts = await attemptRepo.fetchCompletedAttemptsByTeacherExam(examId, 200);

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
  const exam = await teacherExamRepo.findTeacherExamById(examId);

  if (!exam) {
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
  try {
    await teacherExamRepo.deleteTeacherExamById(examId);
  } catch (error: any) {
    console.error('Error deleting teacher exam:', error.message);
    throw new Error('Failed to delete the exam analysis.');
  }

  // 4. Invalidate cache
  queryCache.invalidateByPrefix(`teacher_exams_${exam.sub_admin_id}`);
}

export async function fetchTeacherExamQuestions(examId: string): Promise<any[]> {
  return await teacherExamRepo.fetchTeacherExamQuestions(examId);
}

export async function fetchTeacherExamAttempts(examId: string): Promise<any[]> {
  return await attemptRepo.fetchTeacherExamAttempts(examId, 50);
}

export function getCachedTeacherExams(subAdminId: string): any[] {
  return queryCache.get(`teacher_exams_${subAdminId}`) || [];
}
