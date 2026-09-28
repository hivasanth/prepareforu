import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'
import { Body, Label } from '../../common/AntigravityTypography'
import { EmptyState } from '../../common/SharedComponents'
import type { TrendDataPoint, DistributionSlice } from './types'

interface ChartProps {
  type: 'trend' | 'distribution';
  data: TrendDataPoint[] | DistributionSlice[];
  hasEnoughData?: boolean;
}

interface CustomTooltipProps extends Partial<TooltipContentProps> {
  chartType?: 'trend' | 'distribution'
  distributionTotal?: number
}

const CustomTooltip = ({ active, payload, label, chartType = 'trend', distributionTotal = 0 }: CustomTooltipProps) => {
  const { isDark } = useTheme()

  if (!active || !payload || payload.length === 0) return null

  const item = payload[0]
  const entry = item.payload as Record<string, unknown> | undefined

  const tooltipShell =
    `${isDark ? 'bg-slate-900/95 border-white/10' : 'light:stat-card-surface light:shadow-premium-card light:border-card-premium-border'} backdrop-blur-xl border p-3 rounded-2xl shadow-2xl`

  if (chartType === 'distribution') {
    const name = typeof entry?.name === 'string' && entry.name ? entry.name : String(item.name ?? '')
    const rawValue = typeof entry?.value === 'number' ? entry.value : item.value
    const value = Number(rawValue)
    const pct = distributionTotal > 0 ? Math.round((value / distributionTotal) * 100) : 0

    return (
      <div className={tooltipShell}>
        <Label className={`text-[10px] font-bold uppercase tracking-widest mb-2 border-b pb-2 m-0 ${isDark ? 'text-text-muted/40 border-white/5' : 'text-text-muted/40 border-black/5'}`}>{name}</Label>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeof entry?.color === 'string' ? entry.color : 'var(--primary)' }} />
          <Body className="text-[11px] font-bold uppercase tracking-tight text-text-primary m-0">
            {Number.isFinite(value) ? `${value} questions` : 'No data'} <span className="text-text-muted/70">{Number.isFinite(value) && distributionTotal > 0 ? `· ${pct}%` : ''}</span>
          </Body>
        </div>
      </div>
    )
  }

  const timestamp = typeof label === 'number' ? label : Number(Date.parse(String(label ?? '')))
  const formattedLabel = Number.isFinite(timestamp)
    ? new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : String(label ?? '')

  const accuracyRaw = typeof entry?.accuracy === 'number' ? entry.accuracy : item.value
  const accuracy = Number(accuracyRaw)
  const accuracyText = Number.isFinite(accuracy) ? `${accuracy.toFixed(1)}%` : 'N/A'

  const scoreRaw = entry?.score
  const scoreText = typeof scoreRaw === 'number' ? String(scoreRaw) : typeof scoreRaw === 'string' ? scoreRaw : null

  return (
    <div className={tooltipShell}>
      <Label className={`text-[10px] font-bold uppercase tracking-widest mb-2 border-b pb-2 m-0 ${isDark ? 'text-text-muted/40 border-white/5' : 'text-text-muted/40 border-black/5'}`}>{formattedLabel || '—'}</Label>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeof entry?.color === 'string' ? entry.color : 'var(--primary)' }} />
        <Body className="text-[11px] font-bold uppercase tracking-tight text-text-primary m-0">
          Accuracy: <span className="text-primary">{accuracyText}</span>
        </Body>
      </div>
      {scoreText !== null && (
        <Body className={`text-[10px] font-semibold m-0 ${isDark ? 'text-text-muted/50' : 'text-text-muted/50'}`}>
          Score: {scoreText}
        </Body>
      )}
    </div>
  )
}

const PerformanceCharts: React.FC<ChartProps> = ({
  type,
  data,
  hasEnoughData = true,
}) => {
  const { isDark } = useTheme()

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <EmptyState icon={<BarChart3 size={48} aria-hidden />} title="No data" subtitle="Complete exams to see analytics." />
      </div>
    )
  }

const formatTrendTick = (v: number) => {
  const d = new Date(v);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatPercentTick = (v: number) => `${v}%`;

const legendFormatter = (value: string) => <Label className="text-text-secondary uppercase tracking-widest ml-1 m-0">{value}</Label>;

  if (type === 'trend') {
    const validData = (data as TrendDataPoint[]).filter((d) => typeof d.accuracy === 'number' && !isNaN(d.accuracy));

    return (
      <div className="w-full h-full min-w-0 relative" role="img" aria-label="Performance accuracy trend chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={validData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} />
            <XAxis
              dataKey="sortKey"
              scale="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10, fontWeight: 700 }}
              tickFormatter={formatTrendTick}
              dy={10}
              minTickGap={40}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10, fontWeight: 700 }}
              domain={[0, 100]}
              tickFormatter={formatPercentTick}
            />
            <Tooltip content={<CustomTooltip chartType="trend" />} />
            <Line
              type="monotone"
              dataKey="accuracy"
              name="Accuracy"
              stroke="var(--primary)"
              strokeWidth={4}
              dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={0}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
        {!hasEnoughData && (
          <div className="absolute top-0 right-0 px-2 py-0.5 rounded-md bg-warning/10 border border-warning/20 text-warning text-[8px] font-bold uppercase tracking-widest">
             Low Data
          </div>
        )}
      </div>
    )
  }

  if (type === 'distribution') {
    const slices = data as DistributionSlice[]
    const distributionTotal = slices.reduce((sum, s) => sum + (Number(s.value) || 0), 0)

    return (
      <div className="w-full h-full min-w-0" role="img" aria-label="Score distribution pie chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={8}
              dataKey="value"
              isAnimationActive={false}
            >
              {slices.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip chartType="distribution" distributionTotal={distributionTotal} />} />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={legendFormatter}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return null
}

export default React.memo(PerformanceCharts)
