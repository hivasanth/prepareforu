import { useEffect, useRef, type FC } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

export const MermaidDiagram: FC<{ code: string }> = ({ code }) => {
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

  return <div ref={containerRef} className="w-full flex justify-center text-text-primary mermaid-container" />;
};
