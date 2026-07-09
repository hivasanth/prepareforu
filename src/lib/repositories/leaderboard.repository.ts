import { supabase } from '../supabase'

type LeaderboardEntryRow = {
  user_id: string
  best_score: number
  best_accuracy: number
  best_time_secs: number
  best_submitted_at: string
  rank: number
  users: { full_name: string } | null
}

type UserNameRow = {
  id: string
  full_name: string
}

export async function fetchLeaderboardByPaper(
  examId: string,
  paperId: string | undefined
): Promise<LeaderboardEntryRow[] | null> {
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
  if (paperId) query = query.eq('paper_id', paperId)
  const { data, error } = await query
  if (error) throw error
  return data as unknown as LeaderboardEntryRow[] | null
}

export async function fetchUserRankRpc(
  examId: string,
  paperId: string | null,
  timeRange: string
): Promise<{
  rank: number
  score: number
  accuracy: number
  duration: number
  submitted_at: string
} | null> {
  const { data, error } = await supabase.rpc('get_user_leaderboard_rank', {
    p_exam_id: examId,
    p_paper_id: paperId,
    p_time_range: timeRange,
  })
  if (error) throw error
  return data as {
    rank: number
    score: number
    accuracy: number
    duration: number
    submitted_at: string
  } | null
}

export async function refreshLeaderboardViewRpc(): Promise<void> {
  const { error } = await supabase.rpc('refresh_leaderboard_view')
  if (error) throw error
}

export async function fetchLeaderboardView(
  examId: string,
  offset: number,
  pageSize: number,
  isAppscGroups?: boolean
): Promise<{ data: Record<string, unknown>[] | null; count: number | null }> {
  let query = supabase
    .from('admin_leaderboard_view')
    .select('*', { count: 'exact' })
  if (isAppscGroups) {
    query = query.eq('exam_selection', 'APPSC_GROUPS')
  } else if (examId !== 'all') {
    query = query.eq('exam_id', examId)
  }
  query = query
    .order('best_score', { ascending: false })
    .order('best_accuracy', { ascending: false })
    .order('best_time_secs', { ascending: true })
    .range(offset, offset + pageSize - 1)
  const { data, count, error } = await query
  if (error) throw error
  return { data: data as Record<string, unknown>[] | null, count }
}

export async function fetchLeaderboardByPaperPaginated(
  examId: string | null,
  paperId: string,
  appscGroupIds: string[],
  offset: number,
  pageSize: number
): Promise<{ data: Record<string, unknown>[] | null; count: number | null }> {
  let query = supabase
    .from('leaderboard')
    .select('*', { count: 'exact' })
    .order('best_score', { ascending: false })
    .order('best_accuracy', { ascending: false })
    .order('best_time_secs', { ascending: true })
    .range(offset, offset + pageSize - 1)
  if (examId) {
    query = query.eq('exam_id', examId)
  } else {
    query = query.in('exam_id', appscGroupIds)
  }
  query = query.eq('paper_id', paperId)
  const { data, count, error } = await query
  if (error) throw error
  return { data: data as Record<string, unknown>[] | null, count }
}

export async function fetchUserNamesByIds(userIds: string[]): Promise<UserNameRow[] | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', userIds)
  if (error) throw error
  return data
}
