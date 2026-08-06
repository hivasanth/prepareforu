import { useState, useEffect, useCallback, useRef } from 'react';
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
  subjectMarksRef: React.MutableRefObject<Record<string, number>>;
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
  const subjectMarksRef = useRef<Record<string, number>>({});

  const restoreAttemptState = useCallback(async (
    attemptId: string,
    questions: Question[],
    isResumed: boolean,
    attemptData: Attempt | null,
  ) => {
    let restoredAnswers: Record<string, string | null> = {};
    let restoredVisited = new Set<string>();
    let restoredMarked = new Set<string>();
    let restoredTimeSpent: Record<string, number> = {};
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
      const qs: Question[] = [...state.questions];
      const result = await createAttempt({
        userId: user.id,
        source: state.source || 'subject_test',
        totalMarks: state.totalMarks || qs.length,
        questionsSnapshot: qs,
        forceNew: false,
      });
      const attemptData = result.attemptData || null;
      const restored = await restoreAttemptState(attemptData?.id || '', qs, result.isResumed, attemptData);
      applyRestoredState(restored, attemptData, qs);
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
        display_order: 0,
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
        totalMarks: paperData.total_marks,
        questionsSnapshot: resolvedQuestions,
        forceNew: false,
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
      setPaper(paperData);
      const marksMap: Record<string, number> = {};
      subjects.forEach(s => { marksMap[s.subject_name] = s.marks_per_question; });
      subjectMarksRef.current = marksMap;

      const existingAttempt = await findInProgressAttempt({
        userId: user.id,
        paperId,
        source: 'exam_tab',
      });

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
      setError(err.message || 'Failed to load exam.');
      setInitComplete(true);
      setLoading(false);
    }
  }, [paperId, user?.id, location.state, initStateBackedExam, _startExam, setPaper, restoreAttemptState, applyRestoredState]);

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
  }, [attemptRef.current?.id, initComplete]);

  return {
    phase,
    loading,
    error,
    initComplete,
    rawQuestions,
    teluguAvailable,
    initExam,
    handleLanguageSelect,
    subjectMarksRef,
  };
}
