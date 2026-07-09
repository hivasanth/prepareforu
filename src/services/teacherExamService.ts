import * as attemptRepo from '../lib/repositories/attempt.repository';
import * as teacherExamRepo from '../lib/repositories/teacherExam.repository';
import { queryCache } from '../utils/queryCache';
import { ensureRole } from '../utils/authUtils';
import type { UserProfile } from '../types/auth.types';
import type { TeacherExamWithAttempt, TeacherExamLeaderboardEntry } from '../types/exam.types';
import { logError } from '../utils/logger'

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
      logError('teacherExamService.fetchTeacherExams.error', { message: examErr?.message });
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
      resourceOwnerId: (exam as Record<string, unknown>).sub_admin_id as string | undefined
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
    resourceOwnerId: (exam as Record<string, unknown>).sub_admin_id as string | undefined
  });

  // 3. Delete
  try {
    await teacherExamRepo.deleteTeacherExamById(examId);
  } catch (error: any) {
    logError('teacherExamService.deleteTeacherExam.error', { message: error.message });
    throw new Error('Failed to delete the exam analysis.');
  }

  // 4. Invalidate cache
  queryCache.invalidateByPrefix(`teacher_exams_${exam.sub_admin_id}`);
}

export async function fetchSubAdminIdByUserId(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  userId: string
): Promise<{ id: string } | null> {
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin', 'user'],
    operation: 'fetchSubAdminIdByUserId',
    requestId: ctx.requestId,
    resourceOwnerId: userId
  });
  try {
    return await teacherExamRepo.fetchSubAdminIdByUserId(userId)
  } catch (error: any) {
    logError('teacherExamService.fetchSubAdminIdByUserId.error', { message: error.message })
    return null
  }
}

export async function fetchTeacherExamsWithFullFields(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  subAdminId: string
): Promise<any[]> {
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchTeacherExamsWithFullFields',
    requestId: ctx.requestId,
    resourceOwnerId: subAdminId
  });
  try {
    return (await teacherExamRepo.fetchTeacherExamsWithFullFields(subAdminId)) ?? []
  } catch (error: any) {
    logError('teacherExamService.fetchTeacherExamsWithFullFields.error', { message: error.message })
    throw new Error('Unable to load exam list.')
  }
}

export async function fetchTeacherExamQuestions(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examId: string
): Promise<any[]> {
  const exam = await teacherExamRepo.findTeacherExamById(examId);
  if (!exam) {
    throw new Error('Exam not found or unauthorized access.');
  }
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin', 'user'],
    operation: 'fetchTeacherExamQuestions',
    requestId: ctx.requestId,
    resourceOwnerId: (exam as Record<string, unknown>).sub_admin_id as string | undefined
  });
  return (await teacherExamRepo.fetchTeacherExamQuestions(examId)) ?? [];
}

export async function fetchAttemptsWithUsersByTeacherExam(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examId: string
): Promise<any[]> {
  const exam = await teacherExamRepo.findTeacherExamById(examId);
  if (!exam) {
    throw new Error('Exam not found or unauthorized access.');
  }
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchAttemptsWithUsersByTeacherExam',
    requestId: ctx.requestId,
    resourceOwnerId: (exam as Record<string, unknown>).sub_admin_id as string | undefined
  });
  try {
    return (await attemptRepo.fetchAttemptsWithUsersByTeacherExam(examId)) ?? []
  } catch (error: any) {
    logError('teacherExamService.fetchAttemptsWithUsersByTeacherExam.error', { message: error.message })
    throw new Error('Unable to load attempt data for evaluation.')
  }
}

export async function fetchAttemptAnswersByAttemptIds(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  attemptIds: string[]
): Promise<any[]> {
  if (attemptIds.length === 0) return []
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchAttemptAnswersByAttemptIds',
    requestId: ctx.requestId,
  });
  try {
    return (await attemptRepo.fetchAttemptAnswersByAttemptIds(attemptIds)) ?? []
  } catch (error: any) {
    logError('teacherExamService.fetchAttemptAnswersByAttemptIds.error', { message: error.message })
    throw new Error('Unable to load answer data.')
  }
}

export async function fetchTeacherExamAttempts(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examId: string
): Promise<any[]> {
  const exam = await teacherExamRepo.findTeacherExamById(examId);
  if (!exam) {
    throw new Error('Exam not found or unauthorized access.');
  }
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchTeacherExamAttempts',
    requestId: ctx.requestId,
    resourceOwnerId: (exam as Record<string, unknown>).sub_admin_id as string | undefined
  });
  return (await attemptRepo.fetchTeacherExamAttempts(examId, 50)) ?? [];
}

export async function fetchAttemptsByTeacherExamIds(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examIds: string[]
): Promise<any[]> {
  if (examIds.length === 0) return []
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchAttemptsByTeacherExamIds',
    requestId: ctx.requestId,
  });
  try {
    return (await attemptRepo.fetchAttemptsByTeacherExamIds(examIds)) ?? []
  } catch (error: any) {
    logError('teacherExamService.fetchAttemptsByTeacherExamIds.error', { message: error.message })
    throw new Error('Unable to load attempt data.')
  }
}

export function getCachedTeacherExams(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  subAdminId: string
): any[] {
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin', 'user'],
    operation: 'getCachedTeacherExams',
    requestId: ctx.requestId,
    resourceOwnerId: subAdminId
  });
  return queryCache.get(`teacher_exams_${subAdminId}`) || [];
}

export async function createTeacherExamAtomic(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  config: {
  title: string
  subAdminId: string   // user_id (auth), not sub_admins.id
  startTime: string
  endTime: string
  durationMinutes: number
  marksPerQuestion: number
  negativeMarkValue: number
  questions: any[]
}): Promise<void> {
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'createTeacherExamAtomic',
    requestId: ctx.requestId,
    resourceOwnerId: config.subAdminId
  });
  const profile = (await teacherExamRepo.fetchSubAdminIdByUserId(config.subAdminId)) as Record<string, unknown> | null
  if (!profile) {
    throw new Error('Your Sub-Admin identity could not be verified. Are you registered as an educator?')
  }

  await teacherExamRepo.createTeacherExamAtomicRpc({
    p_title: config.title,
    p_sub_admin_id: profile.id as string,
    p_start_time: config.startTime,
    p_end_time: config.endTime,
    p_duration_minutes: config.durationMinutes,
    p_marks_per_question: config.marksPerQuestion,
    p_negative_mark_value: config.negativeMarkValue,
    p_source_type: null,
    p_questions: config.questions,
  });
}

export async function fetchTeacherExamsForExport(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  subAdminId: string
): Promise<any[]> {
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchTeacherExamsForExport',
    requestId: ctx.requestId,
    resourceOwnerId: subAdminId
  });
  return (await teacherExamRepo.fetchTeacherExamsBySubAdminId(subAdminId)) ?? [];
}
