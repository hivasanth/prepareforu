import { Users, BookOpen, Activity, BarChart3 } from 'lucide-react'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { StatCard } from '../../common/AntigravityUI'
import { ErrorState, StatSkeleton } from '../../common/SharedComponents'
import { resolveExamIds, KNOWN_EXAM_IDS } from '../../../lib/examUtils'
import { dashboardService } from '../../../services/dashboardService'

export function StatsGrid({ selectedExam }: { selectedExam: string }) {
  const { data, loading, error, refetch } = useSupabaseQuery(async () => {
    try {
      if (!KNOWN_EXAM_IDS.includes(selectedExam)) {
        return { data: { users: 0, questions: 0, configs: 0, attempts: 0 }, error: null }
      }

      const resolvedIds = resolveExamIds(selectedExam)
      const counts = await dashboardService.fetchOverviewCounts(selectedExam, resolvedIds)
      return { data: counts, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  }, [selectedExam])

  if (loading) return <StatSkeleton />
  if (error) return <div className="col-span-full"><ErrorState message={error} onRetry={refetch} /></div>

  return (
    <div role="region" aria-label="Statistics summary" aria-live="polite" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
      <StatCard 
        icon={Users} 
        label="Total Users" 
        value={data?.users || 0} 
        color="var(--primary)" 
        loading={false} 
      />
      <StatCard 
        icon={Activity} 
        label="Total Attempts" 
        value={data?.attempts || 0} 
        color="var(--secondary)" 
        loading={false} 
      />
      <StatCard 
        icon={BarChart3} 
        label="Total Questions" 
        value={data?.questions || 0} 
        color="var(--info)" 
        loading={false} 
      />
      <StatCard 
        icon={BookOpen} 
        label="Active Exams" 
        value={data?.configs || 0} 
        color="var(--warning)" 
        loading={false} 
      />
    </div>
  )
}
