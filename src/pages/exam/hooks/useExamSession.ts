import { useEffect, useCallback, useRef } from 'react';
import {
  setQuestionAnswer,
  setQuestionReview,
  syncAnswersCache,
} from '../../../services/examService';
import { executeWithRetry, StaleOperationError } from '../../../services/persistenceRetry';
import { computeExamStatistics, type ExamStatistics } from '../../../utils/examStateCalculator';
import type { Question, Attempt, ExamPaper } from '../../../types/exam.types';

interface UseExamSessionOptions {
  initComplete: boolean;
  loading: boolean;
  attempt: Attempt | null;
  paper: ExamPaper | null;
  questions: Question[];
  currentQuestion: Question | undefined;
  isSubmitting: boolean;
  selectedAnswers: Record<string, string | null>;
  markedForReview: Set<string>;
  visitedQuestions: Set<string>;
  subjectMarksRef: React.MutableRefObject<Record<string, number>>;
  selectedAnswersRef: React.MutableRefObject<Record<string, string | null>>;
  markedForReviewRef: React.MutableRefObject<Set<string>>;
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  setMarkedForReview: React.Dispatch<React.SetStateAction<Set<string>>>;
  onError: (message: string) => void;
}

interface UseExamSessionReturn {
  examStats: ExamStatistics;
  handleOptionSelect: (option: string) => Promise<void>;
  clearAnswer: () => Promise<void>;
  toggleMarkForReview: () => Promise<void>;
}

export function useExamSession({
  initComplete,
  loading,
  attempt,
  paper,
  questions,
  currentQuestion,
  isSubmitting,
  selectedAnswers,
  markedForReview,
  visitedQuestions,
  subjectMarksRef,
  selectedAnswersRef,
  markedForReviewRef,
  setSelectedAnswers,
  setMarkedForReview,
  onError,
}: UseExamSessionOptions): UseExamSessionReturn {
  const lastSyncAnswers = useRef<string>('');
  const syncTimeoutRef = useRef<any>(null);

  const examStats = computeExamStatistics(questions, selectedAnswers, markedForReview, visitedQuestions, undefined, attempt?.duration_seconds ?? undefined);

  // ─── Autosave Cache Sync ────────────────────────────────────────────────────
  useEffect(() => {
    if (!initComplete || !attempt?.id || loading) return;
    const currentAnswersStr = JSON.stringify(selectedAnswers);
    if (currentAnswersStr === lastSyncAnswers.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await syncAnswersCache(attempt.id, selectedAnswers as Record<string, string | null>);
        lastSyncAnswers.current = currentAnswersStr;
      } catch {
      }
    }, 5000);
    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [selectedAnswers, attempt?.id, loading, initComplete]);

  // ─── Keep refs in sync ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!initComplete) return;
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers, initComplete]);
  useEffect(() => { if (!initComplete) return; markedForReviewRef.current = markedForReview; }, [markedForReview, initComplete]);

  // ─── Mark for Review ───────────────────────────────────────────────────────
  const toggleMarkForReview = useCallback(async () => {
    if (!currentQuestion || !attempt) return;
    const questionId = currentQuestion.id;
    const wasMarked = markedForReviewRef.current.has(questionId);
    const newMarked = !wasMarked;

    const nextMarked = new Set(markedForReviewRef.current);
    if (nextMarked.has(questionId)) nextMarked.delete(questionId);
    else nextMarked.add(questionId);
    markedForReviewRef.current = nextMarked;
    setMarkedForReview(nextMarked);
    try {
      await executeWithRetry(
        `${questionId}-review`,
        () => setQuestionReview(attempt.id, questionId, currentQuestion.correct_option, newMarked),
      );
    } catch (error) {
      if (error instanceof StaleOperationError) { return; }
      const current = markedForReviewRef.current.has(questionId);
      if (current === newMarked) {
        const rollback = new Set(markedForReviewRef.current);
        if (rollback.has(questionId)) rollback.delete(questionId);
        else rollback.add(questionId);
        markedForReviewRef.current = rollback;
        setMarkedForReview(rollback);
      }
      onError("Failed to save review flag. Please try again.");
    }
  }, [currentQuestion, attempt, onError, setMarkedForReview]);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handleOptionSelect = async (option: string) => {
    if (isSubmitting || !attempt || !currentQuestion) return;
    const questionId = currentQuestion.id;
    const previousAnswer = selectedAnswersRef.current[questionId];
    if (previousAnswer === option) { return; }

    const nextAnswers = { ...selectedAnswersRef.current, [questionId]: option };
    selectedAnswersRef.current = nextAnswers;
    setSelectedAnswers(nextAnswers);

    try {
      await executeWithRetry(
        `${questionId}-answer`,
        () => setQuestionAnswer(
          attempt.id,
          questionId,
          option,
          currentQuestion.correct_option,
          subjectMarksRef.current[currentQuestion.subject_name] ?? (attempt.total_marks / questions.length),
          paper?.negative_mark_value || 0,
        ),
      );
    } catch (error) {
      if (error instanceof StaleOperationError) { return; }
      if (selectedAnswersRef.current[questionId] === option) {
        const revert = { ...selectedAnswersRef.current };
        if (previousAnswer === undefined) delete revert[questionId];
        else revert[questionId] = previousAnswer;
        selectedAnswersRef.current = revert;
        setSelectedAnswers(revert);
      }
      onError("Failed to save answer. Please try again.");
    }
  };

  const clearAnswer = async () => {
    if (isSubmitting || !attempt || !currentQuestion) return;
    const questionId = currentQuestion.id;
    const previousAnswer = selectedAnswersRef.current[questionId];
    if (previousAnswer === undefined || previousAnswer === null) return;

    const nextAnswers = { ...selectedAnswersRef.current, [questionId]: null };
    selectedAnswersRef.current = nextAnswers;
    setSelectedAnswers(nextAnswers);

    try {
      await executeWithRetry(
        `${questionId}-answer`,
        () => setQuestionAnswer(
          attempt.id,
          questionId,
          null,
          currentQuestion.correct_option,
          subjectMarksRef.current[currentQuestion.subject_name] ?? (attempt.total_marks / questions.length),
          paper?.negative_mark_value || 0,
        ),
      );
    } catch (error) {
      if (error instanceof StaleOperationError) { return; }
      if (selectedAnswersRef.current[questionId] === null) {
        const revert = { ...selectedAnswersRef.current, [questionId]: previousAnswer };
        selectedAnswersRef.current = revert;
        setSelectedAnswers(revert);
      }
      onError("Failed to clear answer. Please try again.");
    }
  };

  return {
    examStats,
    handleOptionSelect,
    clearAnswer,
    toggleMarkForReview,
  };
}

