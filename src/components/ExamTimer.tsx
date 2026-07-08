import { useState, useEffect, useRef, type FC } from 'react';
import { useToast } from '../hooks/useToast';
import { updateTabSwitchCount } from '../services/examService';

interface ExamTimerProps {
  attemptId: string;
  durationMinutes: number;
  startedAt: string;
  onTimeUp: () => void;
  tabSwitchLimit?: number;
  initialTabSwitches?: number;
}

export const ExamTimer: FC<ExamTimerProps> = ({
  attemptId,
  durationMinutes,
  startedAt,
  onTimeUp,
  tabSwitchLimit = 5,
  initialTabSwitches = 0
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [tabSwitches, setTabSwitches] = useState(initialTabSwitches);
  const { showToast } = useToast();
  const timerRef = useRef<any>(null);

  /**
   * INDUSTRY BEST PRACTICE: "Callback Ref" pattern.
   *
   * Store the latest `onTimeUp` in a ref so the setInterval closure always
   * calls the most-recent version without needing `onTimeUp` in its dependency
   * array. This prevents the interval from being torn down and recreated on
   * every parent re-render, which was the primary cause of the immediate
   * auto-submit bug.
   */
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // ─── Timer: Calculate and count down from server-authoritative startedAt ────
  useEffect(() => {
    const calculateTimeLeft = () => {
      const startedTime = new Date(startedAt).getTime();
      const endTime = startedTime + durationMinutes * 60 * 1000;
      return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    };

    // Set immediately so there's no "0" flash on mount
    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    // If time is already up when the component mounts (e.g. resumed attempt),
    // fire immediately instead of waiting for the first tick.
    if (initial <= 0) {
      onTimeUpRef.current();
      return;
    }

    timerRef.current = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        onTimeUpRef.current(); // always calls the latest version via ref
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // ✅ onTimeUp intentionally excluded — handled by the ref above.
    // Only restart the interval if the exam config itself changes.
  }, [startedAt, durationMinutes]);

  // ─── Tab Switch Detection ────────────────────────────────────────────────────
  /**
   * NOTE: visibilitychange is intentionally handled here in ExamTimer ONLY.
   * ActiveExamPage previously also registered the same event, causing double-
   * counting of tab switches. That duplicate handler has been removed.
   */
  const tabSwitchesRef = useRef(tabSwitches);
  useEffect(() => {
    tabSwitchesRef.current = tabSwitches;
  }, [tabSwitches]);

  // Stable refs so the event listener closure never goes stale
  const attemptIdRef = useRef(attemptId);
  const tabSwitchLimitRef = useRef(tabSwitchLimit);
  const showToastRef = useRef(showToast);
  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);
  useEffect(() => { tabSwitchLimitRef.current = tabSwitchLimit; }, [tabSwitchLimit]);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) return;

      try {
        const newCount = await updateTabSwitchCount(
          attemptIdRef.current,
          tabSwitchesRef.current
        );
        setTabSwitches(newCount);

        const limit = tabSwitchLimitRef.current;
        if (newCount >= limit) {
          showToastRef.current(
            'Security Alert: Maximum tab switches reached. Auto-submitting...',
            'error'
          );
          onTimeUpRef.current();
        } else if (newCount >= 3) {
          showToastRef.current(
            `Warning: You have ${limit - newCount} tab switch(es) left before auto-submit.`,
            'warning'
          );
        } else {
          showToastRef.current(
            `Tab switch recorded. Warning: ${newCount}/${limit}`,
            'warning'
          );
        }
      } catch (err) {
        console.error('Failed to update tab switch count', err instanceof Error ? err.message : err);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // ✅ Empty deps — all values accessed via stable refs; listener registered once.
  }, []);

  // ─── Formatting ─────────────────────────────────────────────────────────────
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentageLeft = durationMinutes > 0
    ? (timeLeft / (durationMinutes * 60)) * 100
    : 0;

  const getTimerColor = () => {
    if (percentageLeft <= 10) return 'text-rose-500 font-black animate-pulse';
    if (percentageLeft <= 25) return 'text-amber-500 font-bold';
    return 'text-emerald-500 font-bold';
  };

  const getBorderColor = () => {
    if (percentageLeft <= 10) return 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
    if (percentageLeft <= 25) return 'border-amber-500/30';
    return 'border-emerald-500/20';
  };

  return (
    <div className={`
      flex items-center gap-2 px-6 py-2.5 rounded-2xl border-2 transition-all duration-500
      ${getBorderColor()}
      bg-elevated-bg
    `}>
      <div className="flex flex-col items-center">
        <span className="text-[9px] font-black uppercase tracking-widest leading-none mb-1 text-text-disabled">
          Remaining
        </span>
        <div className={`text-2xl tabular-nums leading-none font-['Vend_Sans'] ${getTimerColor()}`}>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};
