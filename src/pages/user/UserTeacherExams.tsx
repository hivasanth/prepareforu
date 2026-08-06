import { useNavigate } from 'react-router-dom'
import {
  LoadingSkeleton,
  ErrorState,
  EmptyState,
} from '../../components/common/SharedComponents'
import {
  PageContainer,
  Stack,
  ErrorContainer,
  RetryButton,
  H2,
  Body,
} from '../../components/common/AntigravityUI'
import { ToastContainer, useToast } from '../../hooks/useToast'
import { TeacherLeaderboardModal } from '../../components/user/TeacherLeaderboardModal'
import { useTeacherExams, TeacherExamCard, TeacherExamFilterBar } from '../../components/user/educator-exams'

export default function UserTeacherExams() {
  const navigate = useNavigate()
  const { toasts } = useToast()

  const {
    user, authLoading,
    activeTab, setActiveTab,
    filteredExams,
    loading, now,
    errorState, pageError, retryError,
    selectedMonth, setSelectedMonth,
    monthsList,
    selectedLeaderboardExam, setSelectedLeaderboardExam,
    isStarting,
    handleStartTeacherExam,
  } = useTeacherExams()

  if (authLoading) {
    return (
      <PageContainer>
        <Stack gap={16}>
          <div className="flex justify-center w-full">
            <LoadingSkeleton height={48} width={320} borderRadius={12} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {[1, 2, 3].map(i => <LoadingSkeleton key={i} height={240} borderRadius={16} />)}
          </div>
        </Stack>
      </PageContainer>
    )
  }

  if (!user?.coupon_code_used) {
    return (
      <PageContainer>
        <div className="py-12">
          <ErrorState
            icon="🔒"
            title="Educator Portal Locked"
            message="Access restricted to students with valid educator codes."
            onRetry={() => navigate('/dashboard')}
          />
        </div>
      </PageContainer>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <LoadingSkeleton key={i} height={300} borderRadius={16} />)}
            </div>
          ) : errorState === 'error' && pageError ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map(exam => (
                <TeacherExamCard
                  key={exam.id}
                  exam={exam}
                  activeTab={activeTab}
                  now={now}
                  isStarting={isStarting}
                  onStart={handleStartTeacherExam}
                  onLeaderboard={setSelectedLeaderboardExam}
                />
              ))}
            </div>
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
      <ToastContainer toasts={toasts} />
    </PageContainer>
  )
}
