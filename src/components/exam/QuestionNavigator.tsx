import type { FC, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Send, Trash2 } from 'lucide-react';
import { BUTTON_HOVER, GHOST_HOVER, FOCUS_RING } from '../common/AntigravityMotion';
import { GOLD_LIGHT_MATERIAL } from '../common/AntigravityCard';

interface QuestionNavigatorProps {
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  hasAnswer: boolean;
  isMarkedForReview: boolean;
  canProceed?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClear: () => void;
  onSubmit: () => void;
  onSkip?: () => void;
}

const baseBtn = `flex items-center gap-2 uppercase tracking-widest shadow-sm ${FOCUS_RING} font-bold rounded-[13px]`;

const NavButton: FC<{
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}> = ({ onClick, disabled = false, variant = 'primary', children, className = '', ariaLabel }) => {
  const variants = {
    primary: `${baseBtn} px-8 py-3 text-[13px] bg-primary text-white shadow-primary/20 ${BUTTON_HOVER} ${disabled ? 'opacity-40 pointer-events-none' : ''}`,
    secondary: `${baseBtn} px-6 py-2.5 text-xs bg-hover-bg text-text-secondary border border-border-subtle ${GHOST_HOVER} ${disabled ? 'opacity-40 pointer-events-none' : 'hover:bg-hover-bg/80'}`,
    danger: `${baseBtn} px-6 py-2.5 text-xs bg-danger text-white shadow-danger/20 ${BUTTON_HOVER} ${disabled ? 'opacity-40 pointer-events-none' : ''}`,
  };

  return (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={`${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export const QuestionNavigator: FC<QuestionNavigatorProps> = ({
  isFirstQuestion,
  isLastQuestion,
  hasAnswer,
  isMarkedForReview,
  canProceed: canProceedProp,
  onPrev,
  onNext,
  onClear,
  onSubmit,
  onSkip,
}) => {
  const canProceed = canProceedProp ?? (hasAnswer || isMarkedForReview);

  return (
    <div className="md:flex hidden items-center justify-between gap-4 mt-2" role="toolbar" aria-label="Question navigation">
      <div className="flex gap-3">
        <NavButton variant="secondary" disabled={isFirstQuestion} onClick={onPrev} ariaLabel="Previous question">
          <ChevronLeft size={16} />
          Prev
        </NavButton>
        <NavButton variant="secondary" disabled={!hasAnswer} onClick={onClear} ariaLabel="Clear answer">
          <Trash2 size={14} />
          Clear
        </NavButton>
      </div>
      <div className="flex gap-3">
        {!isLastQuestion && (
          <NavButton variant="secondary" disabled={!!hasAnswer} onClick={() => { if (onSkip) onSkip(); else onNext(); }} ariaLabel="Skip question">
            Skip
            <ChevronRight size={16} />
          </NavButton>
        )}
        {isLastQuestion ? (
          <NavButton variant="danger" onClick={onSubmit} ariaLabel="Submit exam">
            <Send size={16} />
            Submit Exam
          </NavButton>
        ) : (
          <NavButton variant="primary" disabled={!canProceed} onClick={onNext} ariaLabel="Next question">
            Next
            <ChevronRight size={16} />
          </NavButton>
        )}
      </div>
    </div>
  );
};

export const MobileActionBar: FC<{
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  hasAnswer: boolean;
  canProceed: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClear: () => void;
  onSubmit: () => void;
  onSkip?: () => void;
}> = ({ isFirstQuestion, isLastQuestion, hasAnswer, onPrev, onNext, onClear, onSubmit, onSkip }) => {
  const ghostBase = `flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold h-full rounded-[13px] ${GHOST_HOVER} ${FOCUS_RING}`;
  const materialBase = `flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold h-full rounded-[13px] ${BUTTON_HOVER} ${FOCUS_RING}`;

  return (
    <footer className={`md:hidden h-16 bg-card-bg border-t border-border-subtle grid grid-cols-3 gap-1 p-2 ${GOLD_LIGHT_MATERIAL}`} role="toolbar" aria-label="Question navigation">
      <button onClick={onPrev} disabled={isFirstQuestion} aria-label="Previous question" className={`${ghostBase} bg-hover-bg text-text-secondary ${isFirstQuestion ? 'opacity-40' : ''}`}>
        <ChevronLeft size={18} />PREV
      </button>
      <button onClick={onClear} disabled={!hasAnswer} aria-label="Clear answer" className={`${ghostBase} bg-hover-bg text-danger ${!hasAnswer ? 'opacity-40' : ''}`}>
        <Trash2 size={18} />CLEAR
      </button>
      <button
        onClick={isLastQuestion ? onSubmit : (onSkip && !hasAnswer ? onSkip : onNext)}
        aria-label={isLastQuestion ? 'Submit exam' : 'Next question'}
        className={`${materialBase} ${isLastQuestion ? 'bg-danger text-white' : 'bg-primary text-white'}`}
      >
        {isLastQuestion ? <><Send size={18} />FINISH</> : <><ChevronRight size={18} />NEXT</>}
      </button>
    </footer>
  );
};
