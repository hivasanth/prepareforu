import { useMemo } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';
import { Button } from '../../components/common/AntigravityUI';
import { ReviewSkeleton } from '../../components/exam/ReviewSkeleton';
import { ExamPageError } from '../../components/exam/ExamPageError';
import { QuestionVisualizer } from '../../components/common/QuestionVisualizer';
import { DiagramRenderer } from '../../components/common/DiagramRenderer';
import { ReviewLayout, ReviewQuestionCard } from '../../components/exam';
import { useReview } from '../../components/exam/useReview';
import type { ReviewFilter } from '../../components/exam/useReview';

export default function ReviewPage() {
  const {
    loading, error, loadData, navigate,
    data, examTitle, stats, filterCounts, filteredQuestions,
    filter, setFilter, searchQuery, setSearchQuery,
    displayLang, setDisplayLang, handleBack,
  } = useReview();

  // rules-of-hooks: build the answer map unconditionally (null-safe) BEFORE any
  // early return, so the hook order is identical across loading/error/data renders.
  const answerMap = useMemo(
    () => new Map((data?.answers ?? []).map(a => [a.question_id, a])),
    [data],
  );

  if (loading) {
    return <ReviewSkeleton />;
  }

  if (error) {
    return (
      <ExamPageError
        icon={ShieldAlert}
        title="Access Restriction"
        message={error}
        onRetry={() => loadData()}
        onBack={() => navigate('/dashboard')}
      />
    );
  }

  if (!data) return null;

  return (
    <ReviewLayout
      examTitle={examTitle}
      stats={stats}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      filter={filter}
      onFilterChange={(f) => setFilter(f as ReviewFilter)}
      filterCounts={filterCounts}
      displayLang={displayLang}
      onToggleLang={setDisplayLang}
      onBack={handleBack}
    >
      {filteredQuestions.map((q, idx) => {
        const answer = answerMap.get(q.id);
        return (
          <ReviewQuestionCard
            key={q.id}
            question={q}
            answer={answer}
            index={idx}
            displayLang={displayLang}
            visualNode={q.visual ? <QuestionVisualizer visual={q.visual} /> : undefined}
            diagramNode={q.diagram ? <DiagramRenderer diagram={q.diagram} /> : undefined}
          />
        );
      })}

      <div className="flex justify-center pt-4">
        <Button variant="secondary" size="lg" onClick={() => navigate('/dashboard')}>
          <RotateCcw size={18} className="mr-2" /> Back to Dashboard
        </Button>
      </div>
    </ReviewLayout>
  );
}
