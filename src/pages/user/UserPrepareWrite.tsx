import { Suspense, lazy } from 'react'
import { ExamLayout } from '../../components/exam'
import { GridSkeleton } from '../../components/common/SharedComponents'
import {
  PageContainer,
  PageTransition,
  ErrorContainer,
  RetryButton,
  H2,
  Body,
} from '../../components/common/AntigravityUI'
import { ToastContainer } from '../../hooks/useToast'
import { usePrepareWrite } from '../../components/user/prepare-write'

const SelectionView = lazy(() => import('../../components/user/prepare-write/SelectionView').then(m => ({ default: m.SelectionView })))
const PreparationView = lazy(() => import('../../components/user/prepare-write/PreparationView').then(m => ({ default: m.PreparationView })))
const ExamView = lazy(() => import('../../components/user/prepare-write/ExamView').then(m => ({ default: m.ExamView })))
const ResultView = lazy(() => import('../../components/user/prepare-write/ResultView').then(m => ({ default: m.ResultView })))
const ReviewView = lazy(() => import('../../components/user/prepare-write/ReviewView').then(m => ({ default: m.ReviewView })))

export default function UserPrepareWrite() {
  const {
    userExamSelection,
    authLoading,
    loading,
    actionLoading,
    errorState,
    pageError,
    retryError,
    toasts,
    state,
    exams,
    papers,
    availabilityMap,
    visibleCount,
    setVisibleCount,
    handleExamChange,
    startPreparation,
    startExam,
    handleAnswer,
    handleToggleReview,
    submitExam,
    exitSession,
    handlePaperSelect,
    handleJumpToQuestion,
    handlePrev,
    handleNextOrSubmit,
    goToReview,
    goToResult,
    clearSession,
  } = usePrepareWrite()

  if (errorState === 'error' && pageError) {
    return (
      <PageContainer>
        <ErrorContainer category={pageError.category} severity={pageError.severity}>
          <H2>{pageError.title}</H2>
          <Body>{pageError.message}</Body>
          {pageError.retryable && (
            <RetryButton onRetry={retryError} />
          )}
        </ErrorContainer>
      </PageContainer>
    )
  }

  const renderCurrentView = () => {
    switch (state.view) {
      case 'SELECTION':
        return (
          <SelectionView
            userSelection={userExamSelection}
            exams={exams}
            papers={papers}
            selectedExamId={state.selectedExamId}
            selectedPaper={state.selectedPaper}
            availabilityMap={availabilityMap}
            loading={authLoading || loading}
            actionLoading={actionLoading}
            error={null}
            onExamChange={handleExamChange}
            onPaperSelect={handlePaperSelect}
            onStartPreparation={startPreparation}
            onRetry={() => state.selectedExamId && handleExamChange(state.selectedExamId)}
          />
        )
      case 'PREPARATION':
        return (
          <PreparationView
            paper={state.selectedPaper}
            questions={state.questions}
            visibleCount={visibleCount}
            onExit={exitSession}
            onStartExam={startExam}
            onLoadMore={() => setVisibleCount(prev => prev + 10)}
          />
        )
      case 'EXAM':
        return (
          <ExamView
            paper={state.selectedPaper}
            questions={state.questions}
            currentIndex={state.currentIndex}
            answers={state.answers}
            markedForReview={state.markedForReview}
            startTime={state.startTime}
            onExit={exitSession}
            onSubmit={submitExam}
            onAnswer={handleAnswer}
            onToggleReview={handleToggleReview}
            onJumpToQuestion={handleJumpToQuestion}
            onPrev={handlePrev}
            onNext={handleNextOrSubmit}
          />
        )
      case 'RESULT':
        return (
          <ResultView
            questions={state.questions}
            answers={state.answers}
            durationSeconds={state.startTime && state.endTime ? Math.floor((state.endTime - state.startTime) / 1000) : undefined}
            onReview={goToReview}
            onNewSession={clearSession}
          />
        )
      case 'REVIEW':
        return (
          <ReviewView
            questions={state.questions}
            answers={state.answers}
            durationSeconds={state.startTime && state.endTime ? Math.floor((state.endTime - state.startTime) / 1000) : undefined}
            onBackToResult={goToResult}
            onCloseReview={clearSession}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <Suspense fallback={<GridSkeleton count={4} height={120} columns="grid-cols-1" />}>
        {state.view === 'EXAM' ? (
          <ExamLayout>
            {renderCurrentView()}
          </ExamLayout>
        ) : state.view === 'REVIEW' ? (
          renderCurrentView()
        ) : (
          <PageContainer>
            <PageTransition>
              {renderCurrentView()}
            </PageTransition>
          </PageContainer>
        )}
      </Suspense>
      <ToastContainer toasts={toasts} />
    </>
  )
}
