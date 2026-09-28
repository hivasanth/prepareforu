import { useMemo, useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

const CHART_VAR_NAMES = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--chart-6',
]

function resolveChartColors(): string[] {
  const root = document.documentElement
  const style = getComputedStyle(root)
  return CHART_VAR_NAMES.map(name => style.getPropertyValue(name).trim() || '#64748B')
}

export function SubjectPieChart({ data }: { data: { subject_name: string; question_count: number }[] }) {
  const chartData = useMemo(() => data.map(s => ({ name: s.subject_name, value: s.question_count })), [data])
  const [colors, setColors] = useState(resolveChartColors)

  // Re-resolve on theme class change (light/dark toggle)
  useEffect(() => {
    const observer = new MutationObserver(() => setColors(resolveChartColors()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="h-[240px] w-full" role="img" aria-label="Subject distribution pie chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={5}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <RechartsTooltip
            contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: 'var(--surface-floating)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
