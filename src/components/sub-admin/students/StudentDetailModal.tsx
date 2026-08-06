import { Users, Calendar, TrendingUp, Award, BookOpen, Copy, Download, AlertCircle } from 'lucide-react';
import {
  Stack,
  Card,
  Badge,
  Button,
  StatCard,
  Label,
  Body,
  DataGrid,
  Alert,
} from '../../common/AntigravityUI';
import { AdminModal } from '../../common/AdminModal';
import type { Student } from './useStudents';

interface StudentDetailModalProps {
  student: Student;
  onClose: () => void;
  onCopyData: (s: Student) => void;
  onDownloadCSV: (s: Student) => void;
  actionError: string | null;
}

export function StudentDetailModal({
  student: s,
  onClose,
  onCopyData,
  onDownloadCSV,
  actionError,
}: StudentDetailModalProps) {
  return (
    <AdminModal
      isOpen={!!s}
      onClose={onClose}
      title={s.full_name}
      description={s.email}
      headerBadge={<Badge variant="primary" icon={Users}>Student Profile</Badge>}
      footer={
        <Stack direction="row" gap="sm">
          <Button variant="secondary" onClick={() => onCopyData(s)}>
            <Copy size={16} className="mr-2" /> Copy Data
          </Button>
          <Button variant="primary" onClick={() => onDownloadCSV(s)}>
            <Download size={16} className="mr-2" /> Download CSV
          </Button>
        </Stack>
      }
    >
      <Stack gap="xl">
        {actionError && (
          <Alert variant="error" icon={AlertCircle} title="Action failed">
            {actionError}
          </Alert>
        )}
        <div className="grid grid-cols-4 gap-4">
          <StatCard icon={Users} label="Coupon" value={s.coupon_code || 'N/A'} color="var(--primary)" />
          <StatCard icon={Calendar} label="Joined" value={new Date(s.created_at).toLocaleDateString()} color="var(--success)" />
          <StatCard icon={TrendingUp} label="Avg. Score" value={`${s.stats.avgScore}%`} color="var(--warning)" />
          <StatCard icon={Award} label="Best Score" value={`${s.stats.bestScore}%`} color="var(--danger)" />
        </div>

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
            <Card variant="default" className="p-0 overflow-hidden">
              <DataGrid
                rowKey="id"
                rows={s.attempts}
                columns={[
                  { key: 'exam_name', label: 'Exam Protocol', cellClassName: 'font-bold text-text-primary' },
                  { key: 'score', label: 'Score', render: (val) => <span className="font-black text-primary">{val}%</span> },
                  { key: 'time_taken', label: 'Duration', render: (val) => `${Math.floor(Number(val) / 60)}m ${Number(val) % 60}s` },
                  { key: 'submitted_at', label: 'Submission', render: (val) => new Date(val as string).toLocaleDateString() },
                ]}
              />
            </Card>
          )}
        </Stack>
      </Stack>
    </AdminModal>
  );
}
