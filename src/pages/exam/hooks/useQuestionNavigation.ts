import { useCallback, useEffect } from 'react';
import { touchQuestionVisit, addQuestionTime } from '../../../services/examService';
import { executeWithRetry, StaleOperationError } from '../../../services/persistenceRetry';
import { computeQuestionState } from '../../../utils/examStateCalculator';
import type { Question, Attempt } from '../../../types/exam.types';

interface UseQuestionNavigationOptions {
  initComplete: boolean;
  questions: Question[];
  selectedAnswers: Record<string, string | null>;
  markedForReview: Set<string>;
  visitedQuestions: Set<string>;
  currentIdx: number;
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
  setVisitedQuestions: React.Dispatch<React.SetStateAction<Set<string>>>;
  currentIdxRef: React.MutableRefObject<number>;
  visitedQuestionsRef: React.MutableRefObject<Set<string>>;
  questionEntryTimeRef: React.MutableRefObject<number>;
  questionTimeSpentRef: React.MutableRefObject<Record<string, number>>;
  attemptRef: React.MutableRefObject<Attempt | null>;
}

interface UseQuestionNavigationReturn {
  currentIdx: number;
  currentQuestion: Question | undefined;
  isLastQuestion: boolean;
  isFirstQuestion: boolean;
  hasAnswer: boolean;
  isMarked: boolean;
  canProceed: boolean;
  goToQuestion: (index: number) => Promise<void>;
  handleNext: () => void;
  handleSkip: () => void;
  handlePrev: () => void;
}

export function useQuestionNavigation({
  initComplete,
  questions,
  selectedAnswers,
  markedForReview,
  visitedQuestions,
  currentIdx,
  setCurrentIdx,
  setVisitedQuestions,
  currentIdxRef,
  visitedQuestionsRef,
  questionEntryTimeRef,
  questionTimeSpentRef,
  attemptRef,
}: UseQuestionNavigationOptions): UseQuestionNavigationReturn {
  const currentQuestion = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;
  const isFirstQuestion = currentIdx === 0;
  const currentQState = currentQuestion ? computeQuestionState(currentQuestion.id, currentIdx, currentIdx, selectedAnswers, markedForReview, visitedQuestions) : null;
  const hasAnswer = currentQState?.isAnswered ?? false;
  const isMarked = currentQState?.isMarked ?? false;
  const canProceed = hasAnswer || isMarked;

  const goToQuestion = useCallback(async (index: number) => {
    if (index < 0 || index >= questions.length) return;
    const currentId = questions[currentIdxRef.current]?.id;

    const currentAttempt = attemptRef.current;
    if (currentId && currentAttempt) {
      const elapsed = Math.floor((Date.now() - questionEntryTimeRef.current) / 1000);
      const total = (questionTimeSpentRef.current[currentId] || 0) + elapsed;

      questionTimeSpentRef.current[currentId] = total;
      executeWithRetry(
        `${currentId}-time`,
        () => addQuestionTime(currentAttempt.id, currentId, elapsed),
      ).catch((err: unknown) => {
        if (!(err instanceof StaleOperationError)) {
          console.warn("Failed to persist time for", currentId);
        }
      });
    }
    setCurrentIdx(index);
    currentIdxRef.current = index;
    questionEntryTimeRef.current = Date.now();

    const targetId = questions[index]?.id;
    const targetAttempt = attemptRef.current;
    if (targetId && targetAttempt && !visitedQuestionsRef.current.has(targetId)) {
      const nextVisited = new Set(visitedQuestionsRef.current);
      nextVisited.add(targetId);
      visitedQuestionsRef.current = nextVisited;
      setVisitedQuestions(nextVisited);
      try {
        await executeWithRetry(
          `${targetId}-visit`,
          () => touchQuestionVisit(targetAttempt.id, targetId),
        );
      } catch (err) {
        if (!(err instanceof StaleOperationError)) {
          console.warn("Failed to persist visited state for", targetId);
        }
      }
    }
  }, [questions, setCurrentIdx, setVisitedQuestions, currentIdxRef, visitedQuestionsRef, questionEntryTimeRef, questionTimeSpentRef, attemptRef]);

  useEffect(() => {
    if (!initComplete) return;
    let cancelled = false;
    (async () => {
      if (currentQuestion && !visitedQuestionsRef.current.has(currentQuestion.id)) {
        const nextVisited = new Set(visitedQuestionsRef.current);
        nextVisited.add(currentQuestion.id);
        visitedQuestionsRef.current = nextVisited;
        setVisitedQuestions(nextVisited);
        questionEntryTimeRef.current = Date.now();
        const visitAttempt = attemptRef.current;
        if (visitAttempt) {
          try {
            await executeWithRetry(
              `${currentQuestion.id}-visit`,
              () => touchQuestionVisit(visitAttempt.id, currentQuestion.id),
            );
          } catch (err) {
            if (!(err instanceof StaleOperationError) && !cancelled) {
              console.warn("Failed to persist visited state for", currentQuestion.id);
            }
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [currentIdx, currentQuestion?.id, initComplete, setVisitedQuestions, visitedQuestionsRef, questionEntryTimeRef, attemptRef]);

  useEffect(() => { if (!initComplete) return; visitedQuestionsRef.current = visitedQuestions; }, [visitedQuestions, initComplete, visitedQuestionsRef]);
  useEffect(() => { if (!initComplete) return; currentIdxRef.current = currentIdx; }, [currentIdx, initComplete, currentIdxRef]);

  const handleNext = useCallback(() => {
    if (canProceed) goToQuestion(currentIdx + 1);
  }, [canProceed, currentIdx, goToQuestion]);

  const handleSkip = useCallback(() => {
    if (!hasAnswer) goToQuestion(currentIdx + 1);
  }, [hasAnswer, currentIdx, goToQuestion]);

  const handlePrev = useCallback(() => {
    goToQuestion(currentIdx - 1);
  }, [currentIdx, goToQuestion]);

  return {
    currentIdx,
    currentQuestion,
    isLastQuestion,
    isFirstQuestion,
    hasAnswer,
    isMarked,
    canProceed,
    goToQuestion,
    handleNext,
    handleSkip,
    handlePrev,
  };
}
