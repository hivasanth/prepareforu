import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { usePageError } from '../../../hooks/usePageError';
import {
  fetchTopicsBySubject,
  fetchTopicTestQuestions,
  fetchTopicCounts,
  fetchAppscPapers,
  fetchSubjectsByExam,
  fetchSubjectsByPaper,
  mapQuestionsToStandard,
  clearTopicTestCache,
  getCachedTopics,
  getCachedTopicCounts,
  type TopicItem,
} from '../../../services/topicTestService';
import { getCachedSubjects, getCachedPapers, getCachedSubjectsByPaper } from '../../../services/subjectTestService';
import { getDefaultMinQuestions, getMinQuestions } from '../../../services/questionAvailabilityService';
import { NoAvailableQuestionsError } from '../../../services/errors/NoAvailableQuestionsError';
import { usePortalPaperState } from '../../../hooks/usePortalPaperState';
import { usePortalInit } from '../../../hooks/usePortalInit';
import { useAppscPaperSelection } from '../../../hooks/useAppscPaperSelection';
import { usePortalLaunch } from '../../../hooks/usePortalLaunch';
import type { ExamPaper } from '../../../types/exam.types';

type ViewState = 'PORTAL' | 'CONFIG';

export function useTopicExams() {
  const { user, loading: authLoading } = useAuth();
  const { state: errorState, error: pageError, captureError, retry: retryError, reset } = usePageError();

  const examSelection = user?.exam_selection ?? undefined;

  const {
    papers, setPapers, selectedPaperId, setSelectedPaperId,
    activeGroup, setActiveGroup,
    groupOptions, isAppsc,
  } = usePortalPaperState({ examSelection });

  // Mirror the current paper/subject selection into refs so retries and
  // re-fetches can resolve the CURRENT context without adding a dependency
  // that would re-run the portal-init effect on every selection change.
  const selectedPaperIdRef = useRef(selectedPaperId);
  useEffect(() => {
    selectedPaperIdRef.current = selectedPaperId;
  }, [selectedPaperId]);

  const selectedSubjectRef = useRef<string | null>(null);

  // FIX-7: cache-aware initialization. A valid cached result renders content
  // immediately; a cache miss (null) means "not loaded" → skeleton; a cached
  // empty array is a genuine empty state, never a false loading flash.
  const firstCachedPaper = isAppsc ? (getCachedPapers(examSelection || '')[0] ?? null) : null;
  const initialExamId = isAppsc
    ? (firstCachedPaper?.exam_id || examSelection || '')
    : (examSelection || '');
  const initialPaperId = isAppsc ? (firstCachedPaper?.id ?? undefined) : undefined;

  const initialSubjects: string[] = (() => {
    if (!examSelection) return [];
    if (isAppsc) {
      return firstCachedPaper ? (getCachedSubjectsByPaper(firstCachedPaper.id) ?? []) : [];
    }
    return getCachedSubjects(examSelection) ?? [];
  })();
  const initialSubject = initialSubjects[0] ?? null;
  const initialTopics = initialSubject
    ? (getCachedTopics(initialExamId, initialPaperId, initialSubject) ?? [])
    : [];

  const [view, setView] = useState<ViewState>('PORTAL');

  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [topics, setTopics] = useState<TopicItem[]>(initialTopics);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>(() =>
    initialSubject ? (getCachedTopicCounts(initialExamId, initialPaperId, initialSubject) ?? {}) : {},
  );
  const [selectedSubject, setSelectedSubject] = useState<string | null>(initialSubject);
  // Canonical topic identity: the FULL TopicItem from exam_topics. The English
  // name inside it is display data; identity flows through `.id` only.
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(30);
  const [minQuestions, setMinQuestions] = useState<number>(getDefaultMinQuestions);

  // Mirror the current subject into a ref so retries and re-fetches can resolve
  // the CURRENT context without a dependency that re-runs portal-init.
  useEffect(() => {
    selectedSubjectRef.current = selectedSubject;
  }, [selectedSubject]);

  // FIX-7: loading gate reads the exact key each flow writes — exam-level for
  // non-APPSC, paper-level for APPSC (auto-selected first paper).
  const hasCachedPortalData = useCallback(() => {
    if (!examSelection) return false;
    if (isAppsc) {
      return !!firstCachedPaper && !!getCachedSubjectsByPaper(firstCachedPaper.id);
    }
    return !!getCachedSubjects(examSelection);
  }, [examSelection, isAppsc, firstCachedPaper]);

  const [loading, setLoading] = useState(() => {
    if (authLoading) return true;
    if (!examSelection) return true;
    return !hasCachedPortalData();
  });

  // FIX-7: raise the topics-grid skeleton when a subject is known but its
  // topics are not yet cached — never paint a false EmptyState during init.
  const [topicsLoading, setTopicsLoading] = useState(() =>
    initialSubjects.length > 0 && initialTopics.length === 0,
  );

  const loadData = useCallback(async (force: boolean) => {
    if (force) {
      // FIX-2: force retry ALWAYS enters the loading gate — it must never
      // depend on cache presence to decide whether the skeleton shows.
      setLoading(true);
      await clearTopicTestCache(examSelection || '');
    } else if (hasCachedPortalData()) {
      // Data exists, background refresh
    } else {
      setLoading(true);
    }
    try {
      if (isAppsc) {
        const rawPapers = await fetchAppscPapers(examSelection || '', force);
        setPapers(rawPapers);
        // FIX-7: hydrate the paper's subjects synchronously on cold start /
        // force retry so the portal never paints with an empty subject row.
        const shouldFetchSubjects = force || !hasCachedPortalData();
        const paperToFetch = selectedPaperIdRef.current || rawPapers[0]?.id;
        if (shouldFetchSubjects && paperToFetch) {
          setTopicsLoading(true);
          const subjectsData = await fetchSubjectsByPaper(paperToFetch, force);
          if (selectedSubjectRef.current === null || !subjectsData.includes(selectedSubjectRef.current)) {
            setSelectedSubject(subjectsData[0] || null);
          }
          setSubjects(subjectsData);
        }
      } else {
        const [subjectsData, minQ] = await Promise.all([
          fetchSubjectsByExam(examSelection || '', force),
          getMinQuestions(examSelection || '', force),
        ]);
        if (selectedSubjectRef.current === null || !subjectsData.includes(selectedSubjectRef.current)) {
          setSelectedSubject(subjectsData[0] || null);
        }
        setSubjects(subjectsData);
        setMinQuestions(minQ);
      }
      return true;
    } finally {
      // FIX-2: loading is cleared on success AND failure. On failure the throw
      // propagates to initPortal → handleInitError → captureError, which paints
      // the error screen — never a stuck skeleton or empty flash.
      setLoading(false);
    }
  }, [examSelection, isAppsc, setPapers, setSubjects, setSelectedSubject, setMinQuestions, setTopicsLoading, setLoading, hasCachedPortalData]);

  // Stable error handler for the portal-init effect. An inline arrow here would
  // give `initPortal` a new identity on every render, re-running `loadData`
  // after every selection change.
  const handleInitError = useCallback((msg: string) => {
    captureError(msg, { retryFn: () => loadData(true) });
  }, [captureError, loadData]);

  const { mountedRef } = usePortalInit({
    authLoading,
    examSelection,
    setLoading,
    onError: handleInitError,
    loadData,
  });

  const fetchAppscPaperData = useCallback(async (paperId: string, isCurrent: () => boolean) => {
    const subjectsData = await fetchSubjectsByPaper(paperId);
    if (!isCurrent()) return;
    // FIX-4/FIX-7: sync the subject selection with the new paper's subjects so
    // stale subjects/topics never paint under the new paper's tab.
    setTopicsLoading(true);
    if (selectedSubjectRef.current === null || !subjectsData.includes(selectedSubjectRef.current)) {
      setSelectedSubject(subjectsData[0] || null);
    }
    setSubjects(subjectsData);
  }, [setSubjects, setSelectedSubject, setTopicsLoading]);

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

  // Auto-select first subject whenever subjects list changes
  useEffect(() => {
    if (subjects.length > 0) {
      if (!selectedSubject || !subjects.includes(selectedSubject)) {
        setSelectedSubject(subjects[0]);
      }
    } else {
      setSelectedSubject(null);
    }
  }, [subjects, selectedSubject]);

  // FIX-1: topic fetch failures must propagate to the page error state with a
  // retry that uses the CURRENT exam/paper/subject context — never be silently
  // swallowed into a misleading EmptyState. reloadTopicsRef always points at
  // the latest closure so a retry never uses a stale subject/paper.
  const reloadTopicsRef = useRef<() => Promise<boolean>>(async () => false);

  useEffect(() => {
    if (!examSelection || !selectedSubject || (isAppsc && !selectedPaperId)) {
      setTopics([]);
      setTopicCounts({});
      return;
    }

    let isCurrent = true;
    async function loadTopics() {
      const examId = isAppsc
        ? (papers.find((p: ExamPaper) => p.id === selectedPaperId)?.exam_id || examSelection || '')
        : (examSelection || '');
      const paperKey = isAppsc ? (selectedPaperId ?? undefined) : undefined;

      // FIX-7: a fully cached topic context refreshes in the background — no
      // skeleton flash on cache hits. Missing cache → raise the grid skeleton.
      const hasCached = getCachedTopics(examId, paperKey, selectedSubject!) !== null
        && getCachedTopicCounts(examId, paperKey, selectedSubject!) !== null;
      if (!hasCached) setTopicsLoading(true);

      try {
        const [topicsData, countsData] = await Promise.all([
          fetchTopicsBySubject(examId, paperKey, selectedSubject ?? undefined),
          fetchTopicCounts(examId, paperKey, selectedSubject ?? undefined)
        ]);

        if (!isCurrent || !mountedRef.current) return false;
        setTopics(topicsData);
        setTopicCounts(countsData);
        return true;
      } catch (err) {
        if (isCurrent && mountedRef.current) {
          captureError(err, { retryFn: () => reloadTopicsRef.current() });
        }
        return false;
      } finally {
        if (isCurrent && mountedRef.current) setTopicsLoading(false);
      }
    }

    reloadTopicsRef.current = loadTopics;
    loadTopics();
    return () => {
      isCurrent = false;
    };
  }, [selectedSubject, selectedPaperId, examSelection, isAppsc, papers, mountedRef, captureError]);

  const { isLaunching, launchTest } = usePortalLaunch({
    guard: () => !!selectedSubject && !!selectedTopic,
    fetchQuestions: async () => {
      const examId = isAppsc
        ? papers.find((p: ExamPaper) => p.id === selectedPaperId)?.exam_id
        : examSelection;

      if (!examId) throw new Error('No exam selected. Please select an exam and try again.');

      const rawQuestions = await fetchTopicTestQuestions({
        examId,
        paperId: (isAppsc ? selectedPaperId : undefined) ?? undefined,
        subjectName: selectedSubject || '',
        topicId: selectedTopic?.id ?? null,
        legacyTopicName: selectedTopic?.id ? undefined : (selectedTopic?.topic_en || undefined),
        count: questionCount,
      });
      return mapQuestionsToStandard(rawQuestions);
    },
    buildNavState: (questions) => ({
      source: 'topic_exam',
      // P0-01: forward the selection context so the server resolves the
      // authoritative set; the client sends no question content.
      examId: isAppsc
        ? papers.find((p: ExamPaper) => p.id === selectedPaperId)?.exam_id
        : examSelection,
      paperId: isAppsc ? selectedPaperId ?? undefined : undefined,
      questionCount,
      // FIND-5 (shared): derive the 1-min/1-mark per-question contract from the
      // ACTUAL delivered question count, not the requested target, so a short
      // pool never yields a timer/marks mismatch (see useSubjectTests).
      durationMinutes: questions.length,
      title: `${selectedTopic?.topic_en} — Topic Exam`,
      paperName: `${selectedSubject} - ${selectedTopic?.topic_en}`,
      showSubjectName: false,
      negativeMarkValue: 0,
      marksPerQuestion: 1,
      totalMarks: questions.length,
      subjectName: selectedSubject,
      topicName: selectedTopic?.topic_en ?? ''
    }),
    navPath: '/active-exam/topic-test',
    onError: (error) => {
      // FIX-3: "no questions available" is a business-empty condition, not a
      // server outage — non-retryable, with a Back-to-Topic-List recovery.
      // Everything else stays retryable and is classified by the classifier.
      if (error instanceof NoAvailableQuestionsError) {
        captureError(error, {
          category: 'business',
          retryable: false,
          fallbackMessage: `No questions are currently available for ${selectedTopic?.topic_en}. Please choose a different topic or try again later.`,
        });
      } else {
        captureError(error, { retryFn: launchTest });
      }
    },
  });

  const handleExamChange = useCallback((id: string) => {
    // FIX-4: reconcile context on exam change — clear the previous group's
    // subjects/topics/counts; the paperLoading gate keeps the skeleton up.
    setSubjects([]);
    setTopics([]);
    setTopicCounts({});
    setSelectedTopic(null);
    setActiveGroup(id);
    const firstPaper = papers.find((p: ExamPaper) => p.exam_id === id);
    if (firstPaper) setSelectedPaperId(firstPaper.id);
  }, [papers, setActiveGroup, setSelectedPaperId, setSubjects, setTopics, setTopicCounts]);

  // FIX-4/FIX-10: clear the previous paper's data on paper change. The shared
  // hook's paperLoading gate keeps the skeleton up until the new paper's data
  // lands, so Paper A data is never presented under Paper B — including when
  // Paper B's fetch fails (error screen, not stale Paper A content).
  const handlePaperChange = useCallback((id: string) => {
    setSubjects([]);
    setTopics([]);
    setTopicCounts({});
    setSelectedTopic(null);
    setSelectedPaperId(id);
  }, [setSubjects, setTopics, setTopicCounts, setSelectedPaperId]);

  // FIX-4: subject change clears the previous subject's topic data
  // synchronously and raises the grid skeleton — old topics never paint under
  // the new subject tab. The subject tabs themselves stay available.
  const handleSubjectChange = useCallback((id: string) => {
    setTopics([]);
    setTopicCounts({});
    setSelectedTopic(null);
    setTopicsLoading(true);
    setSelectedSubject(id);
  }, [setTopics, setTopicCounts, setSelectedTopic, setTopicsLoading, setSelectedSubject]);

  // The card hands over the FULL TopicItem — identity (`.id`) plus its display
  // names. A bare name is never accepted as a selection.
  const handleTopicClick = useCallback((topic: TopicItem) => {
    const count = topicCounts[topic.topic_en] || 0;
    if (count < minQuestions) return;
    setSelectedTopic(topic);
    setQuestionCount(30);
    setView('CONFIG');
  }, [topicCounts, minQuestions]);

  const handleBack = useCallback(() => {
    // Clear any captured page error (e.g. a business-empty from a failed
    // launch) so the Back action actually returns to the topic list instead
    // of re-rendering the error screen.
    reset();
    setView('PORTAL');
  }, [reset]);

  return {
    loading,
    paperLoading,
    topicsLoading,
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
    selectedSubject,
    topics,
    topicCounts,
    selectedTopic,
    questionCount,
    minQuestions,
    isLaunching,
    handleExamChange,
    handlePaperChange,
    handleSubjectChange,
    handleTopicClick,
    setQuestionCount,
    handleLaunch: launchTest,
    handleBack,
  };
}
