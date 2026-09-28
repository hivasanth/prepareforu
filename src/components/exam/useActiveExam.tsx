import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useExamSecurity } from '../../pages/exam/hooks/useExamSecurity';
import { useExamKeyboard } from '../../pages/exam/hooks/useExamKeyboard';
import { useExamInitialization } from '../../pages/exam/hooks/useExamInitialization';
import { useExamSession } from '../../pages/exam/hooks/useExamSession';
import { useQuestionNavigation } from '../../pages/exam/hooks/useQuestionNavigation';
import { useExamSubmission } from '../../pages/exam/hooks/useExamSubmission';
import { QuestionVisualizer } from '../common/QuestionVisualizer';
import { DiagramRenderer } from '../common/DiagramRenderer';
import type { Question, Attempt, ExamPaper } from '../../types/exam.types';

export function useActiveExam() {
  const { paperId } = useParams<{ paperId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | null>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [displayLang, setDisplayLang] = useState<'en' | 'te'>('en');
  const [showStatusBoard, setShowStatusBoard] = useState(true);

  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());

  // Contextual exam banner (Group 5: floating toasts eliminated).
  // Security warnings persist until dismissed; action errors auto-dismiss.
  const [examBanner, setExamBanner] = useState<{ kind: 'error' | 'warning'; message: string } | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissExamBanner = useCallback(() => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setExamBanner(null);
  }, []);

  const showExamBanner = useCallback((message: string, kind: 'error' | 'warning' = 'error') => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setExamBanner({ kind, message });
    if (kind === 'error') {
      bannerTimerRef.current = setTimeout(() => setExamBanner(null), 5000);
    }
  }, []);

  useEffect(() => () => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
  }, []);

  const visitedQuestionsRef = useRef<Set<string>>(new Set());
  const markedForReviewRef = useRef<Set<string>>(new Set());
  const currentIdxRef = useRef(0);

  const isActuallySubmitted = useRef(false);
  const attemptRef = useRef<Attempt | null>(null);
  const selectedAnswersRef = useRef<Record<string, string | null>>({});
  const paperRef = useRef<ExamPaper | null>(null);
  const isAutoSubmittingRef = useRef(false);
  const questionEntryTimeRef = useRef<number>(Date.now());
  const questionTimeSpentRef = useRef<Record<string, number>>({});

  const examSource = (location.state as any)?.source || 'exam_tab';
  const showSubjectName = (location.state as any)?.showSubjectName !== false;

  const {
    phase,
    loading,
    error,
    initComplete,
    teluguAvailable,
    initExam,
    handleLanguageSelect,
  } = useExamInitialization({
    paperId,
    user,
    location,
    navigate,
    setPaper,
    setAttempt,
    setQuestions,
    setSelectedAnswers,
    setVisitedQuestions,
    setMarkedForReview,
    setCurrentIdx,
    setDisplayLang,
    attemptRef,
    selectedAnswersRef,
    visitedQuestionsRef,
    markedForReviewRef,
    questionTimeSpentRef,
    currentIdxRef,
    paperRef,
  });

  const {
    showFullscreenPrompt,
    fullscreenViolations,
    requestFullscreen,
  } = useExamSecurity({
    initComplete,
    loading,
    attemptId: attempt?.id,
    isActuallySubmitted,
    onSecurityNotice: (message) => showExamBanner(message, 'warning'),
  });

  const {
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
  } = useQuestionNavigation({
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
  });

  const {
    examStats,
    handleOptionSelect,
    clearAnswer,
    toggleMarkForReview,
  } = useExamSession({
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
    selectedAnswersRef,
    markedForReviewRef,
    setSelectedAnswers,
    setMarkedForReview,
    onError: (message) => showExamBanner(message, 'error'),
  });

  useExamKeyboard({
    initComplete,
    isSubmitting,
    isSubmitModalOpen,
    loading,
    currentIdx,
    questionsLength: questions.length,
    isLastQuestion,
    goToQuestion,
    handleOptionSelect,
    clearAnswer,
    toggleMarkForReview,
    setIsSubmitModalOpen,
  });

  // Refs are synced directly at each setter call site (FIX-10).

  const { finalSubmit, onTimeUp } = useExamSubmission({
    currentQuestion,
    navigate,
    examSource,
    user,
    onError: (message) => showExamBanner(message, 'error'),
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
  });

  const visualNode = useMemo(() => currentQuestion?.visual && (
    <div className="mb-8 rounded-2xl overflow-hidden border border-border-subtle">
      <QuestionVisualizer visual={currentQuestion.visual} />
    </div>
  ), [currentQuestion?.visual]);

  const diagramNode = useMemo(() => currentQuestion?.diagram && (
    <div className="mb-8 p-4 bg-hover-bg/20 rounded-2xl border border-border-subtle">
      <DiagramRenderer diagram={currentQuestion.diagram} />
    </div>
  ), [currentQuestion?.diagram]);

  return {
    phase, loading, error, initComplete,
    paper, attempt, questions,
    visitedQuestions, markedForReview,
    displayLang, setDisplayLang,
    currentIdx, currentQuestion, isFirstQuestion, isLastQuestion,
    hasAnswer, isMarked, canProceed,
    goToQuestion, handleNext, handleSkip, handlePrev,
    selectedAnswers, handleOptionSelect, clearAnswer, toggleMarkForReview,
    examStats,
    isSubmitting, isAutoSubmitting, isSubmitModalOpen, setIsSubmitModalOpen,
    showStatusBoard, setShowStatusBoard,
    finalSubmit, onTimeUp,
    showFullscreenPrompt, fullscreenViolations, requestFullscreen,
    examSource, showSubjectName,
    visualNode, diagramNode,
    examBanner, dismissExamBanner, showExamBanner,
    teluguAvailable, handleLanguageSelect,
    initExam,
    navigate,
  };
}
