import { useState, useRef, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isAdmin } from '../../utils/authUtils'
import { supabase } from '../../lib/supabase'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { useAdminFilters } from '../../hooks/useAdminFilters'
import { GuardLoader } from '../../guards/Guards'
import { assignRanks, APPSC_GROUPS, type LeaderboardEntry } from '../../utils/rankUtils'

// Components
import { RefreshCw } from 'lucide-react'
import { 
  PageContainer, 
  SectionReveal, 
  Card,
  Stack
} from '../../components/common/AntigravityUI'
import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import { LeaderboardPagination } from '../../components/admin/leaderboard/LeaderboardPagination'
import { LeaderboardView } from '../../components/admin/leaderboard/LeaderboardView'
import { EmptyState, ErrorState } from '../../components/common/SharedComponents'

const PAGE_SIZE = 50

export default function AdminLeaderboard() {
  const { user, loading: authLoading } = useAuth()
  const { selectedExam, selectedPaper, setSelectedExam, setSelectedPaper } = useAdminFilters()
  const [page, setPage] = useState(0)

  useEffect(() => {
    setPage(0)
  }, [selectedExam, selectedPaper])

  const lastRefreshRef = useRef<number>(0)
  const REFRESH_COOLDOWN = 30000 // 30 seconds

  const { data, loading, error, refetch } = useSupabaseQuery(async () => {
    try {
      // Industry Best Practice: Automatic background refresh with cooldown
      // This ensures the materialized view is fresh without requiring a manual button
      const isValidExam = selectedExam === 'all' || selectedExam === 'APPSC_GROUPS' || selectedExam.startsWith('APPSC_GROUP_')
      if (!isValidExam) {
        return { data: { entries: [], count: 0 }, error: null }
      }

      const now = Date.now()
      if (now - lastRefreshRef.current > REFRESH_COOLDOWN) {
        lastRefreshRef.current = now
        await supabase.rpc('refresh_leaderboard_view')
      }

      const offset = page * PAGE_SIZE

      // When a specific paper is selected, query the leaderboard table
      // (has paper_id column) instead of the materialized view.
      if (selectedPaper !== 'all') {
        const examId = selectedExam === 'APPSC_GROUPS' ? null : selectedExam

        let lbQuery = supabase
          .from('leaderboard')
          .select('*', { count: 'exact' })
          .order('best_score', { ascending: false })
          .order('best_accuracy', { ascending: false })
          .order('best_time_secs', { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1)

        if (examId) lbQuery = lbQuery.eq('exam_id', examId)
        else lbQuery = lbQuery.in('exam_id', APPSC_GROUPS)
        lbQuery = lbQuery.eq('paper_id', selectedPaper)

        const lbRes = await lbQuery
        if (lbRes.error) throw lbRes.error

        const lbData = lbRes.data || []

        // Fetch user names for the returned user IDs
        const userIds = [...new Set(lbData.map(d => d.user_id))]
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', userIds)
        const userMap: Record<string, string> = {}
        for (const u of users || []) {
          userMap[u.id] = u.full_name
        }

        const examSelection = selectedExam === 'APPSC_GROUPS' || (selectedExam.startsWith?.('APPSC_GROUP_') ?? false)
          ? 'APPSC_GROUPS'
          : selectedExam

        const entries: LeaderboardEntry[] = lbData.map(d => ({
          user_id: d.user_id,
          user_name: userMap[d.user_id] || 'Unknown',
          exam_id: d.exam_id,
          exam_selection: examSelection,
          paper_id: d.paper_id,
          best_score: d.best_score,
          best_accuracy: d.best_accuracy,
          best_time_secs: d.best_time_secs,
          last_attempt_date: d.best_submitted_at,
          total_attempts: d.attempt_count
        }))

        return {
          data: {
            entries: assignRanks(entries),
            count: lbRes.count || 0
          },
          error: null
        }
      }

      // Use admin_leaderboard_view for non-paper queries
      let query = supabase.from('admin_leaderboard_view').select('*', { count: 'exact' })
      
      if (selectedExam === 'APPSC_GROUPS') {
        query = query.eq('exam_selection', 'APPSC_GROUPS')
      } else if (selectedExam !== 'all') {
        query = query.eq('exam_id', selectedExam)
      }

      query = query
        .order('best_score', { ascending: false })
        .order('best_accuracy', { ascending: false })
        .order('best_time_secs', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1)

      const res = await query
      if (res.error) throw res.error

      return {
        data: {
          entries: assignRanks(res.data as LeaderboardEntry[]),
          count: res.count || 0
        },
        error: null
      }
    } catch (e) {
      return { data: null, error: e }
    }
  }, [selectedExam, selectedPaper, page])

  if (authLoading) return <GuardLoader />
  if (!isAdmin(user)) return <Navigate to="/unauthorized" replace />

  return (
    <PageContainer>

      <Stack gap="lg">
        <SectionReveal className="w-full">
          <AdminSelectionTabs
            selectedExam={selectedExam}
            setSelectedExam={setSelectedExam}
            selectedPaper={selectedPaper}
            setSelectedPaper={setSelectedPaper}
            hideAll={true}
            showSubjects={false}
            className="w-full"
          />
        </SectionReveal>

        <SectionReveal delay={0.1}>
          {loading ? (
            <Card variant="subtle" className="py-24 text-center">
              <RefreshCw size={48} className="mx-auto mb-4 animate-spin opacity-20" />
              <p className="text-text-secondary font-black uppercase tracking-widest text-xs opacity-40">Syncing rankings...</p>
            </Card>
          ) : error ? (
            <ErrorState message={typeof error === 'string' ? error : (error as any)?.message || 'Query failed'} onRetry={refetch} />
          ) : !data?.entries.length ? (
            <EmptyState title="No Rankings Yet" subtitle="Attempts from 'Exams' tab will appear here." />
          ) : (
            <div className="animate-in fade-in duration-500">
              <LeaderboardView data={data.entries} />
            </div>
          )}
        </SectionReveal>

        <LeaderboardPagination 
          currentPage={page}
          hasMore={data ? (page + 1) * PAGE_SIZE < data.count : false}
          onPageChange={setPage}
          isFetching={loading}
        />
      </Stack>
    </PageContainer>
  )
}
