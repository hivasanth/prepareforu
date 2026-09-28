import { supabase } from '../lib/supabase'
import * as attemptRepo from '../lib/repositories/attempt.repository'
import * as userRepo from '../lib/repositories/user.repository'
import { ensureRole } from '../utils/authUtils'
import { errorFields } from '../utils/errorClassification'
import { logError, logWarn, logInfo } from '../utils/logger'
import type {
  UserProfile,
  ExamSelection,
  CouponResult,
  ServiceResult,
} from '../types/auth.types'
import type { EducatorStudentRow } from '../types/user.types'

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const START_TIME  = Date.now()
  const MAX_TIMEOUT = 5000
  const RETRY_DELAY = [400, 800, 1500]

  logInfo('userService.getProfile.start', { userId })

  for (let i = 0; i <= RETRY_DELAY.length; i++) {
    const elapsed = Date.now() - START_TIME
    if (elapsed > MAX_TIMEOUT) {
      logWarn('userService.getProfile.timeout', { elapsed })
      break
    }

    try {
      const userData = await userRepo.findUserById(userId).catch(() => null)

      if (userData) {
        logInfo('userService.getProfile.found', { userId })

        let sub_admin_id = userData.sub_admin_id;

        if (userData.role === 'sub_admin') {
          const saData = await userRepo.findSubAdminByUserId(userId).catch(() => null);

          if (saData) {
            sub_admin_id = saData.id;
          }
        }

        return {
          ...userData,
          sub_admin_id
        } as UserProfile;
      }

      logWarn('userService.getProfile.notFound', { attempt: i + 1 })

      if (i < RETRY_DELAY.length) {
        const delay = RETRY_DELAY[i]
        logInfo('userService.getProfile.retry', { delay })
        await new Promise(r => setTimeout(r, delay))
      }
    } catch (err) {
      logError('userService.getProfile.exception', { message: err instanceof Error ? err.message : String(err) })
    }
  }

  logWarn('userService.getProfile.exhausted', { userId })
  return null
}

// ─── Update Exam Selection ────────────────────────────────────────────────────
export async function updateExamSelection(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  userId:        string,
  examSelection: ExamSelection,
): Promise<ServiceResult<null>> {
  const { user, requestId } = ctx;

  ensureRole({
    user,
    allowedRoles: ['admin', 'sub_admin', 'user'],
    operation: 'updateExamSelection',
    requestId,
    resourceOwnerId: userId
  });

  if (!userId) {
    return { success: false, error: { source: 'auth', code: 'USER_NOT_FOUND', message: 'User not found.' } }
  }

  try {
    await userRepo.updateUserExamSelection(examSelection)
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: { source: 'db', code: 'UNKNOWN', message: errorFields(error).message ?? 'An unexpected error occurred. Please try again.' } }
  }
}

// ─── My Entitlements ──────────────────────────────────────────────────────────
/**
 * The exams the server says this account may actually open.
 *
 * P0-02: the client must render exam choices from this, never from a local
 * expansion of `exam_selection`. A locally derived list is cosmetic — the RLS
 * policies and the RPCs decide access — but it is what makes a user believe
 * they have access to something they do not.
 */
export async function getMyEntitlements(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
): Promise<ServiceResult<{ exam_id: string; exam_selection: string; exam_name: string }[]>> {
  const { user, requestId } = ctx;

  ensureRole({
    user,
    allowedRoles: ['admin', 'sub_admin', 'user'],
    operation: 'getMyEntitlements',
    requestId,
  });

  try {
    const rows = await userRepo.fetchMyEntitlements();
    return { success: true, data: rows ?? [] };
  } catch (error: unknown) {
    return { success: false, error: { source: 'db', code: 'UNKNOWN', message: errorFields(error).message ?? 'An unexpected error occurred. Please try again.' } }
  }
}

// ─── Validate Coupon ──────────────────────────────────────────────────────────
export async function validateCoupon(couponCode: string): Promise<CouponResult> {
  try {
    if (!couponCode.trim()) return { valid: false, error: 'Coupon code is empty.' }

    try {
      const data = await userRepo.validateCouponRpc(couponCode.trim().toUpperCase())
      if (!data || !data.valid) return { valid: false, error: 'Invalid or expired coupon.' }
      return { valid: true, subAdminName: (data as Record<string, unknown>).sub_admin_name as string }
    } catch (error: unknown) {
      logError('userService.validateCoupon.error', { message: errorFields(error).message })
      return { valid: false, error: 'Could not validate coupon.' }
    }
  } catch (err: unknown) {
    logError('userService.validateCoupon.outerError', { message: err instanceof Error ? err.message : String(err) })
    return { valid: false, error: 'Network error. Could not validate coupon.' }
  }
}

export async function linkUserToEducator(couponCode: string): Promise<{ success: boolean; educatorName?: string; error?: string }> {
  try {
    const result = await userRepo.linkUserToEducatorRpc(couponCode)
    if (result.success) {
      return { success: true, educatorName: result.educator_name }
    }
    return { success: false, error: result.error || 'Failed to link educator.' }
  } catch (error: unknown) {
    logError('userService.linkUserToEducator.error', { message: error instanceof Error ? error.message : String(error) })
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Fetches students linked to a specific sub-admin (educator).
 * Strictly isolated via ensureRole and resourceOwnerId.
 */
export async function fetchSubAdminStudents(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  educatorId: string
): Promise<EducatorStudentRow[]> {
  const { user, requestId } = ctx;

  ensureRole({
    user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchSubAdminStudents',
    requestId,
    resourceOwnerId: educatorId
  });

  try {
    const data = await userRepo.fetchUsersByEducatorId(educatorId);
    return data ?? [];
  } catch (error: unknown) {
    // Rethrow the ORIGINAL error object: structured PostgREST metadata
    // (status/code/details/hint) must reach the canonical classifier intact.
    logError('userService.fetchSubAdminStudents.error', { message: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Administrative: Toggles a user's active status.
 */
export async function toggleUserStatus(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  targetUserId: string,
  isActive: boolean
): Promise<ServiceResult<null>> {
  const { user, requestId } = ctx;

  ensureRole({
    user,
    allowedRoles: ['admin'],
    operation: 'toggleUserStatus',
    requestId
  });

  try {
    // S-1: reject self-target — an admin must never toggle their own status.
    if (user && user.id === targetUserId) {
      logWarn('userService.toggleUserStatus.forbidden', { requestId, targetUserId, reason: 'self_target' });
      return { success: false, error: { source: 'auth', code: 'ACTION_FORBIDDEN', message: 'You cannot change your own account status.' } };
    }

    // S-1: the target must exist and be a regular student account. Admin and
    // sub-admin rows are administrative identities and are never toggled here.
    const target = await userRepo.findUserById(targetUserId);
    if (!target) {
      logWarn('userService.toggleUserStatus.notFound', { requestId, targetUserId });
      return { success: false, error: { source: 'db', code: 'USER_NOT_FOUND', message: 'User not found.' } };
    }
    if (target.role !== 'user') {
      logWarn('userService.toggleUserStatus.forbidden', { requestId, targetUserId, role: target.role });
      return { success: false, error: { source: 'auth', code: 'ACTION_FORBIDDEN', message: 'Only student accounts can be deactivated or activated.' } };
    }

    // R-1: an update that matches 0 rows silently did nothing — treat as failure.
    // The write goes through admin_set_user_active (SECURITY DEFINER) because
    // is_active is no longer a client-writable column (BE-2 column revoke).
    const affected = await userRepo.adminSetUserActiveRpc(targetUserId, isActive);
    if (affected === 0) {
      logWarn('userService.toggleUserStatus.noRows', { requestId, targetUserId, isActive });
      return { success: false, error: { source: 'db', code: 'UPDATE_FAILED', message: 'Failed to update user status.' } };
    }

    // S-2: log the successful mutation with target + requestId.
    logInfo('userService.toggleUserStatus.success', { requestId, targetUserId, isActive });
    return { success: true, data: null };
  } catch (error: unknown) {
    logError('userService.toggleUserStatus.error', { message: errorFields(error).message });
    return { success: false, error: { source: 'db', code: 'UPDATE_FAILED', message: errorFields(error).message ?? 'Failed to update user status.' } };
  }
}

/**
 * Administrative: Removes a sub-admin (revokes authorization).
 * SA-4: executes as ONE atomic database transaction via
 * admin_remove_sub_admin — role ARCHIVE + profile delete commit together or
 * roll back together, so no partial-success authorization state is possible.
 * The role is set to 'deactivated_sub_admin' (never reverted to 'user'), which
 * also keeps removed educators off the Admin → Users list.
 * Caller role is verified server-side inside the RPC from auth.uid();
 * linked students are detached by the fk_users_sub_admin ON DELETE SET NULL.
 */
export async function removeSubAdmin(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  saId: string
): Promise<ServiceResult<null>> {
  const { user, requestId } = ctx;

  ensureRole({
    user,
    allowedRoles: ['admin'],
    operation: 'removeSubAdmin',
    requestId
  });

  try {
    await userRepo.removeSubAdminViaRpc(saId);
  } catch (error: unknown) {
    logError('[userService] removeSubAdmin rpc error:', { message: error instanceof Error ? error.message : String(error) });
    return { success: false, error: { source: 'db', code: 'DELETE_FAILED', message: 'Failed to remove educator.' } };
  }

  return { success: true, data: null };
}

/**
 * Fetches the sub-admin profile for a given user.
 */
export async function fetchSubAdminProfile(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  userId: string
): Promise<{ id: string } | null> {
  const { user, requestId } = ctx;

  ensureRole({
    user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchSubAdminProfile',
    requestId,
    resourceOwnerId: userId
  });

  try {
    const data = await userRepo.findSubAdminByUserId(userId);
    if (!data) return null;
    return data;
  } catch (error: unknown) {
    // Rethrow the ORIGINAL error object — a technical failure must never be
    // conflated with a genuine "no profile row" result (which is `null`).
    logError('userService.fetchSubAdminProfile.error', { message: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Fetches attempts for a list of students specifically for a sub-admin's exams.
 */
/**
 * Formats a SQL DATE column value ("YYYY-MM-DD") using the local calendar.
 * `new Date("YYYY-MM-DD")` is parsed as UTC midnight, which can render the
 * previous day in negative-UTC locales. Splitting the parts and building a
 * local Date avoids the timezone shift entirely.
 */
export function formatDateOnly(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  const [, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString()
}

// ─── Sub-admin Profile ────────────────────────────────────────────────────────
export async function fetchSubAdminProfileAndUser(
  userId: string
): Promise<{ profile: Awaited<ReturnType<typeof userRepo.findSubAdminProfileByUserId>>; lastActivity: string }> {
  const profile = await userRepo.findSubAdminProfileByUserId(userId);
  const uData = await userRepo.findUserLastActivity(userId);
  const lastLogin = uData?.last_activity_date
    ? formatDateOnly(uData.last_activity_date)
    : '—';
  return { profile, lastActivity: lastLogin };
}

/* B6: ownership is derived server-side from auth.uid() inside the
 * update_sub_admin_name RPC — the caller's identity is never trusted from
 * parameters. Updates sub_admins.full_name + users.full_name atomically. */
export async function updateSubAdminProfile(fullName: string): Promise<void> {
  await userRepo.updateSubAdminNameViaRpc(fullName);
}

export interface OnboardSubAdminResult {
  success: boolean
  sub_admin_id?: string
  /** The educator's coupon code. When the admin left it blank this is the
   *  server-GENERATED code, returned so the Admin UI can display/share it. */
  coupon_code?: string | null
  replayed?: boolean
  error?: { error?: string; message?: string }
  data?: { error?: string; message?: string }
}

export async function onboardSubAdmin(params: {
  email: string
  fullName: string
  couponCode: string
  commissionPercentage?: number | null
  /** Idempotency key (§5): ONE per LOGICAL provisioning operation. The caller
   *  owns its lifecycle — generated when a NEW creation begins, reused only
   *  when RETRYING the same failed operation, cleared on success/close. The
   *  server + DB dedupe on this key, so a retry after a success-timeout
   *  resolves to the original sub-admin instead of double-provisioning. */
  requestId: string
}): Promise<OnboardSubAdminResult> {
  const { email, fullName, couponCode, commissionPercentage, requestId } = params
  const result = await supabase.functions.invoke('onboard-sub-admin', {
    body: {
      email,
      full_name: fullName,
      coupon_code: couponCode,
      commission_percentage: commissionPercentage,
      request_id: requestId,
    },
  })
  // Surface the backend error object (with its canonical `error` code) instead
  // of collapsing to a bare message — the caller maps it to domain UX.
  //
  // NOTE on supabase-js: on a non-2xx, `result.error` is a `FunctionsHttpError`
  // whose `.message` is always the generic "Edge Function returned a non-2xx
  // status code" and whose actual HTTP status + JSON body live in
  // `error.context` (a Response, also exposed as `result.response`). Reading
  // `result.error.message`/`.status` directly therefore DROPS the real backend
  // code/message/status (the root cause of the misleading "Something went
  // wrong" alert). We always unwrap `error.context` first.
  if (result.error) {
    const ctx = (result as { response?: Response }).response ?? result.error?.context
    let code: string | undefined
    let message: string | undefined
    let status: number | undefined
    if (ctx && typeof ctx.status === 'number') status = ctx.status
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = await ctx.json()
        if (body && typeof body === 'object') {
          if (typeof body.error === 'string') code = body.error
          if (typeof body.message === 'string') message = body.message
        }
      } catch {
        // Response body is not JSON — fall through to transport-only status.
      }
    }
    const err = new Error(message || 'Failed to onboard educator.') as Error & { code?: string; status?: number }
    err.code = code
    err.status = status
    throw err
  }
  return result.data
}

export interface UpdateSubAdminCommissionResult {
  success: boolean
  id?: string
  commission_percentage?: number
  updated_at?: string
  error?: { error?: string; message?: string }
}

/* Admin-only commission edit. Optimistic concurrency: pass expectedUpdatedAt
 * (the sub_admins.updated_at the admin UI last observed) so a stale snapshot
 * is rejected server-side (CONCURRENT_UPDATE_CONFLICT) instead of silently
 * overwriting a newer value. Throws an Error carrying the canonical `error`
 * code and HTTP status from the RPC for domain-level UX mapping. */
export async function updateSubAdminCommission(
  subAdminId: string,
  commission: number,
  expectedUpdatedAt?: string | null,
): Promise<UpdateSubAdminCommissionResult> {
  try {
    const row = await userRepo.adminUpdateSubAdminCommissionRpc(
      subAdminId,
      commission,
      expectedUpdatedAt,
    )
    return {
      success: true,
      id: row?.id,
      commission_percentage: row?.commission_percentage,
      updated_at: row?.updated_at,
    }
  } catch (err: unknown) {
    const errObj = err as { message?: string; code?: string; status?: number }
    logError('userService.updateSubAdminCommission.error', {
      subAdminId,
      commission,
      message: errObj.message ?? String(err),
    })
    const domainErr = new Error(errObj.message || 'Failed to update commission.') as Error & { code?: string; status?: number }
    domainErr.code = errObj.code?.toUpperCase()
    domainErr.status = typeof errObj.status === 'number' ? errObj.status : undefined
    throw domainErr
  }
}

/** Bounded SELECT shape returned by attemptRepo.fetchAttemptsForStudents —
 *  the sparse attempt row the sub-admin student page actually renders. */
export interface ExamAttemptViewRow {
  id: string
  user_id: string
  score: number | null
  duration_seconds: number | null
  teacher_exams: {
    title: string
    total_questions: number
    total_marks: number | null
  }
  submitted_at: string | null
}

export async function fetchAttemptsForSubAdminStudents(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  studentIds: string[],
  subAdminId: string
): Promise<ExamAttemptViewRow[]> {
  const { user, requestId } = ctx;

  ensureRole({
    user,
    allowedRoles: ['admin', 'sub_admin'],
    operation: 'fetchAttemptsForSubAdminStudents',
    requestId,
    resourceOwnerId: subAdminId // Verified against the sub-admin whose data this is
  });

  if (studentIds.length === 0) return [];

  try {
    // Scale: split the roster into bounded id chunks. Each query is constrained
    // to <= CHUNK_SIZE user_ids (plus the teacher_exams sub_admin_id predicate),
    // so per-request bounds never grow with cohort size.
    const CHUNK_SIZE = 100;
    const chunks: string[][] = [];
    for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
      chunks.push(studentIds.slice(i, i + CHUNK_SIZE));
    }
    const perChunk = await Promise.all(
      chunks.map((ids) => attemptRepo.fetchAttemptsForStudents(ids, subAdminId))
    );
    return perChunk
      .flat()
      .filter((a): a is NonNullable<typeof a> => a !== null);
  } catch (error: unknown) {
    // Rethrow the ORIGINAL error object — structured metadata must survive
    // for canonical classification downstream.
    logError('userService.fetchAttemptsForSubAdminStudents.error', { message: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

// Errors propagate to the caller — a technical failure must never be
// conflated with a genuine "no profile row" result (which is `null` from the
// repository's maybeSingle() on a successful query).
export async function findSubAdminProfileSimple(userId: string): Promise<{ id: string; coupon_code: string } | null> {
  try {
    return await userRepo.findSubAdminProfileByUserIdSimple(userId)
  } catch (error: unknown) {
    logError('userService.findSubAdminProfileSimple', { message: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

// Errors propagate to the caller — backend failure must never render as a
// successful "0 students" statistic.
export async function countUsersByEducatorId(educatorId: string): Promise<number> {
  const count = await userRepo.countUsersByEducatorId(educatorId)
  return count ?? 0
}

export async function fetchUsersPaginated(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  params: {
    activeTab: string
    statusFilter: string
    searchQuery: string
    page: number
    pageSize: number
  }
): Promise<{ rows: Record<string, unknown>[]; total: number }> {
  const { user, requestId } = ctx

  ensureRole({
    user,
    allowedRoles: ['admin'],
    operation: 'fetchUsersPaginated',
    requestId
  })

  try {
    const offset = (params.page - 1) * params.pageSize
    const result = await userRepo.fetchUsersPaginated({
      activeTab: params.activeTab,
      statusFilter: params.statusFilter,
      searchQuery: params.searchQuery.trim(),
      offset,
      pageSize: params.pageSize,
      sortColumn: 'created_at',
      sortAscending: false,
    })

    const rows = result.rows ?? []
    const pageIds = rows.map(r => r.id)
    const statsById = new Map<string, { exams_taken: number; daily_streak: number; highest_streak: number }>()

    // Canonical per-user stats come from get_admin_user_stats (one batched
    // RPC per page — no N+1). A stats failure degrades to null stats so the
    // user list stays usable; the attempt/streak cells render 0/empty.
    try {
      const stats = await userRepo.fetchAdminUserStats(pageIds)
      if (stats) {
        for (const s of stats) {
          statsById.set(s.user_id, {
            exams_taken: s.exams_taken,
            daily_streak: s.daily_streak,
            highest_streak: s.highest_streak,
          })
        }
      }
    } catch (statsError) {
      logError('userService.fetchUsersPaginated.stats', { message: statsError instanceof Error ? statsError.message : String(statsError) })
    }

    const merged = rows.map(r => {
      const s = statsById.get(r.id)
      return {
        ...r,
        exams_taken: s?.exams_taken ?? null,
        daily_streak: s?.daily_streak ?? null,
        highest_streak: s?.highest_streak ?? null,
      }
    })

    return { rows: merged, total: result.count ?? 0 }
  } catch (error: unknown) {
    logError('userService.fetchUsersPaginated', { message: errorFields(error).message })
    throw error
  }
}

export async function fetchAllSubAdmins(): Promise<Record<string, unknown>[] | null> {
  return await userRepo.fetchAllSubAdmins()
}

export async function fetchStudentsByEducatorId(
  educatorId: string
): Promise<{ rows: Record<string, unknown>[]; truncated: boolean }> {
  try {
    const result = await userRepo.fetchAllStudentsByEducatorId(educatorId)
    return { rows: result.rows, truncated: result.truncated }
  } catch (error: unknown) {
    logError('userService.fetchStudentsByEducatorId', { message: error instanceof Error ? error.message : String(error) })
    throw new Error('Unable to load students for this educator.')
  }
}

/* B6: narrowly-scoped RPC — validates the exact preference keys server-side
 * and updates only sub_admins.notification_prefs for the session owner. */
export async function updateSubAdminNotificationPrefs(prefs: Record<string, unknown>): Promise<void> {
  try {
    await userRepo.updateSubAdminNotificationPrefsViaRpc(prefs)
  } catch (error: unknown) {
    logError('userService.updateSubAdminNotificationPrefs', { message: errorFields(error).message })
    throw error
  }
}
