import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

function normalizeSeries(data: any) {
  const { chartType, series } = data;
  const yAxisLabel = data.y_axis || data.yAxisLabel || '';

  let finalSeries: any[] = [];

  if (Array.isArray(data.data) && Array.isArray(data.x_axis)) {
    finalSeries = data.data.map((val: any, i: number) => ({
      name: data.x_axis[i] || `Item ${i}`,
      value: val
    }));
  }
  else if (Array.isArray(data.data) && Array.isArray(data.labels)) {
    finalSeries = data.data.map((val: any, i: number) => ({
      name: data.labels[i] || `Item ${i}`,
      value: val
    }));
  }
  else if (Array.isArray(series)) {
    if (series.length > 0 && typeof series[0] === 'object' && series[0] !== null && Array.isArray(series[0].value)) {
      const labels = data.labels || [];
      finalSeries = series[0].value.map((val: any, i: number) => ({
        name: labels[i] || `Item ${i}`,
        value: val
      }));
    }
    else if (series.length > 0 && typeof series[0] === 'object' && series[0] !== null && typeof series[0].value !== 'object') {
      finalSeries = series;
    }
    else if (series.length > 0 && typeof series[0] !== 'object') {
      const labels = data.labels || [];
      finalSeries = series.map((val: any, i: number) => ({
        name: labels[i] || `Item ${i}`,
        value: val
      }));
    }
  } else if (data.datasets?.[0]?.data) {
    finalSeries = data.datasets[0].data.map((val: any, i: number) => ({
      name: data.labels?.[i] || `Item ${i}`,
      value: val
    }));
  }
  else if (Array.isArray(data.data)) {
    finalSeries = data.data.map((val: any, i: number) => ({
      name: `Item ${i + 1}`,
      value: val
    }));
  }

  return { finalSeries, colors: data.colors || COLORS, yAxisLabel, chartType: chartType || data.type || 'bar' };
}

export const ChartVisualizer: React.FC<{ data: any }> = React.memo(({ data }) => {
  const { finalSeries, colors, yAxisLabel, chartType } = normalizeSeries(data);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'bar' ? (
          <BarChart data={finalSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" opacity={0.3} />
            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: 'var(--text-secondary)', fontSize: 11 } } : undefined} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--surface-floating)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)' }}
              itemStyle={{ color: '#6366f1' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {finalSeries.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : chartType === 'pie' ? (
          <PieChart>
            <Pie
              data={finalSeries}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              isAnimationActive={false}
            >
              {finalSeries.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'var(--surface-floating)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }} />
          </PieChart>
        ) : (
          <AreaChart data={finalSeries}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" opacity={0.3} />
            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--surface-floating)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }} />
            <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorValue)" isAnimationActive={false} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
});
