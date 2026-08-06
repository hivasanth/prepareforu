import { useState, useEffect, useCallback } from 'react';

interface UseExamSecurityOptions {
  initComplete: boolean;
  loading: boolean;
  attemptId: string | null | undefined;
  isActuallySubmitted: React.MutableRefObject<boolean>;
  /** Contextual exam banner (Group 5: floating warnings eliminated). */
  onSecurityNotice?: (message: string) => void;
}

interface UseExamSecurityReturn {
  showFullscreenPrompt: boolean;
  setShowFullscreenPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  fullscreenViolations: number;
  requestFullscreen: () => void;
}

export function useExamSecurity({
  initComplete,
  loading,
  attemptId,
  isActuallySubmitted,
  onSecurityNotice,
}: UseExamSecurityOptions): UseExamSecurityReturn {
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [fullscreenViolations, setFullscreenViolations] = useState(0);

  const requestFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (!elem.requestFullscreen) return;
    elem.requestFullscreen()
      .then(() => setShowFullscreenPrompt(false))
      .catch(() => setShowFullscreenPrompt(true));
  }, []);

  useEffect(() => {
    if (!initComplete || loading || !attemptId) return;
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const preventCopyPaste = (e: Event) => { e.preventDefault(); onSecurityNotice?.('Security Policy disabled during exams.'); };
    const handleFullscreenChange = () => {
      if (document.fullscreenElement || isActuallySubmitted.current) return;
      setShowFullscreenPrompt(true);
      setFullscreenViolations(prev => prev + 1);
      onSecurityNotice?.('Maintain fullscreen during the exam.');
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('selectstart', preventCopyPaste);
    document.addEventListener('dragstart', preventCopyPaste);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('selectstart', preventCopyPaste);
      document.removeEventListener('dragstart', preventCopyPaste);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loading, attemptId, onSecurityNotice, initComplete, isActuallySubmitted]);

  return {
    showFullscreenPrompt,
    setShowFullscreenPrompt,
    fullscreenViolations,
    requestFullscreen,
  };
}
