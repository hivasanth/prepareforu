import { useState, useEffect, useRef, type FC } from 'react';
import { updateTabSwitchCount } from '../services/examService';

interface ExamTimerProps {
  attemptId: string;
  durationMinutes: number;
  startedAt: string;
  onTimeUp: () => void;
  tabSwitchLimit?: number;
  /** Contextual exam banner (Group 5: floating warnings eliminated). */
  onSecurityNotice?: (message: string) => void;
}

export const ExamTimer: FC<ExamTimerProps> = ({
  attemptId,
  durationMinutes,
  startedAt,
  onTimeUp,
  tabSwitchLimit = 5,
  onSecurityNotice,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [announcement, setAnnouncement] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setAnnouncement('Time is up. Your answers are being submitted.');
      onTimeUpRef.current();
      return;
    }

    timerRef.current = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      // Last-minute countdown announced to screen readers at 10-second marks.
      if (remaining > 0 && remaining <= 60 && remaining % 10 === 0) {
        setAnnouncement(`${remaining} seconds remaining`);
      }

      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        setAnnouncement('Time is up. Your answers are being submitted.');
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

  // Stable refs so the event listener closure never goes stale
  const attemptIdRef = useRef(attemptId);
  const tabSwitchLimitRef = useRef(tabSwitchLimit);
  const onSecurityNoticeRef = useRef(onSecurityNotice);
  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);
  useEffect(() => { tabSwitchLimitRef.current = tabSwitchLimit; }, [tabSwitchLimit]);
  useEffect(() => { onSecurityNoticeRef.current = onSecurityNotice; }, [onSecurityNotice]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) return;

      try {
        // M-03 fix: increment is server-side and atomic — no client-supplied
        // count. The DB returns the new authoritative count.
        const newCount = await updateTabSwitchCount(attemptIdRef.current);

        const limit = tabSwitchLimitRef.current;
        if (newCount >= limit) {
          onSecurityNoticeRef.current?.(
            'Security Alert: Maximum tab switches reached. Auto-submitting...'
          );
          onTimeUpRef.current();
        } else if (newCount >= 3) {
          onSecurityNoticeRef.current?.(
            `Warning: You have ${limit - newCount} tab switch(es) left before auto-submit.`
          );
        } else {
          onSecurityNoticeRef.current?.(
            `Tab switch recorded. Warning: ${newCount}/${limit}`
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
    if (percentageLeft <= 10) return 'text-danger font-black animate-pulse';
    if (percentageLeft <= 25) return 'text-warning font-bold';
    return 'text-success font-bold';
  };

  const getBorderColor = () => {
    if (percentageLeft <= 10) return 'border-danger/50 shadow-glow-danger';
    if (percentageLeft <= 25) return 'border-warning/30';
    return 'border-success/20';
  };

  return (
    <div
      role="timer"
      aria-label={`Time remaining: ${minutes} minutes ${seconds} seconds`}
      className={`
      flex items-center gap-2 px-6 py-2.5 rounded-2xl border-2 transition-interaction duration-very-slow ease-standard
      ${getBorderColor()}
      bg-elevated-bg
    `}>
      <div className="flex flex-col items-center">
        <span className="text-[9px] font-bold uppercase tracking-widest leading-none mb-1 text-text-muted">
          Remaining
        </span>
        <div className={`text-2xl tabular-nums leading-none font-sans ${getTimerColor()}`}>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>
      <span role="status" className="sr-only">{announcement}</span>
    </div>
  );
};
