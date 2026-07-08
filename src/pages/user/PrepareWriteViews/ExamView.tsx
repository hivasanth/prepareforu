import { useState, useEffect, type FC } from 'react';
import { Maximize2, Minimize2, Timer, XCircle } from 'lucide-react';
import { IconButton, ProgressBar } from '../../../components/common/AntigravityUI';
import { DiagramRenderer } from '../../../components/common/DiagramRenderer';
import { QuestionVisualizer } from '../../../components/common/QuestionVisualizer';
import {
  ExamHeader,
  QuestionActions,
  QuestionCard,
  SubmitExamModal,
  MobileQuestionStrip,
  QuestionNavigator,
  MobileActionBar,
  StatusBoard,
} from '../../../components/exam';
import { computeExamStatistics, computeQuestionState } from '../../../utils/examStateCalculator';
import type { Question, ExamPaper } from '../../../types/exam.types';

interface ExamViewProps {
  paper: ExamPaper | null;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  markedForReview: Record<string, boolean>;
  startTime: number | null;
  onExit: () => void;
  onSubmit: () => void;
  onAnswer: (questionId: string, option: 'A' | 'B' | 'C' | 'D') => void;
  onToggleReview: (questionId: string) => void;
  onJumpToQuestion: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const ExamView: FC<ExamViewProps> = ({
  paper,
  questions,
  currentIndex,
  answers,
  markedForReview,
  startTime,
  onExit,
  onSubmit,
  onAnswer,
  onToggleReview,
  onJumpToQuestion,
  onPrev,
  onNext,
}) => {
  const [displayLang, setDisplayLang] = useState<'en' | 'te'>('en');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const handleAnswer = (option: string) => {
    const q = questions[currentIndex];
    if (q) onAnswer(q.id, option as 'A' | 'B' | 'C' | 'D');
  };

  const handleClear = () => {
    const q = questions[currentIndex];
    if (q) onAnswer(q.id, null as unknown as 'A' | 'B' | 'C' | 'D');
  };

  useEffect(() => {
    const handler = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [currentIndex]);

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const elapsedTime = Math.floor((Date.now() - (startTime || 0)) / 60000);
  const markedSet = new Set(Object.keys(markedForReview).filter(k => markedForReview[k]));
  const visitedSet = new Set(questions.map(q => q.id));
  const examStats = computeExamStatistics(questions, answers, markedSet, visitedSet, undefined, paper?.duration_minutes ? paper.duration_minutes * 60 : undefined);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const qState = q ? computeQuestionState(q.id, currentIndex, currentIndex, answers, markedSet, visitedSet) : null;
  const hasAnswer = qState?.isAnswered ?? false;
  const isMarked = qState?.isMarked ?? false;
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canProceed = hasAnswer || isMarked;

  const visualNode = q?.visual && (
    <div className="mb-8 rounded-2xl overflow-hidden border border-border-subtle">
      <QuestionVisualizer visual={q.visual} />
    </div>
  );

  const diagramNode = q?.diagram && !q?.visual && (
    <div className="mb-8 p-4 bg-hover-bg/20 rounded-2xl border border-border-subtle">
      <DiagramRenderer diagram={q.diagram} />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ExamHeader
        title="Examination"
        subtitle={paper?.paper_name}
        timerSlot={
          <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-border-subtle bg-hover-bg">
            <Timer size={16} className="text-primary" />
            <span className="text-[12px] sm:text-[14px] font-black text-text-primary tabular-nums">{elapsedTime}m</span>
          </div>
        }
        leftActions={
          <IconButton onClick={onExit} className="text-danger border-danger/20">
            <XCircle size={20} />
          </IconButton>
        }
        rightActions={
          <>
            <IconButton onClick={toggleFullScreen} className="hidden sm:flex text-text-secondary">
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </IconButton>
            <QuestionActions
              displayLang={displayLang}
              onToggleLang={setDisplayLang}
              isMarkedForReview={isMarked}
              onToggleReview={() => { if (q) onToggleReview(q.id); }}
            />
          </>
        }
      />

      <main className="flex-1 flex overflow-hidden max-w-[1360px] mx-auto w-full">
        <section className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-6 custom-scrollbar scroll-smooth min-w-0">
          <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
            <ProgressBar value={progress} />

            {q && (
              <QuestionCard
                question={q}
                index={currentIndex}
                total={questions.length}
                displayLang={displayLang}
                onToggleLang={setDisplayLang}
                selectedAnswer={answers[q.id]}
                onSelectOption={handleAnswer}
                isMarkedForReview={isMarked}
                onToggleReview={() => { if (q) onToggleReview(q.id); }}
                visualNode={visualNode}
                diagramNode={diagramNode}
              />
            )}

            <QuestionNavigator
              isFirstQuestion={isFirstQuestion}
              isLastQuestion={isLastQuestion}
              hasAnswer={hasAnswer}
              isMarkedForReview={isMarked}
              onPrev={onPrev}
              onNext={onNext}
              onClear={handleClear}
              onSubmit={() => setShowSubmitModal(true)}
            />
          </div>
        </section>

        <StatusBoard
          questions={questions}
          currentIdx={currentIndex}
          selectedAnswers={answers as Record<string, string | null>}
          markedForReview={markedSet}
          visitedQuestions={visitedSet}
          fullscreenViolations={0}
          onJumpTo={onJumpToQuestion}
          stats={examStats}
        />
      </main>

      <MobileQuestionStrip
        questions={questions}
        currentIdx={currentIndex}
        selectedAnswers={answers as Record<string, string | null>}
        markedForReview={markedSet}
        visitedQuestions={visitedSet}
        onJumpTo={onJumpToQuestion}
      />

      <MobileActionBar
        isFirstQuestion={isFirstQuestion}
        isLastQuestion={isLastQuestion}
        hasAnswer={hasAnswer}
        canProceed={canProceed}
        onPrev={onPrev}
        onNext={onNext}
        onClear={handleClear}
        onSubmit={() => setShowSubmitModal(true)}
      />

      <SubmitExamModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={() => { setShowSubmitModal(false); onSubmit(); }}
        answeredCount={examStats.answered}
        totalCount={questions.length}
        notVisitedCount={examStats.notVisited}
      />
    </div>
  );
};
