import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { useTheme } from '../../context/ThemeContext'

interface ChartProps {
  type: 'trend' | 'distribution';
  data: any[];
  hasEnoughData?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  const { isDark } = useTheme()
  if (active && payload && payload.length) {
    const p = payload[0];
    const pt = p.payload;
    const formattedLabel = label
      ? new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
    return (
      <div className={`${isDark ? 'bg-slate-900/95 border-white/10 text-white/40' : 'bg-white/95 border-black/10 text-black/40'} backdrop-blur-xl border p-3 rounded-2xl shadow-2xl`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 border-b pb-2 ${isDark ? 'text-white/40 border-white/5' : 'text-black/40 border-black/5'}`}>{formattedLabel}</p>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <p className={`text-[11px] font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
            Accuracy: <span className="text-primary">{Number(pt?.accuracy ?? p.value).toFixed(1)}%</span>
          </p>
        </div>
        {pt && (
          <p className={`text-[10px] font-semibold ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            Score: {pt.score}
          </p>
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
        <span className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-widest">No data</span>
      </div>
    )
  }

const formatTrendTick = (v: number) => {
  const d = new Date(v);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatPercentTick = (v: number) => `${v}%`;

const legendFormatter = (value: string) => <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">{value}</span>;

  if (type === 'trend') {
    const validData = data.filter((d: any) => typeof d.accuracy === 'number' && !isNaN(d.accuracy));

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
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={8}
              dataKey="value"
              isAnimationActive={false}
            >
              {data.map((entry: any, index: number) => (
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
