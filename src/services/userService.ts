import * as attemptRepo from '../lib/repositories/attempt.repository'
import * as userRepo from '../lib/repositories/user.repository'
import { queryCache } from '../utils/queryCache'
import { ensureRole } from '../utils/authUtils'
import { logError } from '../utils/logger'
import type { 
  UserProfile, 
  ExamSelection, 
  CouponResult, 
  ServiceResult,
} from '../types/auth.types'

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const START_TIME  = Date.now()
  const MAX_TIMEOUT = 5000 // 5.0s total failure bound
  const RETRY_DELAY = [400, 800, 1500] // Exponential delays
  
  console.log(`[userService] getProfile: Initializing fetch...`)

  for (let i = 0; i <= RETRY_DELAY.length; i++) {
    const elapsed = Date.now() - START_TIME
    if (elapsed > MAX_TIMEOUT) {
      console.warn(`[userService] getProfile: Timeout exceeded (${elapsed}ms).`)
      break
    }

    try {
      const userData = await userRepo.findUserById(userId).catch(() => null)

      if (userData) {
        console.log(`[userService] getProfile: Base profile found.`)
        
        let sub_admin_id = userData.sub_admin_id;

        // For sub-admins: always resolve their own sub_admins table ID authoritatively.
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

      console.warn(`[userService] getProfile: Record not found in 'users' table (Attempt ${i + 1}).`)

      const isRecordMissing = true
      const isNetworkError  = false

      if (!isRecordMissing && !isNetworkError) {
        console.error(`[userService] getProfile: Terminal logic error. Stopping.`);
        return null
      }

      if (i < RETRY_DELAY.length) {
        const delay = RETRY_DELAY[i]
        console.log(`[userService] getProfile: Retrying in ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
      }
    } catch (err) {
      console.error('[userService] getProfile: Unexpected exception', err instanceof Error ? err.message : err)
    }
  }

  console.warn(`[userService] getProfile: Exhausted all attempts.`)
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
      return { valid: true, subAdminName: data.sub_admin_name }
    } catch (error: any) {
      console.error('[userService] validateCoupon error:', error.message)
      return { valid: false, error: 'Could not validate coupon.' }
    }
  } catch (err: unknown) {
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
    return data as UserProfile[];
  } catch (error: any) {
    console.error('[userService] fetchSubAdminStudents error:', error.message);
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
 * Forcefully invalidates dashboard-related cached data for a user.
 */
export async function clearDashboardCache(userId: string) {
  if (!userId) return;
  console.log(`[userService] Clearing dashboard cache...`);
  // Clear dashboard stats
  queryCache.invalidateByPrefix(`dash_stats_${userId}`);
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
    console.error('[userService] fetchSubAdminProfile error:', error.message);
    throw new Error('Unable to identify sub-admin profile.');
  }
}

/**
 * Fetches attempts for a list of students specifically for a sub-admin's exams.
 */
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
    return await attemptRepo.fetchAttemptsForStudents(studentIds, subAdminId);
  } catch (error: any) {
    console.error('[userService] fetchAttemptsForSubAdminStudents error:', error.message);
    throw new Error('Unable to fetch student performance data.');
  }
}
