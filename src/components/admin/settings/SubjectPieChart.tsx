import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

const COLORS = ['#12291C', '#C8960C', '#4E342E', '#A87828', '#1A3316', '#8B5A10']

export function SubjectPieChart({ data }: { data: { subject_name: string; question_count: number }[] }) {
  const chartData = data.map(s => ({ name: s.subject_name, value: s.question_count }))

  return (
    <div className="h-[240px] w-full">
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
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip
            contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: 'var(--card-bg)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
