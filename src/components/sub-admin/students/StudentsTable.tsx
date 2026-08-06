import { Users, Eye } from 'lucide-react';
import {
  Card,
  Badge,
  DataGrid,
  IconButton,
} from '../../common/AntigravityUI';
import { AdminIconWrap } from '../../common/AdminIconWrap';
import { AdminText } from '../../common/AdminText';
import type { Student } from './useStudents';

interface StudentsTableProps {
  students: Student[];
  onViewDetail: (student: Student) => void;
}

export function StudentsTable({ students, onViewDetail }: StudentsTableProps) {
  return (
    <Card variant="default" className="p-0 overflow-hidden border-border-subtle/20">
      <DataGrid
        rowKey="id"
        rows={students}
        columns={[
          {
            key: '_idx',
            label: 'SR.',
            headerClassName: 'w-12 text-center',
            cellClassName: 'text-center',
            render: (val: number) => (
              <span className="text-[10px] font-bold text-[var(--text-muted)]">
                {val + 1}
              </span>
            ),
          },
          {
            key: 'full_name',
            label: 'Student',
            render: (_: any, s: Student) => (
              <div className="flex items-center gap-3">
                <AdminIconWrap size="sm" rounded="full">
                  <Users size={14} />
                </AdminIconWrap>
                <div className="min-w-0">
                  <AdminText as="p" variant="cinzel" className="font-bold text-text-primary truncate text-[13px]">{s.full_name}</AdminText>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{s.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'totalExams',
            label: 'Exams',
            align: 'center',
            render: (_: any, s: Student) => (
              <Badge variant="default" className="!h-6 !px-2">
                {s.stats.totalExams} Attempts
              </Badge>
            ),
          },
          {
            key: 'avgScore',
            label: 'Avg. Score',
            align: 'center',
            render: (_: any, s: Student) => (
              <span className="font-black text-primary text-[13px]">
                {s.stats.avgScore}%
              </span>
            ),
          },
          {
            key: 'lastActive',
            label: 'Last Active',
            render: (_: any, s: Student) => (
              <span className="text-[var(--text-muted)] font-medium text-[12px]">
                {s.stats.lastActive ? new Date(s.stats.lastActive).toLocaleDateString() : 'Never'}
              </span>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            align: 'center',
            render: (_: any, s: Student) => (
              <div className="flex items-center justify-center">
                <IconButton
                  size="sm"
                  variant="primary"
                  onClick={() => onViewDetail(s)}
                  title="View Analytics"
                  aria-label={`View analytics for ${s.full_name}`}
                  className="border border-primary/20 hover:border-primary !rounded-xl"
                >
                  <Eye size={16} />
                </IconButton>
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
}
