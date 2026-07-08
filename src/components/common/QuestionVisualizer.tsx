import { useEffect, useRef, type FC } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import mermaid from 'mermaid';
import { BlockMath } from 'react-katex';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import DOMPurify from 'dompurify'
import type { QuestionVisual } from '../../types/exam.types';

interface QuestionVisualizerProps {
  visual: QuestionVisual;
  className?: string;
}

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

// World Map TopoJSON for base mapping (can be swapped for an India-specific one)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

// Normalize visual prop to canonical { type, data, title? } format
// Handles:
//   1. Canonical format: { type, data: { ... }, title? }
//   2. Flat DB format:   { type, data: [6,24], x_axis: [...], y_axis: "...", title? }
//   3. visual_engine:    { render_type, metadata, title? }
function normalizeVisualProp(visual: any): QuestionVisual {
  // Case 1: Already canonical — data is a non-array object
  if (visual.type && visual.data !== undefined && typeof visual.data === 'object' && !Array.isArray(visual.data)) {
    return visual as QuestionVisual;
  }

  // Case 2: Flat DB format — x_axis/y_axis/headers/rows sit alongside type/data/title
  // Pack everything except type & title into `data` so renderers can access them
  if (visual.type && (visual.x_axis || visual.y_axis || visual.headers || visual.rows || Array.isArray(visual.data))) {
    const { type, title, ...rest } = visual;
    return { type, title, data: rest };
  }

  // Case 3: visual_engine format — { render_type, metadata }
  if (visual.render_type && visual.metadata !== undefined) {
    return {
      type: visual.render_type as QuestionVisual['type'],
      title: visual.title || undefined,
      data: visual.metadata,
    };
  }

  // Fallback: already canonical with primitive data
  if (visual.type && visual.data !== undefined) return visual as QuestionVisual;
  return visual as QuestionVisual;
}

export const QuestionVisualizer: FC<QuestionVisualizerProps> = ({ visual: rawVisual, className = "" }) => {
  const visual = normalizeVisualProp(rawVisual);
  const { type, data, title } = visual;

  return (
    <div className={`my-6 space-y-4 ${className} animate-in fade-in zoom-in duration-500`}>
      {title && <h5 className="text-sm font-black text-text-primary text-center uppercase tracking-wider">{title}</h5>}
      
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-center overflow-hidden min-h-[240px]">
        {type === 'chart' && renderChart(data)}
        {type === 'table' && renderTable(data)}
        {type === 'geometry' && renderGeometry(data)}
        {type === 'venn' && renderVenn(data)}
        {type === 'mermaid' && <MermaidRenderer code={data.code} />}
        {type === 'latex' && renderLatex(data)}
        {type === 'svg' && renderSVG(data)}
        {type === 'map_overlay' && renderMap(data)}
      </div>
    </div>
  );
};

// --- CHART RENDERING (RECHARTS) ---
function renderChart(data: any) {
  const { chartType, series, colors = COLORS } = data;
  // Y-axis label (from flat DB format or explicit field)
  const yAxisLabel = data.y_axis || data.yAxisLabel || '';

  let finalSeries: any[] = [];

  // Case 0: Flat DB format — { data: [6, 24], x_axis: ["A", "B"], y_axis: "..." }
  // This is the format produced by bulk upload / AI question generation
  if (Array.isArray(data.data) && Array.isArray(data.x_axis)) {
    finalSeries = data.data.map((val: any, i: number) => ({
      name: data.x_axis[i] || `Item ${i}`,
      value: val
    }));
  }
  // Case 0b: Flat DB format with just data array + labels
  else if (Array.isArray(data.data) && Array.isArray(data.labels)) {
    finalSeries = data.data.map((val: any, i: number) => ({
      name: data.labels[i] || `Item ${i}`,
      value: val
    }));
  }
  else if (Array.isArray(series)) {
    // Case 1: series is array of objects where value is an array (dataset/series-level format)
    // e.g. series: [{ name: "Rainfall (cm)", value: [118, 102, 56, 124] }]
    if (series.length > 0 && typeof series[0] === 'object' && series[0] !== null && Array.isArray(series[0].value)) {
      const labels = data.labels || [];
      finalSeries = series[0].value.map((val: any, i: number) => ({
        name: labels[i] || `Item ${i}`,
        value: val
      }));
    }
    // Case 2: series is array of objects where value is a primitive (canonical point format)
    // e.g. series: [{ name: "Srikakulam", value: 118 }, { name: "Krishna", value: 102 }]
    else if (series.length > 0 && typeof series[0] === 'object' && series[0] !== null && typeof series[0].value !== 'object') {
      finalSeries = series;
    }
    // Case 3: series is array of primitives (numbers or strings)
    // e.g. series: [118, 102, 56, 124]
    else if (series.length > 0 && typeof series[0] !== 'object') {
      const labels = data.labels || [];
      finalSeries = series.map((val: any, i: number) => ({
        name: labels[i] || `Item ${i}`,
        value: val
      }));
    }
  } else if (data.datasets?.[0]?.data) {
    // Fallback for AI generated JSON format from datasets
    finalSeries = data.datasets[0].data.map((val: any, i: number) => ({
      name: data.labels?.[i] || `Item ${i}`,
      value: val
    }));
  }
  // Case 5: Bare data array with no labels at all — just number the items
  else if (Array.isArray(data.data)) {
    finalSeries = data.data.map((val: any, i: number) => ({
      name: `Item ${i + 1}`,
      value: val
    }));
  }

  const actualChartType = chartType || data.type || 'bar';

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        {actualChartType === 'bar' ? (
          <BarChart data={finalSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 11 } } : undefined} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc' }}
              itemStyle={{ color: '#6366f1' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {finalSeries.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : actualChartType === 'pie' ? (
          <PieChart>
            <Pie
              data={finalSeries}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {finalSeries.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
          </PieChart>
        ) : (
          <AreaChart data={finalSeries}>
             <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
            <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// --- DATA TABLE RENDERING ---
function renderTable(data: any) {
  const headers = data.headers || data.columns || [];
  const rows = data.rows || [];
  
  return (
    <div className="w-full overflow-x-auto border border-white/10 rounded-2xl">
      <table className="w-full text-xs text-left">
        <thead className="bg-white/5 text-text-muted font-black uppercase tracking-tighter">
          <tr>
            {headers.map((h: string, i: number) => (
              <th key={i} className="px-3 py-2 border-b border-white/10">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row: any[], i: number) => (
            <tr key={i} className="hover:bg-white/5">
              {row.map((val, j) => (
                <td key={j} className="px-3 py-2 text-text-primary whitespace-nowrap">{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- LATEX RENDERING (KATEX) ---
function renderLatex(data: any) {
  const expression = data.expression || data.latex || "";
  return (
    <div className="text-white text-lg">
      <BlockMath math={expression} />
    </div>
  );
}

// --- MERMAID FLOWCHART RENDERING ---
const MermaidRenderer: FC<{ code: string }> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && code) {
      mermaid.render(`mermaid-${Math.random().toString(36).slice(2, 11)}`, code)
        .then((result) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = result.svg;
          }
        })
        .catch((error) => console.error("Mermaid parsing error:", error.message));
    }
  }, [code]);

  return <div ref={containerRef} className="w-full flex justify-center text-white mermaid-container" />;
};

// --- RAW SVG RENDERING ---
function renderSVG(data: any) {
  const svgContent = data.svg_content || data.svg || "";
  const viewBox = data.viewBox || "0 0 300 150";
  
  return (
    <svg 
      viewBox={viewBox} 
      className="w-full max-w-md mx-auto"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svgContent) }}
    />
  );
}

// --- MAP OVERLAY RENDERING (REACT-SIMPLE-MAPS) ---
function renderMap(data: any) {
  const overlays = data.overlays || [];
  
  // Center defaults to India if not specified
  const centerLat = data.center?.lat || 22.0;
  const centerLng = data.center?.lng || 78.0;
  const zoom = data.zoom || 5;
  const scale = zoom * 150; // Approximation for scale based on zoom

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden bg-slate-900/50">
      <ComposableMap 
        projection="geoMercator" 
        projectionConfig={{ center: [centerLng, centerLat], scale }}
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="rgba(99, 102, 241, 0.15)"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "rgba(99, 102, 241, 0.3)", outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
        
        {overlays.map((marker: any, index: number) => (
          <Marker key={index} coordinates={[marker.lng, marker.lat]}>
            <circle r={6} fill={marker.color || "#f43f5e"} stroke="#fff" strokeWidth={2} />
            {marker.label && (
              <text
                textAnchor="middle"
                y={-12}
                className="font-sans fill-white text-[14px] font-bold"
              >
                {marker.label}
              </text>
            )}
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}

// --- GEOMETRY RENDERING (LEGACY SVG) ---
function renderGeometry(data: any) {
  const { shape, labels = {} } = data;

  if (shape === 'triangle') {
    return (
      <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-xl">
        <path d="M100 20 L180 160 L20 160 Z" fill="rgba(99, 102, 241, 0.1)" stroke="#6366f1" strokeWidth="3" />
        {/* Points Labels */}
        <text x="95" y="15" fill="#f8fafc" fontSize="14" fontWeight="bold">A</text>
        <text x="185" y="170" fill="#f8fafc" fontSize="14" fontWeight="bold">B</text>
        <text x="5" y="170" fill="#f8fafc" fontSize="14" fontWeight="bold">C</text>
        {/* Optional value labels */}
        {labels.ab && <text x="145" y="90" fill="#94a3b8" fontSize="12">{labels.ab}</text>}
        {labels.bc && <text x="100" y="180" fill="#94a3b8" fontSize="12">{labels.bc}</text>}
        {labels.angleA && <text x="90" y="45" fill="#f43f5e" fontSize="10">{labels.angleA}°</text>}
      </svg>
    );
  }

  if (shape === 'circle') {
    return (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <circle cx="100" cy="100" r="70" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="3" />
        <line x1="100" y1="100" x2="170" y2="100" stroke="#10b981" strokeWidth="2" strokeDasharray="4" />
        <circle cx="100" cy="100" r="3" fill="#10b981" />
        <text x="130" y="90" fill="#f8fafc" fontSize="12" fontWeight="bold">r = {data.radius || '?'}</text>
        <text x="95" y="115" fill="#94a3b8" fontSize="12">O</text>
      </svg>
    );
  }

  return <div className="text-text-muted italic">Unknown shape metadata</div>;
}

// --- VENN DIAGRAM RENDERING (LEGACY) ---
function renderVenn(data: any) {
  const { setA = "A", setB = "B", intersection = "A ∩ B" } = data;
  return (
    <svg viewBox="0 0 300 150" className="w-full max-w-[300px]">
      <circle cx="110" cy="75" r="60" fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" strokeWidth="2" />
      <circle cx="190" cy="75" r="60" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="2" />
      
      <text x="60" y="75" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">{setA}</text>
      <text x="240" y="75" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">{setB}</text>
      <text x="150" y="75" fill="#f8fafc" fontSize="9" textAnchor="middle" className="pointer-events-none">{intersection}</text>
    </svg>
  );
}
