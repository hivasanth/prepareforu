import { useState, useCallback } from 'react';
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
} from '../../../services/subjectTestService';
import { getDefaultMinQuestions } from '../../../services/questionAvailabilityService';
import { usePortalPaperState } from '../../../hooks/usePortalPaperState';
import { usePortalInit } from '../../../hooks/usePortalInit';
import { useAppscPaperSelection } from '../../../hooks/useAppscPaperSelection';
import { usePortalLaunch } from '../../../hooks/usePortalLaunch';
import type { ExamPaper } from '../../../types/exam.types';

type ViewState = 'PORTAL' | 'CONFIG';

export function useSubjectTests() {
  const { user, loading: authLoading } = useAuth();
  const { state: errorState, error: pageError, captureNetworkError, captureServerError, retry: retryError } = usePageError();

  const [view, setView] = useState<ViewState>('PORTAL');

  const [subjects, setSubjects] = useState<string[]>(() => {
    if (!user?.exam_selection) return [];
    return getCachedSubjects(user.exam_selection) || [];
  });
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>(() => {
    if (!user?.exam_selection) return {};
    return getCachedSubjectCounts(user.exam_selection) || {};
  });
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(30);

  const [minQuestions, setMinQuestions] = useState<number>(getDefaultMinQuestions);
  const [loading, setLoading] = useState(() => {
    if (authLoading) return true;
    if (!user?.exam_selection) return true;
    return !getCachedSubjects(user.exam_selection);
  });

  const {
    papers, setPapers, selectedPaperId, setSelectedPaperId,
    activeGroup, setActiveGroup,
    groupOptions, isAppsc,
  } = usePortalPaperState({ examSelection: user?.exam_selection ?? undefined });

  const loadData = useCallback(async (force: boolean) => {
    if (force) {
      await clearSubjectTestCache(user?.exam_selection || '');
    } else if (getCachedSubjects(user?.exam_selection || '')) {
      // Data exists, background refresh
    } else {
      setLoading(true);
    }
    if (isAppsc) {
      const rawPapers = await fetchAppscPapers(user?.exam_selection || '', force);
      setPapers(rawPapers);
    } else {
      const [subjectsData, countsData] = await Promise.all([
        fetchSubjectsByExam(user?.exam_selection || '', force),
        fetchSubjectCounts(user?.exam_selection || '', undefined, force)
      ]);
      setSubjects(subjectsData);
      setSubjectCounts(countsData);
    }
    setLoading(false);
  }, [user?.exam_selection, isAppsc, setPapers, setSubjects, setSubjectCounts, setLoading]);

  usePortalInit({
    authLoading,
    examSelection: user?.exam_selection ?? undefined,
    setLoading,
    onError: (msg) => captureNetworkError(msg, { retryFn: () => loadData(true) }),
    loadData,
  });

  const fetchAppscPaperData = useCallback(async (paperId: string) => {
    const [subjectsData, countsData] = await Promise.all([
      fetchSubjectsByPaper(paperId),
      fetchSubjectCounts(user?.exam_selection || '', paperId)
    ]);
    setSubjects(subjectsData);
    setSubjectCounts(countsData);
  }, [user?.exam_selection, setSubjects, setSubjectCounts]);

  useAppscPaperSelection({
    isAppsc,
    selectedPaperId,
    examSelection: user?.exam_selection ?? undefined,
    setMinQuestions,
    fetchPaperData: fetchAppscPaperData,
  });

  const { isLaunching, launchTest } = usePortalLaunch({
    guard: () => !!selectedSubject,
    fetchQuestions: async () => {
      const examId = isAppsc
        ? papers.find((p: ExamPaper) => p.id === selectedPaperId)?.exam_id
        : user?.exam_selection;
      if (!examId) throw new Error('No exam selected. Please select an exam and try again.');
      const rawQuestions = await fetchSubjectTestQuestions({
        examId,
        paperId: (isAppsc ? selectedPaperId : undefined) ?? undefined,
        subjectName: selectedSubject!,
        count: questionCount,
        userId: user?.id
      });
      return mapQuestionsToStandard(rawQuestions);
    },
    buildNavState: () => ({
      source: 'subject_test',
      durationMinutes: questionCount,
      title: `${selectedSubject} — Subject Test`,
      paperName: `${selectedSubject}`,
      showSubjectName: false,
      negativeMarkValue: 0,
      marksPerQuestion: 1,
      totalMarks: questionCount,
      subjectName: selectedSubject
    }),
    navPath: '/active-exam/subject-test',
    onError: (msg) => captureServerError(msg, { retryFn: launchTest }),
  });

  const handleSubjectClick = useCallback((s: string) => {
    const count = subjectCounts[s] || 0;
    if (count < minQuestions) return;
    setSelectedSubject(s);
    setQuestionCount(30);
    setView('CONFIG');
  }, [subjectCounts, minQuestions]);

  const handleExamChange = useCallback((id: string) => {
    setActiveGroup(id);
    const firstPaper = papers.find((p: ExamPaper) => p.exam_id === id);
    if (firstPaper) setSelectedPaperId(firstPaper.id);
  }, [papers, setActiveGroup, setSelectedPaperId]);

  const handleBack = useCallback(() => {
    setView('PORTAL');
  }, []);

  return {
    loading,
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
    handlePaperChange: setSelectedPaperId,
    handleSubjectClick,
    setQuestionCount,
    handleLaunch: launchTest,
    handleBack,
  };
}
