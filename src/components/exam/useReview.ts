import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { fetchAttemptResult, markReviewAccessed } from '../../services/examService';
import { computeExamStatistics, computeAnswerStatus } from '../../utils/examStateCalculator';
import type { Attempt, AttemptAnswer } from '../../types/exam.types';

type ReviewFilter = 'all' | 'correct' | 'wrong' | 'skipped' | 'not_visited';

const EMPTY_STATS = {
  total: 0, correct: 0, wrong: 0, skipped: 0, notVisited: 0,
  score: 0, accuracy: 0, timeTaken: 0, answered: 0, marked: 0, visited: 0,
};

export function useReview() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { loading, execute } = useAsyncOperation(true);
  const [data, setData] = useState<{ attempt: Attempt; answers: AttemptAnswer[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLang, setDisplayLang] = useState<'en' | 'te'>('en');

  const loadData = useCallback(async () => {
    if (!user) return;
    await execute(async () => {
      setError(null);
      if (!attemptId) {
        setError('Invalid attempt link.');
        return;
      }
      const result = await fetchAttemptResult(attemptId, user.id);
      if (result.attempt.review_accessed) {
        setError("Review access has expired or been limited for security reasons.");
        return;
      }
      setData(result);
      try {
        await markReviewAccessed(attemptId);
      } catch {
        // Non-fatal: the review data is already loaded, so the review stays viewable.
      }
    });
  }, [attemptId, user, execute]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => {
    if (!data) return EMPTY_STATS;
    const questions = data.attempt.questions_snapshot || [];
    const visited = new Set(data.answers.map(a => a.question_id));
    return computeExamStatistics(questions, {}, new Set(), visited, data.answers, data.attempt.duration_seconds ?? 0) ?? EMPTY_STATS;
  }, [data]);

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

  return {
    loading,
    error,
    loadData,
    navigate,
    data,
    examTitle,
    stats,
    filterCounts,
    filteredQuestions,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    displayLang,
    setDisplayLang,
    handleBack,
  };
}
