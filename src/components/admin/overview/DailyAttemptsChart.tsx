import { memo, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Calendar } from 'lucide-react'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { useDateRange } from '../../../hooks/useDateRange'
import { ErrorContainer, FilterSelect, RetryButton, H2, Body } from '../../common/AntigravityUI'
import { LoadingSkeleton } from '../../common/SharedComponents'
import { format, addDays } from 'date-fns'
import { PerformanceSectionHeader } from '../../user/performance/PerformanceSectionHeader'
import { useBreakpoint } from '../../../hooks/useBreakpoint'
import { dashboardService } from '../../../services/dashboardService'

interface DailyAttemptsChartProps {
  selectedExam: string
  resolvedIds: string[]
}

export const DailyAttemptsChart = memo(function DailyAttemptsChart({ selectedExam, resolvedIds }: DailyAttemptsChartProps) {
  const { isXs } = useBreakpoint()
  const { ranges, selectedRangeId, setSelectedRangeId, selectedRange } = useDateRange()

  const { data, loading, error, refetch } = useSupabaseQuery<Record<string, number>>(async () => {
    try {
      if (!selectedRange) return { data: {} as Record<string, number>, error: null }
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
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PerformanceSectionHeader title="Daily Attempts" subtitle="Exam Volume Insight" />

        <FilterSelect
          icon={Calendar}
          value={selectedRangeId}
          onChange={setSelectedRangeId}
          options={ranges.map(r => ({ id: r.id, name: r.name }))}
          className="!w-full sm:!w-48"
        />
      </div>

      <div className="h-[260px] lg:h-[300px] w-full relative animate-in" tabIndex={0} role="figure" aria-label="Daily exam attempt counts bar chart">
        {loading ? (
          <LoadingSkeleton height="100%" borderRadius={16} />
        ) : error ? (
          <ErrorContainer category="network" severity="critical">
            <H2>Failed to load daily attempts</H2>
            <Body>{error}</Body>
            <RetryButton onRetry={refetch} />
          </ErrorContainer>
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
                  backgroundColor: 'var(--surface-floating)',
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
})
