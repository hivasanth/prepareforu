import { Suspense, lazy } from 'react'
import { CheckCircle2 } from 'lucide-react'
import {
  PageContainer,
  PageTransition,
  ErrorContainer,
  RetryButton,
  H2,
  Body,
  Alert,
} from '../../components/common/AntigravityUI'
import {
  usePrepareWrite,
  SelectionViewSkeleton,
  PreparationViewSkeleton,
} from '../../components/user/prepare-write'

const SelectionView = lazy(() => import('../../components/user/prepare-write/SelectionView').then(m => ({ default: m.SelectionView })))
const PreparationView = lazy(() => import('../../components/user/prepare-write/PreparationView').then(m => ({ default: m.PreparationView })))

export default function UserPrepareWrite() {
  const {
    userExamSelection,
    authLoading,
    loading,
    actionLoading,
    errorState,
    pageError,
    retryError,
    notice,
    state,
    exams,
    papers,
    availabilityMap,
    visibleCount,
    setVisibleCount,
    handleExamChange,
    startPreparation,
    startRealExam,
    exitSession,
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
  // Mirrors SelectionView.tsx — the tabs row renders only for APPSC selections.
  const showTabs = userExamSelection === 'APPSC_GROUPS' || userExamSelection === 'APPSC';

  switch (state.view) {
    case 'SELECTION':
      // On the initial load (authLoading=true OR first load with no exams yet),
      // show the full-page skeleton. On exam-change reloads, keep the
      // SelectionContainer > Tabs row mounted and only the paper grid
      // shows the skeleton (mirrors /exams, /subject-tests, /topic-exams).
      if (authLoading || (loading && exams.length === 0)) {
        return <SelectionViewSkeleton count={8} showTabs={showTabs} />;
      }
      return (
        <Suspense fallback={<SelectionViewSkeleton count={8} showTabs={showTabs} />}>
          <SelectionView
            userSelection={userExamSelection}
            exams={exams}
            papers={papers}
            selectedExamId={state.selectedExamId}
            selectedPaper={state.selectedPaper}
            availabilityMap={availabilityMap}
            loading={loading}
            actionLoading={actionLoading}
            onExamChange={handleExamChange}
            onStartPreparation={startPreparation}
          />
        </Suspense>
      );
    case 'PREPARATION':
      // actionLoading=true means we are transitioning from SELECTION into
      // PREPARATION (the locked question set is being built server-side).
      if (actionLoading && state.questions.length === 0) return <PreparationViewSkeleton />;
      return (
        <Suspense fallback={<PreparationViewSkeleton />}>
          <PreparationView
            paper={state.selectedPaper}
            questions={state.questions}
            questionCount={state.questionCount}
            expiresAt={state.expiresAt}
            visibleCount={visibleCount}
            actionLoading={actionLoading}
            onExit={exitSession}
            onStartRealExam={startRealExam}
            onLoadMore={() => setVisibleCount(prev => prev + 10)}
          />
        </Suspense>
      );
    default:
      return null;
  }
};

return (
  <PageContainer>
    <PageTransition>
      {renderCurrentView()}
      {state.view === 'SELECTION' && (
        <div className="mt-6">
          <button
            type="button"
            onClick={clearSession}
            className="text-[11px] font-bold text-text-secondary/60 hover:text-text-primary uppercase tracking-widest transition-colors"
          >
            Reset preparation
          </button>
        </div>
      )}
      {notice && (
        <Alert variant="success" icon={CheckCircle2} title="Success" className="w-full">
          {notice}
        </Alert>
      )}
    </PageTransition>
  </PageContainer>
);
}