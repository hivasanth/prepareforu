import type { FC } from 'react';
import { Eye } from 'lucide-react';
import { RadioGroup } from '../common/AntigravityUI';

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
      <RadioGroup<'en' | 'te'>
        value={displayLang}
        onChange={onToggleLang}
        label="Question language"
        options={[
          { value: 'en', label: 'English' },
          { value: 'te', label: 'తెలుగు' },
        ]}
      />

      <button
        onClick={onToggleReview}
        aria-pressed={isMarkedForReview}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border-2 ${
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
