import { BookOpen, Target, TrendingUp, Trophy } from 'lucide-react'
import { StatCard } from '../common/AntigravityUI'
import { useBreakpoint } from '../../hooks/useBreakpoint'

interface Metrics {
  total: number
  avgAccuracy: number
  avgScore: number
  bestScore: number
}

interface PerformanceMetricsGridProps {
  metrics: Metrics | null
}

export function PerformanceMetricsGrid({ metrics }: PerformanceMetricsGridProps) {
  const { isXs, isSm } = useBreakpoint()
  const isMobile = isXs || isSm

  return (
    <section className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
      <StatCard icon={BookOpen} label="Total Exams" value={metrics?.total || 0} color="#2563EB" />
      <StatCard icon={Target} label="Avg Accuracy" value={`${metrics?.avgAccuracy || 0}%`} color="#7C3AED" />
      <StatCard icon={TrendingUp} label="Average Score" value={metrics?.avgScore || 0} color="#0891B2" />
      <StatCard icon={Trophy} label="Best Score" value={metrics?.bestScore || 0} color="#16A34A" />
    </section>
  )
}
