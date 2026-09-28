import { useAuth } from '../../context/AuthContext'
import {
  PageContainer,
  Stack,
  ErrorContainer,
  RetryButton,
  H2,
  Body,
} from '../../components/common/AntigravityUI'
import { useUserExams, ExamPaperGrid, ExamGridSkeleton, ExamSelectionSkeleton } from '../../components/user/full-exams'

export default function UserExams() {
  const { loading: authLoading } = useAuth()

  const {
    loading,
    errorState,
    pageError,
    retryError,
    isRetrying,
    isAppsc,
    groupOptions,
    activeGroup,
    handleGroupChange,
    displayedPapers,
    availabilityMap,
    isStarting,
    handleStartExam,
    currentIndex,
    handleScroll,
    scrollToCard,
    scrollContainerRef,
  } = useUserExams()

  /* EX-3: only APPSC users get the Exam Selection tabs, so the selection
     skeleton must not render for non-APPSC users. While auth is still loading
     the identity/exam selection is unknown, so keep the original structure
     (selection + grid) until the user type is known. */
  const renderLoadingContent = () => (
    <PageContainer>
      <Stack gap="lg">
        {(authLoading || isAppsc) && <ExamSelectionSkeleton />}
        <ExamGridSkeleton />
      </Stack>
    </PageContainer>
  )

  if (authLoading) {
    return renderLoadingContent()
  }

  if (errorState === 'error' && pageError) {
    return (
      <PageContainer>
        <ErrorContainer category={pageError.category} severity={pageError.severity}>
          <H2>{pageError.title}</H2>
          <Body>{pageError.message}</Body>
          {pageError.retryable && (
            <RetryButton onRetry={retryError} loading={isRetrying} />
          )}
        </ErrorContainer>
      </PageContainer>
    )
  }

  if (loading) {
    return renderLoadingContent()
  }

  return (
    <PageContainer>
      <Stack gap="lg">
        <ExamPaperGrid
          isAppsc={isAppsc}
          groupOptions={groupOptions}
          activeGroup={activeGroup}
          onGroupChange={handleGroupChange}
          displayedPapers={displayedPapers}
          availabilityMap={availabilityMap}
          isStarting={isStarting}
          onStartExam={handleStartExam}
          currentIndex={currentIndex}
          onScroll={handleScroll}
          onScrollToCard={scrollToCard}
          scrollContainerRef={scrollContainerRef}
        />
      </Stack>
    </PageContainer>
  )
}
