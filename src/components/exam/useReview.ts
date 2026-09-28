import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { fetchAttemptResult, markReviewAccessed, fetchContentReviewQuestions, fetchTeacherExamReviewQuestions } from '../../services/examService';
import { computeExamStatistics, computeAnswerStatus } from '../../utils/examStateCalculator';
import type { Attempt, AttemptAnswer } from '../../types/exam.types';

export type ReviewFilter = 'all' | 'correct' | 'wrong' | 'skipped' | 'not_visited';

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
    try {
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
        if (result.attempt.status === 'completed' || result.attempt.status === 'auto_submitted') {
          // M-02 fix: consume the one-time review gate ATOMICALLY before any
          // answer-key definitions (correct_option / explanations) can be rendered.
          // This eliminates the window where a user could view full review content
          // while review_accessed stays false. A failure here is HARD — we must not
          // reveal the answer key unless the gate has been consumed server-side.
          await markReviewAccessed(attemptId);
          const snapshot = result.attempt.questions_snapshot || [];
          let defMap = new Map<string, Partial<typeof snapshot[number]>>();
          try {
            if (result.attempt.teacher_exam_id) {
              // H-1: teacher attempts store an answer-free snapshot, so the
              // review restores full definitions (correct_option, explanations)
              // through the ownership+completion gated RPC.
              const defs = await fetchTeacherExamReviewQuestions(attemptId);
              defMap = new Map(defs.map(d => [d.id, d] as [string, typeof snapshot[number]]));
            } else {
              const defs = await fetchContentReviewQuestions(attemptId);
              defMap = new Map(defs.map(d => [d.id, d] as [string, typeof snapshot[number]]));
            }
            result.attempt.questions_snapshot = snapshot.map(q => {
              const def = defMap.get(q.id);
              return def ? ({ ...q, ...def } as typeof q) : q;
            });
          } catch {
            // Graceful degradation only afer the gate is consumed: snapshot +
            // attempt_answers remain the display floor. The one-time review gate
            // is still enforced server-side (review_accessed = true).
          }
        }
        setData(result);
      });
    } catch {
      setError('Failed to load review. Please try again.');
    }
  }, [attemptId, user, execute]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => {
    if (!data) return EMPTY_STATS;
    const questions = data.attempt.questions_snapshot || [];
    const visited = new Set(data.answers.map(a => a.question_id));
    return computeExamStatistics(questions, {}, new Set(), visited, data.answers, data.attempt.duration_seconds ?? 0) ?? EMPTY_STATS;
  }, [data]);

  const filterCounts = useMemo(() => {
    const allQuestions = data?.attempt.questions_snapshot || [];
    const answerMap = new Map((data?.answers || []).map(a => [a.question_id, a]));
    const counts = { all: 0, correct: 0, wrong: 0, skipped: 0, not_visited: 0 };
    for (const q of allQuestions) {
      counts.all++;
      const answer = answerMap.get(q.id);
      const status = computeAnswerStatus(answer).status;
      if (status === 'correct') counts.correct++;
      else if (status === 'wrong') counts.wrong++;
      else if (status === 'skipped') counts.skipped++;
      else if (status === 'not_visited') counts.not_visited++;
    }
    return counts;
  }, [data]);

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
