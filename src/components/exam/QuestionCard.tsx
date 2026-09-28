import type { FC, ReactNode } from 'react';
import { Globe } from 'lucide-react';
import type { Question } from '../../types/exam.types';
import { Card } from '../common/AntigravityCard';
import { QuestionOptions } from './QuestionOptions';
import { QuestionActions } from './QuestionActions';
import { QuestionCardHeader } from './QuestionCardHeader';

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  displayLang: 'en' | 'te';
  onToggleLang: (lang: 'en' | 'te') => void;
  selectedAnswer: string | null | undefined;
  /** Omit in read-only contexts: answer options render as static rows and are
   *  not announced as interactive controls (no radio role / pointer cursor). */
  onSelectOption?: (option: string) => void;
  /** Exam-taking controls — omit in read-only contexts to hide the
   *  mark-for-review control from the header actions. */
  isMarkedForReview?: boolean;
  onToggleReview?: () => void;
  visualNode?: ReactNode;
  diagramNode?: ReactNode;
  /** Review/view mode: hides the per-card language toggle AND mark-for-review
   *  controls entirely (the host page owns language selection). Also renders
   *  the card as a fully static review surface — the base `Card` drops its
   *  hover lift (`variant="static"`) and answer options lose transient
   *  pointer-hover feedback. */
  readOnly?: boolean;
  /** Suppress transient pointer-hover feedback on the answer options.
   *  Defaults to `!readOnly`, so read-only review contexts are static while
   *  interactive exam-taking consumers keep their hover behavior. */
  hoverable?: boolean;
  /** Reveals the correct option (and wrong-selection state when a user answer
   *  is provided via `selectedAnswer`). */
  showCorrect?: boolean;
  correctOption?: string;
  /** Optional explanation rendered below the options in the canonical
   *  explanation treatment. Bilingual selection is the caller's duty. */
  explanation?: string | null;
  /** Disables option interaction (pure view/review contexts). */
  optionsDisabled?: boolean;
}

export const QuestionCard: FC<QuestionCardProps> = ({
  question,
  index,
  total,
  displayLang,
  onToggleLang,
  selectedAnswer,
  onSelectOption,
  isMarkedForReview = false,
  onToggleReview,
  visualNode,
  diagramNode,
  readOnly = false,
  hoverable,
  showCorrect = false,
  correctOption,
  explanation,
  optionsDisabled = false,
}) => {
  const optionHoverable = hoverable ?? !readOnly;

  return (
    <Card
      variant={readOnly ? 'static' : 'elevated'}
      padding={0}
      className="relative overflow-hidden"
    >
      <QuestionCardHeader
        index={index + 1}
        total={total}
        actions={
          readOnly ? undefined : (
            <QuestionActions
              displayLang={displayLang}
              onToggleLang={onToggleLang}
              isMarkedForReview={isMarkedForReview}
              onToggleReview={onToggleReview}
            />
          )
        }
        difficulty={question.difficulty}
      />

      <div className="p-5 md:p-6">
        {displayLang === 'te' && !question.question_text_te?.trim() ? (
          <div className="flex items-center gap-3 p-4 bg-warning/5 border border-warning/10 rounded-2xl mb-6">
            <Globe className="w-4 h-4 text-warning/40" />
            <span className="text-[11px] font-bold text-warning uppercase tracking-widest">Telugu Translation Unavailable</span>
          </div>
        ) : null}

        <h2 className="font-semibold text-text-primary leading-relaxed mb-6 text-[clamp(14px,1.8vw,17px)] max-w-[780px]">
          {displayLang === 'en'
            ? (question.question_text_en?.trim() || '')
            : (question.question_text_te?.trim() || question.question_text_en?.trim() || '')}
        </h2>

        {visualNode}
        {diagramNode}

        <QuestionOptions
          options={['A', 'B', 'C', 'D'].map(opt => {
            const lower = opt.toLowerCase();
            return displayLang === 'en'
              ? (question[`option_${lower}_en` as keyof Question] as string)?.trim() || ''
              : (question[`option_${lower}_te` as keyof Question] as string)?.trim() || '';
          })}
          selectedAnswer={selectedAnswer}
          onSelect={onSelectOption}
          showCorrect={showCorrect}
          correctOption={correctOption}
          disabled={optionsDisabled}
          hoverable={optionHoverable}
        />

        {explanation?.trim() ? (
          <div className="mt-6 bg-primary/5 border border-primary/10 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Explanation</span>
            <p className="text-xs text-text-secondary font-medium leading-relaxed italic">
              &ldquo;{explanation.trim()}&rdquo;
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
};
