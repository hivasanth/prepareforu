import React, { lazy, Suspense, type FC } from 'react';
import DOMPurify from 'dompurify'
import type { QuestionVisual } from '../../types/exam.types';

const ChartVisualizer = lazy(() => import('../visualizers/ChartVisualizer').then(m => ({ default: m.ChartVisualizer })));
const MermaidDiagram = lazy(() => import('../visualizers/MermaidDiagram').then(m => ({ default: m.MermaidDiagram })));
const MathBlock = lazy(() => import('../visualizers/MathBlock').then(m => ({ default: m.MathBlock })));
const MapVisualizer = lazy(() => import('../visualizers/MapVisualizer').then(m => ({ default: m.MapVisualizer })));

interface QuestionVisualizerProps {
  visual: QuestionVisual;
  className?: string;
}

// Normalize visual prop to canonical { type, data, title? } format
function normalizeVisualProp(visual: any): QuestionVisual {
  if (visual.type && visual.data !== undefined && typeof visual.data === 'object' && !Array.isArray(visual.data)) {
    return visual as QuestionVisual;
  }
  if (visual.type && (visual.x_axis || visual.y_axis || visual.headers || visual.rows || Array.isArray(visual.data))) {
    const { type, title, ...rest } = visual;
    return { type, title, data: rest };
  }
  if (visual.render_type && visual.metadata !== undefined) {
    return {
      type: visual.render_type as QuestionVisual['type'],
      title: visual.title || undefined,
      data: visual.metadata,
    };
  }
  if (visual.type && visual.data !== undefined) return visual as QuestionVisual;
  return visual as QuestionVisual;
}

const LoadingFallback = () => (
  <div className="w-full h-64 flex items-center justify-center text-text-muted text-sm">
    Loading visualizer...
  </div>
);

export const QuestionVisualizer: FC<QuestionVisualizerProps> = React.memo(({ visual: rawVisual, className = "" }) => {
  const visual = normalizeVisualProp(rawVisual);
  const { type, data, title } = visual;

  return (
    <div className={`my-6 space-y-4 ${className} animate-in`}>
      {title && <h5 className="text-sm font-bold text-text-primary text-center uppercase tracking-wider">{title}</h5>}
      
      <div className="bg-card-bg/30 border border-border-subtle/20 rounded-3xl p-6 flex items-center justify-center overflow-hidden min-h-[240px]">
        <Suspense fallback={<LoadingFallback />}>
          {type === 'chart' && <ChartVisualizer data={data as never} />}
          {type === 'table' && renderTable(data)}
          {type === 'geometry' && renderGeometry(data)}
          {type === 'venn' && renderVenn(data)}
          {type === 'mermaid' && <MermaidDiagram code={String(data.code ?? '')} />}
          {type === 'latex' && <MathBlock expression={String(data.expression ?? data.latex ?? "")} />}
          {type === 'svg' && renderSVG(data)}
          {type === 'map_overlay' && <MapVisualizer data={data as never} />}
        </Suspense>
      </div>
    </div>
  );
});

// --- DATA TABLE RENDERING (lightweight, no deps) ---
function renderTable(data: any) {
  const headers = data.headers || data.columns || [];
  const rows = data.rows || [];
  
  return (
    <div className="w-full overflow-x-auto border border-border-subtle/20 rounded-2xl">
      <table className="w-full text-xs text-left">
        <thead className="bg-hover-bg/40 text-text-secondary font-bold uppercase tracking-tighter">
          <tr>
            {headers.map((h: string, i: number) => (
              <th key={i} className="px-3 py-2 border-b border-border-subtle/20">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle/10">
          {rows.map((row: any[], i: number) => (
            <tr key={i} className="hover:bg-hover-bg/40">
              {row.map((val, j) => (
                <td key={j} className="px-3 py-2 text-text-primary whitespace-nowrap">{typeof val === 'object' ? JSON.stringify(val) : val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- RAW SVG RENDERING (lightweight, only DOMPurify) ---
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

// --- GEOMETRY RENDERING (lightweight, pure SVG) ---
function renderGeometry(data: any) {
  const { shape, labels = {} } = data;

  if (shape === 'triangle') {
    return (
      <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-xl">
        <path d="M100 20 L180 160 L20 160 Z" fill="rgba(99, 102, 241, 0.1)" stroke="#6366f1" strokeWidth="3" />
        <text x="95" y="15" fill="var(--text-primary)" fontSize="14" fontWeight="bold">A</text>
        <text x="185" y="170" fill="var(--text-primary)" fontSize="14" fontWeight="bold">B</text>
        <text x="5" y="170" fill="var(--text-primary)" fontSize="14" fontWeight="bold">C</text>
        {labels.ab && <text x="145" y="90" fill="var(--text-secondary)" fontSize="12">{labels.ab}</text>}
        {labels.bc && <text x="100" y="180" fill="var(--text-secondary)" fontSize="12">{labels.bc}</text>}
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
        <text x="130" y="90" fill="var(--text-primary)" fontSize="12" fontWeight="bold">r = {data.radius || '?'}</text>
        <text x="95" y="115" fill="var(--text-secondary)" fontSize="12">O</text>
      </svg>
    );
  }

  return <div className="text-text-muted italic">Unknown shape metadata</div>;
}

// --- VENN DIAGRAM RENDERING (lightweight, pure SVG) ---
function renderVenn(data: any) {
  const { setA = "A", setB = "B", intersection = "A ∩ B" } = data;
  return (
    <svg viewBox="0 0 300 150" className="w-full max-w-[300px]">
      <circle cx="110" cy="75" r="60" fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" strokeWidth="2" />
      <circle cx="190" cy="75" r="60" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="2" />
      
      <text x="60" y="75" fill="var(--text-primary)" fontSize="12" fontWeight="bold" textAnchor="middle">{setA}</text>
      <text x="240" y="75" fill="var(--text-primary)" fontSize="12" fontWeight="bold" textAnchor="middle">{setB}</text>
      <text x="150" y="75" fill="var(--text-primary)" fontSize="9" textAnchor="middle" className="pointer-events-none">{intersection}</text>
    </svg>
  );
}
