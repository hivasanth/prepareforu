import { AlertCircle } from 'lucide-react'
import { UserSelectionTabs } from '../../components/user/UserSelectionTabs'
import {
  PageContainer, Stack, SectionReveal,
  ErrorContainer, RetryButton, H2, Body,
} from '../../components/common/AntigravityUI'
import { EmptyState, GridSkeleton } from '../../components/common/SharedComponents'
import { useTopics } from '../../components/user/topics/useTopics'
import { TopicReader } from '../../components/user/topics/TopicReader'
import { TopicListView } from '../../components/user/topics/TopicListView'

export default function UserTopics() {
  const {
    topics,
    isLoading,
    activeTopic,
    activeIndex,
    errorState,
    pageError,
    retryError,
    selectedExam,
    selectedPaper,
    selectedSubject,
    isContextValid,
    setSelectedExam,
    setSelectedPaper,
    setSelectedSubject,
    openTopic,
    goNext,
    goPrev,
    setActiveTopic,
  } = useTopics()

  return (
    <PageContainer>
      <Stack gap="lg">
        <SectionReveal className="w-full">
          <UserSelectionTabs
            selectedExam={selectedExam}      setSelectedExam={setSelectedExam}
            selectedPaper={selectedPaper}    setSelectedPaper={setSelectedPaper}
            selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject}
            hideAll={true}
            flattenAppsc={true}
            bare
          />
        </SectionReveal>

        {errorState === 'error' && pageError ? (
          <SectionReveal>
            <ErrorContainer category={pageError.category} severity={pageError.severity}>
              <H2>{pageError.title}</H2>
              <Body>{pageError.message}</Body>
              {pageError.retryable && (
                <RetryButton onRetry={retryError} />
              )}
            </ErrorContainer>
          </SectionReveal>
        ) : !isContextValid && topics.length === 0 && !activeTopic ? (
          <SectionReveal>
            <EmptyState
              icon="📖"
              title="Select a Subject"
              subtitle="Pick an Exam, Paper, and Subject above to start reading topics."
            />
          </SectionReveal>
        ) : isLoading && topics.length === 0 && !activeTopic ? (
          <SectionReveal>
            <GridSkeleton count={4} columns="grid-cols-1" />
          </SectionReveal>
        ) : activeTopic ? (
          <SectionReveal>
            <TopicReader
              topic={activeTopic}
              topics={topics}
              currentIndex={activeIndex}
              onBack={() => setActiveTopic(null)}
              onNext={goNext}
              onPrev={goPrev}
            />
          </SectionReveal>
        ) : topics.length === 0 ? (
          <SectionReveal>
            <EmptyState
              icon={<AlertCircle size={40} className="text-text-secondary opacity-20" />}
              title="No topics found for this subject yet."
              subtitle="Check back soon — the admin is still adding content."
            />
          </SectionReveal>
        ) : (
          <SectionReveal>
            <TopicListView
              selectedSubject={selectedSubject}
              topics={topics}
              onTopicClick={openTopic}
            />
          </SectionReveal>
        )}
      </Stack>
    </PageContainer>
  )
}
