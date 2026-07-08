import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import {
  Button,
  IconBadge,
  Stack,
} from '../../components/common/AntigravityUI';
import { QuestionVisualizer } from '../../components/common/QuestionVisualizer';
import { DiagramRenderer } from '../../components/common/DiagramRenderer';
import { ReviewLayout, ReviewQuestionCard } from '../../components/exam';

import { useAuth } from '../../context/AuthContext';
import { fetchAttemptResult, markReviewAccessed } from '../../services/examService';
import { computeExamStatistics, computeAnswerStatus } from '../../utils/examStateCalculator';
import type { Attempt, AttemptAnswer } from '../../types/exam.types';

type ReviewFilter = 'all' | 'correct' | 'wrong' | 'skipped' | 'not_visited';

export default function ReviewPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ attempt: Attempt; answers: AttemptAnswer[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLang, setDisplayLang] = useState<'en' | 'te'>('en');

  const loadData = useCallback(async () => {
    if (!attemptId || !user) return;
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAttemptResult(attemptId, user.id);
      if (result.attempt.review_accessed) {
        setError("Review access has expired or been limited for security reasons.");
        return;
      }
      setData(result);
      await markReviewAccessed(attemptId);
    } catch {
      setError("Unable to access review session. This might be due to a network issue or security restrictions.");
    } finally {
      setLoading(false);
    }
  }, [attemptId, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const examStats = useMemo(() => {
    if (!data) return null;
    const questions = data.attempt.questions_snapshot || [];
    const visited = new Set(data.answers.map(a => a.question_id));
    return computeExamStatistics(questions, {}, new Set(), visited, data.answers, data.attempt.duration_seconds ?? 0);
  }, [data]);

  const stats = examStats || { total: 0, correct: 0, wrong: 0, skipped: 0, notVisited: 0, score: 0, accuracy: 0, timeTaken: 0, answered: 0, marked: 0, visited: 0 };

  const filterCounts = useMemo(() => ({
    all: stats.total,
    correct: stats.correct,
    wrong: stats.wrong,
    skipped: stats.skipped,
    not_visited: stats.notVisited,
  }), [stats]);

  const filteredQuestions = useMemo(() => {
    if (!data) return [];
    const allQuestions = data.attempt.questions_snapshot || [];
    const answerMap = new Map(data.answers.map(a => [a.question_id, a]));
    return allQuestions.filter(q => {
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
  }, [data, filter, searchQuery]);

  const examTitle = (location.state as any)?.examTitle || "Assessment Review";

  const handleBack = useCallback(() => {
    const state = location.state as Record<string, any> | null;
    const source = state?.source;
    if (source) {
      const parentRoutes: Record<string, string> = {
        subject_test: '/subject-tests',
        topic_exam: '/topic-exams',
        prepare_write: '/prepare-write',
        exam_tab: '/exams',
        teacher_exam: '/educator-exams',
      };
      const target = parentRoutes[source];
      if (target) { navigate(target, { replace: true }); return; }
    }
    if (window.history.length > 1) { navigate(-1); return; }
    navigate('/dashboard', { replace: true });
  }, [navigate, location.state]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-app-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-base font-semibold text-text-secondary">Loading Review Data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 max-w-md">
          <IconBadge icon={ShieldAlert} size="4xl" className="rounded-[18px]" darkClassName="bg-warning/10 text-warning" />
          <Stack gap={8}>
            <h3 className="text-2xl font-black text-text-primary">Access Restriction</h3>
            <p className="text-text-secondary">{error}</p>
          </Stack>
          <Stack gap={12} className="w-full max-w-xs">
            <Button onClick={() => loadData()} fullWidth>Retry Access</Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard')} fullWidth>Return Home</Button>
          </Stack>
        </div>
      </div>
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
      {filteredQuestions.map((q) => {
        const answer = data.answers.find(a => a.question_id === q.id);
        return (
          <ReviewQuestionCard
            key={q.id}
            question={q}
            answer={answer}
            index={filteredQuestions.indexOf(q)}
            displayLang={displayLang}
            visualNode={q.visual ? <QuestionVisualizer visual={q.visual} /> : undefined}
            diagramNode={q.diagram ? <DiagramRenderer diagram={q.diagram} /> : undefined}
          />
        );
      })}

      {filteredQuestions.length === 0 && null}

      <div className="flex justify-center pt-4">
        <Button variant="secondary" onClick={() => navigate('/dashboard')} className="h-12 px-8 uppercase tracking-wider">
          <RotateCcw size={18} className="mr-2" /> Back to Dashboard
        </Button>
      </div>
    </ReviewLayout>
  );
}
