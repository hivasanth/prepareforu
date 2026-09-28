import { useNavigate } from 'react-router-dom'
import { Target, TrendingUp, Clock, Search } from 'lucide-react'
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
    subjectStatsLoading,
    subjectStatsError,
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
    needsSelection,
    filterEmptyReason,
  } = useUserPerformance()

  if (needsSelection) {
    return (
      <PageContainer>
        <div className="py-8">
          <EmptyState
            icon={<Target size={48} aria-hidden />}
            title="Select an exam to view your performance"
            subtitle="Choose your exam selection to unlock performance analytics."
            actionLabel="Choose Exam"
            onAction={() => navigate('/signup')}
          />
        </div>
      </PageContainer>
    )
  }

  if (loading) return <PerformanceSkeleton showAppscTabs={isAppsc} />

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
            icon={<TrendingUp size={48} aria-hidden />}
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
            />
          </SectionReveal>
        )}

        <PerformanceTimeRangeTabs
          selectedTimeRange={selectedTimeRange}
          onChange={setSelectedTimeRange}
        />

        {filteredAttempts.length === 0 ? (
          filterEmptyReason === 'time' ? (
            <EmptyState
              icon={<Clock size={48} aria-hidden />}
              title="No performance data for this time range"
              subtitle="Try a different time range, or complete exams in this selection to see analytics."
            />
          ) : (
            <EmptyState
              icon={<Search size={48} aria-hidden />}
              title="No performance data for the selected exam"
              subtitle="Complete exams in this selection to see your analytics here."
            />
          )
        ) : (
          <div className="space-y-8">
            <PerformanceMetricsGrid metrics={metrics} />
            <PerformanceAnalyticsSection
              trendData={trendData}
              hasEnoughTrendData={hasEnoughTrendData}
              distribution={distribution}
              subjectStats={subjectStats}
              subjectStatsLoading={subjectStatsLoading}
              subjectStatsError={subjectStatsError}
            />
          </div>
        )}
      </Stack>
    </PageContainer>
  )
}
