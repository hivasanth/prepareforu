import type { FC } from 'react';
import { Layers, AlertCircle, X } from 'lucide-react';
import { IconBadge, H3, IconButton } from '../common/AntigravityUI';
import { GOLD_LIGHT_MATERIAL, CARD_HOVER } from '../common/AntigravityCard';
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
  isVisible: boolean;
  onToggleVisibility: () => void;
}

/**
 * Status Board — question palette and legend.
 *
 * Desktop (≥ md): right sidebar, flex child, w-[27%].
 * Mobile (< md): fixed bottom-sheet overlay with backdrop, z-40.
 * Toggle: close button inside header (mobile only); parent provides
 * a header-level toggle for desktop.
 */
export const StatusBoard: FC<StatusBoardProps> = ({
  questions,
  currentIdx,
  selectedAnswers,
  markedForReview,
  visitedQuestions,
  fullscreenViolations,
  onJumpTo,
  stats,
  isVisible,
  onToggleVisibility,
}) => {
  return (
    <aside
      className={`border border-card-border shadow-elevation-3 micro-light bg-card-bg overflow-y-auto custom-scrollbar transition-all duration-slow ease-standard flex-shrink-0 ${GOLD_LIGHT_MATERIAL} ${CARD_HOVER} ${isVisible ? '' : 'hidden'} fixed inset-x-0 bottom-0 z-40 max-h-[70vh] rounded-t-3xl pl-5 pr-4 py-6 md:w-[27%] md:min-w-[220px] md:max-w-[340px] md:rounded-2xl md:static md:z-auto md:max-h-none`}
      aria-label="Status board"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <IconBadge icon={Layers} size="lg" className="shadow-sm" />
          <H3 className="text-sm font-bold uppercase">Status Board</H3>
        </div>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onToggleVisibility}
          aria-label="Close status board"
          className="md:hidden"
        >
          <X size={16} />
        </IconButton>
      </div>

      <QuestionPalette
        questions={questions}
        currentIdx={currentIdx}
        selectedAnswers={selectedAnswers}
        markedForReview={markedForReview}
        visitedQuestions={visitedQuestions}
        onJumpTo={onJumpTo}
      />

      <div className="mt-8 p-4 rounded-2xl bg-app-bg border-2 lg:border-[3px] border-border-subtle transition-interaction duration-slow ease-standard">
        <div className="flex flex-col gap-3">
          <LegendItem
            color="bg-success"
            borderClass="border-success"
            label="Current"
            count={stats ? 1 : undefined}
          />
          <LegendItem
            color="bg-warning"
            borderClass="border-warning"
            label="Answered"
            count={stats?.answered}
          />
          <LegendItem
            color="bg-purple-500"
            borderClass="border-purple-500"
            label="Marked for Review"
            count={stats?.marked}
          />
          <LegendItem
            color="bg-info"
            borderClass="border-info"
            label="Skipped"
            count={stats?.skipped}
          />
          <LegendItemNotVisited
            label="Not Visited"
            count={stats?.notVisited}
          />
        </div>
      </div>

      {fullscreenViolations > 0 && (
        <div role="alert" className="mt-6 p-4 bg-warning/5 border border-warning/10 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="m-0 text-[10px] font-bold text-warning uppercase tracking-widest">Security Status</p>
            <p className="m-0 text-[10px] font-bold text-warning/70 leading-relaxed">
              Fullscreen exits recorded: {fullscreenViolations}. Please maintain fullscreen for exam integrity.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

const LegendItem: FC<{ color: string; borderClass: string; label: string; count?: number }> = ({ color, borderClass, label, count }) => (
  <div className="flex items-center gap-3 text-xs lg:text-[13px] font-bold text-foreground uppercase tracking-widest">
    <div className={`w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-md border-2 lg:border-[3px] ${borderClass} bg-transparent flex items-center justify-center`}>
      <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-sm ${color}`} />
    </div>
    {label}{count !== undefined ? ` (${count})` : ''}
  </div>
);

const LegendItemNotVisited: FC<{ label: string; count?: number }> = ({ label, count }) => (
  <div className="flex items-center gap-3 text-xs lg:text-[13px] font-bold text-foreground uppercase tracking-widest">
    <div className="w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-md border-2 lg:border-[3px] border-border-subtle bg-transparent" />
    {label}{count !== undefined ? ` (${count})` : ''}
  </div>
);
