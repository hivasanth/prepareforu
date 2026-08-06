import { memo } from 'react'
import { Grid, Card, Badge, Label, Stack } from '../../../components/common/AntigravityUI'
import { SectionReveal } from '../../../components/common/AntigravityUI'
import { AdminFilterBar } from '../../../components/common/AdminFilterBar'
import { AdminText } from '../../../components/common/AdminText'
import { GridSkeleton, EmptyState } from '../../../components/common/SharedComponents'
import { ErrorContainer } from '../../../components/common/ErrorContainer'
import { RetryButton } from '../../../components/common/RetryButton'
import { BookOpen, Clock } from 'lucide-react'
import type { TeacherExamOption } from './types'

interface ExamListSectionProps {
  exams: TeacherExamOption[]
  examsLoading: boolean
  examsError: string | null
  filteredExams: TeacherExamOption[]
  searchTerm: string
  onSearchChange: (v: string) => void
  monthFilter: string
  onMonthChange: (v: string) => void
  monthOptions: { id: string; name: string }[]
  onRefresh: () => void
  onSelectExam: (id: string) => void
}

export const ExamListSection = memo(function ExamListSection({
  examsLoading, examsError, filteredExams,
  searchTerm, onSearchChange,
  monthFilter, onMonthChange, monthOptions,
  onRefresh, onSelectExam,
}: ExamListSectionProps) {
  return (
    <Stack gap="lg">
      <SectionReveal>
        <AdminFilterBar
          searchPlaceholder="Search exams..."
          searchAriaLabel="Search exams"
          searchValue={searchTerm}
          onSearchChange={onSearchChange}
          monthValue={monthFilter}
          onMonthChange={onMonthChange}
          monthOptions={monthOptions}
          onRefresh={onRefresh}
          loading={examsLoading}
        />
      </SectionReveal>

      {examsLoading ? (
        <GridSkeleton count={6} height={192} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
      ) : examsError ? (
        <ErrorContainer category="server" severity="high">
          <h3 className="text-lg font-black text-text-primary">PROTOCOL FAILURE</h3>
          <p className="text-sm text-text-secondary font-medium">{examsError}</p>
          <RetryButton onRetry={onRefresh} label="Re-sync Vault" />
        </ErrorContainer>
      ) : filteredExams.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={48} />}
          title="Vault is Empty"
          subtitle="No results matching your filters were identified."
        />
      ) : (
        <Grid cols={3} gap={24}>
          {filteredExams.map((exam, idx) => (
            <SectionReveal key={exam.id} delay={idx * 0.05}>
              <Card
                variant="premium-neutral"
                className="p-6 flex flex-col h-full group relative cursor-pointer"
                onClick={() => onSelectExam(exam.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectExam(exam.id) } }}
                aria-label={`View exam: ${exam.title}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <Badge variant={exam.status === 'published' ? 'success' : 'warning'}>
                    {exam.status || 'Draft'}
                  </Badge>
                </div>

                <div className="space-y-2 mb-6">
                  <AdminText as="h3" variant="cinzel" className="font-bold text-text-primary text-lg leading-tight uppercase group-hover:text-primary transition-colors truncate">
                    {exam.title}
                  </AdminText>
                  <div className="flex items-center gap-2 text-[var(--text-muted)] font-bold text-[11px] uppercase tracking-widest">
                    <Clock size={12} />
                    {new Date(exam.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border-subtle/30 flex items-center justify-between">
                  <Stack gap="xs">
                    <Label>Questions</Label>
                    <span className="text-sm font-black text-text-primary">{exam.total_questions}</span>
                  </Stack>
                  <div className="w-px h-8 bg-border-subtle/30" />
                  <Stack gap="xs" align="end">
                    <Label>Total Marks</Label>
                    <span className="text-sm font-black text-text-primary">
                      {exam.total_marks}
                    </span>
                  </Stack>
                </div>

                <div className="absolute -bottom-6 -right-6 opacity-[0.03] text-text-primary group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <BookOpen size={120} strokeWidth={1} />
                </div>
              </Card>
            </SectionReveal>
          ))}
        </Grid>
      )}
    </Stack>
  )
})
