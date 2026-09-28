import { useNavigate } from 'react-router-dom'
import {
  LoadingSkeleton,
  EmptyState,
} from '../../components/common/SharedComponents'
import { Skeleton } from '../../components/common/Skeleton'
import {
  PageContainer,
  Stack,
  ErrorContainer,
  RetryButton,
  H2,
  Body,
} from '../../components/common/AntigravityUI'
import { Alert } from '../../components/common/Alert'
import { TeacherLeaderboardModal } from '../../components/user/TeacherLeaderboardModal'
import { useTeacherExams, TeacherExamCard, TeacherExamFilterBar, EducatorLinkCard } from '../../components/user/educator-exams'

function EducatorExamsLoadingSkeleton() {
  return (
    <PageContainer>
      <div role="status" aria-live="polite" aria-label="Loading educator exams" className="w-full">
        <Stack gap={16}>
          <div className="flex justify-center w-full">
            <LoadingSkeleton height={48} width={320} borderRadius={12} />
          </div>
          <div className="flex justify-center w-full mb-4">
            <LoadingSkeleton height={40} width={240} borderRadius={20} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                type="card"
                className="h-[220px]"
                decorative
              />
            ))}
          </div>
        </Stack>
      </div>
    </PageContainer>
  )
}

function EducatorExamsDataSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading educator exams" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton
          key={i}
          type="card"
          className="h-[220px]"
          decorative
        />
      ))}
    </div>
  )
}

export default function UserTeacherExams() {
  const navigate = useNavigate()

  const {
    user, authLoading,
    activeTab, setActiveTab,
    filteredExams,
    loading,
    errorState, pageError, retryError,
    selectedMonth, setSelectedMonth,
    monthsList,
    selectedLeaderboardExam, setSelectedLeaderboardExam,
    isStarting,
    handleStartTeacherExam,
  } = useTeacherExams()

  if (authLoading) {
    return <EducatorExamsLoadingSkeleton />
  }

  if (!user?.coupon_code_used) {
    return (
      <EducatorLinkCard
        onLinked={() => navigate('/educator-exams')}
      />
    )
  }

  return (
    <PageContainer className="py-2 md:py-4">
      <Stack gap={16}>
        <TeacherExamFilterBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          monthsList={monthsList}
        />

        <div className="w-full">
          {loading ? (
            <EducatorExamsDataSkeleton />
          ) : errorState === 'error' && pageError && filteredExams.length === 0 ? (
            // Full-page error only when there is no last-good data. M-3: a
            // refresh/start failure must never replace the grid.
            <ErrorContainer category={pageError.category} severity={pageError.severity}>
              <H2>{pageError.title}</H2>
              <Body>{pageError.message}</Body>
              {pageError.retryable && (
                <RetryButton onRetry={retryError} />
              )}
            </ErrorContainer>
          ) : filteredExams.length === 0 ? (
            <EmptyState
              title={activeTab === 'ended' ? 'No Completed Exams' : `No ${activeTab} Exams`}
              subtitle={activeTab === 'ended'
                ? `You don't have any completed assessments from your teacher in ${monthsList.find(m => m.id === selectedMonth)?.name || 'this month'}.`
                : `You don't have any ${activeTab} assessments from your teacher at the moment.`
              }
            />
          ) : (
            <>
              {errorState === 'error' && pageError && (
                // Non-destructive inline banner above the grid — data stays
                // visible and the user can retry without losing it.
                <Alert variant="warning" className="mb-4">
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <Body className="text-[13px]">{pageError.message}</Body>
                    {pageError.retryable && (
                      <RetryButton onRetry={retryError} size="sm" />
                    )}
                  </div>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExams.map(exam => (
                  <TeacherExamCard
                    key={exam.id}
                    exam={exam}
                    activeTab={activeTab}
                    isStarting={isStarting}
                    onStart={handleStartTeacherExam}
                    onLeaderboard={setSelectedLeaderboardExam}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {selectedLeaderboardExam && user && (
          <TeacherLeaderboardModal
            exam={selectedLeaderboardExam}
            user={user}
            onClose={() => setSelectedLeaderboardExam(null)}
          />
        )}
      </Stack>
    </PageContainer>
  )
}
