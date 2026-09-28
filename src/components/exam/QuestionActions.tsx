import type { FC } from 'react';
import { Eye } from 'lucide-react';
import { BilingualToggle } from '../common/BilingualToggle';
import { GHOST_HOVER, FOCUS_RING } from '../common/AntigravityMotion';

interface QuestionActionsProps {
  displayLang: 'en' | 'te';
  onToggleLang: (lang: 'en' | 'te') => void;
  /** Review marking is an exam-taking control — omit `onToggleReview` in
   *  read-only contexts (review lists, bulk-parser preview) to hide it. */
  isMarkedForReview?: boolean;
  onToggleReview?: () => void;
}

export const QuestionActions: FC<QuestionActionsProps> = ({
  displayLang,
  onToggleLang,
  isMarkedForReview = false,
  onToggleReview,
}) => {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
      <BilingualToggle displayLang={displayLang} onChange={onToggleLang} />

      {onToggleReview && (
        <button
          onClick={onToggleReview}
          aria-pressed={isMarkedForReview}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest ${GHOST_HOVER} ${FOCUS_RING} border-2 ${
          isMarkedForReview
            ? 'bg-purple-500/10 text-purple-500 border-purple-500/30 shadow-sm'
            : 'bg-option-surface text-text-secondary border-border-subtle/40 hover:border-purple-500/30 hover:text-purple-500'
        }`}
      >
        <Eye size={14} />
        {isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
      </button>
      )}
    </div>
  );
};
