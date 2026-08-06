import { Button, Grid, H2, Body, ErrorContainer, RetryButton } from '../../common/AntigravityUI'
import { LoadingSkeleton, EmptyState } from '../../common/SharedComponents'
import { RecentAttemptCard } from '../../common/RecentAttemptCard'
import type { AttemptWithRelations } from '../../../types/exam.types'

interface DashboardRecentActivityProps {
  recentActivity: AttemptWithRelations[]
  loading: boolean
  error: string | null
  isRetrying: boolean
  onRetry: () => void
  onViewPerformance: () => void
  onStartExam: () => void
  onReviewAttempt: (attemptId: string) => void
}

export function DashboardRecentActivity({
  recentActivity, loading, error, isRetrying,
  onRetry, onViewPerformance, onStartExam, onReviewAttempt,
}: DashboardRecentActivityProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <H2 className="uppercase">Recent Activity</H2>
        <Button variant="soft" onClick={onViewPerformance} className="self-end sm:self-center">
          Analytics →
        </Button>
      </div>

      {loading ? (
        <Grid cols={1} sm={2} lg={3} className="gap-4 md:gap-6">
          {[1, 2, 3].map(i => <LoadingSkeleton key={i} height={180} borderRadius={24} />)}
        </Grid>
      ) : error ? (
        <ErrorContainer category="network" severity="critical">
          <H2>Failed to load recent activity</H2>
          <Body>{error}</Body>
          <RetryButton onRetry={onRetry} loading={isRetrying} />
        </ErrorContainer>
      ) : recentActivity.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No Recent Activity"
          subtitle="Complete your first exam to see your results here."
          actionLabel="Start an Exam"
          onAction={onStartExam}
        />
      ) : (
        <Grid cols={1} sm={2} lg={3} className="gap-4 md:gap-6">
          {recentActivity.map((act) => (
            <RecentAttemptCard
              key={act.id}
              attempt={act}
              onClick={() => onReviewAttempt(act.id)}
            />
          ))}
        </Grid>
      )}
    </>
  )
}
