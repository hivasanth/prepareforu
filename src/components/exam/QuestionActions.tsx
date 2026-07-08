import type { FC } from 'react';
import { Eye, Globe } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
  const { isDark } = useTheme();

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
      <div
        className={`flex items-center gap-1 p-1 rounded-xl ${
          isDark ? 'bg-hover-bg/30' : 'bg-[#F5EAD4] border-[2px] border-[#A87828] shadow-[2px_2px_0px_#8B5A10]'
        }`}
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
                  ? isDark
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-primary border-[1.5px] border-[#A87828] text-white shadow-[1px_1px_0px_#8B5A10]'
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
