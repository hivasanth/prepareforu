import { useState, useEffect, useCallback } from 'react';
import type { Location, NavigateFunction } from 'react-router-dom';
import type { UserProfile } from '../../../types/auth.types';
import {
  fetchPaperWithSubjects,
  fetchQuestionsForPaper,
  fetchAttemptAnswers,
  findAttemptById,
  findInProgressAttempt,
  createAttempt,
  submitAttempt,
} from '../../../services/examService';
import { clearAllPendingOperations } from '../../../services/persistenceRetry';
import { getAllowedExamIds } from '../../../utils/examUtils';
import { startPreparedExamRpc } from '../../../lib/repositories/question.repository';
import {
  lockExamLanguage,
  clearExamSession,
  resolveQuestionsForSession,
  detectTeluguAvailability,
} from '../../../utils/examSessionStore';
import type { Question, Attempt, ExamPaper } from '../../../types/exam.types';
import type { SupportedLanguage } from '../../../utils/languageUtils';

interface UseExamInitializationOptions {
  paperId: string | undefined;
  user: UserProfile | null;
  location: Location;
  navigate: NavigateFunction;
  setPaper: React.Dispatch<React.SetStateAction<ExamPaper | null>>;
  setAttempt: React.Dispatch<React.SetStateAction<Attempt | null>>;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  setVisitedQuestions: React.Dispatch<React.SetStateAction<Set<string>>>;
  setMarkedForReview: React.Dispatch<React.SetStateAction<Set<string>>>;
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
  setDisplayLang: React.Dispatch<React.SetStateAction<'en' | 'te'>>;
  attemptRef: React.MutableRefObject<Attempt | null>;
  selectedAnswersRef: React.MutableRefObject<Record<string, string | null>>;
  visitedQuestionsRef: React.MutableRefObject<Set<string>>;
  markedForReviewRef: React.MutableRefObject<Set<string>>;
  questionTimeSpentRef: React.MutableRefObject<Record<string, number>>;
  currentIdxRef: React.MutableRefObject<number>;
  paperRef: React.MutableRefObject<ExamPaper | null>;
}

interface UseExamInitializationReturn {
  phase: 'loading' | 'lang_select' | 'exam';
  loading: boolean;
  error: string | null;
  initComplete: boolean;
  rawQuestions: Question[];
  teluguAvailable: boolean;
  initExam: () => Promise<void>;
  handleLanguageSelect: (lang: SupportedLanguage) => void;
}

export function useExamInitialization({
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
}: UseExamInitializationOptions): UseExamInitializationReturn {
  const [phase, setPhase] = useState<'loading' | 'lang_select' | 'exam'>('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initComplete, setInitComplete] = useState(false);
  const [rawQuestions, setRawQuestions] = useState<Question[]>([]);
  const [teluguAvailable, setTeluguAvailable] = useState(false);

  const restoreAttemptState = useCallback(async (
    attemptId: string,
    questions: Question[],
    isResumed: boolean,
    attemptData: Attempt | null,
  ) => {
    const restoredAnswers: Record<string, string | null> = {};
    const restoredVisited = new Set<string>();
    const restoredMarked = new Set<string>();
    const restoredTimeSpent: Record<string, number> = {};
    let restoredCurrentIdx = 0;

    if (isResumed && attemptData) {
      try {
        const existingRows = await fetchAttemptAnswers(attemptId);
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
          const idx = questions.findIndex(q => q.id === lastVisitedId);
          if (idx >= 0) restoredCurrentIdx = idx;
        }
      } catch {
        const fallback = (attemptData.answers_json || {}) as Record<string, string | null>;
        for (const q of questions) {
          if (fallback[q.id] !== undefined) restoredAnswers[q.id] = fallback[q.id];
        }
      }
    }

    return { restoredAnswers, restoredVisited, restoredMarked, restoredTimeSpent, restoredCurrentIdx };
  }, []);

  const applyRestoredState = useCallback((
    restored: { restoredAnswers: Record<string, string | null>; restoredVisited: Set<string>; restoredMarked: Set<string>; restoredTimeSpent: Record<string, number>; restoredCurrentIdx: number },
    finalAttempt: Attempt | null,
    finalQuestions: Question[],
  ) => {
    attemptRef.current = finalAttempt;
    selectedAnswersRef.current = restored.restoredAnswers;
    visitedQuestionsRef.current = restored.restoredVisited;
    markedForReviewRef.current = restored.restoredMarked;
    questionTimeSpentRef.current = restored.restoredTimeSpent;
    currentIdxRef.current = restored.restoredCurrentIdx;
    setQuestions(finalQuestions);
    setAttempt(finalAttempt);
    setSelectedAnswers(restored.restoredAnswers);
    setVisitedQuestions(restored.restoredVisited);
    setMarkedForReview(restored.restoredMarked);
    setCurrentIdx(restored.restoredCurrentIdx);
  }, [setQuestions, setAttempt, setSelectedAnswers, setVisitedQuestions, setMarkedForReview, setCurrentIdx, attemptRef, selectedAnswersRef, visitedQuestionsRef, markedForReviewRef, questionTimeSpentRef, currentIdxRef]);

  const initStateBackedExam = useCallback(async (state: any) => {
    if (!user) return;
    try {
      setError(null);
      setLoading(true);
      setPhase('loading');
      // P0-01: pass selection CONTEXT only. The server samples the question set
      // itself, so the client's own fetch is just a preview/fallback -- the
      // attempt is scored and reviewed against the server's snapshot.
      const result = await createAttempt({
        userId: user.id,
        examId: state.examId,
        paperId: state.paperId,
        source: state.source || 'subject_test',
        subjectName: state.subjectName,
        topicName: state.topicName,
        questionCount: state.questionCount,
      });
      const attemptData = result.attemptData || null;
      const served: Question[] = (
        attemptData?.questions_snapshot?.length
          ? attemptData.questions_snapshot
          : state.questions
      ) as Question[];
      // The 1 question = 1 mark = 1 minute contract must follow what the server
      // ACTUALLY served, which can differ from the requested count.
      const servedCount = served.length;
      const restored = await restoreAttemptState(attemptData?.id || '', served, result.isResumed, attemptData);
      applyRestoredState(restored, attemptData, served);
      setPaper({
        id: paperId || 'practice',
        exam_id: '',
        paper_name: state.title || 'Practice Exam',
        stage: 'SINGLE',
        total_questions: servedCount,
        total_marks: servedCount,
        duration_minutes: servedCount,
        negative_marking: state.negativeMarkValue > 0,
        negative_mark_value: state.negativeMarkValue || 0,
        display_order: 0,
        start_time: null,
        end_time: null,
      });
      setDisplayLang('en');
      setPhase('exam');
      setInitComplete(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start exam.');
      setInitComplete(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id, paperId, restoreAttemptState, applyRestoredState, setPaper, setDisplayLang]);

  const _startExam = useCallback(async (paperData: ExamPaper, questionsToResolve: Question[], lang: SupportedLanguage) => {
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
      const restored = await restoreAttemptState(finalAttempt?.id || '', finalQuestions, isResumed, finalAttempt);
      applyRestoredState(restored, finalAttempt, finalQuestions);
      setPhase('exam');
      setInitComplete(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start exam.');
      setInitComplete(true);
    } finally {
      setLoading(false);
    }
  }, [paperId, user?.id, navigate, restoreAttemptState, applyRestoredState]);

  /**
   * Prepare & Write real-exam launch (F-01 locked flow).
   *
   * prepare_write is the ONLY state-backed source that does NOT carry client
   * questions: the locked set is stored server-side in exam_preparations and is
   * consumed by start_prepared_exam (authority = server). Two entry points:
   *   • Resume  — an in-progress attempt for this paper already exists (e.g.
   *     interrupted reload), restore its locked snapshot.
   *   • Launch  — otherwise consume the pending preparation via
   *     start_prepared_exam(preparationId) into a fresh attempt.
   */
  const initPreparedExam = useCallback(async (state: any) => {
    if (!user || !paperId) {
      setError('Invalid exam link.');
      setInitComplete(true);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setLoading(true);
      setPhase('loading');
      clearExamSession();

      const { paper: paperData } = await fetchPaperWithSubjects(paperId);
      setPaper(paperData);

      // 1. Resume path: an in-progress attempt for this PAPER wins (matches the
      // server's one-active-attempt-per-paper resume semantics in create_attempt,
      // regardless of source — a previously started real exam on this paper is
      // the authoritative continuation).
      const existingAttempt = await findInProgressAttempt({
        userId: user.id,
        paperId,
      });
      if (existingAttempt?.questions_snapshot?.length) {
        const qs = existingAttempt.questions_snapshot as Question[];
        if (paperData.duration_minutes > 0) {
          const elapsed = Date.now() - new Date(existingAttempt.started_at).getTime();
          const durationMs = paperData.duration_minutes * 60 * 1000;
          if (elapsed >= durationMs) {
            try {
              const result = await submitAttempt(existingAttempt.id, user.id);
              clearExamSession();
              navigate(`/review/${existingAttempt.id}`, { replace: true, state: { result, examTitle: paperData.paper_name, paperName: paperData.paper_name } });
            } catch {
              setError('Your previous session has expired. Please start a new preparation.');
            }
            setInitComplete(true);
            return;
          }
        }
        const restored = await restoreAttemptState(existingAttempt.id, qs, true, existingAttempt as Attempt);
        applyRestoredState(restored, existingAttempt as Attempt, qs);
        setDisplayLang('en');
        setPhase('exam');
        setInitComplete(true);
        return;
      }

      // 2. Launch path: consume the server-locked preparation.
      if (!state?.preparationId) {
        setError('This preparation is no longer available. Please prepare the paper again.');
        setInitComplete(true);
        return;
      }
      const started = await startPreparedExamRpc(state.preparationId);
      const attemptData = await findAttemptById(started.attempt_id, user?.id ?? '');
      const qs = started.questions as unknown as Question[];
      const restored = await restoreAttemptState(started.attempt_id, qs, started.is_resumed, attemptData);
      applyRestoredState(restored, attemptData as Attempt, qs);
      // Fill bilingual availability for the lang-select gate.
      setDisplayLang('en');
      setPhase('exam');
      setInitComplete(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start your prepared exam.');
      setInitComplete(true);
    } finally {
      setLoading(false);
    }
  }, [paperId, user?.id, navigate, restoreAttemptState, applyRestoredState, setPaper, setDisplayLang]);

  const initExam = useCallback(async () => {
    const state = location.state as Record<string, any> | null;
    if (state?.source === 'prepare_write') {
      await initPreparedExam(state);
      return;
    }
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
        const attemptData = await findAttemptById(state.attemptId, user?.id ?? '');
        if (!attemptData) throw new Error('Failed to load exam attempt.');
        const resolvedQ: Question[] = [...state.questions];
        const restored = await restoreAttemptState(attemptData.id, resolvedQ, true, attemptData);
        applyRestoredState(restored, attemptData as Attempt, resolvedQ);
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
    if (!user) return;
    if (!paperId) {
      setError('Invalid exam link.');
      setInitComplete(true);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setLoading(true);
      setPhase('loading');
      clearExamSession();
      const { paper: paperData, subjects } = await fetchPaperWithSubjects(paperId);
      if (!getAllowedExamIds(user.exam_selection).includes(paperData.exam_id)) {
        throw new Error('You are not authorized to access this exam.');
      }
      setPaper(paperData);

      const existingAttempt = await findInProgressAttempt({
        userId: user.id,
        paperId,
        source: 'exam_tab',
      });

      let fetchedQuestions: Question[];
      if (existingAttempt?.questions_snapshot?.length) {
        fetchedQuestions = existingAttempt.questions_snapshot as Question[];
      } else {
        fetchedQuestions = await fetchQuestionsForPaper(paperId, subjects, paperData.exam_id, user.id);
      }

      const hasTE = detectTeluguAvailability(fetchedQuestions);
      setRawQuestions(fetchedQuestions);
      setTeluguAvailable(hasTE);
      setLoading(false);
      await _startExam(paperData, fetchedQuestions, 'en');
    } catch (err: any) {
      setError(err.message || 'Failed to load exam.');
      setInitComplete(true);
      setLoading(false);
    }
  }, [paperId, user?.id, location.state, initStateBackedExam, _startExam, initPreparedExam, setPaper, restoreAttemptState, applyRestoredState]);

  const handleLanguageSelect = useCallback((lang: SupportedLanguage) => {
    if (paperRef.current) _startExam(paperRef.current, rawQuestions, lang);
  }, [_startExam, rawQuestions]);

  useEffect(() => {
    initExam();
  }, [initExam]);

  useEffect(() => {
    if (!initComplete) return;
    return () => {
      clearAllPendingOperations();
    };
  }, [initComplete]);

  return {
    phase,
    loading,
    error,
    initComplete,
    rawQuestions,
    teluguAvailable,
    initExam,
    handleLanguageSelect,
  };
}
