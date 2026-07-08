import type { FC } from 'react';
import type { Question } from '../../types/exam.types';
import { computeQuestionState } from '../../utils/examStateCalculator';
import { getPaletteColor, getPaletteColorMobile } from '../../utils/paletteColors';

interface QuestionPaletteProps {
  questions: Question[];
  currentIdx: number;
  selectedAnswers: Record<string, string | null>;
  markedForReview: Set<string>;
  visitedQuestions: Set<string>;
  onJumpTo: (index: number) => void;
}

export const QuestionPalette: FC<QuestionPaletteProps> = ({
  questions,
  currentIdx,
  selectedAnswers,
  markedForReview,
  visitedQuestions,
  onJumpTo,
}) => {
  return (
    <div className="grid grid-cols-5 gap-2">
      {questions.map((q, i) => {
        const state = computeQuestionState(q.id, i, currentIdx, selectedAnswers, markedForReview, visitedQuestions);
        const stateClass = getPaletteColor(state);

        return (
          <button
            key={q.id}
            onClick={() => onJumpTo(i)}
            aria-label={`Go to question ${i + 1}`}
            className={`h-11 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all active:scale-90 border ${stateClass}`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
};

export const MobileQuestionStrip: FC<{
  questions: Question[];
  currentIdx: number;
  selectedAnswers: Record<string, string | null>;
  markedForReview: Set<string>;
  visitedQuestions: Set<string>;
  onJumpTo: (index: number) => void;
}> = ({ questions, currentIdx, selectedAnswers, markedForReview, visitedQuestions, onJumpTo }) => (
  <div className="md:hidden h-16 bg-card-bg border-t border-border-subtle flex items-center px-4 overflow-x-auto gap-3 no-scrollbar scroll-smooth">
    {questions.map((q, i) => {
      const state = computeQuestionState(q.id, i, currentIdx, selectedAnswers, markedForReview, visitedQuestions);
      const stateClass = getPaletteColorMobile(state);

      return (
        <button
          key={q.id}
          onClick={() => onJumpTo(i)}
          aria-label={`Go to question ${i + 1}`}
          className={`min-w-[44px] h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-all border-2 ${state.isCurrent ? 'border-success scale-110 shadow-lg' : 'border-transparent'} ${stateClass}`}
        >
          {i + 1}
        </button>
      );
    })}
  </div>
);
