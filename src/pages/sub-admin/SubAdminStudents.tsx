import { Users, RefreshCcw } from 'lucide-react';
import {
  PageContainer,
  Stack,
  SectionReveal,
  Card,
  Button,
} from '../../components/common/AntigravityUI';
import { LoadingSkeleton } from '../../components/common/SharedComponents';
import { AdminFilterBar } from '../../components/common/AdminFilterBar';
import { ToastContainer } from '../../hooks/useToast';
import { useStudents } from '../../components/sub-admin/students/useStudents';
import { StudentsTable } from '../../components/sub-admin/students/StudentsTable';
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

        {ctx.loading ? (
          <div className="bg-card-bg border border-border-subtle/20 rounded-3xl p-8">
            <Stack gap="md">
              {[1, 2, 3, 4, 5].map(i => (
                <LoadingSkeleton key={i} height={64} borderRadius={12} />
              ))}
            </Stack>
          </div>
        ) : ctx.error ? (
          <Card variant="subtle" className="py-16 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-danger/10 text-danger flex items-center justify-center">
              <RefreshCcw size={32} />
            </div>
            <div className="text-center max-w-xs">
              <p className="text-text-primary font-bold uppercase tracking-widest text-[10px] mb-2">Sync Synchronization Error</p>
              <p className="text-text-secondary text-sm font-medium">{ctx.error}</p>
            </div>
            <Button variant="primary" onClick={ctx.fetchData}>Force Protocol Reset</Button>
          </Card>
        ) : ctx.filteredStudents.length === 0 ? (
          <Card variant="subtle" className="py-20 opacity-40 text-center flex flex-col items-center gap-4">
            <Users size={64} className="text-text-secondary" />
            <p className="font-bold uppercase tracking-widest text-xs">No students detected in this corridor</p>
          </Card>
        ) : (
          <SectionReveal>
            <StudentsTable
              students={ctx.filteredStudents}
              onViewDetail={ctx.openDetail}
            />
          </SectionReveal>
        )}
      </Stack>

      {ctx.selectedStudent && (
        <StudentDetailModal
          student={ctx.selectedStudent}
          onClose={ctx.closeDetail}
          onCopyData={ctx.handleCopyClick}
          onDownloadCSV={ctx.handleDownloadCSV}
          actionError={ctx.actionError}
        />
      )}

      <ToastContainer toasts={ctx.toasts} />
    </PageContainer>
  );
}
