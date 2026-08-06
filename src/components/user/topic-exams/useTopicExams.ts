import { useState, useEffect, useCallback } from 'react';
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
  type TopicItem,
} from '../../../services/topicTestService';
import { getCachedSubjects } from '../../../services/subjectTestService';
import { getDefaultMinQuestions } from '../../../services/questionAvailabilityService';
import { usePortalPaperState } from '../../../hooks/usePortalPaperState';
import { usePortalInit } from '../../../hooks/usePortalInit';
import { useAppscPaperSelection } from '../../../hooks/useAppscPaperSelection';
import { usePortalLaunch } from '../../../hooks/usePortalLaunch';
import type { ExamPaper } from '../../../types/exam.types';

type ViewState = 'PORTAL' | 'CONFIG';

export function useTopicExams() {
  const { user, loading: authLoading } = useAuth();
  const { state: errorState, error: pageError, captureNetworkError, captureServerError, retry: retryError } = usePageError();

  const [view, setView] = useState<ViewState>('PORTAL');

  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(30);
  const [minQuestions, setMinQuestions] = useState<number>(getDefaultMinQuestions);
  const [loading, setLoading] = useState(() => {
    if (authLoading) return true;
    if (!user?.exam_selection) return true;
    return !getCachedSubjects(user.exam_selection);
  });
  const [topicsLoading, setTopicsLoading] = useState(false);

  const {
    papers, setPapers, selectedPaperId, setSelectedPaperId,
    activeGroup, setActiveGroup,
    groupOptions, isAppsc,
  } = usePortalPaperState({ examSelection: user?.exam_selection ?? undefined });

  const loadData = useCallback(async (force: boolean) => {
    if (force) {
      await clearTopicTestCache(user?.exam_selection || '');
    } else if (getCachedSubjects(user?.exam_selection || '')) {
      // Data exists, background refresh
    } else {
      setLoading(true);
    }
    if (isAppsc) {
      const rawPapers = await fetchAppscPapers(user?.exam_selection || '', force);
      setPapers(rawPapers);
    } else {
      const subjectsData = await fetchSubjectsByExam(user?.exam_selection || '', force);
      setSubjects(subjectsData);
    }
    setLoading(false);
  }, [user?.exam_selection, isAppsc, setPapers, setSubjects, setLoading]);

  const { mountedRef } = usePortalInit({
    authLoading,
    examSelection: user?.exam_selection ?? undefined,
    setLoading,
    onError: (msg) => captureNetworkError(msg, { retryFn: () => loadData(true) }),
    loadData,
  });

  const fetchAppscPaperData = useCallback(async (paperId: string) => {
    const subjectsData = await fetchSubjectsByPaper(paperId);
    setSubjects(subjectsData);
  }, [setSubjects]);

  useAppscPaperSelection({
    isAppsc,
    selectedPaperId,
    examSelection: user?.exam_selection ?? undefined,
    setMinQuestions,
    fetchPaperData: fetchAppscPaperData,
  });

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

  // Fetch topics and topic counts when selected subject, paper, or exam selection changes
  useEffect(() => {
    if (!user?.exam_selection || !selectedSubject) {
      setTopics([]);
      setTopicCounts({});
      return;
    }

    let isCurrent = true;
    async function loadTopics() {
      setTopicsLoading(true);
      try {
        const examId = isAppsc
          ? (papers.find((p: ExamPaper) => p.id === selectedPaperId)?.exam_id || user?.exam_selection || '')
          : (user?.exam_selection || '');

        const [topicsData, countsData] = await Promise.all([
          fetchTopicsBySubject(examId, selectedPaperId ?? undefined, selectedSubject ?? undefined),
          fetchTopicCounts(examId, selectedPaperId ?? undefined, selectedSubject ?? undefined)
        ]);

        if (!isCurrent || !mountedRef.current) return;
        setTopics(topicsData);
        setTopicCounts(countsData);
      } catch (err) {
        console.error('Failed to load topics:', err instanceof Error ? err.message : err);
      } finally {
        if (isCurrent && mountedRef.current) setTopicsLoading(false);
      }
    }

    loadTopics();
    return () => {
      isCurrent = false;
    };
  }, [selectedSubject, selectedPaperId, user?.exam_selection, isAppsc, papers, mountedRef]);

  const { isLaunching, launchTest } = usePortalLaunch({
    guard: () => !!selectedSubject && !!selectedTopic,
    fetchQuestions: async () => {
      const examId = isAppsc
        ? papers.find((p: ExamPaper) => p.id === selectedPaperId)?.exam_id
        : user?.exam_selection;

      if (!examId) throw new Error('No exam selected. Please select an exam and try again.');

      const rawQuestions = await fetchTopicTestQuestions({
        examId,
        paperId: (isAppsc ? selectedPaperId : undefined) ?? undefined,
        subjectName: selectedSubject || '',
        topicName: selectedTopic || '',
        count: questionCount
      });
      return mapQuestionsToStandard(rawQuestions);
    },
    buildNavState: () => ({
      source: 'topic_exam',
      durationMinutes: questionCount,
      title: `${selectedTopic} — Topic Exam`,
      paperName: `${selectedSubject} - ${selectedTopic}`,
      showSubjectName: false,
      negativeMarkValue: 0,
      marksPerQuestion: 1,
      totalMarks: questionCount,
      subjectName: selectedSubject,
      topicName: selectedTopic
    }),
    navPath: '/active-exam/topic-test',
    onError: (msg) => captureServerError(msg, { retryFn: launchTest }),
  });

  const handleExamChange = useCallback((id: string) => {
    setActiveGroup(id);
    const firstPaper = papers.find((p: ExamPaper) => p.exam_id === id);
    if (firstPaper) setSelectedPaperId(firstPaper.id);
  }, [papers, setActiveGroup, setSelectedPaperId]);

  const handleTopicClick = useCallback((topicName: string) => {
    const count = topicCounts[topicName] || 0;
    if (count < minQuestions) return;
    setSelectedTopic(topicName);
    setQuestionCount(30);
    setView('CONFIG');
  }, [topicCounts, minQuestions]);

  const handleBack = useCallback(() => {
    setView('PORTAL');
  }, []);

  return {
    loading,
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
    handlePaperChange: setSelectedPaperId,
    handleSubjectChange: setSelectedSubject,
    handleTopicClick,
    setQuestionCount,
    handleLaunch: launchTest,
    handleBack,
  };
}
