import { useState, useMemo, type FC } from 'react';
import { XCircle } from 'lucide-react';
import { Button } from '../../common/AntigravityUI';
import { DiagramRenderer } from '../../common/DiagramRenderer';
import { QuestionVisualizer } from '../../common/QuestionVisualizer';
import { ReviewLayout, ReviewQuestionCard } from '../../exam';
import { computePracticeSessionStats, convertAnswersRecord, computeAnswerStatus } from '../../../utils/examStateCalculator';
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

  const reviewDetails: AttemptAnswer[] = useMemo(
    () => convertAnswersRecord(questions, answers),
    [questions, answers]
  );

  const examStats = useMemo(
    () => computePracticeSessionStats(questions, answers, reviewDetails, durationSeconds),
    [questions, answers, reviewDetails, durationSeconds]
  );

  const stats = examStats;

  const answerMap = useMemo(() => new Map(reviewDetails.map(a => [a.question_id, a])), [reviewDetails]);

  const filterCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = { all: 0, correct: 0, wrong: 0, skipped: 0, not_visited: 0 };
    for (const q of questions) {
      counts.all++;
      const answer = answerMap.get(q.id);
      const status = computeAnswerStatus(answer).status;
      if (status === 'correct') counts.correct++;
      else if (status === 'wrong') counts.wrong++;
      else if (status === 'skipped') counts.skipped++;
      else if (status === 'not_visited') counts.not_visited++;
    }
    return counts;
  }, [questions, answerMap]);

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
        return (
          <ReviewQuestionCard
            key={q.id}
            question={q}
            answer={answerMap.get(q.id)}
            index={idx}
            displayLang={displayLang}
            visualNode={q.visual ? <QuestionVisualizer visual={q.visual} /> : undefined}
            diagramNode={q.diagram ? <DiagramRenderer diagram={q.diagram} /> : undefined}
          />
        );
      })}

      <div className="flex justify-center pt-4">
        <Button variant="secondary" size="lg" onClick={onCloseReview}>
          <XCircle size={18} className="mr-2" /> Close Review
        </Button>
      </div>
    </ReviewLayout>
  );
};
