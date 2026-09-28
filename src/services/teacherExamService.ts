import * as attemptRepo from '../lib/repositories/attempt.repository';
import * as teacherExamRepo from '../lib/repositories/teacherExam.repository';
import type { TeacherExamFullRow, TeacherExamSummaryRow } from '../lib/repositories/teacherExam.repository';
import { queryCache } from '../utils/queryCache';
import { teacherExamLeaderboardKey } from '../utils/cacheKeys';
import { ensureRole } from '../utils/authUtils';
import type { UserProfile } from '../types/auth.types';
import type { TeacherExamWithAttempt, TeacherExamLeaderboardEntry } from '../types/exam.types';
import { logError, logInfo, generateRequestId } from '../utils/logger'
import { classifyError } from '../utils/errorClassification'
import type { ErrorInput } from '../types/error.types'

// Canonical safe-error adapter over the ONE shared classifier
// (src/utils/errorClassification.ts). Never surfaces raw PostgREST / auth /
// SQLSTATE text to the UI.
function safeServiceError(error: unknown): Error {
  const { message } = classifyError(error as ErrorInput)
  return new Error(message)
}

const EXAM_NOT_FOUND_MESSAGE = 'Exam not found or you no longer have access.'

export async function fetchTeacherExamMeta(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examId: string
): Promise<{ id: string; title: string; created_at: string }> {
  const exam = await requireTeacherExamOwnership(ctx, examId, 'fetchTeacherExamMeta')
  return { id: examId, title: exam.title, created_at: exam.created_at }
}

// Shared ownership probe for a single teacher exam. Distinguishes:
//   - genuine missing/inaccessible exam row  → EXAM_NOT_FOUND_MESSAGE
//   - transport / server / session failures  → classified safe message
async function requireTeacherExamOwnership(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examId: string,
  operation: string,
  allowedRoles: Array<UserProfile['role']> = ['admin', 'sub_admin', 'user']
): Promise<{ sub_admin_id: string; title: string; created_at: string }> {
  let exam: { sub_admin_id: string; title: string; created_at: string } | null = null
  try {
    exam = await teacherExamRepo.findTeacherExamById(examId)
  } catch (error: unknown) {
    const code = (error as { code?: string } | null)?.code
    if (code === 'PGRST116') {
      throw new Error(EXAM_NOT_FOUND_MESSAGE)
    }
    logError(`teacherExamService.${operation}.examLookup.error`, {
      message: error instanceof Error ? error.message : String(error)
    })
    throw safeServiceError(error)
  }
  if (!exam) {
    throw new Error(EXAM_NOT_FOUND_MESSAGE)
  }
  ensureRole({
    user: ctx.user,
    allowedRoles,
    operation,
    requestId: ctx.requestId,
    resourceOwnerId: (exam as Record<string, unknown>).sub_admin_id as string | undefined
  });
  return exam;
}

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
    } catch (examErr: unknown) {
      // Rethrow the ORIGINAL error object: status/code/details/hint must reach
      // the canonical classifier (normalizeError) intact so transport failures
      // classify correctly instead of collapsing into a generic unknown error.
      logError('teacherExamService.fetchTeacherExams.error', { message: examErr instanceof Error ? examErr.message : String(examErr) });
      throw examErr;
    }
  }, 30000, force); // 30 s TTL — keeps live/upcoming fresh
}

export async function fetchTeacherExamLeaderboard(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examId: string, 
  force = false
): Promise<TeacherExamLeaderboardEntry[]> {
  const { user, requestId } = ctx;
  // M-1/M-4: cache key is user-scoped (never leak another account's rows) and
  // built from the canonical cacheKeys module. The RPC is server-ranked.
  const cacheKey = teacherExamLeaderboardKey(user?.id ?? 'anon', examId);
  
  return queryCache.fetchWithDedup(cacheKey, async () => {
    // 1. Client-side role/ownership gate (classified errors). The RPC re-checks
    //    authorization server-side; this is defense-in-depth, not the boundary.
    await requireTeacherExamOwnership({ user, requestId }, examId, 'fetchTeacherExamLeaderboard');

    const attempts = await teacherExamRepo.fetchTeacherExamLeaderboardRpc(examId);

    return (attempts || []).map(a => ({
      rank: a.rank,
      name: a.name || 'Anonymous',
      score: a.score,
      accuracy: a.accuracy,
      time: a.duration_seconds != null
        ? Math.floor(a.duration_seconds / 60) + 'm ' + (a.duration_seconds % 60) + 's'
        : '--m --s'
    }));
  }, 60000, force); // 1 min TTL for live leaderboard
}

// M-4: targeted post-submit invalidation. Removes exactly the submitting
// user's cached entry for that exam — never a wildcard prefix purge. Call
// after a successful submitAttempt for any attempt carrying teacher_exam_id.
export function invalidateTeacherExamLeaderboard(
  userId: string | null | undefined,
  examId: string
): void {
  if (!userId || !examId) return
  queryCache.invalidate(teacherExamLeaderboardKey(userId, examId))
}

export async function deleteTeacherExam(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examId: string
): Promise<void> {
  const { user, requestId } = ctx;

  // 1-2. Verify existence + ownership (classified errors)
  const exam = await requireTeacherExamOwnership({ user, requestId }, examId, 'deleteTeacherExam', ['admin', 'sub_admin']);

  // 3. Delete
  try {
    await teacherExamRepo.deleteTeacherExamById(examId);
  } catch (error) {
    logError('teacherExamService.deleteTeacherExam.error', { message: error instanceof Error ? error.message : String(error) });
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
  } catch (error: unknown) {
    // Technical failure (network / server / session) must NOT masquerade as
    // "no sub-admin profile". null is reserved for a genuine no-row result;
    // the caller renders the setup-required state only for null.
    logError('teacherExamService.fetchSubAdminIdByUserId.error', { message: error instanceof Error ? error.message : String(error) })
    throw safeServiceError(error)
  }
}

export async function fetchTeacherExamsWithFullFields(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  subAdminId: string
): Promise<TeacherExamFullRow[]> {
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchTeacherExamsWithFullFields',
    requestId: ctx.requestId,
    resourceOwnerId: subAdminId
  });
  try {
    return ((await teacherExamRepo.fetchTeacherExamsWithFullFields(subAdminId)) ?? []) as TeacherExamFullRow[]
  } catch (error: unknown) {
    logError('teacherExamService.fetchTeacherExamsWithFullFields.error', { message: error instanceof Error ? error.message : String(error) })
    throw safeServiceError(error)
  }
}

export async function fetchTeacherExamQuestions(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examId: string
): Promise<unknown[]> {
  await requireTeacherExamOwnership(ctx, examId, 'fetchTeacherExamQuestions');
  try {
    return (await teacherExamRepo.fetchTeacherExamQuestions(examId)) ?? [];
  } catch (error: unknown) {
    logError('teacherExamService.fetchTeacherExamQuestions.error', { message: error instanceof Error ? error.message : String(error) })
    throw safeServiceError(error)
  }
}

export async function fetchAttemptsWithUsersByTeacherExam(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examId: string
): Promise<unknown[]> {
  await requireTeacherExamOwnership(ctx, examId, 'fetchAttemptsWithUsersByTeacherExam', ['admin', 'sub_admin']);
  try {
    return (await attemptRepo.fetchAttemptsWithUsersByTeacherExam(examId)) ?? []
  } catch (error: unknown) {
    logError('teacherExamService.fetchAttemptsWithUsersByTeacherExam.error', { message: error instanceof Error ? error.message : String(error) })
    throw safeServiceError(error)
  }
}

export async function fetchAttemptAnswersByAttemptIds(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  attemptIds: string[]
): Promise<unknown[]> {
  if (attemptIds.length === 0) return []
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchAttemptAnswersByAttemptIds',
    requestId: ctx.requestId,
  });
  try {
    // F-01: is_correct is revoked from REST (shared authenticated role);
    // correctness for the sub-admin/analytics surface flows through the
    // role-gated get_subadmin_attempt_answers RPC.
    return (await attemptRepo.fetchSubadminAttemptAnswersRpc(attemptIds)) ?? []
  } catch (error: unknown) {
    logError('teacherExamService.fetchAttemptAnswersByAttemptIds.error', { message: error instanceof Error ? error.message : String(error) })
    throw safeServiceError(error)
  }
}

export async function fetchTeacherExamAttempts(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examId: string
): Promise<unknown[]> {
  await requireTeacherExamOwnership(ctx, examId, 'fetchTeacherExamAttempts');
  try {
    return (await attemptRepo.fetchTeacherExamAttempts(examId, 50)) ?? [];
  } catch (error: unknown) {
    logError('teacherExamService.fetchTeacherExamAttempts.error', { message: error instanceof Error ? error.message : String(error) })
    throw safeServiceError(error)
  }
}

export async function fetchTeacherAttemptCount(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  examIds: string[]
): Promise<number> {
  if (examIds.length === 0) return 0
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchTeacherAttemptCount',
    requestId: ctx.requestId,
  });
  try {
    return (await attemptRepo.countAttemptsByTeacherExamIds(examIds)) ?? 0
  } catch (error: unknown) {
    // Rethrow the ORIGINAL error object — structured PostgREST metadata
    // (status/code) must survive for canonical classification downstream.
    logError('teacherExamService.fetchTeacherAttemptCount.error', { message: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

// Exact dashboard aggregates independent of ANY list page size. All three
// counts run server-side in parallel and cover the ENTIRE authorized cohort:
//   - totalExams   = exact COUNT over the sub-admin's teacher_exams
//   - activeExams  = exact COUNT of published exams in the live window
//   - totalAttempts= exact COUNT of attempts scoped by RLS to the sub-admin's
//                    owned teacher_exams (no client-built exam-ID list)
export async function fetchDashboardAggregates(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  subAdminId: string
): Promise<{ totalExams: number; activeExams: number; totalAttempts: number }> {
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchDashboardAggregates',
    requestId: ctx.requestId,
    resourceOwnerId: subAdminId
  });
  try {
    const nowIso = new Date().toISOString()
    const [totalExams, activeExams, totalAttempts] = await Promise.all([
      teacherExamRepo.countTeacherExamsBySubAdminId(subAdminId),
      teacherExamRepo.countActiveTeacherExamsBySubAdminId(subAdminId, nowIso),
      attemptRepo.countAuthorizedAttempts(),
    ])
    return {
      totalExams: totalExams ?? 0,
      activeExams: activeExams ?? 0,
      totalAttempts: totalAttempts ?? 0,
    }
  } catch (error: unknown) {
    // Rethrow the ORIGINAL error object — structured PostgREST metadata
    // (status/code) must survive for canonical classification downstream.
    logError('teacherExamService.fetchDashboardAggregates.error', { message: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

export function getCachedTeacherExams(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  subAdminId: string
): TeacherExamWithAttempt[] {
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin', 'user'],
    operation: 'getCachedTeacherExams',
    requestId: ctx.requestId,
    resourceOwnerId: subAdminId
  });
  return queryCache.get(`teacher_exams_${subAdminId}_${ctx.user?.id ?? 'anon'}`) || [];
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
  questions: unknown[]
}): Promise<void> {
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'createTeacherExamAtomic',
    requestId: ctx.requestId,
    resourceOwnerId: config.subAdminId
  });
  const requestId = generateRequestId('exam_create')
  logInfo('subadmin.exam.create.start', {
    requestId,
    title: config.title,
    questionCount: config.questions.length,
    durationMinutes: config.durationMinutes,
  }, 'teacherExamService')

  const profile = (await teacherExamRepo.fetchSubAdminIdByUserId(config.subAdminId)) as Record<string, unknown> | null
  if (!profile) {
    logError('subadmin.exam.create.identity_denied', {
      requestId,
      reason: 'sub_admin_identity_unverified',
      subAdminId: config.subAdminId,
    }, 'teacherExamService')
    throw new Error('Your Sub-Admin identity could not be verified. Are you registered as an educator?')
  }

  // The wizard edits wall-clock ISO strings ("YYYY-MM-DDTHH:mm"); Postgres
  // timestamptz columns interpret a timezone-less literal as UTC, so convert
  // to an explicit UTC instant at the service boundary.
  const startTime = new Date(config.startTime).toISOString()
  const endTime = new Date(config.endTime).toISOString()

  // C3: a fresh, cryptographically-strong per-attempt idempotency key so a
  // lost/retried request can never create a duplicate exam. NOT derived from
  // title/user/count/clock (all can collide across legitimate attempts).
  const requestKey = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`

  // Strip transient client editor state (client_id) so it never reaches the DB.
  const questions = (config.questions as Array<Record<string, unknown>>).map((q) => {
    const safe = { ...q }
    delete safe.client_id
    return safe
  })

  try {
    await teacherExamRepo.createTeacherExamAtomicRpc({
      p_title: config.title,
      p_sub_admin_id: profile.id as string,
      p_start_time: startTime,
      p_end_time: endTime,
      p_duration_minutes: config.durationMinutes,
      p_marks_per_question: config.marksPerQuestion,
      p_negative_mark_value: config.negativeMarkValue,
      p_source_type: 'text',
      p_request_key: requestKey,
      p_questions: questions,
    });
    logInfo('subadmin.exam.create.success', {
      requestId,
      title: config.title,
      questionCount: config.questions.length,
    }, 'teacherExamService')
  } catch (err) {
    logError('subadmin.exam.create.failed', {
      requestId,
      title: config.title,
      error: classifyError(err as ErrorInput),
    }, 'teacherExamService')
    throw mapTeacherExamCreateError(err)
  }
}

// Server-side RPC error gates are surfaced as deterministic, user-safe
// messages. The generic classifier (safeServiceError) catches everything else.
function mapTeacherExamCreateError(error: unknown): Error {
  const raw = error instanceof Error ? error.message : String(error)
  const upper = raw.toUpperCase()
  if (upper.includes('UNAUTHORIZED') || upper.includes('PERMISSION DENIED')) {
    return new Error('You do not have permission to publish this exam.')
  }
  if (upper.includes('RATE_LIMIT') || upper.includes('RATE LIMIT')) {
    return new Error('Too many exams published recently. Please wait a few minutes and try again.')
  }
  if (upper.includes('VALIDATION_ERROR')) {
    return new Error('The exam could not be saved because some details are invalid. Please review your questions and settings.')
  }
  if (upper.includes('REQUEST_KEY') || upper.includes('DUPLICATE')) {
    return new Error('This publish was already recorded. Check your My Exams list.')
  }
  const { message } = classifyError(error as ErrorInput)
  return new Error(message)
}

export async function fetchTeacherExamsForExport(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  subAdminId: string
): Promise<{ rows: TeacherExamSummaryRow[]; truncated: boolean }> {
  ensureRole({
    user: ctx.user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchTeacherExamsForExport',
    requestId: ctx.requestId,
    resourceOwnerId: subAdminId
  });
  const result = await teacherExamRepo.fetchAllTeacherExamsBySubAdminId(subAdminId)
  return result;
}
