import type { FC } from 'react';
import { Check, X, Brain } from 'lucide-react';
import DOMPurify from 'dompurify';
import { computeAnswerStatus } from '../../utils/examStateCalculator';
import type { Question, AttemptAnswer } from '../../types/exam.types';
import { Card } from '../common/AntigravityCard';
import { NumberBadge } from '../common/NumberBadge';

interface ReviewQuestionCardProps {
  question: Question;
  answer: AttemptAnswer | undefined;
  index: number;
  displayLang: 'en' | 'te';
  visualNode?: React.ReactNode;
  diagramNode?: React.ReactNode;
}

/**
 * Review question card:
 *   Uses Card variant="static" — NO hover lift for read-only content.
 *   Question number uses NumberBadge variant="question".
 *   Option surfaces use bg-option-surface (white in light, dark in dark).
 *   No hover on non-interactive review options.
 *   Technical Rationale section labeled.
 */
export const ReviewQuestionCard: FC<ReviewQuestionCardProps> = ({
  question,
  answer,
  index,
  displayLang,
  visualNode,
  diagramNode,
}) => {
  const { status, isCorrect } = computeAnswerStatus(answer);

  return (
    <Card variant="static" className="space-y-8 relative">
      <div className="flex gap-5">
        <NumberBadge
          value={index + 1}
          variant="question"
          className={`w-10 h-10 text-[14px] ${
            status === 'correct' ? 'text-success' :
            status === 'wrong' ? 'text-danger' :
            status === 'skipped' ? 'text-warning' :
            'text-text-disabled'
          }`}
        />
        <div className="space-y-6 flex-grow min-w-0">
          {displayLang === 'te' && !question.question_text_te?.trim() && (
            <div className="p-3 bg-warning/5 border border-warning/10 rounded-xl">
              <span className="text-[10px] font-bold text-warning uppercase tracking-widest">Telugu Translation Unavailable</span>
            </div>
          )}

          <h4
            className="text-[clamp(14px,1.8vw,18px)] font-bold text-text-primary leading-snug tracking-tight m-0 max-w-[900px]"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                displayLang === 'en'
                  ? (question.question_text_en?.trim() || 'Untitled Question')
                  : (question.question_text_te?.trim() || question.question_text_en?.trim() || 'Untitled Question')
              )
            }}
          />

          {visualNode}
          {diagramNode && !visualNode && diagramNode}
        </div>
      </div>

      {/* Status pill */}
      <div className="flex gap-2 sm:pl-16">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
          status === 'correct' ? 'bg-success/10 text-success' :
          status === 'wrong' ? 'bg-danger/10 text-danger' :
          status === 'skipped' ? 'bg-warning/10 text-warning' :
          'bg-hover-bg text-text-secondary'
        }`}>
          {status === 'correct' ? 'Correct' :
           status === 'wrong' ? 'Incorrect' :
           status === 'skipped' ? 'Skipped' : 'Not Visited'}
        </span>
      </div>

      {/* Options grid — no hover, read-only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:pl-16">
        {['A', 'B', 'C', 'D'].map((opt) => {
          const label = opt as 'A' | 'B' | 'C' | 'D';
          const lower = label.toLowerCase();
          const optionText = displayLang === 'en'
            ? (question[`option_${lower}_en` as keyof Question] as string)?.trim() || ''
            : (question[`option_${lower}_te` as keyof Question] as string)?.trim() || '';

          const isUserChoice = answer?.selected_option === label;
          const isRealCorrect = question.correct_option === label;

          if (!optionText) return null;

          let stateClass = 'bg-option-surface border-border-subtle text-text-disabled opacity-60';
          if (isRealCorrect) stateClass = 'bg-success/10 border-success/20 text-success font-bold';
          else if (isUserChoice && !isCorrect) stateClass = 'bg-danger/10 border-danger/20 text-danger font-bold';

          return (
            <div
              key={label}
              className={`p-4 rounded-button-md border-2 lg:border-[3px] flex items-center justify-between text-[14px] lg:text-[15px] lg:font-semibold ${stateClass}`}
            >
              <span
                className="line-clamp-2 leading-relaxed flex-1"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(optionText) }}
              />
              {isRealCorrect && (
                <span className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <span className="sr-only">Correct answer</span>
                  <Check size={16} strokeWidth={3} aria-hidden="true" />
                </span>
              )}
              {isUserChoice && !isCorrect && (
                <span className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <span className="sr-only">Your answer - incorrect</span>
                  <X size={16} strokeWidth={3} aria-hidden="true" />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Technical Rationale */}
      <div className="sm:ml-16 p-8 rounded-[20px] border relative overflow-hidden bg-option-surface border-border-subtle shadow-sm">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <div className="flex items-center gap-3 mb-2">
          <Brain size={18} className="text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Technical Rationale</span>
        </div>
        <p className="text-[clamp(13px,1.5vw,15px)] text-text-primary/90 leading-relaxed italic m-0">
          {displayLang === 'en'
            ? (question.explanation_en?.trim() || "No detailed explanation provided.")
            : (question.explanation_te?.trim() || "తెలుగు వివరణ అందుబాటులో లేదు. (No Telugu explanation provided.)")}
        </p>
      </div>
    </Card>
  );
};
