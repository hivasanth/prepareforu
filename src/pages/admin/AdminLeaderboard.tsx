import {
  PageContainer,
  SectionReveal,
  Card,
  Stack,
  Pagination,
  H1,
  H2,
  Body,
  ErrorContainer,
  RetryButton,
  FloatingList,
  FloatingListHeader,
  FloatingListItem
} from '../../components/common/AntigravityUI'
import { Skeleton } from '../../components/common/Skeleton'
import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import { LeaderboardView } from '../../components/admin/leaderboard/LeaderboardView'
import { LEADERBOARD_GRID, LEADERBOARD_CELL, LEADERBOARD_GRID_INSET } from '../../components/admin/leaderboard/leaderboardGrid'
import { EmptyState } from '../../components/common/SharedComponents'
import { useAdminLeaderboard } from '../../components/admin/leaderboard/useAdminLeaderboard'

const SKELETON_ROW_COUNT = 5

/* Shape-matched loading state: reuses the ONE leaderboard grid contract
 * (LEADERBOARD_GRID/LEADERBOARD_CELL) and the canonical Skeleton primitive so
 * the placeholder geometry is identical to the loaded page — rank, avatar +
 * name, score, and the lg-only metric columns. Bars are `decorative` because
 * the page wrapper below already owns the single role="status" live region. */
function LeaderboardSkeleton() {
  return (
    <Card variant="elevated">
      <FloatingList gap="sm">
        <FloatingListHeader padding="none">
          {/* py-4 matches LeaderboardView's header exactly so the cold→content
              swap is vertically seamless. */}
          <div className={`${LEADERBOARD_GRID} ${LEADERBOARD_GRID_INSET} py-4`}>
            <div className={`${LEADERBOARD_CELL.rank} flex justify-center`}>
              <Skeleton decorative width={32} height={20} borderRadius={10} />
            </div>
            <div className={`${LEADERBOARD_CELL.name} flex items-center gap-3 pl-2 md:pl-3`}>
              <Skeleton decorative width={36} height={36} borderRadius={12} />
              <Skeleton decorative width={112} height={16} borderRadius={8} />
            </div>
            <div className={`${LEADERBOARD_CELL.score} flex justify-center`}>
              <Skeleton decorative width={56} height={28} borderRadius={14} />
            </div>
            <div className={`${LEADERBOARD_CELL.duration} flex justify-center`}>
              <Skeleton decorative width={64} height={28} borderRadius={14} />
            </div>
            <div className={`${LEADERBOARD_CELL.attempts} flex justify-center`}>
              <Skeleton decorative width={48} height={28} borderRadius={14} />
            </div>
            <div className={`${LEADERBOARD_CELL.date} flex justify-center`}>
              <Skeleton decorative width={96} height={20} borderRadius={8} />
            </div>
          </div>
        </FloatingListHeader>

        {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
          <FloatingListItem key={i} padding="none">
            <div className={`${LEADERBOARD_GRID} ${LEADERBOARD_GRID_INSET} py-3 md:py-4`}>
              <div className={`${LEADERBOARD_CELL.rank} flex justify-center`}>
                <Skeleton decorative width={32} height={20} borderRadius={10} />
              </div>
              <div className={`${LEADERBOARD_CELL.name} flex items-center gap-3 pl-2 md:pl-3`}>
                <Skeleton decorative width={36} height={36} borderRadius={12} />
                <Skeleton decorative width={120} height={16} borderRadius={8} />
              </div>
              <div className={`${LEADERBOARD_CELL.score} flex justify-center`}>
                <Skeleton decorative width={56} height={28} borderRadius={14} />
              </div>
              <div className={`${LEADERBOARD_CELL.duration} flex justify-center`}>
                <Skeleton decorative width={64} height={28} borderRadius={14} />
              </div>
              <div className={`${LEADERBOARD_CELL.attempts} flex justify-center`}>
                <Skeleton decorative width={48} height={28} borderRadius={14} />
              </div>
              <div className={`${LEADERBOARD_CELL.date} flex justify-center`}>
                <Skeleton decorative width={96} height={20} borderRadius={8} />
              </div>
            </div>
          </FloatingListItem>
        ))}
      </FloatingList>
    </Card>
  )
}

export default function AdminLeaderboard() {
  const {
    entries, loading, error, refetch,
    page, setPage, hasMore,
    selectedExam, selectedPaper, setSelectedExam, setSelectedPaper,
  } = useAdminLeaderboard()

  return (
    <PageContainer>
      <H1 className="sr-only">Admin Leaderboard</H1>
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
              <LeaderboardSkeleton />
            ) : error ? (
              <ErrorContainer category="unknown" variant="page">
                <H2>Something went wrong</H2>
                <Body>{typeof error === 'string' ? error : (error as { message?: string })?.message || 'Query failed'}</Body>
                <RetryButton onRetry={refetch} />
              </ErrorContainer>
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
