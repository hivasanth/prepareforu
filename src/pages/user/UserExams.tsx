import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LoadingSkeleton, ErrorState } from '../../components/common/SharedComponents'
import {
  PageContainer,
  Stack,
  ErrorContainer,
  RetryButton,
  H2,
  Body,
} from '../../components/common/AntigravityUI'
import { useUserExams, ExamPaperGrid } from '../../components/user/full-exams'

export default function UserExams() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const {
    loading,
    errorState,
    pageError,
    retryError,
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

  if (authLoading) {
    return (
      <PageContainer>
        <Stack gap="lg">
          <div className="flex justify-center">
            <LoadingSkeleton height={44} width={320} borderRadius={14} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <LoadingSkeleton key={i} height={320} borderRadius={18} />
            ))}
          </div>
        </Stack>
      </PageContainer>
    )
  }

  if (!user?.exam_selection) {
    return (
      <PageContainer>
        <div className="py-12">
          <ErrorState
            icon="📋"
            title="No Exam Selection"
            message="You haven't selected any exams yet. Please visit your profile to choose your exams."
            onRetry={() => navigate('/dashboard')}
          />
        </div>
      </PageContainer>
    )
  }

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

  if (loading) {
    return (
      <PageContainer>
        <Stack gap="lg">
          <div className="flex justify-center">
            <LoadingSkeleton height={44} width={320} borderRadius={14} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <LoadingSkeleton key={i} height={320} borderRadius={18} />
            ))}
          </div>
        </Stack>
      </PageContainer>
    )
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
