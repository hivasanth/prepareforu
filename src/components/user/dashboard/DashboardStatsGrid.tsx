import { Flame, Target, Trophy, GraduationCap } from 'lucide-react'
import { StatCard, Grid, H2, Body, ErrorContainer, RetryButton } from '../../common/AntigravityUI'
import { StatSkeleton } from '../../common/SharedComponents'
import type { DashboardStats } from '../../../services/dashboardService'
import type { DashboardError } from './useUserDashboard'

interface DashboardStatsGridProps {
  stats: DashboardStats | null
  loading: boolean
  error: DashboardError | null
  /** DASH-LOW-1 — non-destructive background-refresh failure. When true and
   *  `stats` is present, last-known-good data stays on screen and a polite
   *  notice is shown instead of the destructive ErrorContainer. */
  refreshFailed?: boolean
  isRetrying: boolean
  onRetry: () => void
}

export function DashboardStatsGrid({ stats, loading, error, refreshFailed = false, isRetrying, onRetry }: DashboardStatsGridProps) {
  const showNonDestructiveNotice = refreshFailed && !!stats
  return (
    <>
      {loading ? (
        <div role="status" aria-live="polite" aria-label="Loading dashboard stats">
          <StatSkeleton decorative columns="grid-cols-2 lg:grid-cols-4" gap="gap-4 md:gap-5 lg:gap-6" />
        </div>
      ) : error && !showNonDestructiveNotice ? (
        <ErrorContainer category={error.category} severity="critical">
          <H2>Failed to load dashboard stats</H2>
          <Body>{error.message}</Body>
          <RetryButton onRetry={onRetry} loading={isRetrying} />
        </ErrorContainer>
      ) : (
        <>
          {showNonDestructiveNotice && (
            <div role="status" aria-live="polite" className="mb-4 text-sm font-bold text-text-secondary">
              Couldn't refresh your stats. Showing your last saved numbers.
            </div>
          )}
          <Grid cols={2} lg={4}>
            <StatCard icon={Flame} label="STREAK" value={stats?.daily_streak || 0} unit="Days" status="warning" />
            <StatCard icon={GraduationCap} label="WISDOM" value={stats?.exams_taken || 0} unit="Exams" status="accent" />
            <StatCard icon={Target} label="PRECISION" value={stats?.accuracy || 0} unit="%" status="info" />
            <StatCard icon={Trophy} label="STANDING" value={stats?.global_rank || 'N/A'} status="secondary" />
          </Grid>
        </>
      )}
    </>
  )
}
