import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { VisualFallback } from '../common/visuals/VisualFallback';

export const MathBlock: React.FC<{ expression: string }> = React.memo(({ expression }) => {
  const expr = expression?.trim() ?? '';

  let html: string | null = null;
  if (expr) {
    try {
      html = katex.renderToString(expr, { throwOnError: true, displayMode: true });
    } catch {
      html = null;
    }
  }

  if (!expr || html === null) {
    return <VisualFallback code={expr ? 'VISUAL_RENDER_ERROR' : 'INVALID_VISUAL_DATA'} />;
  }

  return (
    <div
      className="text-text-primary text-lg"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});