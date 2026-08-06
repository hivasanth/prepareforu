import React from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export const MathBlock: React.FC<{ expression: string }> = React.memo(({ expression }) => (
  <div className="text-text-primary text-lg">
    <BlockMath math={expression} />
  </div>
));
