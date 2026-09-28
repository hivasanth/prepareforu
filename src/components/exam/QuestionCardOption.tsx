import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { FOCUS_RING } from '../common/AntigravityMotion';
import { NumberBadge } from '../common/NumberBadge';

export type QuestionCardOptionState = 'neutral' | 'selected' | 'correct' | 'wrong';

interface QuestionCardOptionProps {
  /** Option letter (A–D) rendered by the canonical NumberBadge option variant. */
  label: string;
  state?: QuestionCardOptionState;
  /** When provided the row renders as a selectable button (exam-taking);
   *  omit for static/editable rows. */
  onClick?: () => void;
  disabled?: boolean;
  /** Suppress transient pointer-hover feedback (read-only review contexts).
   *  Defaults to true so interactive exam-taking consumers are unchanged. */
  hoverable?: boolean;
  ariaChecked?: boolean;
  /** Row content between the marker and the trailing state icon. */
  children: ReactNode;
}

/* Canonical QuestionCard option row shell (extracted verbatim from
 * QuestionOptions.tsx): marker column + content + semantic state.
 * Light: white surface, neutral border, green border on hover.
 * Dark: approved dark surface, semantic state colors. No lift, no shadow. */
export function QuestionCardOption({
  label,
  state = 'neutral',
  onClick,
  disabled = false,
  hoverable = true,
  ariaChecked,
  children,
}: QuestionCardOptionProps) {
  let borderClass = hoverable
    ? 'border-border-subtle bg-option-surface hover:border-success'
    : 'border-border-subtle bg-option-surface';
  let labelOverride = '';

  if (state === 'wrong') {
    borderClass = 'border-danger bg-danger/5';
    labelOverride = 'bg-danger text-white';
  } else if (state === 'correct') {
    borderClass = 'border-success bg-success/5';
    labelOverride = 'bg-success text-white';
  } else if (state === 'selected') {
    borderClass = 'border-primary bg-primary/5';
    labelOverride = 'bg-primary text-white';
  }

  const inner = (
    <>
      {labelOverride ? (
        <div data-question-card-marker={label} className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-sm md:text-base flex-shrink-0 ${labelOverride}`}>
          {label}
        </div>
      ) : (
        <NumberBadge
          value={label}
          variant="option"
          className="w-9 h-9 md:w-10 md:h-10 text-sm md:text-base rounded-xl"
          dataQuestionCardMarker={label}
        />
      )}
      {children}
      {state === 'selected' && (
        <CheckCircle2 size={20} className="flex-shrink-0 text-primary" />
      )}
      {state === 'correct' && (
        <>
          <span className="sr-only">Correct answer</span>
          <CheckCircle2 size={20} className="flex-shrink-0 text-success" aria-hidden="true" />
        </>
      )}
    </>
  );

  const rowCls = `w-full flex items-center gap-3 p-3 md:p-3.5 rounded-xl border-2 transition-colors duration-fast ease-standard ${FOCUS_RING} text-left ${
    disabled || !onClick ? 'cursor-default' : 'cursor-pointer'
  } ${borderClass}`;

  const correctDataAttr = state === 'correct' ? { 'data-question-card-correct': 'true' } : undefined;

  if (!onClick) {
    return (
      <div className={rowCls} {...correctDataAttr}>
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={ariaChecked}
      onClick={onClick}
      disabled={disabled}
      className={rowCls}
      {...correctDataAttr}
    >
      {inner}
    </button>
  );
}
