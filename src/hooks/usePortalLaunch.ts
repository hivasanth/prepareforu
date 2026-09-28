import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Question } from '../types/exam.types';

interface UsePortalLaunchOptions {
  guard: () => boolean;
  fetchQuestions: () => Promise<Question[]>;
  buildNavState: (questions: Question[]) => Record<string, unknown>;
  navPath: string;
  onError: (error: unknown) => void;
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

  const launchTest = useCallback(async (): Promise<boolean> => {
    if (!guard() || isLaunching) return false;
    setIsLaunching(true);

    try {
      const questions = await fetchQuestions();
      if (!mountedRef.current) return false;

      navigate(navPath, { state: { ...buildNavState(questions), questions } });
      return true;
    } catch (err: unknown) {
      if (mountedRef.current) {
        onError(err);
      }
      return false;
    } finally {
      if (mountedRef.current) {
        setIsLaunching(false);
      }
    }
  }, [isLaunching, guard, fetchQuestions, buildNavState, navPath, onError, navigate]);

  return { isLaunching, launchTest };
}
