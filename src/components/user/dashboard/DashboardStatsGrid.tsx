import { Flame, Target, Trophy, GraduationCap } from 'lucide-react'
import { StatCard, Grid, H2, Body, ErrorContainer, RetryButton } from '../../common/AntigravityUI'
import { StatSkeleton } from '../../common/SharedComponents'
import type { DashboardStats } from '../../../services/dashboardService'

interface DashboardStatsGridProps {
  stats: DashboardStats | null
  loading: boolean
  error: string | null
  isRetrying: boolean
  onRetry: () => void
}

export function DashboardStatsGrid({ stats, loading, error, isRetrying, onRetry }: DashboardStatsGridProps) {
  return (
    <>
      {loading ? (
        <StatSkeleton />
      ) : error ? (
        <ErrorContainer category="network" severity="critical">
          <H2>Failed to load dashboard stats</H2>
          <Body>{error}</Body>
          <RetryButton onRetry={onRetry} loading={isRetrying} />
        </ErrorContainer>
      ) : (
        <Grid cols={2} lg={4}>
          <StatCard icon={Flame} label="STREAK" value={stats?.daily_streak || 0} unit="Days" status="warning" />
          <StatCard icon={GraduationCap} label="WISDOM" value={stats?.exams_taken || 0} unit="Exams" status="accent" />
          <StatCard icon={Target} label="PRECISION" value={stats?.accuracy || 0} unit="%" status="info" />
          <StatCard icon={Trophy} label="STANDING" value={stats?.global_rank || 'N/A'} status="secondary" />
        </Grid>
      )}
    </>
  )
}
