import type { ReactNode } from 'react';
import { NumberBadge } from '../common/NumberBadge';

interface QuestionCardHeaderProps {
  /** 1-based question number rendered in the canonical NumberBadge. */
  index: number;
  /** Optional denominator for the "of {total}" count line. Omit when unknown (e.g., creation). */
  total?: number;
  /** Middle header slot — language toggle / question actions. */
  actions?: ReactNode;
  difficulty?: string;
  /** Node occupying the difficulty slot when the value must be editable
   *  (e.g., PremiumSelect during question authoring). */
  difficultySlot?: ReactNode;
}

/* Canonical QuestionCard header geometry (extracted verbatim from
 * QuestionCard.tsx so display and authoring share ONE source):
 * [NumberBadge + Question/of-total] ---- [actions] ---- [difficulty] */
export function QuestionCardHeader({
  index,
  total,
  actions,
  difficulty,
  difficultySlot,
}: QuestionCardHeaderProps) {
  return (
    <div className="p-4 md:p-6 border-b border-border-subtle/50 bg-hover-bg/30 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <NumberBadge value={index} variant="question" className="w-10 h-10 text-lg shadow-lg" />
        <div>
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Question</span>
          {typeof total === 'number' && (
            <div className="text-sm font-black text-text-primary uppercase">of {total}</div>
          )}
        </div>
      </div>

      {actions}

      {difficultySlot ?? (
        <div className={`
          px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border shrink-0
          ${difficulty === 'easy' ? 'bg-success/10 text-success border-success/20' :
            difficulty === 'medium' ? 'bg-warning/10 text-warning border-warning/20' :
            'bg-danger/10 text-danger border-danger/20'}
        `}>
          {difficulty}
        </div>
      )}
    </div>
  );
}
