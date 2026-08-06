import { lazy, Suspense } from 'react';
import { LoadingSkeleton } from '../../components/common/SharedComponents';
import {
  PageContainer,
  ErrorContainer,
  RetryButton,
  H2,
  Body,
} from '../../components/common/AntigravityUI';
import { PortalLoadingSkeleton } from '../../components/common/PortalLoadingSkeleton';
import { useSubjectTests } from '../../components/user/subject-tests/useSubjectTests';

const SubjectPortalView = lazy(() => import('../../components/user/subject-tests/SubjectPortalView').then(m => ({ default: m.SubjectPortalView })));
const SubjectConfigView = lazy(() => import('../../components/user/subject-tests/SubjectConfigView').then(m => ({ default: m.SubjectConfigView })));

export default function UserSubjectTests() {
  const {
    loading,
    errorState,
    pageError,
    retryError,
    view,
    isAppsc,
    groupOptions,
    papers,
    activeGroup,
    selectedPaperId,
    subjects,
    subjectCounts,
    selectedSubject,
    questionCount,
    minQuestions,
    isLaunching,
    handleExamChange,
    handlePaperChange,
    handleSubjectClick,
    setQuestionCount,
    handleLaunch,
    handleBack,
  } = useSubjectTests();

  if (loading) return <PortalLoadingSkeleton />;

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
    );
  }

  return (
    <PageContainer>
      {view === 'PORTAL' && (
        <Suspense fallback={<LoadingSkeleton height={500} borderRadius={24} />}>
          <SubjectPortalView
            isAppsc={isAppsc}
            groupOptions={groupOptions}
            papers={papers}
            activeGroup={activeGroup}
            selectedPaperId={selectedPaperId}
            onExamChange={handleExamChange}
            onPaperChange={handlePaperChange}
            subjects={subjects}
            subjectCounts={subjectCounts}
            minQuestions={minQuestions}
            onSubjectClick={handleSubjectClick}
          />
        </Suspense>
      )}

      {view === 'CONFIG' && selectedSubject && (
        <Suspense fallback={<LoadingSkeleton height={400} borderRadius={24} />}>
          <SubjectConfigView
            selectedSubject={selectedSubject}
            subjectCounts={subjectCounts}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
            isLaunching={isLaunching}
            onLaunch={handleLaunch}
            onBack={handleBack}
          />
        </Suspense>
      )}
    </PageContainer>
  );
}
