import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Layers, BookOpen, Send } from 'lucide-react';
import { Button, IconBadge } from '../../components/common/AntigravityUI';
import { useTheme } from '../../context/ThemeContext';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

import { QuestionVisualizer } from '../../components/common/QuestionVisualizer';
import { DiagramRenderer } from '../../components/common/DiagramRenderer';
import { ExamTimer } from '../../components/ExamTimer';
import { LanguageSelectionScreen } from '../../components/exam';
import {
  ExamLayout,
  ExamHeader,
  QuestionCard,
  QuestionNavigator,
  MobileActionBar,
  StatusBoard,
  MobileQuestionStrip,
  SubmitExamModal,
} from '../../components/exam';

import { supabase } from '../../lib/supabase';
import {
  fetchPaperWithSubjects,
  fetchQuestionsForPaper,
  fetchAttemptAnswers,
  createAttempt,
  touchQuestionVisit,
  setQuestionAnswer,
  setQuestionReview,
  addQuestionTime,
  syncAnswersCache,
  submitAttempt
} from '../../services/examService';
import { executeWithRetry, StaleOperationError, clearAllPendingOperations } from '../../services/persistenceRetry';
import {
  lockExamLanguage,
  clearExamSession,
  resolveQuestionsForSession,
  detectTeluguAvailability
} from '../../utils/examSessionStore';
import { computeExamStatistics, computeQuestionState } from '../../utils/examStateCalculator';
import type { Question, Attempt, ExamPaper } from '../../types/exam.types';
import type { SupportedLanguage } from '../../utils/languageUtils';

export default function ActiveExamPage() {
  const { paperId } = useParams<{ paperId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showToast } = useToast();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | null>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayLang, setDisplayLang] = useState<'en' | 'te'>('en');
  const [fullscreenViolations, setFullscreenViolations] = useState(0);

  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());

  // ── Refs for mutable runtime state (avoid stale closures) ────────────────
  const visitedQuestionsRef = useRef<Set<string>>(new Set());
  const markedForReviewRef = useRef<Set<string>>(new Set());
  const currentIdxRef = useRef(0);

  const examSource = (location.state as any)?.source || 'exam_tab';
  const showSubjectName = (location.state as any)?.showSubjectName !== false;

  const [phase, setPhase] = useState<'loading' | 'lang_select' | 'exam'>('loading');
  const [rawQuestions, setRawQuestions] = useState<Question[]>([]);
  const [teluguAvailable, setTeluguAvailable] = useState(false);
  const [initComplete, setInitComplete] = useState(false);

  const lastSyncAnswers = useRef<string>('');
  const syncTimeoutRef = useRef<any>(null);
  const isActuallySubmitted = useRef(false);
  const attemptRef = useRef<Attempt | null>(null);
  const selectedAnswersRef = useRef<Record<string, string | null>>({});
  const paperRef = useRef<ExamPaper | null>(null);
  const isAutoSubmittingRef = useRef(false);
  const subjectMarksRef = useRef<Record<string, number>>({});
  const questionEntryTimeRef = useRef<number>(Date.now());
  const questionTimeSpentRef = useRef<Record<string, number>>({});

  const currentQuestion = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;
  const isFirstQuestion = currentIdx === 0;
  const examStats = computeExamStatistics(questions, selectedAnswers, markedForReview, visitedQuestions, undefined, attempt?.duration_seconds ?? undefined);

  // ─── Navigation ──────────────────────────────────────────────────────────────
  const goToQuestion = useCallback(async (index: number) => {
    if (index < 0 || index >= questions.length) return;
    const currentId = questions[currentIdxRef.current]?.id;

    // Persist time spent on the SOURCE question before leaving
    const currentAttempt = attemptRef.current;
    if (currentId && currentAttempt) {
      const elapsed = Math.floor((Date.now() - questionEntryTimeRef.current) / 1000);
      const total = (questionTimeSpentRef.current[currentId] || 0) + elapsed;

      questionTimeSpentRef.current[currentId] = total;
      // Fire-and-forget: persist accumulated time to DB via atomic function
      const sourceCorrectOption = questions[currentIdxRef.current]?.correct_option || '';
      executeWithRetry(
        `${currentId}-time`,
        () => addQuestionTime(currentAttempt.id, currentId, sourceCorrectOption, elapsed),
      ).catch((err) => {
        if (!(err instanceof StaleOperationError)) {
          console.warn("Failed to persist time for", currentId);
        }
      });
    }
    setCurrentIdx(index);
    currentIdxRef.current = index;
    questionEntryTimeRef.current = Date.now();

    // Mark TARGET question visited (only touches visited + last_visited_at in DB)
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
          () => touchQuestionVisit(targetAttempt.id, targetId, questions[index].correct_option),
        );
      } catch (err) {
        if (!(err instanceof StaleOperationError)) {
          console.warn("Failed to persist visited state for", targetId);
        }
      }
    }
  }, [questions]);

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
              () => touchQuestionVisit(visitAttempt.id, currentQuestion.id, currentQuestion.correct_option),
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
  }, [currentIdx, currentQuestion?.id, initComplete]);

  // ─── State-backed Init (subject_test / topic_exam / prepare_write) ─────────
  const initStateBackedExam = useCallback(async (state: any) => {
    if (!user) return;
    try {
      setError(null);
      setLoading(true);
      setPhase('loading');
      const qs: Question[] = [...state.questions];
      const result = await createAttempt({
        userId: user.id,
        source: state.source || 'subject_test',
        totalMarks: state.totalMarks || qs.length,
        questionsSnapshot: qs,
        forceNew: false
      });
      const attemptData = result.attemptData || null;

      // ── Pre-fetch ALL persisted state BEFORE any state writes ──
      let restoredAnswers: Record<string, string | null> = {};
      let restoredVisited = new Set<string>();
      let restoredMarked = new Set<string>();
      let restoredTimeSpent: Record<string, number> = {};
      let restoredCurrentIdx = 0;

      if (result.isResumed && attemptData) {
        try {
          const existingRows = await fetchAttemptAnswers(attemptData.id);
          let lastVisitedId: string | null = null;
          let lastVisitedAt = 0;
          for (const row of existingRows) {
            if (row.selected_option !== null) {
              restoredAnswers[row.question_id] = row.selected_option;
            } else if (row.visited) {
              restoredAnswers[row.question_id] = null;
            }
            if (row.visited) restoredVisited.add(row.question_id);
            if (row.marked_for_review) restoredMarked.add(row.question_id);
            if (row.time_spent_secs > 0) restoredTimeSpent[row.question_id] = row.time_spent_secs;
            if (row.visited && row.last_visited_at) {
              const visitedTime = new Date(row.last_visited_at).getTime();
              if (visitedTime > lastVisitedAt) {
                lastVisitedAt = visitedTime;
                lastVisitedId = row.question_id;
              }
            }
          }
          if (lastVisitedId) {
            const idx = qs.findIndex(q => q.id === lastVisitedId);
            if (idx >= 0) restoredCurrentIdx = idx;
          }
        } catch {
          const fallback = (attemptData.answers_json || {}) as Record<string, string | null>;
          for (const q of qs) {
            if (fallback[q.id] !== undefined) restoredAnswers[q.id] = fallback[q.id];
          }
        }
      }

      // ── Write ALL runtime state in one synchronous batch ──
      attemptRef.current = attemptData;
      selectedAnswersRef.current = restoredAnswers;
      visitedQuestionsRef.current = restoredVisited;
      markedForReviewRef.current = restoredMarked;
      questionTimeSpentRef.current = restoredTimeSpent;
      currentIdxRef.current = restoredCurrentIdx;
      setQuestions(qs);
      setAttempt(attemptData);
      setPaper({
        id: paperId || 'practice',
        exam_id: '',
        paper_name: state.title || 'Practice Exam',
        stage: 'SINGLE',
        total_questions: qs.length,
        total_marks: state.totalMarks || qs.length,
        duration_minutes: state.durationMinutes || 30,
        negative_marking: state.negativeMarkValue > 0,
        negative_mark_value: state.negativeMarkValue || 0,
        display_order: 0
      });
      setDisplayLang('en');
      setSelectedAnswers(restoredAnswers);
      setVisitedQuestions(restoredVisited);
      setMarkedForReview(restoredMarked);
      setCurrentIdx(restoredCurrentIdx);
      setPhase('exam');
      setInitComplete(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start exam.');
      setInitComplete(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id, paperId]);

  const initExam = useCallback(async () => {
    const state = location.state as Record<string, any> | null;
    if (state?.source && state?.source !== 'exam_tab' && state?.source !== 'teacher_exam' && state?.questions) {
      await initStateBackedExam(state);
      return;
    }
    if (state?.source === 'teacher_exam' && state?.attemptId && state?.questions) {
      try {
        setError(null);
        setLoading(true);
        setPhase('loading');
        clearExamSession();
        const { data: attemptData, error: attemptErr } = await supabase
          .from('attempts').select('*').eq('id', state.attemptId).single();
        if (attemptErr || !attemptData) throw new Error('Failed to load exam attempt.');
        const resolvedQ: Question[] = [...state.questions];

        // ── Pre-fetch ALL persisted state BEFORE any state writes ──
        let restoredAnswers: Record<string, string | null> = {};
        let restoredVisited = new Set<string>();
        let restoredMarked = new Set<string>();
        let restoredTimeSpent: Record<string, number> = {};
        let restoredCurrentIdx = 0;

        try {
          const existingRows = await fetchAttemptAnswers(attemptData.id);
          let lastVisitedId: string | null = null;
          let lastVisitedAt = 0;
          for (const row of existingRows) {
            if (row.selected_option !== null) {
              restoredAnswers[row.question_id] = row.selected_option;
            } else if (row.visited) {
              restoredAnswers[row.question_id] = null;
            }
            if (row.visited) restoredVisited.add(row.question_id);
            if (row.marked_for_review) restoredMarked.add(row.question_id);
            if (row.time_spent_secs > 0) restoredTimeSpent[row.question_id] = row.time_spent_secs;
            if (row.visited && row.last_visited_at) {
              const visitedTime = new Date(row.last_visited_at).getTime();
              if (visitedTime > lastVisitedAt) {
                lastVisitedAt = visitedTime;
                lastVisitedId = row.question_id;
              }
            }
          }
          if (lastVisitedId) {
            const idx = resolvedQ.findIndex(q => q.id === lastVisitedId);
            if (idx >= 0) restoredCurrentIdx = idx;
          }
        } catch {
          const fallback = (attemptData.answers_json || {}) as Record<string, string | null>;
          for (const q of resolvedQ) {
            if (fallback[q.id] !== undefined) restoredAnswers[q.id] = fallback[q.id];
          }
        }

        // ── Write ALL runtime state in one synchronous batch ──
        attemptRef.current = attemptData as Attempt;
        selectedAnswersRef.current = restoredAnswers;
        visitedQuestionsRef.current = restoredVisited;
        markedForReviewRef.current = restoredMarked;
        questionTimeSpentRef.current = restoredTimeSpent;
        currentIdxRef.current = restoredCurrentIdx;
        setQuestions(resolvedQ);
        setAttempt(attemptData as Attempt);
        setSelectedAnswers(restoredAnswers);
        setVisitedQuestions(restoredVisited);
        setMarkedForReview(restoredMarked);
        setCurrentIdx(restoredCurrentIdx);
        setPhase('exam');
        setInitComplete(true);
      } catch {
        setError('Failed to load educator exam.');
        setInitComplete(true);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!paperId || !user) return;
    try {
      setError(null);
      setLoading(true);
      setPhase('loading');
      clearExamSession();
      const { paper: paperData, subjects } = await fetchPaperWithSubjects(paperId);
      setPaper(paperData);
      const marksMap: Record<string, number> = {};
      subjects.forEach(s => { marksMap[s.subject_name] = s.marks_per_question; });
      subjectMarksRef.current = marksMap;

      // Detect existing in_progress attempt BEFORE generating questions.
      // On resume, questions_snapshot is immutable — never regenerate.
      const { data: existingAttempt } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('paper_id', paperId)
        .eq('status', 'in_progress')
        .eq('source', 'exam_tab')
        .maybeSingle();

      let fetchedQuestions: Question[];
      if (existingAttempt?.questions_snapshot?.length) {
        fetchedQuestions = existingAttempt.questions_snapshot as Question[];
      } else {
        fetchedQuestions = await fetchQuestionsForPaper(paperId, subjects, user.id);
      }

      const hasTE = detectTeluguAvailability(fetchedQuestions);
      setRawQuestions(fetchedQuestions);
      setTeluguAvailable(hasTE);
      setLoading(false);
      await _startExam(paperData, fetchedQuestions, 'en');
    } catch (err: any) {
      setError(err.message || "Failed to load exam.");
      setInitComplete(true);
      setLoading(false);
    }
  }, [paperId, user?.id, location.state]);

  const _startExam = useCallback(async (paperData: typeof paper, questionsToResolve: Question[], lang: SupportedLanguage) => {
    if (!paperId || !user || !paperData) return;
    try {
      setLoading(true);
      lockExamLanguage(paperId, lang, questionsToResolve.length);
      const resolvedFrozen = resolveQuestionsForSession(questionsToResolve, paperId);
      const resolvedQuestions: Question[] = [...resolvedFrozen];
      const { attemptData, isResumed } = await createAttempt({
        userId: user.id,
        paperId: paperId,
        examId: paperData.exam_id,
        source: 'exam_tab',
        totalMarks: paperData.total_marks,
        questionsSnapshot: resolvedQuestions,
        forceNew: false
      });
      if (isResumed && attemptData && paperData.duration_minutes > 0) {
        const elapsed = Date.now() - new Date(attemptData.started_at).getTime();
        const durationMs = paperData.duration_minutes * 60 * 1000;
        if (elapsed >= durationMs) {
          try {
            const result = await submitAttempt(attemptData.id, user.id);
            clearExamSession();
            navigate(`/review/${attemptData.id}`, { replace: true, state: { result, examTitle: paperData.paper_name, paperName: paperData.paper_name } });
          } catch {
            setError('Your previous session has expired. Please start a new attempt.');
          }
          setInitComplete(true);
          return;
        }
      }
      const finalQuestions = isResumed && attemptData?.questions_snapshot?.length ? attemptData.questions_snapshot : resolvedQuestions;
      const finalAttempt = attemptData || null;

      // ── Pre-fetch ALL persisted state BEFORE any state writes ──
      // This eliminates intermediate renders with partial state.
      let restoredAnswers: Record<string, string | null> = {};
      let restoredVisited = new Set<string>();
      let restoredMarked = new Set<string>();
      let restoredTimeSpent: Record<string, number> = {};
      let restoredCurrentIdx = 0;

      if (isResumed && attemptData) {
        try {
          const existingRows = await fetchAttemptAnswers(attemptData.id);
          let lastVisitedId: string | null = null;
          let lastVisitedAt = 0;
          for (const row of existingRows) {
            if (row.selected_option !== null) {
              restoredAnswers[row.question_id] = row.selected_option;
            } else if (row.visited) {
              restoredAnswers[row.question_id] = null;
            }
            if (row.visited) restoredVisited.add(row.question_id);
            if (row.marked_for_review) restoredMarked.add(row.question_id);
            if (row.time_spent_secs > 0) restoredTimeSpent[row.question_id] = row.time_spent_secs;
            if (row.visited && row.last_visited_at) {
              const visitedTime = new Date(row.last_visited_at).getTime();
              if (visitedTime > lastVisitedAt) {
                lastVisitedAt = visitedTime;
                lastVisitedId = row.question_id;
              }
            }
          }
          if (lastVisitedId) {
            const idx = finalQuestions.findIndex(q => q.id === lastVisitedId);
            if (idx >= 0) restoredCurrentIdx = idx;
          }
        } catch {
          const fallback = (attemptData.answers_json || {}) as Record<string, string | null>;
          for (const q of finalQuestions) {
            if (fallback[q.id] !== undefined) restoredAnswers[q.id] = fallback[q.id];
          }
        }
      }

      // ── Write ALL runtime state in one synchronous batch ──
      attemptRef.current = finalAttempt;
      paperRef.current = paperData;
      selectedAnswersRef.current = restoredAnswers;
      visitedQuestionsRef.current = restoredVisited;
      markedForReviewRef.current = restoredMarked;
      questionTimeSpentRef.current = restoredTimeSpent;
      currentIdxRef.current = restoredCurrentIdx;
      setQuestions(finalQuestions);
      setAttempt(finalAttempt);
      setSelectedAnswers(restoredAnswers);
      setVisitedQuestions(restoredVisited);
      setMarkedForReview(restoredMarked);
      setCurrentIdx(restoredCurrentIdx);
      setPhase('exam');
      setInitComplete(true);
    } catch (err: any) {
      setError(err.message || "Failed to start exam.");
      setInitComplete(true);
    } finally {
      setLoading(false);
    }
  }, [paperId, user?.id, navigate]);

  const handleLanguageSelect = useCallback((lang: SupportedLanguage) => {
    _startExam(paper, rawQuestions, lang);
  }, [_startExam, paper, rawQuestions]);

  useEffect(() => {
    initExam();
  }, [initExam]);

  useEffect(() => {
    if (!initComplete) return;
    return () => {
      clearAllPendingOperations();
    };
  }, [attempt?.id, initComplete]);

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
      showError("Failed to save review flag. Please try again.");
    }
  }, [currentQuestion, attempt, paper, showError]);

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
          option as 'A' | 'B' | 'C' | 'D',
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
      } else {
      }
      showError("Failed to save answer. Please try again.");
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
      } else {
      }
      showError("Failed to clear answer. Please try again.");
    }
  };

  // ─── Keyboard Shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    if (!initComplete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting || isSubmitModalOpen || loading) return;
      if (e.key === 'ArrowRight') goToQuestion(Math.min(questions.length - 1, currentIdx + 1));
      if (e.key === 'ArrowLeft') goToQuestion(Math.max(0, currentIdx - 1));
      if (['1', '2', '3', '4'].includes(e.key)) handleOptionSelect(['A', 'B', 'C', 'D'][parseInt(e.key) - 1]);
      if (e.key === 'q' || e.key === 'Q') clearAnswer();
      if (e.key === 'm' || e.key === 'M') toggleMarkForReview();
      if (e.key === 'Enter' && isLastQuestion) setIsSubmitModalOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentIdx, questions.length, isLastQuestion,
    isSubmitting, isSubmitModalOpen, loading,
    goToQuestion, handleOptionSelect, clearAnswer, toggleMarkForReview,
    initComplete,
  ]);

  // ─── Keep refs in sync ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!initComplete) return;
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers, initComplete]);
  useEffect(() => { if (!initComplete) return; visitedQuestionsRef.current = visitedQuestions; }, [visitedQuestions, initComplete]);
  useEffect(() => { if (!initComplete) return; markedForReviewRef.current = markedForReview; }, [markedForReview, initComplete]);
  useEffect(() => { if (!initComplete) return; currentIdxRef.current = currentIdx; }, [currentIdx, initComplete]);
  useEffect(() => { if (!initComplete) return; paperRef.current = paper; }, [paper, initComplete]);
  useEffect(() => { if (!initComplete) return; attemptRef.current = attempt; }, [attempt, initComplete]);

  // ─── Fullscreen (user-gesture only) ──────────────────────────────────────────
  const requestFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (!elem.requestFullscreen) return;
    elem.requestFullscreen()
      .then(() => setShowFullscreenPrompt(false))
      .catch(() => setShowFullscreenPrompt(true));
  }, []);

  useEffect(() => {
    if (!initComplete || loading || !attempt) return;
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const preventCopyPaste = (e: Event) => { e.preventDefault(); showToast('Security Policy disabled during exams.', 'warning'); };
    const handleFullscreenChange = () => {
      if (document.fullscreenElement || isActuallySubmitted.current) return;
      setShowFullscreenPrompt(true);
      setFullscreenViolations(prev => prev + 1);
      showToast('Maintain fullscreen during the exam.', 'warning');
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('selectstart', preventCopyPaste);
    document.addEventListener('dragstart', preventCopyPaste);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('selectstart', preventCopyPaste);
      document.removeEventListener('dragstart', preventCopyPaste);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loading, attempt?.id, showToast, initComplete]);

  const finalSubmit = useCallback(async () => {
    const currentAttempt = attemptRef.current;
    const currentAnswers = selectedAnswersRef.current;
    const currentPaper = paperRef.current;
    if (!currentAttempt || isActuallySubmitted.current) return;
    isActuallySubmitted.current = true;
    setIsSubmitting(true);
    setIsSubmitModalOpen(false);
    try {
      // Accumulate final time on current question before submitting
      if (currentQuestion) {
        const elapsed = Math.floor((Date.now() - questionEntryTimeRef.current) / 1000);
        questionTimeSpentRef.current[currentQuestion.id] = (questionTimeSpentRef.current[currentQuestion.id] || 0) + elapsed;
      }
      // Final flush of all per-question time to DB via retry infrastructure
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
        const { clearPerformanceCache } = await import('../../services/performanceService');
        clearPerformanceCache(user.id);
      }
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      navigate(`/review/${currentAttempt.id}`, {
        state: { result, examTitle: currentPaper?.paper_name, paperName: currentPaper?.paper_name, source: examSource }
      });
    } catch {
      isActuallySubmitted.current = false;
      setIsSubmitting(false);
      showError('Failed to submit. Please check your connection.');
    }
  }, [user?.id, navigate, examSource, currentQuestion?.id, questions]);

  const onTimeUp = useCallback(() => {
    if (isAutoSubmittingRef.current || isActuallySubmitted.current) return;
    isAutoSubmittingRef.current = true;
    setIsAutoSubmitting(true);
    setIsSubmitModalOpen(true);
    setTimeout(finalSubmit, 2000);
  }, [finalSubmit]);

  // ─── Navigation Logic (CBT behavior) ───────────────────────────────────────
  const currentQState = currentQuestion ? computeQuestionState(currentQuestion.id, currentIdx, currentIdx, selectedAnswers, markedForReview, visitedQuestions) : null;
  const hasAnswer = currentQState?.isAnswered ?? false;
  const isMarked = currentQState?.isMarked ?? false;
  const canProceed = hasAnswer || isMarked;

  const handleNext = useCallback(() => {
    if (canProceed) goToQuestion(currentIdx + 1);
  }, [canProceed, currentIdx, goToQuestion]);

  const handleSkip = useCallback(() => {
    if (!hasAnswer) goToQuestion(currentIdx + 1);
  }, [hasAnswer, currentIdx, goToQuestion]);

  const handlePrev = useCallback(() => {
    goToQuestion(currentIdx - 1);
  }, [currentIdx, goToQuestion]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080810] p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-[#11111d] rounded-2xl p-8 text-center border border-white/10">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Failed to load exam</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => initExam()} fullWidth>Retry Connection</Button>
            <Button variant="secondary" onClick={() => navigate('/exams')} fullWidth>Back to Dashboard</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-app-bg flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-text-secondary text-[10px] uppercase font-black tracking-widest animate-pulse">
          {phase === 'lang_select' ? 'Creating secure session' : 'Initializing secure environment'}
        </p>
      </div>
    );
  }

  if (phase === 'lang_select' && paper) {
    return (
      <LanguageSelectionScreen
        paperName={paper.paper_name}
        teluguAvailable={teluguAvailable}
        onSelect={handleLanguageSelect}
      />
    );
  }

  if (!attempt || !questions.length) return null;

  const visualNode = currentQuestion?.visual && (
    <div className="mb-8 rounded-2xl overflow-hidden border border-border-subtle">
      <QuestionVisualizer visual={currentQuestion.visual} />
    </div>
  );

  const diagramNode = currentQuestion?.diagram && (
    <div className="mb-8 p-4 bg-hover-bg/20 rounded-2xl border border-border-subtle">
      <DiagramRenderer diagram={currentQuestion.diagram} />
    </div>
  );

  return (
    <ExamLayout
      showFullscreenPrompt={showFullscreenPrompt}
      onRequestFullscreen={requestFullscreen}
    >
      <ExamHeader
        title={paper?.paper_name || ''}
        subtitle={showSubjectName && currentQuestion?.subject_name ? (
          <span className="flex items-center gap-1.5">
            <BookOpen size={12} />
            {currentQuestion.subject_name}
          </span>
        ) : undefined}
        timerSlot={
          <ExamTimer
            attemptId={attempt.id}
            durationMinutes={paper?.duration_minutes || 0}
            startedAt={attempt.started_at}
            onTimeUp={onTimeUp}
            initialTabSwitches={attempt.tab_switch_count}
          />
        }
        leftActions={
          <IconBadge icon={Layers} size="lg" className="hidden sm:flex" />
        }
        rightActions={
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs rounded-[13px] uppercase tracking-widest shadow-lg font-black transition-all active:scale-95 ${
              isDark
                ? 'bg-danger text-white shadow-danger/20 hover:bg-danger/90'
                : 'ancient-btn-danger'
            }`}
          >
            <Send size={14} />
            <span>Finish</span>
          </button>
        }
      />

      <main className="flex-1 flex overflow-hidden relative max-w-[1360px] mx-auto w-full">
        <section className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-6 md:py-8 custom-scrollbar scroll-smooth min-w-0">
          <div className="flex flex-col gap-6 w-full">
            <QuestionCard
              question={currentQuestion}
              index={currentIdx}
              total={questions.length}
              displayLang={displayLang}
              onToggleLang={setDisplayLang}
              selectedAnswer={selectedAnswers[currentQuestion.id]}
              onSelectOption={handleOptionSelect}
              isMarkedForReview={isMarked}
              onToggleReview={toggleMarkForReview}
              visualNode={visualNode}
              diagramNode={diagramNode}
            />

            <QuestionNavigator
              isFirstQuestion={isFirstQuestion}
              isLastQuestion={isLastQuestion}
              hasAnswer={hasAnswer}
              isMarkedForReview={isMarked}
              onPrev={handlePrev}
              onNext={handleNext}
              onClear={clearAnswer}
              onSubmit={() => setIsSubmitModalOpen(true)}
              onSkip={handleSkip}
            />
          </div>
        </section>

        <StatusBoard
          questions={questions}
          currentIdx={currentIdx}
          selectedAnswers={selectedAnswers}
          markedForReview={markedForReview}
          visitedQuestions={visitedQuestions}
          fullscreenViolations={fullscreenViolations}
          onJumpTo={goToQuestion}
          stats={examStats}
        />
      </main>

      <MobileQuestionStrip
        questions={questions}
        currentIdx={currentIdx}
        selectedAnswers={selectedAnswers}
        markedForReview={markedForReview}
        visitedQuestions={visitedQuestions}
        onJumpTo={goToQuestion}
      />

      <MobileActionBar
        isFirstQuestion={isFirstQuestion}
        isLastQuestion={isLastQuestion}
        hasAnswer={hasAnswer}
        canProceed={canProceed}
        onPrev={handlePrev}
        onNext={handleNext}
        onClear={clearAnswer}
        onSubmit={() => setIsSubmitModalOpen(true)}
      />

      <SubmitExamModal
        isOpen={isSubmitModalOpen}
        onClose={() => !isAutoSubmitting && setIsSubmitModalOpen(false)}
        onConfirm={finalSubmit}
        answeredCount={examStats.answered}
        notVisitedCount={examStats.notVisited}
        totalCount={examStats.total}
        isAutoSubmit={isAutoSubmitting}
      />

      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-app-bg/80 backdrop-blur-2xl flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <h3 className="text-2xl font-black text-text-primary uppercase tracking-[0.2em] mt-8">Submitting Your Answers</h3>
            <p className="text-text-secondary font-black text-[10px] uppercase tracking-widest mt-2 animate-pulse">Encrypting &amp; Uploading Results</p>
          </motion.div>
        )}
      </AnimatePresence>
    </ExamLayout>
  );
}
