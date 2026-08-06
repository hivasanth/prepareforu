import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  PageContainer,
  Stack,
  PrimaryButton,
} from '../../components/common/AntigravityUI'
import { WelcomeBanner } from '../../components/user/WelcomeBanner'
import { useUserDashboard } from '../../components/user/dashboard/useUserDashboard'
import { DashboardStatsGrid } from '../../components/user/dashboard/DashboardStatsGrid'
import { DashboardRecentActivity } from '../../components/user/dashboard/DashboardRecentActivity'

export default function UserDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    stats, recentActivity,
    loadingStats, loadingActivity,
    errorStats, errorActivity,
    isRetrying, handleRetry,
  } = useUserDashboard(user?.id, user?.exam_selection ?? undefined)

  return (
    <PageContainer>
      <Stack gap="lg">
        <WelcomeBanner displayName={user?.full_name || 'Learner'} />

        <DashboardStatsGrid
          stats={stats}
          loading={loadingStats}
          error={errorStats}
          isRetrying={isRetrying}
          onRetry={handleRetry}
        />

        <DashboardRecentActivity
          recentActivity={recentActivity}
          loading={loadingActivity}
          error={errorActivity}
          isRetrying={isRetrying}
          onRetry={handleRetry}
          onViewPerformance={() => navigate('/performance')}
          onStartExam={() => navigate('/exams')}
          onReviewAttempt={(id) => navigate(`/review/${id}`)}
        />

        <div className="flex justify-center mt-4 md:mt-6">
          <PrimaryButton onClick={() => navigate('/exams')}>
            Launch Practice Session
          </PrimaryButton>
        </div>
      </Stack>
    </PageContainer>
  )
}
