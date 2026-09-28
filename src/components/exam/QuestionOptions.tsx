import type { FC } from 'react';
import DOMPurify from 'dompurify';
import { QuestionCardOption, type QuestionCardOptionState } from './QuestionCardOption';

interface QuestionOptionsProps {
  options: string[];
  selectedAnswer: string | null | undefined;
  /** Omit in read-only contexts: rows render as static informational divs
   *  (no radio role, no pointer cursor, no click affordance). */
  onSelect?: (option: string) => void;
  disabled?: boolean;
  /** Suppress transient pointer-hover feedback (read-only contexts). */
  hoverable?: boolean;
  showCorrect?: boolean;
  correctOption?: string;
  userAnswer?: string | null;
}

/**
 * Answer option surface — delegates row geometry/markers/states to the shared
 * QuestionCardOption primitive (same source as manual-entry authoring rows).
 */
export const QuestionOptions: FC<QuestionOptionsProps> = ({
  options,
  selectedAnswer,
  onSelect,
  disabled = false,
  hoverable = true,
  showCorrect = false,
  correctOption,
  userAnswer,
}) => {
  const labels = ['A', 'B', 'C', 'D'];

  /* Interactive only when the caller supplies a selection handler. A context
   * without onSelect (e.g. the Bulk Upload preview) must not be announced as
   * a radiogroup nor render radio-wrapped rows — options there are plain
   * informational rows. Disabled-but-handled consumers (sub-admin vault,
   * design-system showcase) keep their existing radio geometry unchanged. */
  const interactive = !!onSelect;

  return (
    <div
      role={interactive ? 'radiogroup' : undefined}
      aria-label={interactive ? 'Answer options' : undefined}
      className="flex flex-col gap-3.5"
    >
      {options.map((optionText, idx) => {
        if (!optionText) return null;
        const label = labels[idx];
        const isSelected = userAnswer
          ? userAnswer === label
          : selectedAnswer === label;
        const isCorrectAnswer = showCorrect && correctOption === label;
        const isWrongSelected = showCorrect && isSelected && correctOption !== label;

        const state: QuestionCardOptionState = isWrongSelected
          ? 'wrong'
          : isCorrectAnswer
            ? 'correct'
            : isSelected
              ? 'selected'
              : 'neutral';

        return (
          <QuestionCardOption
            key={label}
            label={label}
            state={state}
            onClick={interactive ? () => onSelect?.(label) : undefined}
            disabled={disabled}
            hoverable={hoverable}
            ariaChecked={interactive ? isSelected : undefined}
          >
            <span
              className={`text-[13px] sm:text-[13px] md:text-[14px] font-medium flex-1 leading-relaxed ${
                isSelected || isCorrectAnswer ? 'text-primary' : 'text-text-primary'
              }`}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(optionText) }}
            />
          </QuestionCardOption>
        );
      })}
    </div>
  );
};
