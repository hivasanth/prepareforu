import { useState, useMemo, type FC } from 'react';
import { XCircle } from 'lucide-react';
import { Button } from '../../../components/common/AntigravityUI';
import { DiagramRenderer } from '../../../components/common/DiagramRenderer';
import { QuestionVisualizer } from '../../../components/common/QuestionVisualizer';
import { ReviewLayout, ReviewQuestionCard } from '../../../components/exam';
import { computeExamStatistics, convertAnswersRecord, computeAnswerStatus } from '../../../utils/examStateCalculator';
import type { Question, AttemptAnswer } from '../../../types/exam.types';

interface ReviewViewProps {
  questions: Question[];
  answers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  durationSeconds?: number;
  onBackToResult: () => void;
  onCloseReview: () => void;
}

type ReviewFilter = 'all' | 'correct' | 'wrong' | 'skipped' | 'not_visited';

export const ReviewView: FC<ReviewViewProps> = ({
  questions,
  answers,
  durationSeconds,
  onBackToResult,
  onCloseReview,
}) => {
  const [displayLang, setDisplayLang] = useState<'en' | 'te'>('en');
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const visitedSet = useMemo(() => new Set(questions.filter(q => answers[q.id] !== undefined).map(q => q.id)), [questions, answers]);

  const reviewDetails: AttemptAnswer[] = useMemo(
    () => convertAnswersRecord(questions, answers),
    [questions, answers]
  );

  const examStats = useMemo(
    () => computeExamStatistics(questions, answers, new Set(), visitedSet, reviewDetails, durationSeconds),
    [questions, answers, visitedSet, reviewDetails, durationSeconds]
  );

  const stats = examStats;

  const filterCounts: Record<string, number> = {
    all: stats.total,
    correct: stats.correct,
    wrong: stats.wrong,
    skipped: stats.skipped,
    not_visited: stats.notVisited,
  };

  const answerMap = useMemo(() => new Map(reviewDetails.map(a => [a.question_id, a])), [reviewDetails]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const answer = answerMap.get(q.id);
      const matchesFilter =
        filter === 'all' ? true :
        computeAnswerStatus(answer).status === filter;

      const matchesSearch = !searchQuery ||
        (q.question_text_en || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.question_text_te || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject_name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [questions, answerMap, answers, filter, searchQuery]);

  return (
    <ReviewLayout
      examTitle="Diagnostic Review"
      stats={stats}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      filter={filter}
      onFilterChange={(f) => setFilter(f as ReviewFilter)}
      filterCounts={filterCounts}
      displayLang={displayLang}
      onToggleLang={setDisplayLang}
      onBack={onBackToResult}
    >
      {filteredQuestions.map((q, idx) => {
        const answer = answerMap.get(q.id);
        return (
          <ReviewQuestionCard
            key={q.id}
            question={q}
            answer={answer!}
            index={idx}
            displayLang={displayLang}
            visualNode={q.visual ? <QuestionVisualizer visual={q.visual} /> : undefined}
            diagramNode={q.diagram ? <DiagramRenderer diagram={q.diagram} /> : undefined}
          />
        );
      })}

      {filteredQuestions.length === 0 && null}

      <div className="flex justify-center pt-4">
        <Button variant="danger" onClick={onCloseReview} className="h-12 px-8 uppercase tracking-wider">
          <XCircle size={18} className="mr-2" /> Close Review
        </Button>
      </div>
    </ReviewLayout>
  );
};
