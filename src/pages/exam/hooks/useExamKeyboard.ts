import { useEffect } from 'react';
import { SELECTED_OPTIONS } from '../../../validations/questionSchema';

interface UseExamKeyboardOptions {
  initComplete: boolean;
  isSubmitting: boolean;
  isSubmitModalOpen: boolean;
  loading: boolean;
  currentIdx: number;
  questionsLength: number;
  isLastQuestion: boolean;
  goToQuestion: (index: number) => void;
  handleOptionSelect: (option: string) => void | Promise<void>;
  clearAnswer: () => void;
  toggleMarkForReview: () => void;
  setIsSubmitModalOpen: (open: boolean) => void;
}

export function useExamKeyboard({
  initComplete,
  isSubmitting,
  isSubmitModalOpen,
  loading,
  currentIdx,
  questionsLength,
  isLastQuestion,
  goToQuestion,
  handleOptionSelect,
  clearAnswer,
  toggleMarkForReview,
  setIsSubmitModalOpen,
}: UseExamKeyboardOptions): void {
  useEffect(() => {
    if (!initComplete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting || isSubmitModalOpen || loading) return;
      if (e.key === 'ArrowRight') goToQuestion(Math.min(questionsLength - 1, currentIdx + 1));
      if (e.key === 'ArrowLeft') goToQuestion(Math.max(0, currentIdx - 1));
      if (['1', '2', '3', '4'].includes(e.key)) handleOptionSelect(SELECTED_OPTIONS[parseInt(e.key) - 1]);
      if (e.key === 'q' || e.key === 'Q') clearAnswer();
      if (e.key === 'm' || e.key === 'M') toggleMarkForReview();
      if (e.key === 'Enter' && isLastQuestion) setIsSubmitModalOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentIdx, questionsLength, isLastQuestion,
    isSubmitting, isSubmitModalOpen, loading,
    goToQuestion, handleOptionSelect, clearAnswer, toggleMarkForReview,
    initComplete, setIsSubmitModalOpen,
  ]);
}
