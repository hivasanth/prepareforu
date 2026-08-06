import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { addQuestionTime, syncAnswersCache, submitAttempt } from '../../../services/examService';
import { executeWithRetry } from '../../../services/persistenceRetry';
import { clearExamSession } from '../../../utils/examSessionStore';
import type { Question, Attempt, ExamPaper } from '../../../types/exam.types';

interface UseExamSubmissionOptions {
  questions: Question[];
  currentQuestion: Question | undefined;
  navigate: NavigateFunction;
  examSource: string;
  user: { id?: string } | null;
  onError: (message: string) => void;
  setIsSubmitting: (v: boolean) => void;
  setIsSubmitModalOpen: (v: boolean) => void;
  setIsAutoSubmitting: (v: boolean) => void;
  attemptRef: React.MutableRefObject<Attempt | null>;
  selectedAnswersRef: React.MutableRefObject<Record<string, string | null>>;
  paperRef: React.MutableRefObject<ExamPaper | null>;
  questionEntryTimeRef: React.MutableRefObject<number>;
  questionTimeSpentRef: React.MutableRefObject<Record<string, number>>;
  isActuallySubmitted: React.MutableRefObject<boolean>;
  isAutoSubmittingRef: React.MutableRefObject<boolean>;
}

interface UseExamSubmissionReturn {
  finalSubmit: () => Promise<void>;
  onTimeUp: () => void;
}

export function useExamSubmission({
  questions,
  currentQuestion,
  navigate,
  examSource,
  user,
  onError,
  setIsSubmitting,
  setIsSubmitModalOpen,
  setIsAutoSubmitting,
  attemptRef,
  selectedAnswersRef,
  paperRef,
  questionEntryTimeRef,
  questionTimeSpentRef,
  isActuallySubmitted,
  isAutoSubmittingRef,
}: UseExamSubmissionOptions): UseExamSubmissionReturn {
  const finalSubmit = useCallback(async () => {
    const currentAttempt = attemptRef.current;
    const currentAnswers = selectedAnswersRef.current;
    const currentPaper = paperRef.current;
    if (!currentAttempt || isActuallySubmitted.current) return;
    isActuallySubmitted.current = true;
    setIsSubmitting(true);
    setIsSubmitModalOpen(false);
    try {
      if (currentQuestion) {
        const elapsed = Math.floor((Date.now() - questionEntryTimeRef.current) / 1000);
        questionTimeSpentRef.current[currentQuestion.id] = (questionTimeSpentRef.current[currentQuestion.id] || 0) + elapsed;
      }
      const questionMap = new Map(questions.map(q => [q.id, q]));
      Promise.allSettled(
        Object.entries(questionTimeSpentRef.current)
          .filter(([, secs]) => secs > 0)
          .map(([qId, secs]) => {
            const correctOption = questionMap.get(qId)?.correct_option || '';
            return executeWithRetry(
              `${qId}-time`,
              () => addQuestionTime(currentAttempt.id, qId, correctOption, secs),
            );
          })
      ).catch(() => {});
      await syncAnswersCache(currentAttempt.id, currentAnswers as Record<string, string | null>);
      const result = await submitAttempt(currentAttempt.id, user?.id);
      clearExamSession();
      if (user?.id) {
        const { clearPerformanceCache } = await import('../../../services/performanceService');
        clearPerformanceCache(user.id);
      }
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      navigate(`/review/${currentAttempt.id}`, {
        state: { result, examTitle: currentPaper?.paper_name, paperName: currentPaper?.paper_name, source: examSource }
      });
    } catch {
      isActuallySubmitted.current = false;
      setIsSubmitting(false);
      onError('Failed to submit. Please check your connection.');
    }
  }, [user?.id, navigate, examSource, currentQuestion?.id, questions, attemptRef, selectedAnswersRef, paperRef, questionEntryTimeRef, questionTimeSpentRef, isActuallySubmitted, setIsSubmitting, setIsSubmitModalOpen, onError]);

  const onTimeUp = useCallback(() => {
    if (isAutoSubmittingRef.current || isActuallySubmitted.current) return;
    isAutoSubmittingRef.current = true;
    setIsAutoSubmitting(true);
    setIsSubmitModalOpen(true);
    setTimeout(finalSubmit, 2000);
  }, [finalSubmit, isAutoSubmittingRef, isActuallySubmitted, setIsAutoSubmitting, setIsSubmitModalOpen]);

  return { finalSubmit, onTimeUp };
}

