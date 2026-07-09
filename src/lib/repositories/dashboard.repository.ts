import { supabase } from '../supabase'

export async function fetchDashboardStatsRpc(userId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.rpc('get_user_dashboard_stats', { p_user_id: userId })
  if (error) throw error
  return data as Record<string, unknown> | null
}
