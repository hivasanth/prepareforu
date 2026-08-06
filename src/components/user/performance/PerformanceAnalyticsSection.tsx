import { Suspense, lazy, memo } from 'react'
import { TrendingUp } from 'lucide-react'
import { Card, IconBadge } from '../../common/AntigravityUI'
import { LoadingSkeleton } from '../../common/SharedComponents'
import { PerformanceSectionHeader } from './PerformanceSectionHeader'
import { SubjectInsightsCard } from './SubjectInsightsCard'
import type { SubjectStat } from '../../../services/performanceService'
import type { TrendDataPoint, DistributionSlice } from './types'

const PerformanceCharts = lazy(() => import('./PerformanceCharts'))

interface PerformanceAnalyticsSectionProps {
  trendData: TrendDataPoint[]
  hasEnoughTrendData: boolean
  distribution: DistributionSlice[]
  subjectStats: SubjectStat[]
}

export const PerformanceAnalyticsSection = memo(function PerformanceAnalyticsSection({
  trendData,
  hasEnoughTrendData,
  distribution,
  subjectStats
}: PerformanceAnalyticsSectionProps) {
  return (
    <section className="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <Card variant="premium-neutral" padding={24} className="col-span-1 lg:col-span-2 group">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <PerformanceSectionHeader title="Accuracy Trend" subtitle="Accuracy percentage over time" />
            <IconBadge icon={TrendingUp} size="xl" shape="rounded" className="group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="h-[260px] lg:h-[300px] animate-in">
            <Suspense fallback={<LoadingSkeleton height="100%" borderRadius={16} />}>
              <PerformanceCharts type="trend" data={trendData} hasEnoughData={hasEnoughTrendData} />
            </Suspense>
          </div>
        </div>
      </Card>

      <Card variant="premium-neutral" padding={24} className="flex flex-col">
        <PerformanceSectionHeader title="Answer Distribution" subtitle="Response breakdown" />
        <div className="flex-1 min-h-[220px] mt-4">
          <Suspense fallback={<LoadingSkeleton height="100%" borderRadius={16} />}>
            <PerformanceCharts type="distribution" data={distribution} />
          </Suspense>
        </div>
      </Card>

      <SubjectInsightsCard subjectStats={subjectStats} />
    </section>
  )
})
