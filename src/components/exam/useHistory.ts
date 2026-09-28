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
import type { PerformanceAttemptSummary } from '../../types/exam.types';

export function useHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isAppsc = user?.exam_selection === 'APPSC_GROUPS' || user?.exam_selection === 'APPSC';

  const [allAttempts, setAllAttempts] = useState<PerformanceAttemptSummary[]>(() => {
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

  const isRetrying = errorState === 'retrying';
  const isLoading = loading || isRetrying;

  const loadHistory = useCallback(async (force = false): Promise<boolean> => {
    if (authLoading) return false;
    if (!user?.id || !user?.exam_selection) return false;
    const id = nextId();

    if (force) {
      clearPerformanceCache(user.id);
    }

    // BUG-2 fix: keep the loading gate closed during a forced retry. Without
    // this, the force path skipped `setLoading(true)` so the moment
    // `resetError()` cleared the 'retrying' state the page fell through to
    // `loading=false + error=null + data=[]` — an empty/content flash (cold
    // cache) or stale-content-as-success (warm cache) mid-retry.
    if (force || !getCachedAttempts(user?.id || '')?.length || !getCachedMetadata(user?.exam_selection || '')?.exams?.length) {
      setLoading(true);
    }

    resetError();

    try {
      const [historyData, metaData] = await Promise.all([
        fetchPerformanceAttempts(user.id, force),
        fetchPerformanceMetadata(user.exam_selection, false),
      ]);

      if (isStale(id)) return false;

      setAllAttempts(historyData || []);
      setMetadata(metaData || { exams: [], papers: [], subjects: [] });
      return true;
    } catch (err: unknown) {
      if (isStale(id)) return false;
      captureNetworkError(err, { retryFn: () => loadHistory(true) });
      return false;
    } finally {
      if (!isStale(id)) {
        setLoading(false);
      }
    }
  }, [authLoading, user?.id, user?.exam_selection]);

  // BUG-4 fix: reconcile selection against metadata whenever it changes.
  // A valid selection is preserved; an invalid one (stale exam after an
  // in-session `exam_selection` change, or a paper that no longer exists for
  // the selected exam) is re-derived. The old effect only ran while
  // `selectedExamId` was empty, so an in-session metadata change never
  // re-synced the selection.
  useEffect(() => {
    if (metadata.exams.length === 0) return;

    const examValid = metadata.exams.some(e => e.id === selectedExamId);

    if (!examValid) {
      const firstExamId = [...metadata.exams].sort((a, b) => a.name.localeCompare(b.name))[0].id;
      setSelectedExamId(firstExamId);

      if (isAppsc) {
        const firstPaper = metadata.papers
          .filter(p => p.exam_id === firstExamId)
          .sort((a, b) => a.name.localeCompare(b.name))[0];
        setSelectedPaperId(firstPaper?.id ?? '');
      } else {
        setSelectedPaperId('');
      }
      return;
    }

    if (isAppsc) {
      const papers = metadata.papers.filter(p => p.exam_id === selectedExamId);
      if (papers.length > 0 && !papers.some(p => p.id === selectedPaperId)) {
        setSelectedPaperId([...papers].sort((a, b) => a.name.localeCompare(b.name))[0].id);
      }
    } else if (selectedPaperId) {
      setSelectedPaperId('');
    }
  }, [metadata, selectedExamId, selectedPaperId, isAppsc]);

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

  // BUG-5 fix: distinguish a genuinely empty history (no attempts at all)
  // from a filter-empty result (attempts exist, none match the selection).
  const isEmptyFilter = filteredAttempts.length === 0 && allAttempts.length > 0;

  const handleExamChange = useCallback((val: string) => {
    setSelectedExamId(val);
    const firstPaper = metadata.papers
      .filter(p => p.exam_id === val)
      .sort((a, b) => a.name.localeCompare(b.name))[0];
    if (firstPaper) setSelectedPaperId(firstPaper.id);
    else setSelectedPaperId('');
  }, [metadata.papers]);

  return {
    isLoading,
    authLoading,
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
    isEmptyFilter,
  };
}
