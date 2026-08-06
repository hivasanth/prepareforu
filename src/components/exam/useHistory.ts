import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePageError } from '../../hooks/usePageError';
import { useStableFetch } from '../../hooks/useStableFetch';
import {
  fetchPerformanceAttempts,
  clearPerformanceCache,
  fetchPerformanceMetadata,
  getCachedAttempts,
  getCachedMetadata,
  type PerformanceMetadata,
} from '../../services/performanceService';
import type { AttemptWithRelations } from '../../types/exam.types';

export function useHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isAppsc = user?.exam_selection === 'APPSC_GROUPS' || user?.exam_selection === 'APPSC';

  const [allAttempts, setAllAttempts] = useState<AttemptWithRelations[]>(() => {
    return getCachedAttempts(user?.id || '');
  });
  const [metadata, setMetadata] = useState<PerformanceMetadata>(() => {
    return getCachedMetadata(user?.exam_selection || '');
  });

  const [loading, setLoading] = useState(() => {
    if (authLoading) return true;
    return !user?.id || !getCachedAttempts(user.id ?? '').length || !getCachedMetadata(user.exam_selection ?? '')?.exams?.length;
  });

  const { state: errorState, error: pageError, captureNetworkError, retry: retryError, reset: resetError } = usePageError();
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  const { nextId, isStale } = useStableFetch();

  const loadHistory = useCallback(async (force = false) => {
    if (authLoading) return;
    if (!user?.id || !user?.exam_selection) return;
    const id = nextId();

    if (force) {
      clearPerformanceCache(user.id);
    }

    if (!force && (!getCachedAttempts(user?.id || '')?.length || !getCachedMetadata(user?.exam_selection || '')?.exams?.length)) {
      setLoading(true);
    }

    resetError();

    try {
      const [historyData, metaData] = await Promise.all([
        fetchPerformanceAttempts(user.id, force),
        fetchPerformanceMetadata(user.exam_selection),
      ]);

      if (isStale(id)) return;

      setAllAttempts(historyData || []);
      setMetadata(metaData || { exams: [], papers: [], subjects: [] });
    } catch (err: unknown) {
      if (isStale(id)) return;
      captureNetworkError(err, { retryFn: () => loadHistory(true) });
    } finally {
      if (!isStale(id)) {
        setLoading(false);
      }
    }
  }, [authLoading, user?.id, user?.exam_selection]);

  useEffect(() => {
    if (metadata.exams.length > 0 && !selectedExamId) {
      const sorted = [...metadata.exams].sort((a, b) => a.name.localeCompare(b.name));
      const first = sorted[0].id;
      setSelectedExamId(first);

      if (isAppsc) {
        const firstPaper = metadata.papers
          .filter(p => p.exam_id === first)
          .sort((a, b) => a.name.localeCompare(b.name))[0];
        setSelectedPaperId(firstPaper?.id ?? '');
      } else {
        setSelectedPaperId('');
      }
    }
  }, [metadata, selectedExamId, isAppsc]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const examOptions = useMemo(() => {
    return metadata.exams
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(e => ({
        ...e,
        displayName: e.name.replace(/APPSC[\s_]*/gi, '').replace(/_/g, ' '),
      }));
  }, [metadata.exams]);

  const paperOptions = useMemo(() => {
    const filtered = metadata.papers.filter(p => p.exam_id === selectedExamId);
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [metadata.papers, selectedExamId]);

  const filteredAttempts = useMemo(() => {
    let list = [...allAttempts];

    if (selectedExamId) {
      list = list.filter(a => a.exam_id === selectedExamId);
    }

    if (selectedPaperId) {
      list = list.filter(a => a.paper_id === selectedPaperId);
    }

    return list.sort((a, b) => {
      const timeA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const timeB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [allAttempts, selectedExamId, selectedPaperId]);

  const handleExamChange = useCallback((val: string) => {
    setSelectedExamId(val);
    const firstPaper = metadata.papers
      .filter(p => p.exam_id === val)
      .sort((a, b) => a.name.localeCompare(b.name))[0];
    if (firstPaper) setSelectedPaperId(firstPaper.id);
    else setSelectedPaperId('');
  }, [metadata.papers]);

  return {
    loading,
    errorState,
    pageError,
    retryError,
    navigate,
    isAppsc,
    metadata,
    selectedExamId,
    selectedPaperId,
    setSelectedPaperId,
    handleExamChange,
    examOptions,
    paperOptions,
    filteredAttempts,
  };
}
