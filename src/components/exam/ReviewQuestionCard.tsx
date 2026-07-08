import type { FC } from 'react';
import { Check, X, Brain } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useTheme } from '../../context/ThemeContext';
import { computeAnswerStatus } from '../../utils/examStateCalculator';
import type { Question, AttemptAnswer } from '../../types/exam.types';

interface ReviewQuestionCardProps {
  question: Question;
  answer: AttemptAnswer | undefined;
  index: number;
  displayLang: 'en' | 'te';
  visualNode?: React.ReactNode;
  diagramNode?: React.ReactNode;
}

export const ReviewQuestionCard: FC<ReviewQuestionCardProps> = ({
  question,
  answer,
  index,
  displayLang,
  visualNode,
  diagramNode,
}) => {
  const { isDark } = useTheme();
  const { status, isCorrect } = computeAnswerStatus(answer);

  return (
    <div className="space-y-8 relative">
      <div className="flex gap-5">
        <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black border ${
          status === 'correct' ? 'bg-success/10 text-success border-success/30' :
          status === 'wrong' ? 'bg-danger/10 text-danger border-danger/30' :
          'bg-hover-bg text-text-disabled border-border-subtle'
        }`}>
          {index + 1}
        </span>
        <div className="space-y-6 flex-grow min-w-0">
          {displayLang === 'te' && !question.question_text_te?.trim() && (
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Telugu Translation Unavailable</span>
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

      <div className="flex gap-2 sm:pl-16">
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
          status === 'correct' ? 'bg-success/10 text-success' :
          status === 'wrong' ? 'bg-danger/10 text-danger' :
          status === 'skipped' ? 'bg-warning/10 text-warning' :
          'bg-hover-bg text-text-secondary'
        }`}>
          {status === 'correct' ? 'Validated Correct' :
           status === 'wrong' ? 'Critical Error' :
           status === 'skipped' ? 'Skipped' : 'Not Visited'}
        </span>
      </div>

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

          let stateClass = 'bg-hover-bg/20 border-transparent text-text-disabled opacity-60';
          if (isRealCorrect) stateClass = 'bg-success/10 border-success/20 text-success font-bold';
          else if (isUserChoice && !isCorrect) stateClass = 'bg-danger/10 border-danger/20 text-danger font-bold';

          return (
            <div key={label} className={`p-4 rounded-[14px] border-2 flex items-center justify-between text-[14px] ${stateClass} ${isDark ? '' : 'ancient-3d-lift'}`}>
              <span
                className="line-clamp-2 leading-relaxed flex-1"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(optionText) }}
              />
              {isRealCorrect && <Check size={16} strokeWidth={3} className="ml-2 flex-shrink-0" />}
              {isUserChoice && !isCorrect && <X size={16} strokeWidth={3} className="ml-2 flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      <div className={`sm:ml-16 p-8 rounded-[20px] border relative overflow-hidden ${
        isDark ? 'bg-primary/5 border-primary/10' : 'ancient-card !border-primary/20 !shadow-[3px_4px_0px_rgba(105,62,15,0.5)]'
      }`}>
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <div className="flex items-center gap-3 mb-2">
          <Brain size={18} className="text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Technical Rationale</span>
        </div>
        <p className="text-[clamp(13px,1.5vw,15px)] text-text-primary/90 leading-relaxed italic m-0">
          {displayLang === 'en'
            ? (question.explanation_en?.trim() || "No detailed explanation provided.")
            : (question.explanation_te?.trim() || "తెలుగు వివరణ అందుబాటులో లేదు. (No Telugu explanation provided.)")}
        </p>
      </div>
    </div>
  );
};
