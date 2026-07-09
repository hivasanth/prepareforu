import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { BarChart3, Calendar } from 'lucide-react'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { useDateRange } from '../../../hooks/useDateRange'
import { ErrorState } from '../../common/SharedComponents'
import { format, addDays } from 'date-fns'
import { resolveExamIds, KNOWN_EXAM_IDS } from '../../../lib/examUtils'
import { FilterSelect, LoadingOverlay } from '../../common/AntigravityUI'
import { useBreakpoint } from '../../../hooks/useBreakpoint'
import { dashboardService } from '../../../services/dashboardService'

export function DailyAttemptsChart({ selectedExam }: { selectedExam: string }) {
  const { isXs } = useBreakpoint();
  const { ranges, selectedRangeId, setSelectedRangeId, selectedRange } = useDateRange()

  const { data, loading, error, refetch } = useSupabaseQuery<Record<string, number>>(async () => {
    try {
      if (!selectedRange) return { data: {} as Record<string, number>, error: null }

      if (!KNOWN_EXAM_IDS.includes(selectedExam)) {
        return { data: {} as Record<string, number>, error: null }
      }

      const resolvedIds = resolveExamIds(selectedExam)
      const counts = await dashboardService.fetchDailyAttempts(selectedRange, resolvedIds)
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
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all bg-primary/10 border border-primary/20 shadow-sm">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <h3 className="m-0 text-lg sm:text-xl font-black text-text-primary">Daily Attempts</h3>
            <p className="m-0 text-[10px] sm:text-xs text-text-secondary font-bold uppercase tracking-wider opacity-60">
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
                    border: '1px solid var(--border-subtle)', 
                    backgroundColor: 'var(--card-bg)', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }}
                 itemStyle={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'inherit' }}
                 labelStyle={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'inherit' }}
              />
              <Bar 
                dataKey="attempts" 
                fill="var(--primary)" 
                radius={[6, 6, 0, 0]}
                barSize={isXs ? 24 : 32}
                isAnimationActive={false}
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
