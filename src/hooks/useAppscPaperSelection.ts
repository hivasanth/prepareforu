import { useEffect } from 'react';
import { useStableFetch } from './useStableFetch';
import { getMinQuestions } from '../services/questionAvailabilityService';

interface UseAppscPaperSelectionOptions {
  isAppsc: boolean;
  selectedPaperId: string | null;
  examSelection: string | undefined;
  setMinQuestions: (minQ: number) => void;
  fetchPaperData: (paperId: string) => Promise<void>;
}

export function useAppscPaperSelection({
  isAppsc,
  selectedPaperId,
  examSelection,
  setMinQuestions,
  fetchPaperData,
}: UseAppscPaperSelectionOptions) {
  const { mountedRef } = useStableFetch();

  useEffect(() => {
    if (!isAppsc || !selectedPaperId || !examSelection) return;
    let isCurrent = true;

    async function run() {
      try {
        await fetchPaperData(selectedPaperId || '');
        if (!isCurrent || !mountedRef.current) return;

        const minQ = await getMinQuestions(examSelection || '', false);
        if (isCurrent && mountedRef.current) setMinQuestions(minQ);
      } catch (e) {
        console.error(e instanceof Error ? e.message : e);
      }
    }
    run();

    return () => {
      isCurrent = false;
    };
  }, [selectedPaperId, isAppsc, examSelection, fetchPaperData, setMinQuestions, mountedRef]);
}
