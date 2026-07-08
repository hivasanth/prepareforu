import { supabase } from '../supabase'
import { countQuery } from './base.repository'

export async function fetchDashboardStatsRpc(userId: string): Promise<any> {
  const { data, error } = await supabase.rpc('get_user_dashboard_stats', { p_user_id: userId })
  if (error) throw error
  return data
}

export async function fetchOverviewCounts(queries: {
  users: Record<string, any>
  questions: Record<string, any>
  configs: Record<string, any>
  attempts: Record<string, any>
}): Promise<{ users: number; questions: number; configs: number; attempts: number }> {
  const [users, questions, configs, attempts] = await Promise.allSettled([
    countQuery('users', queries.users),
    countQuery('questions', queries.questions),
    countQuery('exam_configs', queries.configs),
    countQuery('attempts', queries.attempts),
  ])
  return {
    users: users.status === 'fulfilled' ? users.value : 0,
    questions: questions.status === 'fulfilled' ? questions.value : 0,
    configs: configs.status === 'fulfilled' ? configs.value : 0,
    attempts: attempts.status === 'fulfilled' ? attempts.value : 0,
  }
}
