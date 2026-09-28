import { Button, Grid, H2, Body, ErrorContainer, RetryButton } from '../../common/AntigravityUI'
import { GridSkeleton, EmptyState } from '../../common/SharedComponents'
import { RecentAttemptCard } from '../../common/RecentAttemptCard'
import { ArrowRight, BarChart3 } from 'lucide-react'
import type { PerformanceAttemptSummary } from '../../../types/exam.types'
import type { DashboardError } from './useUserDashboard'

interface DashboardRecentActivityProps {
  recentActivity: PerformanceAttemptSummary[]
  loading: boolean
  error: DashboardError | null
  /** DASH-LOW-1 — non-destructive background-refresh failure notice. */
  refreshFailed?: boolean
  isRetrying: boolean
  onRetry: () => void
  onViewPerformance: () => void
  onStartExam: () => void
  onReviewAttempt: (attemptId: string) => void
}

export function DashboardRecentActivity({
  recentActivity, loading, error, refreshFailed = false, isRetrying,
  onRetry, onViewPerformance, onStartExam, onReviewAttempt,
}: DashboardRecentActivityProps) {
  const showNonDestructiveNotice = refreshFailed && recentActivity.length > 0
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <H2 className="uppercase">Recent Activity</H2>
        <Button variant="soft" onClick={onViewPerformance} className="self-end sm:self-center">
          Analytics <ArrowRight size={16} />
        </Button>
      </div>

      {loading ? (
        <div role="status" aria-live="polite" aria-label="Loading recent activity">
          <GridSkeleton decorative count={5} height={180} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" gap="gap-4 md:gap-5 lg:gap-6" />
        </div>
      ) : error && !showNonDestructiveNotice ? (
        <ErrorContainer category={error.category} severity="critical">
          <H2>Failed to load recent activity</H2>
          <Body>{error.message}</Body>
          <RetryButton onRetry={onRetry} loading={isRetrying} />
        </ErrorContainer>
      ) : recentActivity.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={48} className="text-primary" aria-hidden />}
          title="No Recent Activity"
          subtitle="Complete your first exam to see your results here."
          actionLabel="Start an Exam"
          onAction={onStartExam}
        />
      ) : (
        <>
          {showNonDestructiveNotice && (
            <div role="status" aria-live="polite" className="mb-4 text-sm font-bold text-text-secondary">
              Couldn't refresh your recent activity. Showing your last saved results.
            </div>
          )}
          <Grid cols={1} sm={2} lg={3}>
            {recentActivity.map((act) => (
              <RecentAttemptCard
                key={act.id}
                attempt={act}
                onClick={() => onReviewAttempt(act.id)}
              />
            ))}
          </Grid>
        </>
      )}
    </>
  )
}
