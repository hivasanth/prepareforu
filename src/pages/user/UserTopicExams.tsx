import { lazy, Suspense } from 'react';
import {
  PageContainer,
  ErrorContainer,
  RetryButton,
  Button,
  H2,
  Body,
} from '../../components/common/AntigravityUI';
import { TopicExamsLoadingSkeleton } from '../../components/user/topic-exams/TopicExamsLoadingSkeleton';
import { SubjectConfigSkeleton } from '../../components/user/subject-tests/SubjectConfigSkeleton';
import { useTopicExams } from '../../components/user/topic-exams/useTopicExams';

const TopicPortalView = lazy(() => import('../../components/user/topic-exams/TopicPortalView').then(m => ({ default: m.TopicPortalView })));
const TopicConfigView = lazy(() => import('../../components/user/topic-exams/TopicConfigView').then(m => ({ default: m.TopicConfigView })));

export default function UserTopicExams() {
  const {
    loading,
    paperLoading,
    topicsLoading,
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
    selectedSubject,
    topics,
    topicCounts,
    selectedTopic,
    questionCount,
    minQuestions,
    isLaunching,
    handleExamChange,
    handlePaperChange,
    handleSubjectChange,
    handleTopicClick,
    setQuestionCount,
    handleLaunch,
    handleBack,
  } = useTopicExams();

  const isRetrying = errorState === 'retrying';

  // UX-1: keep the error surface mounted while a retry is in flight so the
  // RetryButton renders its in-button loading indication (disabled + spinner +
  // "Retrying…") until the retry resolves, then swap to content (success) or
  // re-enable (failure). Checked before the loading skeleton so the error
  // surface wins during retry instead of unmounting to a skeleton.
  if ((errorState === 'error' || errorState === 'retrying') && pageError) {
    return (
      <PageContainer>
        <ErrorContainer category={pageError.category} severity={pageError.severity}>
          <H2>{pageError.title}</H2>
          <Body>{pageError.message}</Body>
          {pageError.retryable && (
            <RetryButton onRetry={retryError} loading={isRetrying} />
          )}
          {pageError.category === 'business' && (
            <Button fullWidth variant="primary" size="xl" onClick={handleBack} className="mt-4">
              Back to Topic List
            </Button>
          )}
        </ErrorContainer>
      </PageContainer>
    );
  }

  if (loading || paperLoading) return <TopicExamsLoadingSkeleton />;

  return (
    <>
      {view === 'PORTAL' && (
        <Suspense fallback={<TopicExamsLoadingSkeleton />}>
          <PageContainer className="py-6 md:py-10">
            <TopicPortalView
              isAppsc={isAppsc}
              groupOptions={groupOptions}
              papers={papers}
              activeGroup={activeGroup}
              selectedPaperId={selectedPaperId}
              onExamChange={handleExamChange}
              onPaperChange={handlePaperChange}
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSubjectChange={handleSubjectChange}
              topics={topics}
              topicCounts={topicCounts}
              minQuestions={minQuestions}
              onTopicClick={handleTopicClick}
              topicsLoading={topicsLoading}
            />
          </PageContainer>
        </Suspense>
      )}

      {view === 'CONFIG' && selectedTopic && (
        <Suspense
          fallback={
            <PageContainer className="py-6 md:py-10">
              <SubjectConfigSkeleton />
            </PageContainer>
          }
        >
          <PageContainer className="py-6 md:py-10">
            <TopicConfigView
              selectedSubject={`${selectedSubject} - ${selectedTopic.topic_en}`}
              subjectCounts={{ [`${selectedSubject} - ${selectedTopic.topic_en}`]: topicCounts[selectedTopic.topic_en] || 0 }}
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
