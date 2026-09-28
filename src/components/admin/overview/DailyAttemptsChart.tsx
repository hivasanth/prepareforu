import { memo, useId, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Calendar } from 'lucide-react'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { useDateRange } from '../../../hooks/useDateRange'
import { ErrorContainer, FilterSelect, RetryButton, H2, Body } from '../../common/AntigravityUI'
import { LoadingSkeleton } from '../../common/SharedComponents'
import { FOCUS_RING } from '../../common/AntigravityMotion'
import { format, addDays } from 'date-fns'
import { PerformanceSectionHeader } from '../../user/performance/PerformanceSectionHeader'
import { useBreakpoint } from '../../../hooks/useBreakpoint'
import { dashboardService } from '../../../services/dashboardService'
import type { ErrorCategory, ErrorSeverity } from '../../../types/error.types'

interface DailyAttemptsChartProps {
  selectedExam: string
  resolvedIds: string[]
}

/** Canonical category → ErrorContainer severity for read-only data failures. */
function severityForCategory(category: ErrorCategory): ErrorSeverity {
  if (category === 'authentication' || category === 'authorization') return 'high'
  if (category === 'network' || category === 'offline' || category === 'timeout' || category === 'server' || category === 'rateLimit' || category === 'maintenance') return 'critical'
  return 'medium'
}

/** Human-readable chart name per exam scope — the figure's accessible name. */
const EXAM_LABEL: Record<string, string> = {
  all: 'All exams',
  APPSC_GROUPS: 'APPSC',
  BANK_EXAMS: 'Bank exams',
}

export const DailyAttemptsChart = memo(function DailyAttemptsChart({ selectedExam, resolvedIds }: DailyAttemptsChartProps) {
  const { isXs } = useBreakpoint()
  const { ranges, selectedRangeId, setSelectedRangeId, selectedRange } = useDateRange()
  // Single id for the sr-only data table; the figure points at it via
  // aria-describedby so SR users discover the detailed values.
  const tableTitleId = useId()

  const { data, loading, error, category, refetch } = useSupabaseQuery<Record<string, number>>(async () => {
    try {
      // Invariant guard: selectedRange is always set at runtime (ranges is a
      // per-mount useMemo and selectedRangeId seeds from initialRange inside
      // it). Kept as defensive protection so a future range refactor cannot
      // silently render an empty/undefined chart window.
      if (!selectedRange) return { data: {} as Record<string, number>, error: null }
      const counts = await dashboardService.fetchDailyAttempts(selectedRange, resolvedIds)
      return { data: counts, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  }, [selectedExam, selectedRangeId], 'overview:daily')

  const chartData = useMemo(() => {
    if (!data || !selectedRange) return []
    const result = []
    let current = selectedRange.start
    while (current <= selectedRange.end) {
      const dateStr = format(current, 'yyyy-MM-dd')
      result.push({
        date: dateStr,
        formattedDate: format(current, 'MMM d'),
        accessibleDate: format(current, 'MMM d, yyyy'),
        attempts: data[dateStr] || 0
      })
      current = addDays(current, 1)
    }
    return result
  }, [data, selectedRange])

  const rangeName = ranges.find(r => r.id === selectedRangeId)?.name ?? ''
  const chartName = `Daily exam attempt counts \u2014 ${EXAM_LABEL[selectedExam] ?? selectedExam}${rangeName ? ` (${rangeName})` : ''}`

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

      <div
        className={`h-[260px] lg:h-[300px] w-full relative animate-in rounded-lg outline-none ${FOCUS_RING}`}
        tabIndex={0}
        role="figure"
        aria-label={chartName}
        aria-describedby={tableTitleId}
      >
        {loading ? (
          <div role="status" aria-label="Loading daily attempts chart" className="h-full">
            <LoadingSkeleton height="100%" borderRadius={16} />
          </div>
        ) : error ? (
          <ErrorContainer category={category} severity={severityForCategory(category)}>
            <H2>Failed to load daily attempts</H2>
            <Body>{error}</Body>
            <RetryButton onRetry={refetch} />
          </ErrorContainer>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: isXs ? -10 : -25, bottom: 0 }}>
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
            {/* Accessible data representation: exact per-date values, zero-filled,
                never requiring hover. Referenced by the figure's aria-describedby. */}
            <table className="sr-only" aria-label="Daily attempt counts by date">
              <caption id={tableTitleId} className="sr-only">Daily attempt counts by date</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Attempts</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((d) => (
                  <tr key={d.date}>
                    <th scope="row">{d.accessibleDate}</th>
                    <td>{d.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
})
