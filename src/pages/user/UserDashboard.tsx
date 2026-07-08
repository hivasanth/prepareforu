import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LoadingSkeleton,
  ErrorState
} from '../../components/common/SharedComponents'
import {
  StatCard,
  PageContainer,
  Stack,
  Grid,
  PrimaryButton,
  H2
} from '../../components/common/AntigravityUI'
import {
  Flame,
  Target,
  Trophy,
  GraduationCap,
} from 'lucide-react'
import { RecentAttemptCard } from '../../components/common/RecentAttemptCard'
import { WelcomeBanner } from '../../components/user/WelcomeBanner'
import { useDashboardData } from '../../hooks/useDashboardData'

// ─── Main Component ────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { stats, recentActivity, loadingStats, loadingActivity, errorStats, errorActivity, fetchData } =
    useDashboardData(user?.id, user?.exam_selection ?? undefined)

  const firstName = user?.full_name?.split(' ')[0] || 'Learner'

  return (
    <PageContainer>
      <Stack gap="lg">
        <WelcomeBanner firstName={firstName} />

        {/* Stats Section */}
        <Stack gap="lg">
          {loadingStats ? (
            <Grid className="grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} height={72} borderRadius={14} />)}
            </Grid>
          ) : errorStats ? (
            <div className="py-4 border border-dashed border-border-subtle rounded-[14px] bg-hover-bg/20">
              <ErrorState message={errorStats} onRetry={() => fetchData(true)} />
            </div>
          ) : (
            <Grid className="grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Flame}    label="STREAK"   value={stats?.daily_streak || 0} unit="Days" color="var(--warning, #FBBF24)" />
              <StatCard icon={GraduationCap} label="WISDOM" value={stats?.exams_taken || 0} unit="Exams" color="var(--primary, #3B82F6)" />
              <StatCard icon={Target}   label="PRECISION" value={stats?.accuracy || 0} unit="%" color="var(--info, #22D3EE)" />
              <StatCard icon={Trophy}   label="STANDING" value={stats?.global_rank ?? 'N/A'} color="var(--secondary, #10B981)" />
            </Grid>
          )}
        </Stack>

        {/* Recent Activity */}
        <Stack gap="md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <H2 className="uppercase">Recent Activity</H2>
            <button
              onClick={() => navigate('/performance')}
              className="h-11 px-5 text-[12px] font-bold uppercase tracking-widest rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all self-end sm:self-center"
            >
              Analytics →
            </button>
          </div>

          {loadingActivity ? (
            <LoadingSkeleton height={300} borderRadius={24} />
          ) : errorActivity ? (
            <div className="py-4 border border-dashed border-border-subtle rounded-[14px] bg-hover-bg/20">
              <ErrorState message={errorActivity} onRetry={() => fetchData(true)} />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-border-subtle rounded-[14px] bg-hover-bg/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary opacity-60">No recent activity detected</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {recentActivity.map((act) => (
                <RecentAttemptCard
                  key={act.id}
                  attempt={act}
                  onClick={() => navigate(`/review/${act.id}`)}
                />
              ))}
            </div>
          )}
        </Stack>

        {/* CTA */}
        <div className="flex justify-center mt-4 md:mt-6">
          <PrimaryButton onClick={() => navigate('/exams')}>
            Launch Practice Session
          </PrimaryButton>
        </div>
      </Stack>
    </PageContainer>
  )
}
