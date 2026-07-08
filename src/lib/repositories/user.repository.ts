import { supabase } from '../supabase'

// ─── users table ─────────────────────────────────────────────────────────────

export async function findUserById(userId: string): Promise<any> {
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

export async function fetchUsersByEducatorId(educatorId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, coupon_code, educator_id, created_at')
    .eq('educator_id', educatorId)
    .limit(5000)
  if (error) throw error
  return data || []
}

export async function updateUser(id: string, updates: Record<string, any>): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

// ─── sub_admins table ────────────────────────────────────────────────────────

export async function findSubAdminByUserId(userId: string): Promise<any> {
  const { data, error } = await supabase
    .from('sub_admins')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function findSubAdminById(saId: string): Promise<any> {
  const { data, error } = await supabase
    .from('sub_admins')
    .select('user_id')
    .eq('id', saId)
    .single()
  if (error) throw error
  return data
}

export async function deleteSubAdmin(saId: string): Promise<void> {
  const { error } = await supabase
    .from('sub_admins')
    .delete()
    .eq('id', saId)
  if (error) throw error
}

// ─── Auth RPCs ────────────────────────────────────────────────────────────────

export async function validateCouponRpc(coupon: string): Promise<any> {
  const { data, error } = await supabase.rpc('validate_coupon', { p_coupon: coupon })
  if (error) throw error
  return data
}

export async function checkUserExistsRpc(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_user_exists', { p_email: email })
  if (error) throw error
  return !!data
}

export async function isAccountLockedRpc(email: string): Promise<{ locked: boolean; seconds_left?: number }> {
  const { data, error } = await supabase.rpc('is_account_locked', { p_email: email })
  if (error) throw error
  return data || { locked: false }
}

export async function recordFailedLoginRpc(email: string): Promise<void> {
  await supabase.rpc('record_failed_login', { p_email: email })
}

export async function resetFailedLoginRpc(email: string): Promise<void> {
  await supabase.rpc('reset_failed_login', { p_email: email })
}

// ─── Edge Functions ───────────────────────────────────────────────────────────

export async function invokeSecurityGateway(pathname: string): Promise<any> {
  const invokePromise = supabase.functions.invoke('security-gateway', {
    method: 'POST',
    body: { pathname }
  })
  return invokePromise
}
