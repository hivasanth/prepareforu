import { supabase } from '../supabase'

export async function fetchDashboardStatsRpc(userId: string): Promise<{
  daily_streak: number
  exams_taken: number
  accuracy: number
  global_rank: string
} | null> {
  const { data, error } = await supabase.rpc('get_user_dashboard_stats', { p_user_id: userId })
  if (error) throw error
  return data as {
    daily_streak: number
    exams_taken: number
    accuracy: number
    global_rank: string
  } | null
}
