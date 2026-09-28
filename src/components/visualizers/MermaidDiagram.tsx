import { useEffect, useRef, useState, type FC } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../../context/ThemeContext';
import { VisualFallback } from '../common/visuals/VisualFallback';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
});

export const MermaidDiagram: FC<{ code: string }> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (containerRef.current && code.trim()) {
      let cancelled = false;

      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'strict',
      });

      mermaid.render(`mermaid-${Math.random().toString(36).slice(2, 11)}`, code)
        .then((result) => {
          if (cancelled) return;
          if (containerRef.current) {
            containerRef.current.innerHTML = result.svg;
            setError(false);
          }
        })
        .catch((renderError) => {
          if (cancelled) return;
          console.error("Mermaid parsing error:", renderError?.message || renderError);
          setError(true);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [code, isDark]);

  if (error) {
    return <VisualFallback code="VISUAL_RENDER_ERROR" />;
  }

  if (!code.trim()) {
    return <VisualFallback code="INVALID_VISUAL_DATA" />;
  }

  return (
    <div
      ref={containerRef}
      data-testid="mermaid-container"
      className="w-full flex justify-center text-text-primary mermaid-container"
    />
  );
};