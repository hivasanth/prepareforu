import { supabase } from '../lib/supabase'
import { safeSupabaseCall } from '../utils/safeSupabase'
import { queryCache } from '../utils/queryCache'
import { ensureRole } from '../utils/authUtils'
import { logError } from '../utils/logger'
import type { 
  UserProfile, 
  ExamSelection, 
  CouponResult, 
  ServiceResult,
  ServiceErrorSource
} from '../types/auth.types'

// ─── Constants ────────────────────────────────────────────────────────────────
const QUERY_TIMEOUT_MS = 5000 // Reduced for faster failover/retries

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Standardizes errors with sources and codes, including a timeout mechanism.
 */
async function safeQuery<T>(
  promise: Promise<{ data: T | null; error: any }>,
  label:   string,
  source:  ServiceErrorSource = 'db'
): Promise<ServiceResult<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), QUERY_TIMEOUT_MS)
    })

    const { data, error } = await Promise.race([promise, timeoutPromise])

    if (timeoutId) clearTimeout(timeoutId)

    if (error) {
      console.error(`[userService][${label}] error:`, error.message)
      return {
        success: false,
        error: {
          source,
          code:    error.status === 429 ? 'RATE_LIMIT' : 'UNKNOWN',
          message: error.message || `An error occurred in ${label}`,
        }
      }
    }

    if (data === null) {
      return { success: true, data: undefined as unknown as T }
    }

    return { success: true, data }
  } catch (err: any) {
    if (timeoutId) clearTimeout(timeoutId)
    if (err.message === 'TIMEOUT') {
      console.warn(`[userService][${label}] request timed out after ${QUERY_TIMEOUT_MS}ms`)
      return {
        success: false,
        error: { source: 'network', code: 'NETWORK', message: 'Request timed out. Please try again.' }
      }
    }
    return {
      success: false,
      error: { source: 'unknown', code: 'UNKNOWN', message: err.message || 'An unexpected error occurred.' }
    }
  }
}

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
      const { data: userData, error: userErr } = await safeSupabaseCall(
        supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
      )

      if (!userErr && userData) {
        console.log(`[userService] getProfile: Base profile found.`)
        
        let sub_admin_id = userData.sub_admin_id;

        // For sub-admins: always resolve their own sub_admins table ID authoritatively.
        // We cannot trust users.sub_admin_id because:
        //   a) It may be stale from when they were a student (pointing to their old educator).
        //   b) It may be NULL if they were promoted before the DB trigger was in place.
        // Querying sub_admins directly is the single source of truth.
        if (userData.role === 'sub_admin') {
          const { data: saData } = await safeSupabaseCall(
            supabase
              .from('sub_admins')
              .select('id')
              .eq('user_id', userId)
              .maybeSingle()
          );

          if (saData) {
            sub_admin_id = saData.id;
          }
        }

        return {
          ...userData,
          sub_admin_id
        } as UserProfile;
      }

      if (userErr) {
        console.error(`[userService] getProfile: Supabase error (Attempt ${i + 1})`, userErr.message)
      } else if (!userData) {
        console.warn(`[userService] getProfile: Record not found in 'users' table (Attempt ${i + 1}).`)
      }

      // Smart Retry Filtering
      const isRecordMissing = !userData && !userErr
      const isNetworkError  = !userErr?.code || userErr?.message?.includes('fetch')

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

  const query = supabase.from('users').update({ exam_selection: examSelection }).eq('id', userId)
  const result = await safeQuery(query as any, 'updateExamSelection')

  return { success: result.success, error: result.error }
}

// ─── Validate Coupon ──────────────────────────────────────────────────────────
export async function validateCoupon(couponCode: string): Promise<CouponResult> {
  try {
    if (!couponCode.trim()) return { valid: false, error: 'Coupon code is empty.' }

    // Using raw call here to match CouponResult return type
    const { data, error } = await safeSupabaseCall(supabase.rpc('validate_coupon', {
      p_coupon: couponCode.trim().toUpperCase(),
    }))

    if (error) {
      console.error('[userService] validateCoupon error:', error.message)
      return { valid: false, error: 'Could not validate coupon.' }
    }

    if (!data || !data.valid) return { valid: false, error: 'Invalid or expired coupon.' }

    return { valid: true, subAdminName: data.sub_admin_name }
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

  const { data, error } = await safeSupabaseCall(
    supabase
      .from('users')
      .select('id, full_name, email, coupon_code, educator_id, created_at')
      .eq('educator_id', educatorId)
      .limit(5000)
  );

  if (error) {
    console.error('[userService] fetchSubAdminStudents error:', error.message);
    throw new Error('Unable to fetch students for this educator.');
  }

  return data as UserProfile[];
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

  const { error } = await safeSupabaseCall(
    supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', targetUserId)
  );

  if (error) {
    logError('userService.toggleUserStatus.error', { message: error.message });
    return { success: false, error: { source: 'db', code: 'UPDATE_FAILED', message: error.message } };
  }

  return { success: true, data: null };
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
  const { data: saRecord, error: fetchError } = await safeSupabaseCall(
    supabase
      .from('sub_admins')
      .select('user_id')
      .eq('id', saId)
      .single()
  );

  if (fetchError || !saRecord) {
    logError('[userService] removeSubAdmin fetch error:', fetchError?.message || 'Sub-admin not found');
    return { success: false, error: { source: 'db', code: 'DELETE_FAILED', message: 'Educator record not found.' } };
  }

  // 2. Delete the sub-admin record
  const { error: deleteError } = await safeSupabaseCall(
    supabase
      .from('sub_admins')
      .delete()
      .eq('id', saId)
  );

  if (deleteError) {
    logError('[userService] removeSubAdmin delete error:', deleteError.message);
    return { success: false, error: { source: 'db', code: 'DELETE_FAILED', message: deleteError.message } };
  }

  // 3. Revert the user's role and clear educator associations
  if (saRecord.user_id) {
    const { error: updateError } = await safeSupabaseCall(
      supabase
        .from('users')
        .update({
          role: 'user',
          sub_admin_id: null,
          educator_id: null
        })
        .eq('id', saRecord.user_id)
    );

    if (updateError) {
      logError('[userService] removeSubAdmin role revert error:', updateError.message);
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

  const { data, error } = await safeSupabaseCall(
    supabase
      .from('sub_admins')
      .select('id')
      .eq('user_id', userId)
      .single()
  );

  if (error) {
    console.error('[userService] fetchSubAdminProfile error:', error.message);
    throw new Error('Unable to identify sub-admin profile.');
  }

  return data;
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

  const { data, error } = await safeSupabaseCall(
    supabase
      .from('attempts')
      .select(`
        id, 
        score, 
        duration_seconds, 
        submitted_at, 
        user_id,
        teacher_exams!inner (
          title,
          total_questions
        )
      `)
      .in('user_id', studentIds)
      .eq('teacher_exams.sub_admin_id', subAdminId)
      .limit(10000)
  );

  if (error) {
    console.error('[userService] fetchAttemptsForSubAdminStudents error:', error.message);
    throw new Error('Unable to fetch student performance data.');
  }

  return data;
}
