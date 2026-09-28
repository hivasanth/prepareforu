import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { usePageError } from '../../../hooks/usePageError';
import {
  fetchSubjectsByExam,
  fetchSubjectTestQuestions,
  clearSubjectTestCache,
  fetchSubjectCounts,
  fetchAppscPapers,
  fetchSubjectsByPaper,
  mapQuestionsToStandard,
  getCachedSubjects,
  getCachedSubjectCounts,
  getCachedPapers,
  getCachedSubjectsByPaper,
  getCachedSubjectCountsByPaper,
} from '../../../services/subjectTestService';
import { getDefaultMinQuestions, getMinQuestions } from '../../../services/questionAvailabilityService';
import { usePortalPaperState } from '../../../hooks/usePortalPaperState';
import { usePortalInit } from '../../../hooks/usePortalInit';
import { useAppscPaperSelection } from '../../../hooks/useAppscPaperSelection';
import { usePortalLaunch } from '../../../hooks/usePortalLaunch';
import type { ExamPaper } from '../../../types/exam.types';

type ViewState = 'PORTAL' | 'CONFIG';

export function useSubjectTests() {
  const { user, loading: authLoading } = useAuth();
  const { state: errorState, error: pageError, captureError, retry: retryError } = usePageError();

  const examSelection = user?.exam_selection ?? undefined;

  const {
    papers, setPapers, selectedPaperId, setSelectedPaperId,
    activeGroup, setActiveGroup,
    groupOptions, isAppsc,
  } = usePortalPaperState({ examSelection });

  // Mirror the current paper selection into a ref so `loadData` can decide
  // whether to hydrate the first paper's subjects WITHOUT `selectedPaperId`
  // becoming a dependency (which would re-run the portal-init effect on every
  // paper switch). The ref is read at execution time inside `loadData`, so it
  // reflects the latest selection even if a fetch was already in flight.
  const selectedPaperIdRef = useRef(selectedPaperId);
  useEffect(() => {
    selectedPaperIdRef.current = selectedPaperId;
  }, [selectedPaperId]);

  const [view, setView] = useState<ViewState>('PORTAL');

  const [subjects, setSubjects] = useState<string[]>(() => {
    if (!examSelection) return [];
    if (isAppsc) {
      const firstPaper = getCachedPapers(examSelection)[0];
      return firstPaper ? (getCachedSubjectsByPaper(firstPaper.id) ?? []) : [];
    }
    return getCachedSubjects(examSelection) ?? [];
  });
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>(() => {
    if (!examSelection) return {};
    if (isAppsc) {
      const firstPaper = getCachedPapers(examSelection)[0];
      return firstPaper ? (getCachedSubjectCountsByPaper(examSelection, firstPaper.id) ?? {}) : {};
    }
    return getCachedSubjectCounts(examSelection) ?? {};
  });
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(30);

  const [minQuestions, setMinQuestions] = useState<number>(getDefaultMinQuestions);

  // FIX-4: loading gate reads the exact key each flow writes — exam-level for
  // non-APPSC, paper-level for APPSC (auto-selected first paper). A cache miss
  // (null) means "not loaded" → skeleton; a cached empty array means
  // "genuinely empty" → EmptyState. No empty→loaded transition on warm cache.
  const hasCachedPortalData = useCallback(() => {
    if (!examSelection) return false;
    if (isAppsc) {
      const firstPaper = getCachedPapers(examSelection)[0];
      return !!firstPaper && !!getCachedSubjectsByPaper(firstPaper.id);
    }
    return !!getCachedSubjects(examSelection);
  }, [examSelection, isAppsc]);

  const [loading, setLoading] = useState(() => {
    if (authLoading) return true;
    if (!examSelection) return true;
    return !hasCachedPortalData();
  });

  const loadData = useCallback(async (force: boolean) => {
    if (force) {
      // ST-H1: raise the skeleton for the full retry window. Previously the
      // force path never set loading, so the cached-empty EmptyState painted
      // during the ~2.5s refetch. `finally` guarantees loading is always
      // cleared on success OR failure (failure re-paints the error via
      // handleInitError below).
      setLoading(true);
      await clearSubjectTestCache(examSelection || '');
    } else if (hasCachedPortalData()) {
      // Data exists, background refresh
    } else {
      setLoading(true);
    }
    try {
      if (isAppsc) {
        const rawPapers = await fetchAppscPapers(examSelection || '', force);
        setPapers(rawPapers);
        // Determine which paper to fetch subjects for:
        // - On retry (force=true): always fetch for currently selected paper, or first paper if none
        // - On cold start (force=false, no cache): fetch for first paper
        // - On background refresh (force=false, has cache): skip to preserve current paper's data
        const shouldFetchSubjects = force || !hasCachedPortalData();
        const paperToFetch = selectedPaperIdRef.current || rawPapers[0]?.id;
        if (shouldFetchSubjects && paperToFetch) {
          const [subjectsData, countsData] = await Promise.all([
            fetchSubjectsByPaper(paperToFetch, force),
            fetchSubjectCounts(examSelection || '', paperToFetch, force),
          ]);
          setSubjects(subjectsData);
          setSubjectCounts(countsData);
        }
      } else {
        const [subjectsData, countsData, minQ] = await Promise.all([
          fetchSubjectsByExam(examSelection || '', force),
          fetchSubjectCounts(examSelection || '', undefined, force),
          getMinQuestions(examSelection || '', force),
        ]);
        setSubjects(subjectsData);
        setSubjectCounts(countsData);
        setMinQuestions(minQ);
      }
      return true;
    } finally {
      setLoading(false);
    }
  }, [examSelection, isAppsc, setPapers, setSubjects, setSubjectCounts, setMinQuestions, setLoading, hasCachedPortalData]);

  // Stable error handler for the portal-init effect. Passing an inline arrow
  // here would give `initPortal` a new identity on every render, causing
  // `loadData` to re-run (and re-hydrate the first paper's subjects) after
  // every paper switch — silently reverting the user's selection.
  // ST-M1: classify via the classifier (network/server/auth auto-detected)
  // rather than forcing every init failure to 'network'.
  const handleInitError = useCallback((msg: string) => {
    captureError(msg, { retryFn: () => loadData(true) });
  }, [captureError, loadData]);

  usePortalInit({
    authLoading,
    examSelection,
    setLoading,
    onError: handleInitError,
    loadData,
  });

  const fetchAppscPaperData = useCallback(async (paperId: string, isCurrent: () => boolean) => {
    const [subjectsData, countsData] = await Promise.all([
      fetchSubjectsByPaper(paperId),
      fetchSubjectCounts(examSelection || '', paperId),
    ]);
    if (!isCurrent()) return;
    setSubjects(subjectsData);
    setSubjectCounts(countsData);
  }, [examSelection, setSubjects, setSubjectCounts]);

  const retryPaperRef = useRef<() => Promise<boolean>>(async () => false);

  const handlePaperError = useCallback((error: unknown) => {
    captureError(error, { retryFn: () => retryPaperRef.current() });
  }, [captureError]);

  const { paperLoading, retryPaper } = useAppscPaperSelection({
    isAppsc,
    selectedPaperId,
    examSelection,
    setMinQuestions,
    fetchPaperData: fetchAppscPaperData,
    onPaperError: handlePaperError,
  });

  useEffect(() => {
    retryPaperRef.current = retryPaper;
  }, [retryPaper]);

  const { isLaunching, launchTest } = usePortalLaunch({
    guard: () => !!selectedSubject,
    fetchQuestions: async () => {
      const examId = isAppsc
        ? papers.find((p: ExamPaper) => p.id === selectedPaperId)?.exam_id
        : examSelection;
      if (!examId) throw new Error('No exam selected. Please select an exam and try again.');
      const rawQuestions = await fetchSubjectTestQuestions({
        examId,
        paperId: (isAppsc ? selectedPaperId : undefined) ?? undefined,
        subjectName: selectedSubject!,
        count: questionCount,
      });
      return mapQuestionsToStandard(rawQuestions);
    },
    buildNavState: (questions) => ({
      source: 'subject_test',
      // P0-01: forward the selection context so the server can resolve and
      // sample the authoritative question set. examId/paperId/s subject form the
      // server-side filter; questionCount is the requested sample size.
      examId: isAppsc
        ? papers.find((p: ExamPaper) => p.id === selectedPaperId)?.exam_id
        : examSelection,
      paperId: isAppsc ? selectedPaperId ?? undefined : undefined,
      questionCount,
      // FIND-5: the exam contract is "1 question = 1 minute = 1 mark", so
      // duration/total marks must be derived from the ACTUAL delivered
      // question count (the requested `questionCount` is a target the service
      // may legitimately undersupply when the subject pool is short). Pinning
      // to the requested count would produce a timer longer than the exam and
      // marks-per-question ≠ 1 whenever fewer questions are delivered.
      durationMinutes: questions.length,
      title: `${selectedSubject} — Subject Test`,
      paperName: `${selectedSubject}`,
      showSubjectName: false,
      negativeMarkValue: 0,
      marksPerQuestion: 1,
      totalMarks: questions.length,
      subjectName: selectedSubject
    }),
    navPath: '/active-exam/subject-test',
    onError: (error) => {
      // ST-M2: "No questions available" is a business-empty state, not a
      // server error. Render a non-retryable business error with a Back
      // affordance instead of an infinite retry loop. Everything else stays
      // retryable and is classified by the classifier.
      const message = error instanceof Error ? error.message : String(error ?? '');
      if (message.startsWith('No questions available')) {
        captureError(error, {
          category: 'business',
          retryable: false,
          fallbackMessage: `No questions are currently available for ${selectedSubject}. Please choose a different subject or try again later.`,
        });
      } else {
        captureError(error, { retryFn: launchTest });
      }
    },
  });

  const handleSubjectClick = useCallback((s: string) => {
    const count = subjectCounts[s] || 0;
    if (count < minQuestions) return;
    setSelectedSubject(s);
    setQuestionCount(30);
    setView('CONFIG');
  }, [subjectCounts, minQuestions]);

  // ST-H2: on paper/exam change, clear the previous paper's subjects/counts
  // immediately. The paperLoading gate (raised synchronously via the shared
  // hook's useLayoutEffect) keeps the skeleton up until the new paper's data
  // lands, so P1 data is never shown under P2's tab.
  const handlePaperChange = useCallback((id: string) => {
    setSubjects([]);
    setSubjectCounts({});
    setSelectedPaperId(id);
  }, [setSubjects, setSubjectCounts, setSelectedPaperId]);

  const handleExamChange = useCallback((id: string) => {
    setSubjects([]);
    setSubjectCounts({});
    setActiveGroup(id);
    const firstPaper = papers.find((p: ExamPaper) => p.exam_id === id);
    if (firstPaper) setSelectedPaperId(firstPaper.id);
  }, [papers, setActiveGroup, setSelectedPaperId, setSubjects, setSubjectCounts]);

  const handleBack = useCallback(() => {
    setView('PORTAL');
  }, []);

  return {
    loading,
    paperLoading,
    errorState,
    pageError,
    retryError,
    view,
    isAppsc,
    groupOptions,
    papers,
    activeGroup,
    selectedPaperId,
    subjects,
    subjectCounts,
    selectedSubject,
    questionCount,
    minQuestions,
    isLaunching,
    handleExamChange,
    handlePaperChange,
    handleSubjectClick,
    setQuestionCount,
    handleLaunch: launchTest,
    handleBack,
  };
}
