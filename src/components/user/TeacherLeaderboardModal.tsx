import { useState, useEffect, useRef, useCallback } from 'react';
import { FocusTrap } from 'focus-trap-react';

import { Trophy, X } from 'lucide-react';
import { fetchTeacherExamLeaderboard } from '../../services/teacherExamService';
import { LoadingSkeleton, ErrorState, EmptyState } from '../common/SharedComponents';
import { Card, Button, DataGrid } from '../common/AntigravityUI';
import type { UserProfile } from '../../types/auth.types';

interface TeacherLeaderboardModalProps {
  exam: { id: string; title: string };
  user: UserProfile;
  onClose: () => void;
}

export function TeacherLeaderboardModal({ exam, user, onClose }: TeacherLeaderboardModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; } }, []);

  const loadLeaderboard = useCallback(async (force = false) => {
    const id = ++requestId.current;
    setError(null);
    if (mountedRef.current) setLoading(true);
    try {
      const rankings = await fetchTeacherExamLeaderboard({ user }, exam.id, force);
      if (id !== requestId.current || !mountedRef.current) return;
      setData(rankings);
    } catch (err: any) {
      if (id !== requestId.current || !mountedRef.current) return;
      setError(err.message);
    } finally {
      if (id === requestId.current && mountedRef.current) setLoading(false);
    }
  }, [exam.id, user]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const modalId = `leaderboard-modal-${exam.id}`;
  const titleId = `${modalId}-title`;

  return (
    <FocusTrap focusTrapOptions={{ escapeDeactivates: true, clickOutsideDeactivates: true, initialFocus: false }}>
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl rounded-[24px] border-primary/20"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
      >
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-card-bg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Trophy size={20} />
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="text-[18px] font-black text-text-primary uppercase tracking-tight m-0 truncate">{exam.title}</h2>
              <p className="text-[12px] text-text-secondary font-bold uppercase tracking-widest opacity-40 m-0">Live Leaderboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-hover-bg flex items-center justify-center text-text-secondary transition-colors shrink-0"
            aria-label="Close leaderboard"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 min-h-[200px] sm:min-h-[300px]">
          {loading ? (
            <div className="p-12 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <LoadingSkeleton key={i} height={50} borderRadius={12} />)}
            </div>
          ) : error ? (
            <div className="p-12">
              <ErrorState message={error} onRetry={() => loadLeaderboard(true)} />
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                title="No Data Yet"
                subtitle="Once participants complete the exam, the rankings will appear here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DataGrid
                rowKey="rank"
                columns={[
                  { key: 'rank', label: 'RANK', align: 'center', render: (val) => (
                    <span className={`font-black ${val <= 3 ? 'text-primary scale-110' : 'text-text-secondary opacity-40'}`}>
                      #{val}
                    </span>
                  )},
                  { key: 'name', label: 'PARTICIPANT', render: (val) => <span className="font-bold text-text-primary uppercase">{val}</span> },
                  { key: 'score', label: 'SCORE', align: 'center', render: (val) => <span className="font-black text-primary">{val}</span> },
                  { key: 'accuracy', label: 'ACCURACY', align: 'center', render: (val) => <span className="font-bold text-success">{val}%</span> },
                  { key: 'time', label: 'TIME', align: 'right', render: (val) => <span className="font-medium text-text-secondary opacity-60 tabular-nums">{val}</span> },
                ]}
                rows={data}
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-hover-bg/30 border-t border-border-subtle flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close Portal</Button>
        </div>
      </Card>
    </div>
    </FocusTrap>
  );
}
