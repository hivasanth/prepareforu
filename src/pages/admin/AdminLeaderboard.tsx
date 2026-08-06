import {
  PageContainer,
  SectionReveal,
  Card,
  Stack,
  Pagination,
  Spinner
} from '../../components/common/AntigravityUI'
import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import { LeaderboardView } from '../../components/admin/leaderboard/LeaderboardView'
import { EmptyState, ErrorState } from '../../components/common/SharedComponents'
import { useAdminLeaderboard } from '../../components/admin/leaderboard/useAdminLeaderboard'

export default function AdminLeaderboard() {
  const {
    entries, loading, error, refetch,
    page, setPage, hasMore,
    selectedExam, selectedPaper, setSelectedExam, setSelectedPaper,
  } = useAdminLeaderboard()

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
          />
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <div role="status" aria-live="polite" aria-label="Leaderboard status">
            {loading ? (
              <Card variant="subtle" className="py-24 text-center">
                <Spinner size="lg" className="mx-auto mb-4" />
                <p className="text-text-muted font-semibold uppercase tracking-widest text-xs">Syncing rankings...</p>
              </Card>
            ) : error ? (
              <ErrorState message={typeof error === 'string' ? error : (error as any)?.message || 'Query failed'} onRetry={refetch} />
            ) : !entries.length ? (
              <EmptyState title="No Rankings Yet" subtitle="Attempts from 'Exams' tab will appear here." />
            ) : (
              <div className="animate-in">
                <LeaderboardView data={entries} />
              </div>
            )}
          </div>
        </SectionReveal>

        {(page > 0 || hasMore) && (
          <Pagination
            page={page}
            hasMore={hasMore}
            onPageChange={setPage}
            className="mt-6 sm:mt-10 lg:mt-12 p-3 bg-card-bg/30 border border-border-subtle rounded-2xl"
          />
        )}
      </Stack>
    </PageContainer>
  )
}
