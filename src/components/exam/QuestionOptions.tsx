import type { FC } from 'react';
import { CheckCircle2 } from 'lucide-react';
import DOMPurify from 'dompurify';

interface QuestionOptionsProps {
  options: string[];
  selectedAnswer: string | null | undefined;
  onSelect: (option: string) => void;
  disabled?: boolean;
  showCorrect?: boolean;
  correctOption?: string;
  userAnswer?: string | null;
}

export const QuestionOptions: FC<QuestionOptionsProps> = ({
  options,
  selectedAnswer,
  onSelect,
  disabled = false,
  showCorrect = false,
  correctOption,
  userAnswer,
}) => {
  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col gap-3.5">
      {options.map((optionText, idx) => {
        if (!optionText) return null;
        const label = labels[idx];
        const isSelected = userAnswer
          ? userAnswer === label
          : selectedAnswer === label;
        const isCorrectAnswer = showCorrect && correctOption === label;
        const isWrongSelected = showCorrect && isSelected && correctOption !== label;

        let borderClass = 'border-border-subtle bg-app-bg hover:border-border-subtle hover:bg-hover-bg';
        let labelBg = 'bg-hover-bg text-text-secondary group-hover:text-text-primary';

        if (isWrongSelected) {
          borderClass = 'border-danger bg-danger/5';
          labelBg = 'bg-danger text-white';
        } else if (isCorrectAnswer) {
          borderClass = 'border-success bg-success/5 shadow-md shadow-success/5';
          labelBg = 'bg-success text-white';
        } else if (isSelected) {
          borderClass = 'border-primary bg-primary/5 shadow-md shadow-primary/5';
          labelBg = 'bg-primary text-white';
        }

        return (
          <button
            key={label}
            onClick={() => onSelect(label)}
            disabled={disabled}
            aria-pressed={isSelected}
            className={`w-full flex items-center gap-3 p-3 md:p-3.5 rounded-xl border-2 transition-all duration-200 text-left group ${
              disabled ? 'cursor-default' : 'cursor-pointer'
            } ${borderClass}`}
          >
            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-sm md:text-base transition-all flex-shrink-0 ${labelBg}`}>
              {label}
            </div>
            <span
              className={`text-[13px] sm:text-[13px] md:text-[14px] font-medium flex-1 leading-relaxed ${
                isSelected || isCorrectAnswer ? 'text-primary' : 'text-text-primary'
              }`}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(optionText) }}
            />
            {isSelected && (
              <CheckCircle2 size={20} className="flex-shrink-0 text-primary" />
            )}
            {isCorrectAnswer && !isSelected && (
              <CheckCircle2 size={20} className="flex-shrink-0 text-success" />
            )}
          </button>
        );
      })}
    </div>
  );
};
