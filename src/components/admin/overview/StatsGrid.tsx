import { Users, BookOpen, Activity, BarChart3 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { StatCard, useTheme } from '../../common/AntigravityUI'
import { ErrorState, StatSkeleton } from '../../common/SharedComponents'
import { resolveExamIds, ATTEMPT_SOURCE_EXAM_TAB, KNOWN_EXAM_IDS } from '../../../lib/examUtils'

export function StatsGrid({ selectedExam }: { selectedExam: string }) {
  const { isDark } = useTheme();
  const { data, loading, error, refetch } = useSupabaseQuery(async () => {
    try {
      if (!KNOWN_EXAM_IDS.includes(selectedExam)) {
        return { data: { users: 0, questions: 0, configs: 0, attempts: 0 }, error: null }
      }

      const resolvedIds = resolveExamIds(selectedExam)
      
      let usersQuery = supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('role', 'user')
      let questionsQuery = supabase.from('questions').select('id', { count: 'exact', head: true }).eq('is_active', true)
      let configsQuery = supabase.from('exam_configs').select('id', { count: 'exact', head: true }).eq('is_published', true)
      let attemptsQuery = supabase.from('attempts').select('id', { count: 'exact', head: true }).eq('source', ATTEMPT_SOURCE_EXAM_TAB)
      
      if (selectedExam !== 'all') {
        usersQuery = usersQuery.eq('exam_selection', selectedExam)
        configsQuery = configsQuery.eq('exam_selection', selectedExam)
        
        if (resolvedIds.length > 0) {
          questionsQuery = questionsQuery.in('exam_id', resolvedIds)
          attemptsQuery = attemptsQuery.in('exam_id', resolvedIds)
        }
      }

      const [usersRes, questionsRes, configsRes, attemptsRes] = await Promise.allSettled([
        usersQuery, questionsQuery, configsQuery, attemptsQuery
      ])

      const getCount = (result: PromiseSettledResult<{ count: number | null }>) =>
        result.status === 'fulfilled' ? result.value.count || 0 : 0

      return {
        data: {
          users: getCount(usersRes),
          questions: getCount(questionsRes),
          configs: getCount(configsRes),
          attempts: getCount(attemptsRes)
        },
        error: null
      }
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
        color={!isDark ? 'var(--ancient-forest)' : 'var(--primary)'} 
        loading={false} 
      />
      <StatCard 
        icon={Activity} 
        label="Total Attempts" 
        value={data?.attempts || 0} 
        color={!isDark ? 'var(--ancient-gold)' : 'var(--secondary)'} 
        loading={false} 
      />
      <StatCard 
        icon={BarChart3} 
        label="Total Questions" 
        value={data?.questions || 0} 
        color={!isDark ? 'var(--ancient-gold-bright)' : '#3b82f6'} 
        loading={false} 
      />
      <StatCard 
        icon={BookOpen} 
        label="Active Exams" 
        value={data?.configs || 0} 
        color={!isDark ? 'var(--ancient-amber)' : '#f59e0b'} 
        loading={false} 
      />
    </div>
  )
}
