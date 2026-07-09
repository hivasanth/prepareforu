import { supabase } from '../supabase'
import type { UserProfile } from '../../types/auth.types'

// ─── users table ─────────────────────────────────────────────────────────────

export async function findUserById(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateUserExamSelection(userId: string, examSelection: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ exam_selection: examSelection })
    .eq('id', userId)
  if (error) throw error
}

export async function fetchUsersByEducatorId(educatorId: string): Promise<Pick<UserProfile, 'id' | 'full_name' | 'email' | 'coupon_code' | 'educator_id' | 'created_at'>[] | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, coupon_code, educator_id, created_at')
    .eq('educator_id', educatorId)
    .limit(5000)
  if (error) throw error
  return data
}

export async function updateUser(id: string, updates: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
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

export async function findSubAdminById(saId: string): Promise<{ user_id: string }> {
  const { data, error } = await supabase
    .from('sub_admins')
    .select('user_id')
    .eq('id', saId)
    .single()
  if (error) throw error
  return data as { user_id: string }
}

export async function deleteSubAdmin(saId: string): Promise<void> {
  const { error } = await supabase
    .from('sub_admins')
    .delete()
    .eq('id', saId)
  if (error) throw error
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

export async function updateSubAdmin(id: string, updates: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from('sub_admins')
    .update(updates)
    .eq('id', id)
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
}[] | null> {
  const { data, error } = await supabase
    .from('sub_admins')
    .select('id, full_name, email, coupon_code, total_referrals, status, created_at')
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

export async function fetchStudentsByEducatorId(educatorId: string): Promise<{
  full_name: string
  email: string
  created_at: string
}[] | null> {
  const { data, error } = await supabase
    .from('users')
    .select('full_name, email, created_at')
    .eq('educator_id', educatorId)
    .limit(5000)
  if (error) throw error
  return data
}

type UserListRow = {
  id: string
  full_name: string
  email: string
  exam_selection: string
  is_active: boolean
  created_at: string
  streak: number
  total_exams: number
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

  let query = supabase
    .from('users')
    .select('id, full_name, email, exam_selection, is_active, created_at, streak, total_exams', { count: 'exact' })
    .eq('role', 'user')

  if (activeTab !== 'all') {
    query = query.eq('exam_selection', activeTab)
  }
  if (statusFilter === 'active') {
    query = query.eq('is_active', true)
  } else if (statusFilter === 'inactive') {
    query = query.eq('is_active', false)
  }

  if (searchQuery) {
    query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
  }

  if (sortColumn) {
    query = query.order(sortColumn, { ascending: sortAscending ?? false })
  }

  const res = await query
    .range(offset, offset + pageSize - 1)

  if (res.error) throw res.error
  return { rows: res.data as UserListRow[] | null, count: res.count }
}
