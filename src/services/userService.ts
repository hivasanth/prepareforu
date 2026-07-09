import { supabase } from '../lib/supabase'
import * as attemptRepo from '../lib/repositories/attempt.repository'
import * as userRepo from '../lib/repositories/user.repository'
import { ensureRole } from '../utils/authUtils'
import { logError, logWarn, logInfo } from '../utils/logger'
import type { 
  UserProfile, 
  ExamSelection, 
  CouponResult, 
  ServiceResult,
} from '../types/auth.types'

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
    await userRepo.updateUserExamSelection(userId, examSelection)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: { source: 'db', code: 'UNKNOWN', message: error.message } }
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
    } catch (error: any) {
      logError('userService.validateCoupon.error', { message: error.message })
      return { valid: false, error: 'Could not validate coupon.' }
    }
  } catch (err: unknown) {
    logError('userService.validateCoupon.outerError', { message: err instanceof Error ? err.message : String(err) })
    return { valid: false, error: 'Network error. Could not validate coupon.' }
  }
}

/**
 * Fetches students linked to a specific sub-admin (educator).
 * Strictly isolated via ensureRole and resourceOwnerId.
 */
export async function fetchSubAdminStudents(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  educatorId: string
): Promise<UserProfile[]> {
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
    return (data as unknown as UserProfile[]) ?? [];
  } catch (error: any) {
    logError('userService.fetchSubAdminStudents.error', { message: error.message });
    throw new Error('Unable to fetch students for this educator.');
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
    await userRepo.updateUser(targetUserId, { is_active: isActive });
    return { success: true, data: null };
  } catch (error: any) {
    logError('userService.toggleUserStatus.error', { message: error.message });
    return { success: false, error: { source: 'db', code: 'UPDATE_FAILED', message: error.message } };
  }
}

/**
 * Administrative: Removes a sub-admin (revokes authorization).
 * Reverts the user's role to 'user' and clears educator associations.
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

  // 1. Fetch user_id before deleting the record
  let saRecord;
  try {
    saRecord = await userRepo.findSubAdminById(saId);
  } catch (fetchError: any) {
    logError('[userService] removeSubAdmin fetch error:', { message: fetchError?.message || 'Sub-admin not found' });
    return { success: false, error: { source: 'db', code: 'DELETE_FAILED', message: 'Educator record not found.' } };
  }

  if (!saRecord) {
    logError('[userService] removeSubAdmin fetch error:', { message: 'Sub-admin not found' });
    return { success: false, error: { source: 'db', code: 'DELETE_FAILED', message: 'Educator record not found.' } };
  }

  // 2. Delete the sub-admin record
  try {
    await userRepo.deleteSubAdmin(saId);
  } catch (deleteError: any) {
    logError('[userService] removeSubAdmin delete error:', { message: deleteError.message });
    return { success: false, error: { source: 'db', code: 'DELETE_FAILED', message: deleteError.message } };
  }

  // 3. Revert the user's role and clear educator associations
  if (saRecord.user_id) {
    try {
      await userRepo.updateUser(saRecord.user_id, {
        role: 'user',
        sub_admin_id: null,
        educator_id: null
      });
    } catch (updateError: any) {
      logError('[userService] removeSubAdmin role revert error:', { message: updateError.message });
      return {
        success: false,
        error: { source: 'db', code: 'UPDATE_FAILED', message: 'Educator removed but role reversion failed. Contact support.' }
      };
    }
  }

  return { success: true, data: null };
}

/**
 * Fetches the sub-admin profile for a given user.
 */
export async function fetchSubAdminProfile(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  userId: string
): Promise<{ id: string }> {
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
    if (!data) throw new Error('Sub-admin not found');
    return data;
  } catch (error: any) {
    logError('userService.fetchSubAdminProfile.error', { message: error.message });
    throw new Error('Unable to identify sub-admin profile.');
  }
}

/**
 * Fetches attempts for a list of students specifically for a sub-admin's exams.
 */
// ─── Sub-admin Profile ────────────────────────────────────────────────────────
export async function fetchSubAdminProfileAndUser(
  userId: string
): Promise<{ profile: any; lastActivity: string }> {
  const profile = await userRepo.findSubAdminProfileByUserId(userId);
  const uData = await userRepo.findUserLastActivity(userId);
  const lastLogin = uData?.last_activity_date
    ? new Date(uData.last_activity_date).toLocaleDateString()
    : '—';
  return { profile, lastActivity: lastLogin };
}

export async function updateSubAdminProfile(
  saId: string,
  userId: string | undefined,
  fullName: string
): Promise<void> {
  await userRepo.updateSubAdmin(saId, { full_name: fullName });
  if (userId) {
    await userRepo.updateUser(userId, { full_name: fullName });
  }
}

export async function onboardSubAdmin(
  email: string,
  fullName: string,
  couponCode: string
): Promise<any> {
  const result = await supabase.functions.invoke('onboard-sub-admin', {
    body: { email, full_name: fullName, coupon_code: couponCode }
  })
  if (result.error) throw new Error(result.error?.message || 'Failed to onboard educator.');
  return result;
}

export async function fetchAttemptsForSubAdminStudents(
  ctx: { user: UserProfile | null | undefined; requestId?: string },
  studentIds: string[],
  subAdminId: string
): Promise<any[]> {
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
    return (await attemptRepo.fetchAttemptsForStudents(studentIds, subAdminId)) ?? [];
  } catch (error: any) {
    logError('userService.fetchAttemptsForSubAdminStudents.error', { message: error.message });
    throw new Error('Unable to fetch student performance data.');
  }
}

export async function findSubAdminProfileSimple(userId: string): Promise<{ id: string; coupon_code: string } | null> {
  try {
    return await userRepo.findSubAdminProfileByUserIdSimple(userId)
  } catch (error: any) {
    logError('userService.findSubAdminProfileSimple', { message: error.message })
    return null
  }
}

export async function countUsersByEducatorId(educatorId: string): Promise<number> {
  try {
    return (await userRepo.countUsersByEducatorId(educatorId)) ?? 0
  } catch (error: any) {
    logError('userService.countUsersByEducatorId', { message: error.message })
    return 0
  }
}

export async function fetchUsersPaginated(params: {
  activeTab: string
  statusFilter: string
  searchQuery: string
  page: number
  pageSize: number
}): Promise<{ rows: Record<string, unknown>[]; total: number }> {
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
    return { rows: result.rows ?? [], total: result.count ?? 0 }
  } catch (error: any) {
    logError('userService.fetchUsersPaginated', { message: error.message })
    throw error
  }
}

export async function fetchAllSubAdmins(): Promise<Record<string, unknown>[] | null> {
  return await userRepo.fetchAllSubAdmins()
}

export async function fetchStudentsByEducatorId(educatorId: string): Promise<Record<string, unknown>[] | null> {
  try {
    return await userRepo.fetchStudentsByEducatorId(educatorId)
  } catch (error: any) {
    logError('userService.fetchStudentsByEducatorId', { message: error.message })
    throw new Error('Unable to load students for this educator.')
  }
}

export async function updateSubAdminNotificationPrefs(id: string, prefs: Record<string, unknown>): Promise<void> {
  try {
    await userRepo.updateSubAdmin(id, { notification_prefs: prefs })
  } catch (error: any) {
    logError('userService.updateSubAdminNotificationPrefs', { message: error.message })
    throw error
  }
}
