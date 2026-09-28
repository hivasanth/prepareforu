import { Users } from 'lucide-react';
import {
  PageContainer,
  Stack,
  SectionReveal,
  Card,
} from '../../components/common/AntigravityUI';
import { AdminFilterBar } from '../../components/common/AdminFilterBar';
import { ErrorContainer, RetryButton } from '../../components/common/AntigravityUI';
import { useStudents } from '../../components/sub-admin/students/useStudents';
import { StudentsTable, StudentsTableSkeleton } from '../../components/sub-admin/students/StudentsTable';
import { StudentDetailModal } from '../../components/sub-admin/students/StudentDetailModal';

export default function SubAdminStudents() {
  const ctx = useStudents();

  return (
    <PageContainer>
      <Stack gap="lg">
        <SectionReveal>
          <AdminFilterBar
            searchPlaceholder="Search name or email..."
            searchAriaLabel="Search students"
            searchValue={ctx.searchTerm}
            onSearchChange={ctx.setSearchTerm}
            monthValue={ctx.monthFilter}
            onMonthChange={ctx.setMonthFilter}
            monthOptions={ctx.monthOptions}
            monthPlaceholder="All Time"
            onRefresh={ctx.fetchData}
            loading={ctx.loading}
          />
        </SectionReveal>

        {ctx.error && ctx.students.length === 0 ? (
          // Initial-load failure (nothing to show yet): full canonical alert.
          <ErrorContainer category={ctx.error.category} severity={ctx.error.severity}>
            <p className="text-text-primary font-bold uppercase tracking-widest text-[11px] mb-2">{ctx.error.title}</p>
            <p className="text-text-secondary text-sm font-medium mb-4">{ctx.error.message}</p>
            <RetryButton onRetry={ctx.fetchData} loading={ctx.loading} />
          </ErrorContainer>
        ) : ctx.loading && !ctx.hasLoaded ? (
          // Initial load only: LAST-GOOD content is never replaced by a
          // skeleton during background refresh. Exactly ONE status owner —
          // refresh busy state is conveyed via the disabled Refresh button.
          <div
            role="status"
            aria-live="polite"
            aria-label="Loading students"
          >
            <StudentsTableSkeleton />
          </div>
        ) : ctx.filteredStudents.length === 0 ? (
          <Card variant="subtle" className="py-20 opacity-40 text-center flex flex-col items-center gap-4">
            <Users size={64} className="text-text-secondary" />
            <p className="font-bold uppercase tracking-widest text-xs">
              {ctx.isFilterActive ? 'No students match your filters' : 'No students detected in this corridor'}
            </p>
          </Card>
        ) : (
          <SectionReveal>
            <Stack gap="md">
              {ctx.error && (
                // Background-refresh failure WITH retained data: keep the
                // last-good table visible and surface the error as a banner
                // above it with its canonical RetryButton.
                <ErrorContainer category={ctx.error.category} severity={ctx.error.severity}>
                  <p className="text-text-primary font-bold uppercase tracking-widest text-[11px] mb-2">{ctx.error.title}</p>
                  <p className="text-text-secondary text-sm font-medium mb-4">{ctx.error.message}</p>
                  <RetryButton onRetry={ctx.fetchData} loading={ctx.loading} />
                </ErrorContainer>
              )}
              <StudentsTable
                students={ctx.filteredStudents}
                onViewDetail={ctx.openDetail}
              />
            </Stack>
          </SectionReveal>
        )}
      </Stack>

      {ctx.selectedStudent && (
        <StudentDetailModal
          student={ctx.selectedStudent}
          onClose={ctx.closeDetail}
          onCopyData={ctx.handleCopyClick}
          onDownloadCSV={ctx.handleDownloadCSV}
        />
      )}
    </PageContainer>
  );
}
