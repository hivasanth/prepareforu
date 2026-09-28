import { supabase } from '../supabase'
import type { UserProfile } from '../../types/auth.types'
import type { EducatorStudentRow } from '../../types/user.types'

// ─── users table ─────────────────────────────────────────────────────────────

export async function findUserById(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, exam_selection, sub_admin_id, educator_id, is_active, email_verified, coupon_code_used, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Persist the caller's preferred exam.
 *
 * P0-02: this is a *preference*, not a grant. The direct
 * `users.exam_selection` UPDATE was the privilege hole that let any account
 * unlock a whole exam category, and the column grant has been revoked. The
 * server validates the choice against the caller's entitlements inside
 * `set_preferred_exam`, which also scopes the write to `auth.uid()` so a
 * caller can no longer name someone else's user id.
 */
export async function updateUserExamSelection(examSelection: string): Promise<void> {
  const { error } = await supabase.rpc('set_preferred_exam', { p_exam_id: examSelection })
  if (error) throw error
}

export async function fetchMyEntitlements(): Promise<{ exam_id: string; exam_selection: string; exam_name: string }[] | null> {
  const { data, error } = await supabase.rpc('get_my_entitlements')
  if (error) throw error
  return data
}

export async function fetchUsersByEducatorId(educatorId: string): Promise<EducatorStudentRow[] | null> {
  // Roster semantics: the "students" page lists users linked to the educator
  // whose role is `user` (i.e. STUDENT). Educator/sub-admin/linked rows are
  // intentionally excluded. Deterministic ordering keeps the roster stable
  // across refreshes. `is_active` is NOT filtered: deactivated students remain
  // part of the cohort so their history and profile stay accessible.
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, coupon_code, educator_id, created_at')
    .eq('educator_id', educatorId)
    .eq('role', 'user')
    .order('created_at', { ascending: true })
    .limit(5000)
  if (error) throw error
  return data
}

// ─── Admin RPCs (SECURITY DEFINER — bypass the column-privilege revokes on
//     protected users columns; the function body enforces is_admin()). ──────────

export async function adminSetUserActiveRpc(userId: string, isActive: boolean): Promise<number> {
  const { data, error } = await supabase.rpc('admin_set_user_active', {
    p_user_id: userId,
    p_is_active: isActive,
  })
  if (error) throw error
  return (data as number) ?? 0
}

// SA-commission: admin-only optimistic-concurrency commission update via the
// SECURITY DEFINER RPC (self-authorizes is_admin(); sub-admins cannot mutate).
// Optimistic concurrency: pass the `updated_at` the admin UI last observed so
// a stale snapshot can never silently overwrite a newer value.
export async function adminUpdateSubAdminCommissionRpc(
  subAdminId: string,
  commission: number,
  expectedUpdatedAt?: string | null,
): Promise<{ id: string; commission_percentage: number; updated_at: string } | null> {
  const { data, error } = await supabase.rpc('admin_update_sub_admin_commission', {
    p_sub_admin_id: subAdminId,
    p_commission: commission,
    p_expected_updated_at: expectedUpdatedAt ?? null,
  })
  if (error) throw error
  return (data as { id: string; commission_percentage: number; updated_at: string } | null) ?? null
}

// SA-4: atomic educator removal — role ARCHIVE ('deactivated_sub_admin') +
// profile delete in ONE database transaction inside the SECURITY DEFINER RPC.
// Any failure rolls back everything, so no partial-success authorization state
// is possible. The archived role (never 'user') also keeps removed educators
// off the Admin → Users list.
export async function removeSubAdminViaRpc(saId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_remove_sub_admin', { p_sub_admin_id: saId })
  if (error) throw error
}

// ─── sub_admins table ────────────────────────────────────────────────────────

export async function findSubAdminByUserId(userId: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('sub_admins')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function findSubAdminProfileByUserIdSimple(userId: string): Promise<{ id: string; coupon_code: string } | null> {
  const { data, error } = await supabase
    .from('sub_admins')
    .select('id, coupon_code')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

// ─── Auth RPCs ────────────────────────────────────────────────────────────────

export async function validateCouponRpc(coupon: string): Promise<{
  valid: boolean
  sub_admin_name?: string
}> {
  const { data, error } = await supabase.rpc('validate_coupon', { p_coupon: coupon })
  if (error) throw error
  return (data as { valid: boolean; sub_admin_name?: string }) ?? { valid: false }
}

export async function checkUserExistsRpc(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_user_exists', { p_email: email })
  if (error) throw error
  return !!data
}

export async function isAccountLockedRpc(email: string): Promise<{ locked: boolean; seconds_left?: number } | null> {
  const { data, error } = await supabase.rpc('is_account_locked', { p_email: email })
  if (error) throw error
  return data
}

export async function linkUserToEducatorRpc(couponCode: string): Promise<{
  success: boolean
  educator_name?: string
  educator_id?: string
  sub_admin_id?: string
  error?: string
}> {
  const { data, error } = await supabase.rpc('link_user_to_educator', {
    p_coupon_code: couponCode.trim().toUpperCase(),
  })
  if (error) throw error
  return (data as { success: boolean; educator_name?: string; educator_id?: string; sub_admin_id?: string; error?: string }) ?? { success: false, error: 'Unknown response from server.' }
}

export async function recordFailedLoginRpc(email: string): Promise<void> {
  await supabase.rpc('record_failed_login', { p_email: email })
}

export async function resetFailedLoginRpc(email: string): Promise<void> {
  await supabase.rpc('reset_failed_login', { p_email: email })
}

// ─── Sub-admin profile ──────────────────────────────────────────────────────

export async function findSubAdminProfileByUserId(userId: string): Promise<{ id: string; full_name: string; email: string; coupon_code: string; notification_prefs: unknown } | null> {
  const { data, error } = await supabase
    .from('sub_admins')
    .select('id, full_name, email, coupon_code, notification_prefs')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function findUserLastActivity(userId: string): Promise<{ last_activity_date: string } | null> {
  const { data, error } = await supabase
    .from('users')
    .select('last_activity_date')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/* B6: the former generic updateSubAdmin(id, Record<string, unknown>) helper is
 * gone. Self-mutations go through narrowly-scoped SECURITY DEFINER RPCs that
 * derive ownership from auth.uid() server-side and touch exact columns only. */
export async function updateSubAdminNameViaRpc(fullName: string): Promise<void> {
  const { error } = await supabase.rpc('update_sub_admin_name', { p_full_name: fullName })
  if (error) throw error
}

export async function updateSubAdminNotificationPrefsViaRpc(
  prefs: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.rpc('update_sub_admin_notification_prefs', { p_prefs: prefs })
  if (error) throw error
}

export async function fetchAllSubAdmins(): Promise<{
  id: string
  full_name: string
  email: string
  coupon_code: string | null
  total_referrals: number
  status: string
  created_at: string
  updated_at: string
  commission_percentage: number | null
}[] | null> {
  const { data, error } = await supabase
    .from('sub_admins')
    .select('id, full_name, email, coupon_code, total_referrals, status, created_at, updated_at, commission_percentage')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function countUsersByEducatorId(educatorId: string): Promise<number | null> {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('educator_id', educatorId)
  if (error) throw error
  return count
}

/**
 * Complete paginated student export for a sub-admin's cohort. Fetches the
 * exact total first, then pages through every record — a row count larger
 * than the page size can no longer silently truncate the CSV. `truncated` is
 * only true as a safety net when the loop returns fewer rows than the exact
 * count (guard against pathological growth); otherwise the export is complete.
 */
export async function fetchAllStudentsByEducatorId(
  educatorId: string,
  pageSize = 1000
): Promise<{ rows: { full_name: string; email: string; created_at: string }[]; truncated: boolean }> {
  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('educator_id', educatorId)
  if (countError) throw countError
  const total = count ?? 0

  const rows: { full_name: string; email: string; created_at: string }[] = []
  for (let from = 0; from < total; from += pageSize) {
    const { data, error } = await supabase
      .from('users')
      .select('full_name, email, created_at')
      .eq('educator_id', educatorId)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1)
    if (error) throw error
    rows.push(...(data ?? []))
  }

  return { rows, truncated: rows.length < total }
}

type UserListRow = {
  id: string
  full_name: string
  email: string
  exam_selection: string
  is_active: boolean
  created_at: string
}

type AdminUserStats = {
  user_id: string
  daily_streak: number
  highest_streak: number
  exams_taken: number
}

export async function fetchAdminUserStats(userIds: string[]): Promise<AdminUserStats[] | null> {
  if (userIds.length === 0) return []
  const { data, error } = await supabase.rpc('get_admin_user_stats', { p_user_ids: userIds })
  if (error) throw error
  return (data as AdminUserStats[] | null) ?? []
}

export async function fetchUsersPaginated(params: {
  activeTab: string
  statusFilter: string
  searchQuery: string
  offset: number
  pageSize: number
  sortColumn?: string
  sortAscending?: boolean
}): Promise<{ rows: UserListRow[] | null; count: number | null }> {
  const { activeTab, statusFilter, searchQuery, offset, pageSize, sortColumn, sortAscending } = params

  // ROLE-SEPARATION: the users list is now served exclusively by the
  // `admin_list_users` SECURITY DEFINER RPC. It hard-codes `role = 'user'` AND
  // `NOT EXISTS (sub_admins)` server-side and guards itself with is_admin(),
  // so a removed/archived educator (role `deactivated_sub_admin`) can never
  // appear here regardless of how the client is called. Search ILIKE escaping
  // and sort-column whitelisting also happen in SQL — the client passes raw
  // input as DATA (escaped via %L / %I), never filter grammar.
  const { data, error } = await supabase.rpc('admin_list_users', {
    p_exam_selection: activeTab === 'all' ? null : activeTab,
    p_status: statusFilter === 'all' ? null : statusFilter,
    p_search: searchQuery || null,
    p_sort_column: sortColumn ?? 'created_at',
    p_sort_asc: sortAscending ?? false,
    p_offset: offset,
    p_limit: pageSize,
  })
  if (error) throw error

  const rows = (data as { rows?: UserListRow[]; count?: number } | null) ?? null
  return { rows: rows?.rows ?? [], count: rows?.count ?? 0 }
}
