import { Users, Eye } from 'lucide-react';
import {
  Badge, Card, IconButton, FloatingList, FloatingListHeader, FloatingListItem,
} from '../../common/AntigravityUI';
import { AdminIconWrap } from '../../common/AdminIconWrap';
import { LoadingSkeleton } from '../../common/SharedComponents';
import { STUDENTS_TABLE_GRID, HEADER_CELL } from './studentsTableGrid';
import type { Student } from './useStudents';

interface StudentsTableProps {
  students: Student[];
  onViewDetail: (student: Student) => void;
}

/* Loading skeleton — consumes the SAME STUDENTS_TABLE_GRID contract as the
 * header and every row, so no layout shift occurs when data loads. */
export function StudentsTableSkeleton() {
  return (
    <Card variant="elevated">
      <FloatingList gap="md">
        <FloatingListHeader padding="md">
          <div className={STUDENTS_TABLE_GRID}>
            <div><LoadingSkeleton height={12} width={64} borderRadius={4} decorative /></div>
            <div className="flex justify-center"><LoadingSkeleton height={12} width={56} borderRadius={4} decorative /></div>
            <div className="hidden md:flex justify-center"><LoadingSkeleton height={12} width={40} borderRadius={4} decorative /></div>
            <div className="hidden md:flex justify-center"><LoadingSkeleton height={12} width={56} borderRadius={4} decorative /></div>
            <div className="flex justify-center"><LoadingSkeleton height={12} width={36} borderRadius={4} decorative /></div>
          </div>
        </FloatingListHeader>
        {Array.from({ length: 4 }).map((_, i) => (
          <FloatingListItem key={i} padding="md" innerClassName={`${STUDENTS_TABLE_GRID} w-full`}>
            <div className="flex items-center gap-3 min-w-0">
              <LoadingSkeleton height={32} width={32} borderRadius={9999} decorative />
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <LoadingSkeleton height={12} width="65%" borderRadius={4} decorative />
                <LoadingSkeleton height={10} width="45%" borderRadius={4} decorative />
              </div>
            </div>
            <div className="flex justify-center"><LoadingSkeleton height={20} width={72} borderRadius={9999} decorative /></div>
            <div className="hidden md:flex justify-center"><LoadingSkeleton height={12} width={32} borderRadius={4} decorative /></div>
            <div className="hidden md:flex justify-center"><LoadingSkeleton height={12} width={56} borderRadius={4} decorative /></div>
            <div className="flex justify-center"><LoadingSkeleton height={32} width={32} borderRadius={12} decorative /></div>
          </FloatingListItem>
        ))}
      </FloatingList>
    </Card>
  );
}

export function StudentsTable({ students, onViewDetail }: StudentsTableProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* ═══ Result count — context element ABOVE the data grid (never the
          column header itself) ════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-[10px] sm:text-[11px] font-bold text-text-muted uppercase tracking-wider">
          {students.length} Students
        </span>
      </div>

      {/* ═══ Outer elevated container ═════════════════════════════════════ */}
      <Card variant="elevated">
        <FloatingList gap="md">
          {/* ═══ Header — SAME STUDENTS_TABLE_GRID contract as every row;
              gold-on-dark treatment identical to Questions/Sub-Admins ══ */}
          <FloatingListHeader padding="md">
            <div data-testid="students-header-grid" className={`${STUDENTS_TABLE_GRID} text-text-muted light:text-[var(--gold-300)]`}>
              <span className={`${HEADER_CELL} text-left`}>Student</span>
              <span className={`${HEADER_CELL} text-center`}>Attempts</span>
              <span className={`${HEADER_CELL} hidden md:block text-center`}>Avg. Score</span>
              <span className={`${HEADER_CELL} hidden md:block text-center`}>Last Active</span>
              <span className={`${HEADER_CELL} text-center`}>Actions</span>
            </div>
          </FloatingListHeader>

          {/* ═══ Rows — direct children map 1:1 onto the shared tracks ══ */}
          {students.map(s => (
            <FloatingListItem
              key={s.id}
              padding="md"
              innerClassName={`${STUDENTS_TABLE_GRID} w-full`}
            >
              {/* STUDENT — avatar + identity block */}
              <div className="flex items-center gap-3 min-w-0">
                <AdminIconWrap size="sm" rounded="full" className="shrink-0">
                  <Users size={14} />
                </AdminIconWrap>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-text-primary truncate text-[13px]">{s.full_name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{s.email}</p>
                </div>
              </div>

              {/* ATTEMPTS */}
              <div className="flex justify-center min-w-0">
                <Badge variant="default" size="xs">
                  {s.stats.totalExams} Attempts
                </Badge>
              </div>

              {/* SCORE — avg percentage (canonical calculatePercentage output) */}
              <div className="hidden md:flex justify-center min-w-0">
                <span className="font-black text-primary text-[13px]">
                  {s.stats.avgPct}%
                </span>
              </div>

              {/* LAST ACTIVE */}
              <div className="hidden md:flex justify-center min-w-0">
                <span className="text-[var(--text-muted)] font-medium text-[12px]">
                  {s.stats.lastActive ? new Date(s.stats.lastActive).toLocaleDateString() : 'Never'}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-center">
                <IconButton
                  size="sm"
                  variant="primary"
                  onClick={() => onViewDetail(s)}
                  title="View Analytics"
                  aria-label={`View analytics for ${s.full_name}`}
                >
                  <Eye size={16} />
                </IconButton>
              </div>
            </FloatingListItem>
          ))}
        </FloatingList>
      </Card>
    </div>
  );
}
