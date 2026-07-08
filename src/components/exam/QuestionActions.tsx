import type { FC } from 'react';
import { Eye, Globe } from 'lucide-react';

interface QuestionActionsProps {
  displayLang: 'en' | 'te';
  onToggleLang: (lang: 'en' | 'te') => void;
  isMarkedForReview: boolean;
  onToggleReview: () => void;
}

export const QuestionActions: FC<QuestionActionsProps> = ({
  displayLang,
  onToggleLang,
  isMarkedForReview,
  onToggleReview,
}) => {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
      <div
        className="flex items-center gap-1 p-1 rounded-xl bg-hover-bg/30"
        role="radiogroup"
        aria-label="Language"
      >
        {(['en', 'te'] as const).map(l => {
          const isActive = displayLang === l;
          return (
            <button
              key={l}
              onClick={() => onToggleLang(l)}
              className={`flex items-center gap-1 px-3 py-2.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              role="radio"
              aria-checked={isActive}
            >
              <Globe size={12} />
              {l === 'en' ? 'English' : 'తెలుగు'}
            </button>
          );
        })}
      </div>

      <button
        onClick={onToggleReview}
        aria-pressed={isMarkedForReview}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${
          isMarkedForReview
            ? 'bg-purple-500/10 text-purple-500 border-purple-500/30 shadow-sm'
            : 'bg-transparent text-text-secondary border-border-subtle/40 hover:border-purple-500/30 hover:text-purple-500'
        }`}
      >
        <Eye size={14} />
        {isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
      </button>
    </div>
  );
};
