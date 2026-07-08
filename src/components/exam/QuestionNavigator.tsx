import type { FC } from 'react';
import { ChevronLeft, ChevronRight, Send, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface QuestionNavigatorProps {
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  hasAnswer: boolean;
  isMarkedForReview: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClear: () => void;
  onSubmit: () => void;
  onSkip?: () => void;
}

const NavButton: FC<{
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, disabled = false, variant = 'primary', children, className = '' }) => {
  const { isDark } = useTheme();

  if (!isDark) {
    const cls = variant === 'danger' ? 'ancient-btn-danger' : variant === 'secondary' ? 'ancient-btn-secondary' : 'ancient-btn-primary';
    const sizing = variant === 'primary'
      ? 'px-8 py-3 text-[13px] rounded-[13px] gap-2'
      : 'px-6 py-2.5 text-xs rounded-[13px] gap-2';
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${cls} ${sizing} ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}
      >
        {children}
      </button>
    );
  }

  const base = 'flex items-center gap-2 uppercase tracking-widest shadow-sm transition-all font-black rounded-[13px]';
  const variants = {
    primary: `${base} px-8 py-3 text-[13px] bg-primary text-white shadow-primary/20 hover:bg-primary/90 ${disabled ? 'opacity-40 pointer-events-none' : ''}`,
    secondary: `${base} px-6 py-2.5 text-xs bg-hover-bg text-text-secondary border border-border-subtle ${disabled ? 'opacity-40 pointer-events-none' : 'hover:bg-hover-bg/80'}`,
    danger: `${base} px-6 py-2.5 text-xs bg-danger text-white shadow-danger/20 hover:bg-danger/90 ${disabled ? 'opacity-40 pointer-events-none' : ''}`,
  };

  return (
    <button onClick={onClick} disabled={disabled} className={variants[variant]}>
      {children}
    </button>
  );
};

export const QuestionNavigator: FC<QuestionNavigatorProps> = ({
  isFirstQuestion,
  isLastQuestion,
  hasAnswer,
  isMarkedForReview,
  onPrev,
  onNext,
  onClear,
  onSubmit,
  onSkip,
}) => {
  const canProceed = hasAnswer || isMarkedForReview;

  return (
    <div className="md:flex hidden items-center justify-between gap-4 mt-2">
      <div className="flex gap-3">
        <NavButton variant="secondary" disabled={isFirstQuestion} onClick={onPrev}>
          <ChevronLeft size={16} />
          Prev
        </NavButton>
        <NavButton variant="secondary" disabled={!hasAnswer} onClick={onClear}>
          <Trash2 size={14} />
          Clear
        </NavButton>
      </div>
      <div className="flex gap-3">
        {!isLastQuestion && (
          <NavButton variant="secondary" disabled={!!hasAnswer} onClick={() => { if (onSkip) onSkip(); else onNext(); }}>
            Skip
            <ChevronRight size={16} />
          </NavButton>
        )}
        {isLastQuestion ? (
          <NavButton variant="danger" onClick={onSubmit}>
            <Send size={16} />
            Submit Exam
          </NavButton>
        ) : (
          <NavButton variant="primary" disabled={!canProceed} onClick={onNext}>
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
}> = ({ isFirstQuestion, isLastQuestion, hasAnswer, canProceed, onPrev, onNext, onClear, onSubmit }) => {
  const { isDark } = useTheme();
  const base = 'flex flex-col items-center justify-center gap-0.5 text-[10px] font-black h-full rounded-[13px] transition-all';

  if (!isDark) {
    return (
      <footer className="md:hidden h-16 bg-card-bg border-t border-border-subtle grid grid-cols-3 gap-1 p-2">
        <button onClick={onPrev} disabled={isFirstQuestion} className={`${base} ancient-btn-secondary ${isFirstQuestion ? 'opacity-40 pointer-events-none' : ''}`}>
          <ChevronLeft size={18} />
          PREV
        </button>
        <button onClick={onClear} disabled={!hasAnswer} className={`${base} ancient-btn-secondary ${!hasAnswer ? 'opacity-40 pointer-events-none' : ''}`}>
          <Trash2 size={18} />
          CLEAR
        </button>
        <button
          onClick={isLastQuestion ? onSubmit : onNext}
          disabled={!isLastQuestion && !canProceed}
          className={`${base} ${isLastQuestion ? 'ancient-btn-danger' : 'ancient-btn-primary'} ${!isLastQuestion && !canProceed ? 'opacity-40 pointer-events-none' : ''}`}
        >
          {isLastQuestion ? <><Send size={18} />FINISH</> : <><ChevronRight size={18} />NEXT</>}
        </button>
      </footer>
    );
  }

  return (
    <footer className="md:hidden h-16 bg-card-bg border-t border-border-subtle grid grid-cols-3 gap-1 p-2">
      <button onClick={onPrev} disabled={isFirstQuestion} className={`${base} bg-hover-bg text-text-secondary ${isFirstQuestion ? 'opacity-40' : ''}`}>
        <ChevronLeft size={18} />PREV
      </button>
      <button onClick={onClear} disabled={!hasAnswer} className={`${base} bg-hover-bg text-danger ${!hasAnswer ? 'opacity-40' : ''}`}>
        <Trash2 size={18} />CLEAR
      </button>
      <button
        onClick={isLastQuestion ? onSubmit : onNext}
        disabled={!isLastQuestion && !canProceed}
        className={`${base} ${isLastQuestion ? 'bg-danger text-white' : 'bg-primary text-white'} ${!isLastQuestion && !canProceed ? 'opacity-40' : ''}`}
      >
        {isLastQuestion ? <><Send size={18} />FINISH</> : <><ChevronRight size={18} />NEXT</>}
      </button>
    </footer>
  );
};
