import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Question } from '../types/exam.types';

interface UsePortalLaunchOptions {
  guard: () => boolean;
  fetchQuestions: () => Promise<Question[]>;
  buildNavState: () => Record<string, unknown>;
  navPath: string;
  onError: (message: string) => void;
}

export function usePortalLaunch({
  guard,
  fetchQuestions,
  buildNavState,
  navPath,
  onError,
}: UsePortalLaunchOptions) {
  const [isLaunching, setIsLaunching] = useState(false);
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const launchTest = useCallback(async () => {
    if (!guard() || isLaunching) return;
    setIsLaunching(true);

    try {
      const questions = await fetchQuestions();
      if (!mountedRef.current) return;

      navigate(navPath, { state: { ...buildNavState(), questions } });
    } catch (err: unknown) {
      if (mountedRef.current) {
        onError(err instanceof Error ? err.message : "Failed to launch");
      }
    } finally {
      if (mountedRef.current) {
        setIsLaunching(false);
      }
    }
  }, [isLaunching, guard, fetchQuestions, buildNavState, navPath, onError, navigate]);

  return { isLaunching, launchTest };
}
