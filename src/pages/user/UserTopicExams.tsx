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
import { useTopicExams } from '../../components/user/topic-exams/useTopicExams';

const TopicPortalView = lazy(() => import('../../components/user/topic-exams/TopicPortalView').then(m => ({ default: m.TopicPortalView })));
const TopicConfigView = lazy(() => import('../../components/user/topic-exams/TopicConfigView').then(m => ({ default: m.TopicConfigView })));

export default function UserTopicExams() {
  const {
    loading,
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
    <PageContainer className="py-6 md:py-10">
      {view === 'PORTAL' && (
        <Suspense fallback={<LoadingSkeleton height={500} borderRadius={24} />}>
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
        </Suspense>
      )}

      {view === 'CONFIG' && selectedTopic && (
        <Suspense fallback={<LoadingSkeleton height={400} borderRadius={24} />}>
          <TopicConfigView
            selectedSubject={`${selectedSubject} - ${selectedTopic}`}
            subjectCounts={{ [`${selectedSubject} - ${selectedTopic}`]: topicCounts[selectedTopic] || 0 }}
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
