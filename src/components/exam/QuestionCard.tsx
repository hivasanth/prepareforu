import type { FC, ReactNode } from 'react';
import { Globe } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { Question } from '../../types/exam.types';
import { QuestionOptions } from './QuestionOptions';
import { QuestionActions } from './QuestionActions';

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  displayLang: 'en' | 'te';
  onToggleLang: (lang: 'en' | 'te') => void;
  selectedAnswer: string | null | undefined;
  onSelectOption: (option: string) => void;
  isMarkedForReview: boolean;
  onToggleReview: () => void;
  visualNode?: ReactNode;
  diagramNode?: ReactNode;
}

export const QuestionCard: FC<QuestionCardProps> = ({
  question,
  index,
  total,
  displayLang,
  onToggleLang,
  selectedAnswer,
  onSelectOption,
  isMarkedForReview,
  onToggleReview,
  visualNode,
  diagramNode,
}) => {
  const { isDark } = useTheme();

  return (
    <div className={`${isDark ? 'bg-card-bg border border-border-subtle shadow-xl' : 'ancient-card'} rounded-[24px] relative overflow-hidden`}>
      <div className={`p-4 md:p-6 border-b flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 ${
        isDark ? 'border-border-subtle/50 bg-hover-bg/30' : ''
      }`}>
        <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-lg ${
          isDark ? 'bg-primary text-white shadow-primary/20' : 'ancient-icon-badge text-amber-400'
        }`}>
            {index + 1}
          </div>
          <div>
            <span className="text-[11px] font-black text-text-secondary uppercase tracking-widest">Question</span>
            <div className="text-sm font-black text-text-primary uppercase">of {total}</div>
          </div>
        </div>

        <QuestionActions
          displayLang={displayLang}
          onToggleLang={onToggleLang}
          isMarkedForReview={isMarkedForReview}
          onToggleReview={onToggleReview}
        />

        <div className={`
          px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border shrink-0
          ${question.difficulty === 'easy' ? 'bg-success/10 text-success border-success/20' :
            question.difficulty === 'medium' ? 'bg-warning/10 text-warning border-warning/20' :
            'bg-danger/10 text-danger border-danger/20'}
        `}>
          {question.difficulty}
        </div>
      </div>

      <div className="p-5 md:p-6">
        {displayLang === 'te' && !question.question_text_te?.trim() ? (
          <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl mb-6">
            <Globe className="w-4 h-4 text-amber-500/40" />
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">Telugu Translation Unavailable</span>
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
        />
      </div>
    </div>
  );
};

export const QuestionInfoHeader: FC<{
  index: number;
  total: number;
  subjectName: string;
  difficulty: string;
}> = ({ index, total, subjectName, difficulty }) => {
  const { isDark } = useTheme();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
          isDark ? 'bg-primary/10 text-primary border border-primary/20' : 'ancient-icon-badge text-amber-400'
        }`}>
          Q{index + 1}
        </div>
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest block">{subjectName}</span>
          <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">of {total}</span>
        </div>
      </div>
      <span className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border ${
        difficulty === 'easy' ? 'bg-success/10 text-success border-success/20' :
        difficulty === 'medium' ? 'bg-warning/10 text-warning border-warning/20' :
        'bg-danger/10 text-danger border-danger/20'
      }`}>
        {difficulty}
      </span>
    </div>
  );
};
