import type { FC } from 'react';
import { Layers, AlertCircle } from 'lucide-react';
import { IconBadge } from '../common/AntigravityUI';
import { QuestionPalette } from './QuestionPalette';
import type { Question } from '../../types/exam.types';
import type { ExamStatistics } from '../../utils/examStateCalculator';

interface StatusBoardProps {
  questions: Question[];
  currentIdx: number;
  selectedAnswers: Record<string, string | null>;
  markedForReview: Set<string>;
  visitedQuestions: Set<string>;
  fullscreenViolations: number;
  onJumpTo: (index: number) => void;
  stats?: ExamStatistics;
}

export const StatusBoard: FC<StatusBoardProps> = ({
  questions,
  currentIdx,
  selectedAnswers,
  markedForReview,
  visitedQuestions,
  fullscreenViolations,
  onJumpTo,
  stats,
}) => {
  return (
    <aside className="w-[27%] min-w-[220px] max-w-[340px] border-l border-border-subtle bg-card-bg pl-5 pr-4 py-6 overflow-y-auto hidden lg:block custom-scrollbar transition-colors duration-300 flex-shrink-0">
      <div className="flex items-center gap-3 mb-6">
        <IconBadge icon={Layers} size="lg" className="shadow-sm" />
        <h3 className="m-0 text-sm font-black text-text-primary tracking-tight uppercase">Status Board</h3>
      </div>

      <QuestionPalette
        questions={questions}
        currentIdx={currentIdx}
        selectedAnswers={selectedAnswers}
        markedForReview={markedForReview}
        visitedQuestions={visitedQuestions}
        onJumpTo={onJumpTo}
      />

      <div className="mt-8 p-4 rounded-2xl bg-app-bg border border-border-subtle transition-colors">
        <h4 className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-4 opacity-60">Indicator Legend</h4>
        <div className="flex flex-col gap-3">
          <LegendItem color="bg-[#22C55E]" label={`Current${stats ? ` (1)` : ''}`} />
          <LegendItem color="bg-[#F59E0B]" label={`Answered${stats ? ` (${stats.answered})` : ''}`} />
          <LegendItem color="bg-[#8B5CF6]" label={`Marked for Review${stats ? ` (${stats.marked})` : ''}`} />
          <LegendItem color="bg-[#3B82F6]" label={`Skipped${stats ? ` (${stats.skipped})` : ''}`} />
          <LegendItemNotVisited label={`Not Visited${stats ? ` (${stats.notVisited})` : ''}`} />
        </div>
      </div>

      {fullscreenViolations > 0 && (
        <div className="mt-6 p-4 bg-warning/5 border border-warning/10 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="m-0 text-[10px] font-black text-warning uppercase tracking-widest">Security Status</p>
            <p className="m-0 text-[10px] font-bold text-warning/70 leading-relaxed">
              Fullscreen exits recorded: {fullscreenViolations}. Please maintain fullscreen for exam integrity.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

const LegendItem: FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-3 text-xs font-bold text-text-primary uppercase tracking-widest">
    <div className={`w-3.5 h-3.5 rounded-md ${color} shadow-sm`} />
    {label}
  </div>
);

const LegendItemNotVisited: FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 text-xs font-bold text-text-secondary uppercase tracking-widest">
    <div className="w-3.5 h-3.5 rounded-md border border-[#64748B] bg-transparent" />
    {label}
  </div>
);
