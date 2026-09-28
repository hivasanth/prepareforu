import { memo } from 'react'
import { Users, BookOpen, Activity, BarChart3 } from 'lucide-react'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { StatCard, Grid, ErrorContainer, RetryButton, H2, Body } from '../../common/AntigravityUI'
import { StatSkeleton } from '../../common/SharedComponents'
import { dashboardService } from '../../../services/dashboardService'
import type { ErrorCategory, ErrorSeverity } from '../../../types/error.types'

interface StatsGridProps {
  selectedExam: string
  resolvedIds: string[]
}

/** Canonical category → ErrorContainer severity for read-only data failures. */
function severityForCategory(category: ErrorCategory): ErrorSeverity {
  if (category === 'authentication' || category === 'authorization') return 'high'
  if (category === 'network' || category === 'offline' || category === 'timeout' || category === 'server' || category === 'rateLimit' || category === 'maintenance') return 'critical'
  return 'medium'
}

export const StatsGrid = memo(function StatsGrid({ selectedExam, resolvedIds }: StatsGridProps) {
  const { data, loading, error, category, refetch } = useSupabaseQuery(async () => {
    try {
      const counts = await dashboardService.fetchOverviewCounts(selectedExam, resolvedIds)
      return { data: counts, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  }, [selectedExam], 'overview:stats')

  if (loading) return (
    <div role="status" aria-label="Loading statistics">
      <StatSkeleton columns="grid-cols-2 lg:grid-cols-4" gap="gap-4 md:gap-5 lg:gap-6" decorative />
    </div>
  )
  if (error) return (
    <ErrorContainer category={category} severity={severityForCategory(category)}>
      <H2>Failed to load overview statistics</H2>
      <Body>{error}</Body>
      <RetryButton onRetry={refetch} />
    </ErrorContainer>
  )

  return (
    // A11y decision (AO-7): keep aria-live="polite" on the statistics region.
    // 1) SWR refreshes that yield identical text produce NO DOM mutation, so no
    //    redundant re-announcement fires. 2) When values genuinely change (exam
    //    switch, retry after failure) the region is re-announced once. This is
    //    the least-noisy correct configuration for live numeric content.
    <div role="region" aria-label="Statistics summary" aria-live="polite">
      <Grid cols={2} lg={4}>
        <StatCard icon={Users} label="Total Users" value={data?.users || 0} status="accent" />
        <StatCard icon={Activity} label="Total Attempts" value={data?.attempts || 0} status="secondary" />
        <StatCard icon={BarChart3} label="Total Questions" value={data?.questions || 0} status="info" />
        <StatCard icon={BookOpen} label="Active Exams" value={data?.configs || 0} status="warning" />
      </Grid>
    </div>
  )
})
