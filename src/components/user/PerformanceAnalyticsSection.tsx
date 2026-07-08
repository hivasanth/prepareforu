import { Suspense, lazy } from 'react'
import { TrendingUp } from 'lucide-react'
import { Card, IconBadge } from '../common/AntigravityUI'
import { LoadingSkeleton } from '../common/SharedComponents'
import { PerformanceSectionHeader } from './PerformanceSectionHeader'
import { SubjectInsightsCard } from './SubjectInsightsCard'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const PerformanceCharts = lazy(() => import('./PerformanceCharts'))

interface SubjectStat {
  subject: string
  accuracy: number
  correct: number
  total: number
  status: string
  color: string
}

interface PerformanceAnalyticsSectionProps {
  trendData: any[]
  hasEnoughTrendData: boolean
  distribution: any[]
  subjectStats: SubjectStat[]
}

export function PerformanceAnalyticsSection({
  trendData,
  hasEnoughTrendData,
  distribution,
  subjectStats
}: PerformanceAnalyticsSectionProps) {
  const { isXs, isSm } = useBreakpoint()
  const isMobile = isXs || isSm

  return (
    <section className="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <Card className="col-span-1 lg:col-span-2 p-6 shadow-xl relative overflow-hidden group border border-border-subtle hover:border-primary/50 transition-colors duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <PerformanceSectionHeader title="Accuracy Trend" subtitle="Accuracy percentage over time" />
            <IconBadge icon={TrendingUp} size="xl" shape="rounded" className="group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="h-[260px] lg:h-[300px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Suspense fallback={<LoadingSkeleton height="100%" borderRadius={16} />}>
              <PerformanceCharts type="trend" data={trendData} hasEnoughData={hasEnoughTrendData} />
            </Suspense>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-xl flex flex-col">
        <PerformanceSectionHeader title="Answer Distribution" subtitle="Response breakdown" />
        <div className="flex-1 min-h-[220px] mt-4">
          <Suspense fallback={<LoadingSkeleton height="100%" borderRadius={16} />}>
            <PerformanceCharts type="distribution" data={distribution} />
          </Suspense>
        </div>
      </Card>

      {!isMobile && <SubjectInsightsCard subjectStats={subjectStats} />}
    </section>
  )
}
