import { useState, useEffect, useCallback } from 'react';

import { Trophy, Medal } from 'lucide-react';
import { fetchTeacherExamLeaderboard } from '../../services/teacherExamService';
import { LoadingSkeleton, ErrorState, EmptyState } from '../common/SharedComponents';
import { Button, Badge, DataGrid } from '../common/AntigravityUI';
import { Body } from '../common/AntigravityTypography';
import { IconBadge } from '../common/IconBadge';
import { AdminModal } from '../common/AdminModal';
import { useStableFetch } from '../../hooks/useStableFetch';
import type { UserProfile } from '../../types/auth.types';
import type { TeacherExamLeaderboardEntry } from '../../types/exam.types';

interface TeacherLeaderboardModalProps {
  exam: { id: string; title: string };
  user: UserProfile;
  onClose: () => void;
}

function getRankBadge(rank: number) {
  if (rank === 1) return <Badge variant="primary" size="sm"><Medal size={12} className="mr-1" />1ST</Badge>;
  if (rank === 2) return <Badge variant="secondary" size="sm"><Medal size={12} className="mr-1" />2ND</Badge>;
  if (rank === 3) return <Badge variant="warning" size="sm"><Medal size={12} className="mr-1" />3RD</Badge>;
  return <Badge variant="default" size="sm">#{rank}</Badge>;
}

function getAccuracyVariant(accuracy: number) {
  if (accuracy >= 80) return 'success' as const;
  if (accuracy >= 60) return 'warning' as const;
  return 'danger' as const;
}

export function TeacherLeaderboardModal({ exam, user, onClose }: TeacherLeaderboardModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeacherExamLeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { nextId, isStale } = useStableFetch();

  const loadLeaderboard = useCallback(async (force = false) => {
    const id = nextId();
    setError(null);
    setLoading(true);
    try {
      const rankings = await fetchTeacherExamLeaderboard({ user }, exam.id, force);
      if (isStale(id)) return;
      setData(rankings);
    } catch (err: unknown) {
      if (isStale(id)) return;
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard data.');
    } finally {
      if (!isStale(id)) setLoading(false);
    }
  }, [exam.id, user]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return (
    <AdminModal
      isOpen={true}
      onClose={onClose}
      title={exam.title}
      description="Live Leaderboard"
      headerBadge={<IconBadge icon={Trophy} size="md" shape="rounded" status="primary" />}
      maxWidth="sm:max-w-3xl"
      footer={
        <Button variant="secondary" onClick={onClose} className="px-6">
          Close
        </Button>
      }
    >
      <div className="min-h-[200px] sm:min-h-[300px]">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <LoadingSkeleton key={i} height={50} borderRadius={12} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => loadLeaderboard(true)} />
        ) : data.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="No Rankings Yet"
            subtitle="Once participants complete the exam, the rankings will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <DataGrid
              rowKey="rank"
              columns={[
                {
                  key: 'rank',
                  label: 'RANK',
                  align: 'center',
                  headerClassName: 'w-20',
                  cellClassName: 'w-20',
                  render: (val) => getRankBadge(val),
                },
                {
                  key: 'name',
                  label: 'PARTICIPANT',
                  render: (val) => (
                    <Body className="font-bold text-text-primary uppercase m-0">{val}</Body>
                  ),
                },
                {
                  key: 'score',
                  label: 'SCORE',
                  align: 'center',
                  headerClassName: 'w-24',
                  cellClassName: 'w-24',
                  render: (val) => (
                    <span className="text-[14px] font-black text-primary tabular-nums">{val}</span>
                  ),
                },
                {
                  key: 'accuracy',
                  label: 'ACCURACY',
                  align: 'center',
                  headerClassName: 'w-28',
                  cellClassName: 'w-28',
                  render: (val) => {
                    const numVal = typeof val === 'number' ? val : parseFloat(val);
                    return (
                      <Badge variant={getAccuracyVariant(numVal)} size="sm">
                        {val}%
                      </Badge>
                    );
                  },
                },
                {
                  key: 'time',
                  label: 'TIME',
                  align: 'right',
                  headerClassName: 'w-24',
                  cellClassName: 'w-24',
                  render: (val) => (
                    <Body className="text-text-muted tabular-nums m-0">{val}</Body>
                  ),
                },
              ]}
              rows={data}
            />
          </div>
        )}
      </div>
    </AdminModal>
  );
}
