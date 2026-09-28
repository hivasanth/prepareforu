import { useHistory } from '../../components/exam/useHistory';
import { Search, BarChart3 } from 'lucide-react';
import {
  PageContainer,
  Stack,
  H2,
  Body,
  ErrorContainer,
  RetryButton,
} from '../../components/common/AntigravityUI';
import { EmptyState } from '../../components/common/SharedComponents';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';
import { UserSelectionTabs } from '../../components/user/UserSelectionTabs';
import { SectionReveal } from '../../components/common/AntigravityAnimation';
import { Grid } from '../../components/common/AntigravityLayout';
import { AttemptCardBase } from '../../components/common/AttemptCardBase';
import { HistorySkeleton } from '../../components/user/history/HistorySkeleton';

export default function UserHistory() {
  const {
    isLoading, errorState, pageError, retryError,
    navigate,
    authLoading,
    isAppsc, metadata,
    selectedExamId, selectedPaperId, setSelectedPaperId, handleExamChange,
    examOptions, paperOptions, filteredAttempts, isEmptyFilter,
  } = useHistory();

  if (isLoading) return (
    <PageContainer>
      <HistorySkeleton showSelection={authLoading || isAppsc} />
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
            />
          </SectionReveal>
        )}

        {filteredAttempts.length === 0 ? (
          isEmptyFilter ? (
            <EmptyState
              icon={<Search size={48} aria-hidden />}
              title="No attempts in this selection"
              subtitle="No completed exams match the selected filters. Try switching the exam or paper tabs to see other attempts."
            />
          ) : (
            <EmptyState
              icon={<BarChart3 size={48} aria-hidden />}
              title="No official exam attempts yet"
              subtitle="Your exam history will appear here once you complete an exam. Start practicing today!"
              actionLabel="Start Today's Exam"
              onAction={() => navigate('/exams')}
            />
          )
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
