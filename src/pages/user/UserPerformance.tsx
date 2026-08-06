import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/common/SharedComponents'
import {
  PageContainer,
  Stack,
  H2,
  Body,
  ErrorContainer,
  RetryButton,
} from '../../components/common/AntigravityUI'
import { SectionReveal } from '../../components/common/AntigravityAnimation'
import { UserSelectionTabs } from '../../components/user/UserSelectionTabs'
import {
  useUserPerformance,
  PerformanceSkeleton,
  PerformanceMetricsGrid,
  PerformanceTimeRangeTabs,
  PerformanceAnalyticsSection,
} from '../../components/user/performance'

export default function UserPerformance() {
  const navigate = useNavigate()
  const {
    loading,
    errorState,
    pageError,
    retryError,
    isAppsc,
    allAttempts,
    filteredAttempts,
    metrics,
    subjectStats,
    trendData,
    distribution,
    selectedExamId,
    handleExamChange,
    selectedPaperId,
    setSelectedPaperId,
    selectedTimeRange,
    setSelectedTimeRange,
    examOptions,
    paperOptions,
  } = useUserPerformance()

  if (loading) return <PerformanceSkeleton />

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

  if (allAttempts.length === 0) {
    return (
      <PageContainer>
        <div className="py-8">
          <EmptyState
            icon="📈"
            title="No exam activity yet"
            subtitle="Complete exams in the Exams tab to see your performance analytics here."
            actionLabel="Start Today's Exam"
            onAction={() => navigate('/exams')}
          />
        </div>
      </PageContainer>
    )
  }

  const hasEnoughTrendData = trendData.length >= 2

  return (
    <PageContainer>
      <Stack gap="lg">
        {isAppsc && (
          <SectionReveal className="w-full">
            <UserSelectionTabs
              selectedExam={selectedExamId}
              setSelectedExam={handleExamChange}
              selectedPaper={selectedPaperId}
              setSelectedPaper={setSelectedPaperId}
              customExamTabs={examOptions.map(e => ({ label: e.displayName, id: e.id }))}
              customPapers={paperOptions.map(p => ({ label: p.name, id: p.id }))}
              showSubjects={false}
              hideAll
              bare
            />
          </SectionReveal>
        )}

        <PerformanceTimeRangeTabs
          selectedTimeRange={selectedTimeRange}
          onChange={setSelectedTimeRange}
        />

        {filteredAttempts.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No data found"
            subtitle="Try adjusting your filters to see results, or start a new exam to build your performance profile."
            actionLabel="Start Today's Exam"
            onAction={() => navigate('/exams')}
          />
        ) : (
          <div className="space-y-8">
            <PerformanceMetricsGrid metrics={metrics} />
            <PerformanceAnalyticsSection
              trendData={trendData}
              hasEnoughTrendData={hasEnoughTrendData}
              distribution={distribution}
              subjectStats={subjectStats}
            />
          </div>
        )}
      </Stack>
    </PageContainer>
  )
}
