import { lazy, Suspense } from 'react'
import { useAuth } from '../../context/AuthContext'
import { GuardLoader } from '../../guards/Guards'
import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import { EXAM_TABS } from '../../components/admin/shared/examPresets'
import { StatsGrid } from '../../components/admin/overview/StatsGrid'
import { useAdminOverview } from '../../components/admin/overview/useAdminOverview'
import { H1, PageContainer, Stack, SectionReveal, Card } from '../../components/common/AntigravityUI'
import { LoadingSkeleton } from '../../components/common/SharedComponents'

const DailyAttemptsChart = lazy(() => import('../../components/admin/overview/DailyAttemptsChart').then(m => ({ default: m.DailyAttemptsChart })))

export default function AdminOverview() {
  const { loading } = useAuth()
  const { selectedExam, setSelectedExam, resolvedIds } = useAdminOverview()

  if (loading) return <GuardLoader />

  return (
    <PageContainer>
      <H1 className="sr-only">Admin Overview</H1>
      <Stack gap="lg">
        <SectionReveal className="flex justify-center lg:justify-start w-full">
          <AdminSelectionTabs
            selectedExam={selectedExam}
            setSelectedExam={setSelectedExam}
            customExamTabs={EXAM_TABS}
            showPapers={false}
            showSubjects={false}
          />
        </SectionReveal>

        <StatsGrid selectedExam={selectedExam} resolvedIds={resolvedIds} />

        <section className="grid gap-6 grid-cols-1">
          <SectionReveal delay={0.1}>
            <Card variant="premium-neutral" padding={24} className="group">
              <Suspense fallback={
                <div role="status" aria-label="Loading daily attempts chart">
                  <LoadingSkeleton height={300} borderRadius={16} />
                </div>
              }>
                <DailyAttemptsChart selectedExam={selectedExam} resolvedIds={resolvedIds} />
              </Suspense>
            </Card>
          </SectionReveal>
        </section>
      </Stack>
    </PageContainer>
  )
}
