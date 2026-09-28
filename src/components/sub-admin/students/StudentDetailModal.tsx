import { useEffect, useRef, useState } from 'react';
import { Users, Calendar, TrendingUp, Award, BookOpen, Copy, Download, Check } from 'lucide-react';
import { MotionConfig, motion } from 'framer-motion';
import {
  Stack,
  Grid,
  Card,
  Badge,
  Button,
  StatCard,
  Label,
  Body,
  FloatingList,
  FloatingListHeader,
  FloatingListItem,
} from '../../common/AntigravityUI';
import { AdminModal } from '../../common/AdminModal';
import { HEADER_CELL, ATTEMPTS_TABLE_GRID } from './studentsTableGrid';
import type { Student } from './useStudents';

interface StudentDetailModalProps {
  student: Student;
  onClose: () => void;
  onCopyData: (s: Student) => Promise<boolean>;
  onDownloadCSV: (s: Student) => boolean;
}

// Action feedback is owned HERE, by the modal that renders the actions
// (one authoritative feedback owner per action — no global toast). The state
// machines below render inline, modal-local success/error states on the very
// buttons that produced them, then auto-revert.
type CopyState = 'idle' | 'copying' | 'copied' | 'error';
type DownloadState = 'idle' | 'preparing' | 'downloaded' | 'error';

const SUCCESS_RESET_MS = 2000; // matches the repo's existing copied-reset timer
const ERROR_RESET_MS = 3000;

const CHECK_POP = {
  initial: { scale: 0.5, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
} as const;

export function StudentDetailModal({
  student: s,
  onClose,
  onCopyData,
  onDownloadCSV,
}: StudentDetailModalProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const copyTimerRef = useRef<number | null>(null);
  const downloadTimerRef = useRef<number | null>(null);
  const errorTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
    if (downloadTimerRef.current !== null) clearTimeout(downloadTimerRef.current);
    if (errorTimerRef.current !== null) clearTimeout(errorTimerRef.current);
  }, []);

  const handleCopy = async () => {
    if (copyState === 'copying') return;
    setCopyState('copying');
    const ok = await onCopyData(s);
    if (!ok) {
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
      setCopyState('error');
      errorTimerRef.current = window.setTimeout(() => setCopyState('idle'), ERROR_RESET_MS);
      return;
    }
    if (errorTimerRef.current !== null) clearTimeout(errorTimerRef.current);
    setCopyState('copied');
    copyTimerRef.current = window.setTimeout(() => setCopyState('idle'), SUCCESS_RESET_MS);
  };

  const handleDownload = () => {
    // Rapid-click control: once a download has been prepared/started, further
    // clicks are ignored until the success state auto-reverts. Error remains
    // retryable immediately.
    if (downloadState !== 'idle' && downloadState !== 'error') return;
    setDownloadState('preparing');
    const ok = onDownloadCSV(s);
    if (!ok) {
      setDownloadState('error');
      errorTimerRef.current = window.setTimeout(() => setDownloadState('idle'), ERROR_RESET_MS);
      return;
    }
    setDownloadState('downloaded');
    downloadTimerRef.current = window.setTimeout(() => setDownloadState('idle'), SUCCESS_RESET_MS);
  };

  const copyLabel =
    copyState === 'copied' ? 'Copied'
    : copyState === 'copying' ? 'Copying…'
    : 'Copy Data';
  const downloadLabel =
    downloadState === 'downloaded' ? 'Downloaded'
    : downloadState === 'preparing' ? 'Preparing…'
    : 'Download CSV';

  return (
    <AdminModal
      isOpen={!!s}
      onClose={onClose}
      title={s.full_name}
      description={s.email}
      headerBadge={<Badge variant="primary" icon={Users}>Student Profile</Badge>}
      footer={
        <MotionConfig reducedMotion="user">
          <Stack direction="row" gap="sm">
            <Stack gap="xs" align="start">
              {copyState === 'error' && (
                <p aria-live="polite" className="text-xs text-danger font-semibold leading-tight">
                  Copy failed — try again
                </p>
              )}
              <Button
                variant={copyState === 'copied' ? 'success' : 'secondary'}
                disabled={copyState === 'copying'}
                onClick={handleCopy}
                aria-label={copyLabel}
              >
                {copyState === 'copied' ? (
                  <motion.span {...CHECK_POP} transition={{ duration: 0.18 }} className="inline-flex">
                    <Check size={16} className="mr-2" aria-hidden />
                  </motion.span>
                ) : (
                  <Copy size={16} className="mr-2" aria-hidden />
                )}
                {copyLabel}
              </Button>
            </Stack>
            <Stack gap="xs" align="start">
              {downloadState === 'error' && (
                <p aria-live="polite" className="text-xs text-danger font-semibold leading-tight">
                  Download failed — try again
                </p>
              )}
              <Button
                variant={downloadState === 'downloaded' ? 'success' : 'primary'}
                disabled={downloadState === 'preparing'}
                onClick={handleDownload}
                aria-label={downloadLabel}
                /* AU-4 shared modal contract: deterministic initial focus. The
                   primary (Download CSV) footer action is the natural default
                   when inspecting a student profile — AdminModal's FocusTrap
                   reads [data-modal-initial-focus] and lands focus here on
                   open, race-free. */
                data-modal-initial-focus="true"
              >
                {downloadState === 'downloaded' ? (
                  <motion.span {...CHECK_POP} transition={{ duration: 0.18 }} className="inline-flex">
                    <Check size={16} className="mr-2" aria-hidden />
                  </motion.span>
                ) : (
                  <Download size={16} className="mr-2" aria-hidden />
                )}
                {downloadLabel}
              </Button>
            </Stack>
          </Stack>
        </MotionConfig>
      }
    >
      <Stack gap="xl">
        {/* Responsive stat grid: 1-col mobile → 4-col desktop (shares the shared
            Grid contract, certified for the same 1280/390 overflow behavior). */}
        <Grid cols={4}>
          <StatCard icon={Users} label="Coupon" value={s.coupon_code || 'N/A'} color="var(--primary)" />
          <StatCard icon={Calendar} label="Joined" value={new Date(s.created_at).toLocaleDateString()} color="var(--success)" />
          <StatCard icon={TrendingUp} label="Avg. Score" value={`${s.stats.avgPct}%`} color="var(--warning)" />
          <StatCard icon={Award} label="Best Score" value={`${s.stats.bestPct}%`} color="var(--danger)" />
        </Grid>

        <Stack gap="md">
          <div className="flex items-center justify-between">
            <Label>Academic Timeline</Label>
            <Badge variant="default" icon={BookOpen}>{s.attempts.length} Attempts</Badge>
          </div>

          {s.attempts.length === 0 ? (
            <Card variant="subtle" className="py-12 text-center opacity-40">
              <TrendingUp size={48} className="mx-auto mb-3" />
              <Body secondary>No academic activity recorded yet.</Body>
            </Card>
          ) : (
            /* Same visual/structural table family as the main Students page:
             * Card(elevated) → FloatingList → FloatingListHeader (premium dark
             * surface) + FloatingListItem (gold rows), all bound to the shared
             * ATTEMPTS_TABLE_GRID contract so header ↔ row geometry matches. */
            <Card variant="elevated">
              <FloatingList gap="md">
                <FloatingListHeader padding="md">
                  <div
                    data-testid="attempts-header-grid"
                    className={`${ATTEMPTS_TABLE_GRID} text-text-muted light:text-[var(--gold-300)]`}
                  >
                    <span className={`${HEADER_CELL} text-left`}>Exam</span>
                    <span className={`${HEADER_CELL} text-center`}>Score (%)</span>
                    <span className={`${HEADER_CELL} hidden md:block text-center`}>Marks</span>
                    <span className={`${HEADER_CELL} hidden md:block text-center`}>Duration</span>
                    <span className={`${HEADER_CELL} text-center`}>Submission</span>
                  </div>
                </FloatingListHeader>

                {s.attempts.map((a) => (
                  <FloatingListItem
                    key={a.id}
                    padding="md"
                    innerClassName={`${ATTEMPTS_TABLE_GRID} w-full`}
                  >
                    {/* EXAM — identity column, left-aligned + truncated */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-text-primary truncate text-[13px]">{a.exam_name}</p>
                      </div>
                    </div>

                    {/* SCORE (%) — canonical percentage metric */}
                    <div className="flex justify-center min-w-0">
                      <span className="font-black text-primary text-[13px]">{a.percentage}%</span>
                    </div>

                    {/* MARKS — raw score / total, kept visible (no masking) */}
                    <div className="hidden md:flex justify-center min-w-0">
                      <span className="text-text-secondary text-[12px]">
                        {a.raw_score} / {a.total_marks}
                      </span>
                    </div>

                    {/* DURATION — mm ss */}
                    <div className="hidden md:flex justify-center min-w-0">
                      <span className="text-[var(--text-muted)] font-medium text-[12px]">
                        {Math.floor(a.time_taken / 60)}m {a.time_taken % 60}s
                      </span>
                    </div>

                    {/* SUBMISSION — locale date */}
                    <div className="flex justify-center min-w-0">
                      <span className="text-[var(--text-muted)] font-medium text-[12px]">
                        {new Date(a.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </FloatingListItem>
                ))}
              </FloatingList>
            </Card>
          )}
        </Stack>
      </Stack>
    </AdminModal>
  );
}
