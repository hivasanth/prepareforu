import { useHistory } from '../../components/exam/useHistory';
import {
  PageContainer,
  Stack,
  H2,
  Body,
  ErrorContainer,
  RetryButton,
} from '../../components/common/AntigravityUI';
import { LoadingSkeleton, EmptyState, GridSkeleton } from '../../components/common/SharedComponents';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';
import { UserSelectionTabs } from '../../components/user/UserSelectionTabs';
import { SectionReveal } from '../../components/common/AntigravityAnimation';
import { Grid } from '../../components/common/AntigravityLayout';
import { AttemptCardBase } from '../../components/common/AttemptCardBase';

export default function UserHistory() {
  const {
    loading, errorState, pageError, retryError,
    navigate,
    isAppsc, metadata,
    selectedExamId, selectedPaperId, setSelectedPaperId, handleExamChange,
    examOptions, paperOptions, filteredAttempts,
  } = useHistory();

  if (loading) return (
    <PageContainer>
      <Stack gap="xxl">
        <LoadingSkeleton height={40} width={200} borderRadius={12} />
        <GridSkeleton count={5} height={180} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
      </Stack>
    </PageContainer>
  );

  if (errorState === 'error' && pageError) return (
    <PageContainer>
      <ErrorContainer category={pageError.category} severity={pageError.severity}>
        <H2>{pageError.title}</H2>
        <Body>{pageError.message}</Body>
        {pageError.retryable && (
          <RetryButton onRetry={retryError} />
        )}
      </ErrorContainer>
    </PageContainer>
  );

  return (
    <PageContainer>
      <Stack gap="lg">
        {isAppsc && metadata.exams.length > 0 && (
          <SectionReveal className="w-full">
            <UserSelectionTabs
              selectedExam={selectedExamId}
              setSelectedExam={handleExamChange}
              selectedPaper={selectedPaperId}
              setSelectedPaper={setSelectedPaperId}
              customExamTabs={examOptions.map(e => ({ label: e.displayName, id: e.id }))}
              customPapers={paperOptions.map(p => ({ label: p.name, id: p.id }))}
              showSubjects={false}
              hideAll={true}
              bare
            />
          </SectionReveal>
        )}

        {filteredAttempts.length === 0 ? (
          <EmptyState
            icon={<span role="img" aria-label="No data">📊</span>}
            title="No data found"
            subtitle="You haven't attempted any exams for this selection yet. Start your preparation today!"
            actionLabel="Start Today's Exam"
            onAction={() => navigate('/exams')}
          />
        ) : (
          <div aria-live="polite" aria-label={`Showing ${filteredAttempts.length} exam attempts`}>
            <Grid cols={3} gap={24}>
              {filteredAttempts.map((attempt) => (
                <AttemptCardBase
                  key={attempt.id}
                  attempt={attempt}
                  dateFormatter={formatDateDDMMYYYY}
                  onClick={() => navigate(`/review/${attempt.id}`)}
                />
              ))}
            </Grid>
          </div>
        )}
      </Stack>
    </PageContainer>
  );
}
