import type { FC } from 'react';
import type { Question } from '../../types/exam.types';
import { computeQuestionState } from '../../utils/examStateCalculator';
import { getPaletteColor, getPaletteColorMobile } from '../../utils/paletteColors';
import { TRANSITION_INTERACTION, FOCUS_RING } from '../common/AntigravityMotion';
import { GOLD_LIGHT_MATERIAL } from '../common/AntigravityCard';

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
    <div role="group" aria-label="Question palette" className="grid grid-cols-5 gap-2">
      {questions.map((q, i) => {
        const state = computeQuestionState(q.id, i, currentIdx, selectedAnswers, markedForReview, visitedQuestions);
        const stateClass = getPaletteColor(state);

        return (
          <button
            key={q.id}
            onClick={() => onJumpTo(i)}
            aria-label={`Go to question ${i + 1}`}
            aria-current={state.isCurrent ? 'true' : undefined}
            className={`h-11 lg:h-12 rounded-xl flex items-center justify-center text-[11px] lg:text-xs font-bold ${TRANSITION_INTERACTION} ${FOCUS_RING} active:brightness-95 border-2 lg:border-[3px] ${stateClass}`}
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
  <div role="group" aria-label="Question palette" className={`md:hidden h-16 bg-card-bg border-t border-border-subtle flex items-center px-4 overflow-x-auto gap-3 no-scrollbar scroll-smooth ${GOLD_LIGHT_MATERIAL}`}>
    {questions.map((q, i) => {
      const state = computeQuestionState(q.id, i, currentIdx, selectedAnswers, markedForReview, visitedQuestions);
      const stateClass = getPaletteColorMobile(state);

      return (
        <button
          key={q.id}
          onClick={() => onJumpTo(i)}
          aria-label={`Go to question ${i + 1}`}
          aria-current={state.isCurrent ? 'true' : undefined}
          className={`min-w-[44px] h-11 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${TRANSITION_INTERACTION} ${FOCUS_RING} border-2 ${state.isCurrent ? 'border-success shadow-lg' : 'border-transparent'} ${stateClass}`}
        >
          {i + 1}
        </button>
      );
    })}
  </div>
);
