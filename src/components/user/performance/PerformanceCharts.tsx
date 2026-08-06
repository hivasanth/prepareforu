import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { useTheme } from '../../../context/ThemeContext'
import { Body, Label } from '../../common/AntigravityTypography'
import { EmptyState } from '../../common/SharedComponents'
import type { TrendDataPoint, DistributionSlice } from './types'

interface ChartProps {
  type: 'trend' | 'distribution';
  data: TrendDataPoint[] | DistributionSlice[];
  hasEnoughData?: boolean;
}

const CustomTooltip = ({ active, payload, label }: Partial<TooltipContentProps>) => {
  const { isDark } = useTheme()
  if (active && payload && payload.length) {
    const p = payload[0];
    const pt = p.payload;
    const formattedLabel = label
      ? new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
    return (
      <div className={`${isDark ? 'bg-slate-900/95 border-white/10 text-text-muted/40' : 'bg-white/95 border-black/10 text-text-muted/40'} backdrop-blur-xl border p-3 rounded-2xl shadow-2xl`}>
        <Label className={`text-[10px] font-bold uppercase tracking-widest mb-2 border-b pb-2 m-0 ${isDark ? 'text-text-muted/40 border-white/5' : 'text-text-muted/40 border-black/5'}`}>{formattedLabel}</Label>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <Body className="text-[11px] font-bold uppercase tracking-tight text-text-primary m-0">
            Accuracy: <span className="text-primary">{Number(pt?.accuracy ?? p.value).toFixed(1)}%</span>
          </Body>
        </div>
        {pt && (
          <Body className={`text-[10px] font-semibold m-0 ${isDark ? 'text-text-muted/50' : 'text-text-muted/50'}`}>
            Score: {pt.score}
          </Body>
        )}
      </div>
    )
  }
  return null
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
        <EmptyState icon="📊" title="No data" subtitle="Complete exams to see analytics." />
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
            <Tooltip content={<CustomTooltip />} />
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
    return (
      <div className="w-full h-full min-w-0" role="img" aria-label="Score distribution pie chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data as DistributionSlice[]}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={8}
              dataKey="value"
              isAnimationActive={false}
            >
              {(data as DistributionSlice[]).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
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
