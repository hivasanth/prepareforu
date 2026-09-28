import { useAuth } from '../../context/AuthContext'
import { Users, BookOpen, Activity, ClipboardCheck, FileText, RefreshCw, GraduationCap } from 'lucide-react'
import {
  PageContainer,
  Stack,
  Grid,
  StatCard,
  SectionReveal,
  SectionHeader,
  Button,
  Body,
  H2,
  ErrorContainer,
  RetryButton,
} from '../../components/common/AntigravityUI'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/common/SharedComponents'
import { WelcomeBanner } from '../../components/user/WelcomeBanner'
import { RecentExamItem, ExamListSkeleton } from '../../components/sub-admin/dashboard'
import { useSubAdminDashboard } from '../../hooks/useSubAdminDashboard'

export default function SubAdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { stats, recentExams, loading, error, refresh } =
    useSubAdminDashboard(user)

  const hasStats = stats !== null

  // A11y: exactly ONE loading status owner, and only for the FIRST load.
  // Background refreshes keep the last-good data visible, so re-announcing a
  // loading region after data exists would be noise; the Refresh button
  // communicates busy state via `disabled`. A refresh failure with data
  // present renders a non-destructive inline alert banner ABOVE the retained
  // content — never a full-page error that makes content disappear.
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div />
        <Button variant="secondary" size="xs" onClick={refresh} disabled={loading} aria-label="Refresh dashboard data">
          <RefreshCw size={12} className="mr-1.5" />
          Refresh
        </Button>
      </div>

      <Stack gap="lg">
        <SectionReveal>
          <WelcomeBanner displayName={user?.full_name || 'Instructor'} variant="educator" />
        </SectionReveal>

        {!hasStats ? (
          error ? (
            <SectionReveal>
              <ErrorContainer category={error.category} severity={error.severity}>
                <H2>{error.title}</H2>
                <Body>{error.message}</Body>
                <RetryButton
                  onRetry={refresh}
                  loading={loading}
                />
              </ErrorContainer>
            </SectionReveal>
          ) : (
            <div
              className="flex flex-col gap-[var(--space-6)]"
              role="status"
              aria-live="polite"
              aria-label="Loading dashboard"
            >
              <SectionReveal>
                <Grid cols={2} lg={4}>
                  <StatCard icon={BookOpen} label="Total Exams" value={0} loading status="accent" />
                  <StatCard icon={Activity} label="Active Exams" value={0} loading status="success" />
                  <StatCard icon={Users} label="Cohort Size" value={0} loading status="warning" />
                  <StatCard icon={ClipboardCheck} label="Total Attempts" value={0} loading status="danger" />
                </Grid>
              </SectionReveal>

              <SectionReveal delay={0.1}>
                <Stack gap="md">
                  <SectionHeader
                    icon={FileText}
                    title="Recent Deployments"
                    action={<Button variant="soft" size="xs" curved onClick={() => navigate('/sub-admin/my-exams')} aria-label="View all exams">View All</Button>}
                  />
                  <ExamListSkeleton />
                </Stack>
              </SectionReveal>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-[var(--space-6)]">
            {error && (
              <SectionReveal>
                <ErrorContainer category={error.category} severity={error.severity}>
                  <H2>{error.title}</H2>
                  <Body>{error.message}</Body>
                  <RetryButton
                    onRetry={refresh}
                    loading={loading}
                  />
                </ErrorContainer>
              </SectionReveal>
            )}

            <SectionReveal>
              <Grid cols={2} lg={4}>
                <StatCard icon={BookOpen} label="Total Exams" value={stats?.totalExams || 0} status="accent" />
                <StatCard icon={Activity} label="Active Exams" value={stats?.activeExams || 0} status="success" />
                <StatCard icon={Users} label="Cohort Size" value={stats?.totalStudents || 0} status="warning" />
                <StatCard icon={ClipboardCheck} label="Total Attempts" value={stats?.totalAttempts || 0} status="danger" />
              </Grid>
            </SectionReveal>

            <SectionReveal delay={0.1}>
              <Stack gap="md">
                <SectionHeader
                  icon={FileText}
                  title="Recent Deployments"
                  action={<Button variant="soft" size="xs" curved onClick={() => navigate('/sub-admin/my-exams')} aria-label="View all exams">View All</Button>}
                />
                {recentExams.length === 0 ? (
                  <EmptyState icon={<GraduationCap size={48} />} title="No exams deployed yet" subtitle="Create your first exam to get started" />
                ) : (
                  <Grid cols={1} lg={2}>
                    {recentExams.map(exam => (
                      <RecentExamItem key={exam.id} exam={exam} onClick={(e) => navigate(`/sub-admin/my-exams?exam=${e.id}`)} />
                    ))}
                  </Grid>
                )}
              </Stack>
            </SectionReveal>
          </div>
        )}
      </Stack>
    </PageContainer>
  )
}
