import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchAttemptResult } from '../../services/examService';
import { computeExamStatistics } from '../../utils/examStateCalculator';
import { submitResultSchema } from '../../validations/securitySchemas';
import type { ExamStatistics } from '../../utils/examStateCalculator';

type StatsWithDuration = ExamStatistics & { duration_seconds: number };

function normalizeResult(res: unknown): StatsWithDuration {
  const parsed = submitResultSchema.safeParse(res);
  if (!parsed.success) {
    return { total: 0, answered: 0, correct: 0, wrong: 0, skipped: 0, marked: 0, visited: 0, notVisited: 0, score: 0, accuracy: 0, timeTaken: 0, duration_seconds: 0 };
  }
  const { correct, wrong, skipped, duration_seconds, score, accuracy } = parsed.data;
  const answered = correct + wrong;
  const total = answered + skipped;
  return {
    total,
    answered,
    correct,
    wrong,
    skipped,
    marked: 0,
    visited: total,
    notVisited: 0,
    score,
    accuracy,
    timeTaken: duration_seconds,
    duration_seconds,
  };
}

export function useResults() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<StatsWithDuration | null>(() => {
    if (location.state?.result) {
      return normalizeResult(location.state.result);
    }
    return null;
  });

  const loadData = useCallback(async () => {
    if (!attemptId) {
      setError('Invalid attempt link.');
      setLoading(false);
      return;
    }

    try {
      if (!location.state?.result) {
        setLoading(true);
      }
      setError(null);
      const { attempt, answers } = await fetchAttemptResult(attemptId, user?.id || '');
      if (attempt.status === 'completed' || attempt.status === 'auto_submitted') {
        const questions = attempt.questions_snapshot || [];
        const stats = computeExamStatistics(
          questions, {}, new Set(), new Set(answers.map(a => a.question_id)), answers, attempt.duration_seconds ?? undefined,
        );
        setStatsData({ ...stats, duration_seconds: attempt.duration_seconds || 0 });
      } else {
        setError("This exam attempt is still in progress. Please complete the exam first.");
      }
    } catch {
      if (!location.state?.result) {
        setError("Failed to retrieve result metrics. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [attemptId, location.state, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const examInfo = location.state?.examTitle || "Competitive Assessment";
  const paperInfo = location.state?.paperName || "Diagnostic Module";

  return {
    loading,
    error,
    statsData,
    loadData,
    attemptId,
    navigate,
    examInfo,
    paperInfo,
  };
}
