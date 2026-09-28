import { motion, AnimatePresence } from 'framer-motion';
import { Layers, BookOpen, Send, X } from 'lucide-react';
import { Alert, Button, IconButton } from '../../components/common/AntigravityUI';
import { Spinner } from '../../components/common/Spinner';
import { ExamPageError } from '../../components/exam/ExamPageError';
import { MODAL_TRANSITION } from '../../components/common/AntigravityMotion';

import { useActiveExam } from '../../components/exam/useActiveExam';
import { ExamTimer } from '../../components/ExamTimer';
import { LanguageSelectionScreen } from '../../components/exam';
import {
  ExamLayout,
  ExamHeader,
  QuestionCard,
  QuestionNavigator,
  MobileActionBar,
  StatusBoard,
  SubmitExamModal,
} from '../../components/exam';

export default function ActiveExamPage() {
  const {
    phase, loading, error,
    paper, attempt, questions,
    displayLang, setDisplayLang,
    currentIdx, currentQuestion, isFirstQuestion, isLastQuestion,
    hasAnswer, isMarked, canProceed,
    goToQuestion, handleNext, handleSkip, handlePrev,
    selectedAnswers, handleOptionSelect, clearAnswer, toggleMarkForReview,
    visitedQuestions, markedForReview,
    examStats,
    isSubmitting, isAutoSubmitting, isSubmitModalOpen, setIsSubmitModalOpen,
    showStatusBoard, setShowStatusBoard,
    finalSubmit, onTimeUp,
    showFullscreenPrompt, fullscreenViolations, requestFullscreen,
    showSubjectName,
    visualNode, diagramNode,
    examBanner, dismissExamBanner, showExamBanner,
    teluguAvailable, handleLanguageSelect,
    initExam,
    navigate,
  } = useActiveExam();

  if (error) {
    return (
      <ExamPageError
        title="Failed to load exam"
        message={error}
        onRetry={() => initExam()}
        onBack={() => navigate('/exams')}
      />
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-app-bg flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-text-secondary text-[10px] uppercase font-bold tracking-widest animate-pulse">
          {phase === 'lang_select' ? 'Creating secure session' : 'Initializing secure environment'}
        </p>
      </div>
    );
  }

  if (phase === 'lang_select' && paper) {
    return (
      <LanguageSelectionScreen
        paperName={paper.paper_name}
        teluguAvailable={teluguAvailable}
        onSelect={handleLanguageSelect}
      />
    );
  }

  if (!attempt || !questions.length || !currentQuestion) {
    return (
      <ExamPageError
        title="Unable to load exam"
        message="The exam could not be loaded. Please try again."
        onRetry={() => initExam()}
        onBack={() => navigate('/exams')}
      />
    );
  }

  return (
    <ExamLayout
      showFullscreenPrompt={showFullscreenPrompt}
      onRequestFullscreen={requestFullscreen}
    >
      <ExamHeader
        title={paper?.paper_name || ''}
        subtitle={showSubjectName && currentQuestion?.subject_name ? (
          <span className="flex items-center gap-1.5">
            <BookOpen size={12} />
            {currentQuestion.subject_name}
          </span>
        ) : undefined}
        timerSlot={
          <ExamTimer
            attemptId={attempt.id}
            durationMinutes={paper?.duration_minutes || 0}
            startedAt={attempt.started_at}
            onTimeUp={onTimeUp}
            onSecurityNotice={(message) => showExamBanner(message, 'warning')}
          />
        }
        leftActions={
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => setShowStatusBoard(prev => !prev)}
            aria-label="Toggle status board"
            className="hidden sm:flex"
          >
            <Layers size={18} />
          </IconButton>
        }
        rightActions={
          <Button variant="primary" size="sm" onClick={() => setIsSubmitModalOpen(true)}>
            <Send size={14} />
            Finish
          </Button>
        }
      />

      {examBanner && (
        <div className="px-4 sm:px-6 pt-3 flex items-start gap-2 z-10">
          <Alert
            variant={examBanner.kind === 'error' ? 'error' : 'warning'}
            title={examBanner.kind === 'error' ? 'Action failed' : 'Security notice'}
            className="flex-1"
          >
            {examBanner.message}
          </Alert>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={dismissExamBanner}
            aria-label="Dismiss exam notice"
          >
            <X size={16} />
          </IconButton>
        </div>
      )}

      {showStatusBoard && (
        <div
          className="fixed inset-0 z-30 bg-app-bg/60 backdrop-blur-sm md:hidden"
          onClick={() => setShowStatusBoard(false)}
        />
      )}

      <main className="flex-1 flex overflow-hidden relative max-w-[1360px] mx-auto w-full">
        <section className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-6 md:py-8 custom-scrollbar scroll-smooth min-w-0">
          <div className="flex flex-col gap-6 w-full">
            <QuestionCard
              question={currentQuestion}
              index={currentIdx}
              total={questions.length}
              displayLang={displayLang}
              onToggleLang={setDisplayLang}
              selectedAnswer={selectedAnswers[currentQuestion.id]}
              onSelectOption={handleOptionSelect}
              isMarkedForReview={isMarked}
              onToggleReview={toggleMarkForReview}
              visualNode={visualNode}
              diagramNode={diagramNode}
            />

            <QuestionNavigator
              isFirstQuestion={isFirstQuestion}
              isLastQuestion={isLastQuestion}
              hasAnswer={hasAnswer}
              isMarkedForReview={isMarked}
              canProceed={canProceed}
              onPrev={handlePrev}
              onNext={handleNext}
              onClear={clearAnswer}
              onSubmit={() => setIsSubmitModalOpen(true)}
              onSkip={handleSkip}
            />
          </div>
        </section>

        <StatusBoard
          questions={questions}
          currentIdx={currentIdx}
          selectedAnswers={selectedAnswers}
          markedForReview={markedForReview}
          visitedQuestions={visitedQuestions}
          fullscreenViolations={fullscreenViolations}
          onJumpTo={goToQuestion}
          stats={examStats}
          isVisible={showStatusBoard}
          onToggleVisibility={() => setShowStatusBoard(prev => !prev)}
        />
      </main>

      <MobileActionBar
        isFirstQuestion={isFirstQuestion}
        isLastQuestion={isLastQuestion}
        hasAnswer={hasAnswer}
        canProceed={canProceed}
        onPrev={handlePrev}
        onNext={handleNext}
        onClear={clearAnswer}
        onSubmit={() => setIsSubmitModalOpen(true)}
        onSkip={handleSkip}
      />

      <SubmitExamModal
        isOpen={isSubmitModalOpen}
        onClose={() => !isAutoSubmitting && setIsSubmitModalOpen(false)}
        onConfirm={finalSubmit}
        answeredCount={examStats.answered}
        notVisitedCount={examStats.notVisited}
        markedCount={examStats.marked}
        totalCount={examStats.total}
        isAutoSubmit={isAutoSubmitting}
      />

      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_TRANSITION}
            className="fixed inset-0 z-toast bg-app-bg/80 backdrop-blur-2xl flex flex-col items-center justify-center"
          >
            <Spinner size="lg" />
            <h3 className="text-2xl font-black text-text-primary uppercase tracking-[0.2em] mt-8">Submitting Your Answers</h3>
            <p className="text-text-secondary font-bold text-[10px] uppercase tracking-widest mt-2 animate-pulse">Encrypting &amp; Uploading Results</p>
          </motion.div>
        )}
      </AnimatePresence>
    </ExamLayout>
  );
}
