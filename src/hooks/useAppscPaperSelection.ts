import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStableFetch } from './useStableFetch';
import { getMinQuestions } from '../services/questionAvailabilityService';

interface UseAppscPaperSelectionOptions {
  isAppsc: boolean;
  selectedPaperId: string | null;
  examSelection: string | undefined;
  setMinQuestions: (minQ: number) => void;
  fetchPaperData: (paperId: string, isCurrent: () => boolean) => Promise<void>;
  onPaperError: (error: unknown) => void;
}

/**
 * Loads the subjects/subject-counts for the selected APPSC paper and the
 * exam's min-questions threshold.
 *
 * ST-H2 remediation: paper-switch failures are surfaced via `onPaperError`
 * (no silent catch); the `paperLoading` gate is raised synchronously
 * (useLayoutEffect) ONLY on an actual paper change or retry — never on the
 * initial auto-select, so the cold mount keeps the exact same render path as
 * before — and the caller's `isCurrent` guard prevents stale paper data from
 * committing when a newer selection supersedes an in-flight fetch.
 */
export function useAppscPaperSelection({
  isAppsc,
  selectedPaperId,
  examSelection,
  setMinQuestions,
  fetchPaperData,
  onPaperError,
}: UseAppscPaperSelectionOptions) {
  const { mountedRef, nextId, isStale } = useStableFetch();
  const [paperLoading, setPaperLoading] = useState(false);
  const paperIdRef = useRef(selectedPaperId);
  const prevPaperRef = useRef<string | null>(null);

  useEffect(() => {
    paperIdRef.current = selectedPaperId;
  }, [selectedPaperId]);

  const loadPaper = useCallback(async (paperId: string): Promise<boolean> => {
    const id = nextId();
    try {
      await fetchPaperData(paperId, () => !isStale(id));
      if (isStale(id)) return false;
      const minQ = await getMinQuestions(examSelection || '', false);
      if (isStale(id)) return false;
      setMinQuestions(minQ);
      return true;
    } catch (error) {
      if (isStale(id)) return false;
      onPaperError(error);
      return false;
    } finally {
      if (!isStale(id)) setPaperLoading(false);
    }
  }, [fetchPaperData, examSelection, setMinQuestions, onPaperError, nextId, isStale]);

  // Raise the paper gate synchronously with an actual paper change so a
  // switch never paints the previous paper's subjects under the new tab.
  // The initial auto-select (null → first paper) is skipped: no stale data
  // exists yet, and skipping avoids an extra skeleton cycle on cold mount.
  useLayoutEffect(() => {
    if (!isAppsc || !selectedPaperId || !examSelection) return;
    if (prevPaperRef.current !== null && prevPaperRef.current !== selectedPaperId) {
      setPaperLoading(true);
    }
    prevPaperRef.current = selectedPaperId;
  }, [isAppsc, selectedPaperId, examSelection]);

  useEffect(() => {
    if (!isAppsc || !selectedPaperId || !examSelection) return;
    loadPaper(selectedPaperId);
  }, [isAppsc, selectedPaperId, examSelection, loadPaper]);

  const retryPaper = useCallback((): Promise<boolean> => {
    const current = paperIdRef.current;
    if (!current) return Promise.resolve(false);
    // Raise the gate for the retry window (ST-H1 class) — loadPaper clears it.
    setPaperLoading(true);
    return loadPaper(current);
  }, [loadPaper]);

  return { paperLoading, retryPaper, mountedRef };
}
