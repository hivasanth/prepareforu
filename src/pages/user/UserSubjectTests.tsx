import { lazy, Suspense } from 'react';
import {
  PageContainer,
  ErrorContainer,
  RetryButton,
  Button,
  H2,
  Body,
} from '../../components/common/AntigravityUI';
import { SubjectTestsLoadingSkeleton } from '../../components/user/subject-tests/SubjectTestsLoadingSkeleton';
import { SubjectConfigSkeleton } from '../../components/user/subject-tests/SubjectConfigSkeleton';
import { useSubjectTests } from '../../components/user/subject-tests/useSubjectTests';

const SubjectPortalView = lazy(() => import('../../components/user/subject-tests/SubjectPortalView').then(m => ({ default: m.SubjectPortalView })));
const SubjectConfigView = lazy(() => import('../../components/user/subject-tests/SubjectConfigView').then(m => ({ default: m.SubjectConfigView })));

export default function UserSubjectTests() {
  const {
    loading,
    paperLoading,
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

  if (loading || paperLoading) return <SubjectTestsLoadingSkeleton isAppsc={isAppsc} />;

  if (errorState === 'error' && pageError) {
    return (
      <PageContainer>
        <ErrorContainer category={pageError.category} severity={pageError.severity}>
          <H2>{pageError.title}</H2>
          <Body>{pageError.message}</Body>
          {pageError.retryable && (
            <RetryButton onRetry={retryError} />
          )}
          {pageError.category === 'business' && (
            <Button fullWidth variant="primary" size="xl" onClick={handleBack} className="mt-4">
              Back to Subject List
            </Button>
          )}
        </ErrorContainer>
      </PageContainer>
    );
  }

  return (
    <>
      {view === 'PORTAL' && (
        <Suspense fallback={<SubjectTestsLoadingSkeleton isAppsc={isAppsc} />}>
          <PageContainer className="py-6 md:py-10">
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
          </PageContainer>
        </Suspense>
      )}

      {view === 'CONFIG' && selectedSubject && (
        <Suspense fallback={<SubjectConfigSkeleton />}>
          <PageContainer className="py-6 md:py-10">
            <SubjectConfigView
              selectedSubject={selectedSubject}
              subjectCounts={subjectCounts}
              questionCount={questionCount}
              setQuestionCount={setQuestionCount}
              isLaunching={isLaunching}
              onLaunch={handleLaunch}
              onBack={handleBack}
            />
          </PageContainer>
        </Suspense>
      )}
    </>
  );
}
