import { useState, useRef, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isAdmin } from '../../utils/authUtils'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { useAdminFilters } from '../../hooks/useAdminFilters'
import { GuardLoader } from '../../guards/Guards'
import { refreshLeaderboardView, fetchAdminLeaderboard } from '../../services/leaderboardService'

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
      const isValidExam = selectedExam === 'all' || selectedExam === 'APPSC_GROUPS' || selectedExam.startsWith('APPSC_GROUP_')
      if (!isValidExam) {
        return { data: { entries: [], count: 0 }, error: null }
      }

      const now = Date.now()
      if (now - lastRefreshRef.current > REFRESH_COOLDOWN) {
        lastRefreshRef.current = now
        await refreshLeaderboardView()
      }

      const result = await fetchAdminLeaderboard(selectedExam, selectedPaper, page, PAGE_SIZE)

      return {
        data: { entries: result.entries, count: result.count },
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
