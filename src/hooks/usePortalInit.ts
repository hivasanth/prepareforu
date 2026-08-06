import { useCallback, useEffect } from 'react';
import { useStableFetch } from './useStableFetch';

interface UsePortalInitOptions {
  authLoading: boolean;
  examSelection: string | undefined;
  setLoading: (loading: boolean) => void;
  onError: (message: string) => void;
  loadData: (force: boolean) => Promise<void>;
}

export function usePortalInit({
  authLoading,
  examSelection,
  setLoading,
  onError,
  loadData,
}: UsePortalInitOptions) {
  const { mountedRef, nextId, isStale } = useStableFetch();

  const initPortal = useCallback(async (force = false) => {
    if (authLoading) return;
    if (!examSelection) return;
    const id = nextId();
    try {
      await loadData(force);
      if (isStale(id)) return;
    } catch (err: unknown) {
      if (isStale(id)) return;
      setLoading(false);
      onError(err instanceof Error ? err.message : "Failed to load portal");
    }
  }, [authLoading, examSelection, loadData, setLoading, onError, nextId, isStale]);

  useEffect(() => {
    initPortal();
  }, [initPortal]);

  return { initPortal, mountedRef };
}
