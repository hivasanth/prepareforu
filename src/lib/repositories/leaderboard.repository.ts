import { supabase } from '../supabase'

export async function fetchLeaderboardByPaper(
  examId: string,
  paperId: string | undefined
): Promise<any[]> {
  let query = supabase
    .from('leaderboard')
    .select(`
      user_id,
      best_score,
      best_accuracy,
      best_time_secs,
      best_submitted_at,
      rank,
      users ( full_name )
    `)
    .eq('exam_id', examId)
    .order('rank', { ascending: true })
    .limit(50)
  if (paperId && paperId !== 'all') query = query.eq('paper_id', paperId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchUserRankRpc(
  examId: string,
  paperId: string | null,
  timeRange: string
): Promise<any> {
  const { data, error } = await supabase.rpc('get_user_leaderboard_rank', {
    p_exam_id: examId,
    p_paper_id: paperId,
    p_time_range: timeRange,
  })
  if (error) throw error
  return data
}
