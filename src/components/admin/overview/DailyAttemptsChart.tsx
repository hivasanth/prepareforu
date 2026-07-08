import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { BarChart3, Calendar } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { useDateRange } from '../../../hooks/useDateRange'
import { ErrorState } from '../../common/SharedComponents'
import { format, parseISO, addDays } from 'date-fns'
import { resolveExamIds, ATTEMPT_SOURCE_EXAM_TAB, KNOWN_EXAM_IDS } from '../../../lib/examUtils'
import { FilterSelect, LoadingOverlay, useTheme } from '../../common/AntigravityUI'
import { useBreakpoint } from '../../../hooks/useBreakpoint'

interface AttemptRow {
  started_at: string;
  exam_id: string;
}

export function DailyAttemptsChart({ selectedExam }: { selectedExam: string }) {
  const { isDark } = useTheme();
  const { isXs } = useBreakpoint();
  const { ranges, selectedRangeId, setSelectedRangeId, selectedRange } = useDateRange()

  const { data, loading, error, refetch } = useSupabaseQuery(async () => {
    try {
      if (!selectedRange) return { data: [], error: null }

      if (!KNOWN_EXAM_IDS.includes(selectedExam)) {
        return { data: [], error: null }
      }

      const resolvedIds = resolveExamIds(selectedExam)
      let query = supabase
        .from('attempts')
        .select('started_at, exam_id')
        .eq('source', ATTEMPT_SOURCE_EXAM_TAB)
        .gte('started_at', selectedRange.start.toISOString())
        .lte('started_at', selectedRange.end.toISOString())
        .order('started_at', { ascending: true })
      
      if (resolvedIds.length > 0) {
        query = query.in('exam_id', resolvedIds)
      }

      const res = await query
      if (res.error) throw res.error

      const rows = (res.data || []) as AttemptRow[]
      const counts = rows.reduce<Record<string, number>>((acc, attempt) => {
        const date = format(parseISO(attempt.started_at), 'yyyy-MM-dd')
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {})

      return { data: counts, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  }, [selectedExam, selectedRangeId])

  const chartData = useMemo(() => {
    if (!data || !selectedRange) return []
    
    const result = []
    let current = selectedRange.start
    while (current <= selectedRange.end) {
      const dateStr = format(current, 'yyyy-MM-dd')
      result.push({
        date: dateStr,
        formattedDate: format(current, 'MMM d'),
        attempts: data[dateStr] || 0
      })
      current = addDays(current, 1)
    }
    
    return result
  }, [data, selectedRange])

  return (
    <div className="p-4 xs:p-6 sm:p-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${!isDark ? 'ancient-icon-badge shadow-lg' : 'bg-primary/10 border border-primary/20 shadow-sm'}`}>
            <BarChart3 className={`w-5 h-5 sm:w-6 sm:h-6 ${!isDark ? '' : 'text-primary'}`} />
          </div>
          <div>
            <h3 className={`m-0 text-lg sm:text-xl font-black text-text-primary ${!isDark ? 'font-cinzel' : ''}`}>Daily Attempts</h3>
            <p className={`m-0 text-[10px] sm:text-xs text-text-secondary font-bold uppercase tracking-wider opacity-60 ${!isDark ? 'font-garamond italic' : ''}`}>
              Exam Volume Insight
            </p>
          </div>
        </div>

        <FilterSelect 
          icon={Calendar}
          value={selectedRangeId}
          onChange={setSelectedRangeId}
          options={ranges.map(r => ({ id: r.id, name: r.name }))}
          className="!w-full sm:!w-48"
        />
      </div>

      <div className="flex-1 min-h-[220px] sm:min-h-[250px] w-full mt-2 relative" tabIndex={0} role="figure" aria-label="Daily exam attempt counts bar chart">
        <LoadingOverlay visible={loading} message="Syncing Data" />

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: isXs ? -10 : -25, bottom: 0 }} role="img" aria-label="Daily exam attempt counts bar chart">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 800 }} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 800 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                 cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                 contentStyle={{ 
                   borderRadius: '16px', 
                   border: !isDark ? '1.5px solid var(--ancient-gold)' : '1px solid var(--border-subtle)', 
                   backgroundColor: !isDark ? 'var(--ancient-cream-light)' : 'var(--card-bg)', 
                   boxShadow: !isDark ? '5px 6px 0px rgba(105, 62, 15, 0.4)' : '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                 }}
                 itemStyle={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'inherit' }}
                 labelStyle={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'inherit' }}
              />
              <Bar 
                dataKey="attempts" 
                fill="var(--primary)" 
                radius={[6, 6, 0, 0]}
                barSize={isXs ? 24 : 32}
                isAnimationActive={true}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.attempts > 0 ? 'var(--primary)' : 'var(--border-subtle)'} 
                    opacity={entry.attempts > 0 ? 1 : 0.3}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
