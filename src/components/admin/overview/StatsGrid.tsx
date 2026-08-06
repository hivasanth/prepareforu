import { memo } from 'react'
import { Users, BookOpen, Activity, BarChart3 } from 'lucide-react'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { StatCard, Grid, ErrorContainer, RetryButton, H2, Body } from '../../common/AntigravityUI'
import { StatSkeleton } from '../../common/SharedComponents'
import { dashboardService } from '../../../services/dashboardService'

interface StatsGridProps {
  selectedExam: string
  resolvedIds: string[]
}

export const StatsGrid = memo(function StatsGrid({ selectedExam, resolvedIds }: StatsGridProps) {
  const { data, loading, error, refetch } = useSupabaseQuery(async () => {
    try {
      const counts = await dashboardService.fetchOverviewCounts(selectedExam, resolvedIds)
      return { data: counts, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  }, [selectedExam])

  if (loading) return <StatSkeleton />
  if (error) return (
    <ErrorContainer category="network" severity="critical">
      <H2>Failed to load overview statistics</H2>
      <Body>{error}</Body>
      <RetryButton onRetry={refetch} />
    </ErrorContainer>
  )

  return (
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
