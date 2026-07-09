import type { FC } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { AlertCircle, Table as TableIcon, Info } from 'lucide-react';

export type DiagramData = 
  | { type: "pie_chart"; metadata: { labels: string[]; values: number[] } }
  | { type: "bar_chart"; metadata: { x: string[]; y: number[] } }
  | { type: "line_graph"; metadata: { x: string[]; y: number[] } }
  | { type: "table"; metadata: { columns: string[]; rows: any[][] } }
  | { type: "venn_diagram"; metadata: { sets: string[]; intersections: Record<string, any[]> } }
  | null;

interface DiagramRendererProps {
  diagram: DiagramData;
  className?: string;
}

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

export const DiagramRenderer: FC<DiagramRendererProps> = ({ diagram, className = "" }) => {
  // ── 1. Early Return Guard
  if (!diagram || !diagram.type || !diagram.metadata) return null;

  const { type, metadata } = diagram;

  // ── 2. Render Strategy
  const renderContent = () => {
    try {
      switch (type) {
        case 'pie_chart':
          return renderPieChart(metadata);
        case 'bar_chart':
          return renderBarChart(metadata);
        case 'line_graph':
          return renderLineGraph(metadata);
        case 'table':
          return renderTable(metadata);
        case 'venn_diagram':
          return renderVennDiagram(metadata);
        default:
          return renderError("Unsupported diagram type");
      }
    } catch (err) {
      console.error("Diagram Rendering Error:", err instanceof Error ? err.message : err);
      return renderError("Failed to render diagram data");
    }
  };

  return (
    <div className={`w-full my-6 overflow-hidden rounded-2xl border border-border-subtle/30 bg-card-bg/40 backdrop-blur-sm shadow-sm p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
          {type === 'table' ? <TableIcon size={14} /> : <Info size={14} />}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary opacity-70">
          Source Visualization: {type.replace('_', ' ')}
        </span>
      </div>
      
      <div className="min-h-[200px] flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
};

// ── Rendering Implementations ────────────────────────────────────────────────

function renderPieChart(metadata: any) {
  if (!metadata.labels || !metadata.values) return renderError("Missing pie chart metadata");
  
  const data = metadata.labels.map((label: string, i: number) => ({
    name: label,
    value: metadata.values[i] || 0
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={5}
            dataKey="value"
            animationBegin={0}
            animationDuration={1000}
            label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
            labelLine={{ stroke: 'var(--text-secondary)', strokeWidth: 1, opacity: 0.3 }}
          >
            {data.map((_: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => value.toLocaleString()}
            contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function getSeriesKeys(metadata: any): string[] {
  // Find all keys starting with 'y' (e.g., 'y', 'y_seller_A', 'y_Total')
  return Object.keys(metadata).filter(k => k.startsWith('y'));
}

function renderBarChart(metadata: any) {
  const seriesKeys = getSeriesKeys(metadata);
  if (!metadata.x || seriesKeys.length === 0) return renderError("Missing bar chart metadata");

  const data = metadata.x.map((label: string, i: number) => {
    const entry: any = { name: label };
    seriesKeys.forEach(k => {
      entry[k] = metadata[k][i] || 0;
    });
    return entry;
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.1} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            fontSize={10} 
            tick={{ fill: 'var(--text-secondary)' }}
            angle={-45}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: 'var(--text-secondary)' }} tickFormatter={(val) => val.toLocaleString()} />
          <Tooltip 
             cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
             formatter={(value: any) => value.toLocaleString()}
             contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} />
          {seriesKeys.map((key, idx) => (
            <Bar 
              key={key} 
              dataKey={key} 
              name={key.replace(/^y_?/, '').replace(/_/g, ' ') || 'Value'} 
              fill={COLORS[idx % COLORS.length]} 
              radius={[4, 4, 0, 0]} 
              barSize={seriesKeys.length > 2 ? 15 : 30} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function renderLineGraph(metadata: any) {
  const seriesKeys = getSeriesKeys(metadata);
  if (!metadata.x || seriesKeys.length === 0) return renderError("Missing line graph metadata");

  const data = metadata.x.map((label: string, i: number) => {
    const entry: any = { name: label };
    seriesKeys.forEach(k => {
      entry[k] = metadata[k][i] || 0;
    });
    return entry;
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.1} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            fontSize={10} 
            tick={{ fill: 'var(--text-secondary)' }}
            angle={-45}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: 'var(--text-secondary)' }} tickFormatter={(val) => val.toLocaleString()} />
          <Tooltip 
             formatter={(value: any) => value.toLocaleString()}
             contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} />
          {seriesKeys.map((key, idx) => (
            <Line 
              key={key}
              type="monotone" 
              dataKey={key} 
              name={key.replace(/^y_?/, '').replace(/_/g, ' ') || 'Value'}
              stroke={COLORS[idx % COLORS.length]} 
              strokeWidth={3} 
              dot={{ r: 4, fill: COLORS[idx % COLORS.length], strokeWidth: 2, stroke: 'var(--card-bg)' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function renderTable(metadata: any) {
  const { columns, rows } = metadata;
  if (!columns || !rows) return renderError("Missing table metadata");

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border-subtle/20">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-hover-bg/40">
            {columns.map((col: string, i: number) => (
              <th key={i} className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-text-secondary border-b border-border-subtle/20">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle/10">
          {rows.map((row: any[], ri: number) => (
            <tr key={ri} className="hover:bg-primary/5 transition-colors even:bg-hover-bg/20">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-sm text-text-primary font-medium whitespace-nowrap">
                  {typeof cell === 'object' ? JSON.stringify(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderVennDiagram(metadata: any) {
  const { sets, intersections } = metadata;
  if (!sets || !intersections) return renderError("Missing venn diagram metadata");

  if (sets.length === 2) {
    return render2SetVenn(sets, intersections);
  } else if (sets.length === 3) {
    return render3SetVenn(sets, intersections);
  }

  // Fallback for 4+ sets: List view
  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sets.map((set: string, i: number) => (
          <div key={i} className="p-4 rounded-xl border border-border-subtle/30 bg-primary/5">
            <h6 className="text-[10px] font-black text-primary uppercase mb-2 tracking-tighter">Set: {set}</h6>
            <div className="text-sm text-text-primary font-medium line-clamp-2">
               {intersections[`${set}_only`]?.join(', ') || '∅'}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/10">
        <h6 className="text-[10px] font-black text-primary uppercase mb-1">Intersections Identified</h6>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(intersections).map(([key, items]: [string, any], i) => {
            if (key.includes('_only') || key === 'Neither') return null;
            return (
              <div key={i} className="px-2 py-1 bg-card-bg/50 rounded-md text-[10px] font-bold border border-primary/20">
                {key.replace(/_/g, ' ∩ ')}: {items?.length || 0} items
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function findValueSafe(obj: any, ...keys: string[]): any[] {
  if (!obj) return [];
  const normalizedSearch = keys.map(k => k.toLowerCase().trim());
  const entries = Object.entries(obj);
  
  // 1. Try explicit keyword matches for "Both" or "Neither"
  if (normalizedSearch.includes('both')) {
    const bothEntry = entries.find(([k]) => {
      const loK = k.toLowerCase();
      return loK === 'both' || loK === 'all' || loK === 'intersection' || loK === 'common' || (normalizedSearch.length > 2 && loK.includes('both'));
    });
    if (bothEntry) return Array.isArray(bothEntry[1]) ? bothEntry[1] : [bothEntry[1]];
  }

  if (normalizedSearch.includes('neither') || normalizedSearch.includes('none')) {
    const neitherEntry = entries.find(([k]) => {
      const loK = k.toLowerCase();
      return loK === 'neither' || loK === 'none' || loK === 'outside' || loK === 'other';
    });
    if (neitherEntry) return Array.isArray(neitherEntry[1]) ? neitherEntry[1] : [neitherEntry[1]];
  }

  // 2. Try matching based on set names (greedy match)
  const setNames = normalizedSearch.filter(k => k !== 'only' && k !== 'both');
  const entry = entries.find(([k]) => {
    const loK = k.toLowerCase();
    // For "Only" keys: Match if key has the set name AND doesn't have other set names
    if (normalizedSearch.includes('only') && setNames.length === 1) {
      return loK.includes(setNames[0]) && (loK.includes('only') || loK === setNames[0]);
    }
    // For "Both" keys: Match if key contains all requested set names
    return setNames.every(sn => loK.includes(sn));
  });

  return Array.isArray(entry?.[1]) ? entry![1] : (entry?.[1] ? [entry[1]] : []);
}

function render2SetVenn(sets: string[], intersections: any) {
  // Extract data with robust key matching
  const aOnly = findValueSafe(intersections, sets[0], 'only');
  const bOnly = findValueSafe(intersections, sets[1], 'only');
  const both = findValueSafe(intersections, sets[0], sets[1]);
  const neither = findValueSafe(intersections, 'neither') || findValueSafe(intersections, 'none');

  return (
    <div className="flex flex-col items-center w-full py-6">
      <div className="relative w-full max-w-[340px] h-64 flex items-center justify-center">
        {/* Circle A */}
        <div className="absolute left-0 w-44 h-44 rounded-full border-2 border-primary/40 bg-primary/20 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center shadow-lg transition-transform hover:scale-105">
           <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary/20 px-2 py-0.5 rounded text-[9px] font-black text-primary uppercase border border-primary/30">{sets[0]}</div>
           <div className="text-[11px] font-bold text-text-primary line-clamp-4 pr-10">
              {aOnly.join(', ') || '∅'}
           </div>
        </div>

        {/* Circle B */}
        <div className="absolute right-0 w-44 h-44 rounded-full border-2 border-rose-500/40 bg-rose-500/20 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center shadow-lg transition-transform hover:scale-105">
           <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-500/20 px-2 py-0.5 rounded text-[9px] font-black text-rose-500 uppercase border border-rose-500/30">{sets[1]}</div>
           <div className="text-[11px] font-bold text-text-primary line-clamp-4 pl-10">
              {bOnly.join(', ') || '∅'}
           </div>
        </div>

        {/* The Overlap (The true intersection) */}
        <div className="z-20 w-24 h-24 rounded-full bg-card-bg/40 backdrop-blur-xl border border-border-subtle/30 shadow-[0_0_20px_var(--border-subtle)] flex flex-col items-center justify-center p-3 text-center animate-pulse-slow">
           <div className="text-[7px] font-black text-text-secondary uppercase mb-1 opacity-60">Both</div>
           <div className="text-xs font-black text-text-primary leading-tight">
              {both.join(', ') || '∅'}
           </div>
        </div>
      </div>

      {neither.length > 0 && (
        <div className="mt-8 px-6 py-3 rounded-2xl bg-card-bg/30 border border-border-subtle/20 flex items-center gap-3 animate-in fade-in zoom-in duration-500">
           <div className="px-2 py-0.5 rounded bg-text-secondary/10 text-[8px] font-black text-text-secondary uppercase border border-text-secondary/20">Neither</div>
           <div className="text-xs font-medium text-text-primary italic opacity-80">
              {neither.join(', ')}
           </div>
        </div>
      )}
    </div>
  );
}

function render3SetVenn(sets: string[], intersections: any) {
  // Circular Triangle Layout for 3 sets
  return (
    <div className="flex flex-col items-center w-full py-8">
      <div className="relative w-full max-w-[340px] h-[340px]">
        {/* Circle Top (Set A) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full border-2 border-primary/40 bg-primary/20 backdrop-blur-md flex flex-col items-center p-6 text-center">
           <span className="text-[9px] font-black text-primary uppercase mb-1">{sets[0]}</span>
           <span className="text-[10px] font-bold text-text-primary mt-2">
              {findValueSafe(intersections, sets[0], 'only').length} items
           </span>
        </div>

        {/* Circle Bottom Left (Set B) */}
        <div className="absolute bottom-8 left-0 w-44 h-44 rounded-full border-2 border-emerald-500/40 bg-emerald-500/20 backdrop-blur-md flex flex-col items-center p-6 text-center">
           <span className="text-[9px] font-black text-emerald-500 uppercase mb-1">{sets[1]}</span>
           <span className="text-[10px] font-bold text-text-primary mt-2">
              {findValueSafe(intersections, sets[1], 'only').length} items
           </span>
        </div>

        {/* Circle Bottom Right (Set C) */}
        <div className="absolute bottom-8 right-0 w-44 h-44 rounded-full border-2 border-amber-500/40 bg-amber-500/20 backdrop-blur-md flex flex-col items-center p-6 text-center">
           <span className="text-[9px] font-black text-amber-500 uppercase mb-1">{sets[2]}</span>
           <span className="text-[10px] font-bold text-text-primary mt-2">
              {findValueSafe(intersections, sets[2], 'only').length} items
           </span>
        </div>

        {/* Center Intersection */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-16 h-16 rounded-full bg-card-bg/50 backdrop-blur-2xl border border-border-subtle/40 flex items-center justify-center shadow-xl">
            <span className="text-[10px] font-black text-text-primary">
               {findValueSafe(intersections, sets[0], sets[1], sets[2]).length || 0}
            </span>
        </div>
      </div>

      <div className="w-full mt-6 grid grid-cols-2 gap-2 max-w-md">
         {Object.entries(intersections).map(([key, items]: [string, any], i) => {
           if (key.toLowerCase().includes('only')) return null;
           return (
             <div key={i} className="px-3 py-2 rounded-lg bg-card-bg/40 border border-border-subtle/10 flex flex-col">
                <span className="text-[7px] font-black text-text-secondary uppercase opacity-60 tracking-wider font-mono">{key.replace(/_/g, ' ∩ ')}</span>
                <span className="text-xs font-bold text-text-primary truncate">
                   {Array.isArray(items) ? (items.join(', ') || '∅') : String(items || '∅')}
                </span>
             </div>
           )
         })}
      </div>
    </div>
  );
}

function renderError(msg: string) {
  return (
    <div className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-border-subtle/30 rounded-2xl">
      <AlertCircle className="text-red-500/50" size={32} strokeWidth={1.5} />
      <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">{msg}</div>
    </div>
  );
}
