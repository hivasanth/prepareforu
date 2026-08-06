import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Users, BookOpen, Activity, ClipboardCheck, FileText, RefreshCw, GraduationCap, UserCheck } from 'lucide-react'
import { ExamDetailModal } from '../../components/sub-admin/exams'
import {
  PageContainer,
  Stack,
  Grid,
  StatCard,
  SectionReveal,
  SectionHeader,
  Button,
  Spinner,
  Body,
  H2,
  ErrorContainer,
  RetryButton,
} from '../../components/common/AntigravityUI'
import { EmptyState } from '../../components/common/SharedComponents'
import { WelcomeBanner } from '../../components/user/WelcomeBanner'
import { RecentExamItem, RecentAttemptItem, ExamListSkeleton, AttemptListSkeleton } from '../../components/sub-admin/dashboard'
import { useSubAdminDashboard } from '../../hooks/useSubAdminDashboard'
import type { SubAdminRecentExams } from '../../components/sub-admin/dashboard'

export default function SubAdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { stats, recentExams, recentAttempts, loading, error, refresh } =
    useSubAdminDashboard(user)

  const [selectedExam, setSelectedExam] = useState<SubAdminRecentExams | null>(null)

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div />
        <Button variant="secondary" size="xs" onClick={refresh} disabled={loading} aria-label="Refresh dashboard data">
          {loading ? <Spinner size="sm" className="mr-1.5 border-current border-t-transparent" /> : <RefreshCw size={12} className="mr-1.5" />}
          Refresh
        </Button>
      </div>

      <Stack gap="lg">
        <SectionReveal>
          <WelcomeBanner displayName={user?.full_name || 'Instructor'} variant="educator" />
        </SectionReveal>

        {error ? (
          <SectionReveal>
            <ErrorContainer category="network" severity="critical">
              <H2>Failed to load dashboard</H2>
              <Body>{error}</Body>
              <RetryButton
                onRetry={refresh}
                loading={loading}
              />
            </ErrorContainer>
          </SectionReveal>
        ) : (
          <>
            <SectionReveal>
              <Grid cols={4} gap={24}>
                <StatCard icon={BookOpen} label="Total Exams" value={stats?.totalExams || 0} loading={loading} color="var(--primary)" aria-label={`Total exams: ${stats?.totalExams || 0}`} />
                <StatCard icon={Activity} label="Active Exams" value={stats?.activeExams || 0} loading={loading} color="var(--success)" aria-label={`Active exams: ${stats?.activeExams || 0}`} />
                <StatCard icon={Users} label="Cohort Size" value={stats?.totalStudents || 0} loading={loading} color="var(--warning)" aria-label={`Cohort size: ${stats?.totalStudents || 0}`} />
                <StatCard icon={ClipboardCheck} label="Total Attempts" value={stats?.totalAttempts || 0} loading={loading} color="var(--danger)" aria-label={`Total attempts: ${stats?.totalAttempts || 0}`} />
              </Grid>
            </SectionReveal>

            <Grid cols={2} gap={24}>
              <SectionReveal delay={0.1}>
                <Stack gap="md">
                  <SectionHeader
                    icon={FileText}
                    title="Recent Deployments"
                    action={<Button variant="secondary" size="xs" onClick={() => navigate('/sub-admin/my-exams')} aria-label="View all exams">View All</Button>}
                  />
                  <Stack gap="sm">
                    {loading && recentExams.length === 0 ? (
                      <ExamListSkeleton />
                    ) : recentExams.length === 0 ? (
                      <EmptyState icon={<GraduationCap size={48} />} title="No exams deployed yet" subtitle="Create your first exam to get started" />
                    ) : (
                      recentExams.map(exam => (
                        <RecentExamItem key={exam.id} exam={exam} onClick={setSelectedExam} />
                      ))
                    )}
                  </Stack>
                </Stack>
              </SectionReveal>

              <SectionReveal delay={0.15}>
                <Stack gap="md">
                  <SectionHeader
                    icon={Users}
                    title="Last Engagements"
                    action={<Button variant="secondary" size="xs" onClick={() => navigate('/sub-admin/students')} aria-label="View all students">View All</Button>}
                  />
                  <Stack gap="sm">
                    {loading && recentAttempts.length === 0 ? (
                      <AttemptListSkeleton />
                    ) : recentAttempts.length === 0 ? (
                      <EmptyState icon={<UserCheck size={48} />} title="No student activity detected" subtitle="Results will appear here once students start attempting exams" />
                    ) : (
                      recentAttempts.map(attempt => (
                        <RecentAttemptItem key={attempt.id} attempt={attempt} />
                      ))
                    )}
                  </Stack>
                </Stack>
              </SectionReveal>
            </Grid>
          </>
        )}
      </Stack>

      {selectedExam && (
        <ExamDetailModal exam={selectedExam} onClose={() => setSelectedExam(null)} />
      )}
    </PageContainer>
  )
}
