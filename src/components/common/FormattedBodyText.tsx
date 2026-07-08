import React from 'react';

interface FormattedBodyTextProps {
  text: string;
  className?: string;
}

function parseInlineMarkdown(text: string): React.ReactNode {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-extrabold text-text-primary">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

/**
 * Parses and renders body text preserving bullet formatting and pipe-delimited tables.
 * Groups consecutive list items starting with -, *, •, +, or numbers into semantic <ul> list blocks.
 * Groups consecutive pipe-delimited rows (| cell | cell |) into premium, responsive HTML <table> blocks.
 */
export function FormattedBodyText({ text, className }: FormattedBodyTextProps) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let currentTable: string[][] = [];
  let listKey = 0;
  let tableKey = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="mt-1.5 mb-3 last:mb-0 space-y-2.5">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  const flushTable = () => {
    if (currentTable.length > 0) {
      // Filter out divider/separator lines (e.g., |---|---| or | :--- | :---: |)
      const dataRows = currentTable.filter(row => {
        const isSeparator = row.every(cell => /^\s*:?-+:?\s*$/.test(cell) || cell.trim() === '');
        return !isSeparator;
      });

      if (dataRows.length > 0) {
        // Find maximum columns to ensure proper row padding
        const maxColumns = Math.max(...dataRows.map(r => r.length));
        
        // Ensure every row has the same number of elements
        const normalizedRows = dataRows.map(row => {
          const padded = [...row];
          while (padded.length < maxColumns) {
            padded.push('');
          }
          return padded;
        });

        const headers = normalizedRows[0];
        const bodyRows = normalizedRows.slice(1);

        elements.push(
          <div 
            key={`table-container-${tableKey++}`} 
            className="w-full overflow-x-auto my-5 rounded-2xl border border-border-subtle/30 shadow-sm"
          >
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-hover-bg/50 text-text-primary border-b border-border-subtle/20 font-bold uppercase tracking-wider">
                <tr>
                  {headers.map((h, i) => (
                    <th 
                      key={i} 
                      className="px-4 py-3 font-semibold text-xs border-r last:border-r-0 border-border-subtle/20"
                    >
                      {parseInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/10 bg-transparent">
                {bodyRows.map((row, i) => (
                  <tr 
                    key={i} 
                    className="hover:bg-hover-bg/50 transition-colors"
                  >
                    {row.map((val, j) => (
                      <td 
                        key={j} 
                        className="px-4 py-3 text-text-secondary border-r last:border-r-0 border-border-subtle/20 leading-relaxed font-sans"
                      >
                        {parseInlineMarkdown(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      currentTable = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('```')) return;

    const isTableLine = trimmed.includes('|');
    const bulletMatch = trimmed.match(/^(?:[-*•+]\s*|\d+\.\s+)(.+)/);

    if (bulletMatch) {
      flushTable();
      currentList.push(
        <li key={`li-${index}`} className="flex items-start gap-2.5 text-inherit leading-relaxed">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
          <div className="flex-1 min-w-0 tracking-wide">
            {parseInlineMarkdown(bulletMatch[1])}
          </div>
        </li>
      );
    } else if (isTableLine) {
      flushList();
      let cells = trimmed.split('|').map(c => c.trim());
      if (cells[0] === '' && trimmed.startsWith('|')) {
        cells.shift();
      }
      if (cells[cells.length - 1] === '' && trimmed.endsWith('|')) {
        cells.pop();
      }
      currentTable.push(cells);
    } else {
      flushList();
      flushTable();
      elements.push(
        <p key={`p-${index}`} className="mb-2 last:mb-0 leading-relaxed tracking-wide">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    }
  });

  flushList();
  flushTable();

  return <div className={`space-y-1.5 ${className}`}>{elements}</div>;
}

