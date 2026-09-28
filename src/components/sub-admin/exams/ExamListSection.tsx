import { memo } from 'react'
import { Grid, SectionReveal } from '../../../components/common/AntigravityUI'
import { SegmentedFilter } from '../../../components/common/AntigravityUI'
import { AdminFilterBar } from '../../../components/common/AdminFilterBar'
import { GridSkeleton, EmptyState } from '../../../components/common/SharedComponents'
import { ErrorContainer } from '../../../components/common/ErrorContainer'
import { RetryButton } from '../../../components/common/RetryButton'
import { BookOpen, Radio } from 'lucide-react'
import { ExamCard } from './ExamCard'
import type { ExamViewFilter } from '../../../utils/examWindow'
import type { TeacherExamOption } from './types'

interface ExamListSectionProps {
  examsLoading: boolean
  examsError: string | null
  filteredExams: TeacherExamOption[]
  activeFilter: ExamViewFilter
  onFilterChange: (filter: ExamViewFilter) => void
  filterCounts: Record<ExamViewFilter, number>
  activeFilterResults: TeacherExamOption[]
  searchTerm: string
  onSearchChange: (v: string) => void
  yearFilter: number
  onYearChange: (v: number) => void
  yearOptions: { id: string; name: string }[]
  monthFilter: number
  onMonthChange: (v: number) => void
  monthOptions: { id: string; name: string }[]
  onRefresh: () => void
  onSelectExam: (id: string) => void
}

const FILTER_OPTIONS: { id: ExamViewFilter; label: string; icon?: React.ReactNode }[] = [
  { id: 'live', label: 'Live', icon: <Radio size={12} /> },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'published', label: 'Published' },
]

const EMPTY_MESSAGES: Record<ExamViewFilter, { title: string; subtitle: string }> = {
  live: { title: 'No Live Exams', subtitle: 'There are no exams currently in progress.' },
  upcoming: { title: 'No Upcoming Exams', subtitle: 'There are no exams scheduled for the coming time.' },
  published: { title: 'Vault is Empty', subtitle: 'No results matching your filters were identified.' },
}

function countBadge(count: number): React.ReactNode {
  return (
    <span className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-text-secondary">
      {count}
    </span>
  )
}

export const ExamListSection = memo(function ExamListSection({
  examsLoading, examsError,
  activeFilter, onFilterChange, filterCounts, activeFilterResults,
  searchTerm, onSearchChange,
  yearFilter, onYearChange, yearOptions,
  monthFilter, onMonthChange, monthOptions,
  onRefresh, onSelectExam,
}: ExamListSectionProps) {
  const emptyMsg = EMPTY_MESSAGES[activeFilter]
  const showAdminFilter = activeFilter === 'published'

  return (
    <>
      <SectionReveal>
        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            <SegmentedFilter
              ariaLabel="Filter exams by status"
              options={FILTER_OPTIONS.map(o => ({ ...o, badge: countBadge(filterCounts[o.id]) }))}
              value={activeFilter}
              onChange={(id) => onFilterChange(id as ExamViewFilter)}
            />
          </div>
          {showAdminFilter && (
            <AdminFilterBar
              searchPlaceholder="Search exams..."
              searchAriaLabel="Search exams"
              searchValue={searchTerm}
              onSearchChange={onSearchChange}
              yearValue={String(yearFilter)}
              onYearChange={(v) => onYearChange(Number(v))}
              yearOptions={yearOptions}
              monthValue={String(monthFilter)}
              onMonthChange={(v) => onMonthChange(Number(v))}
              monthOptions={monthOptions}
              onRefresh={onRefresh}
              loading={examsLoading}
            />
          )}
        </div>
      </SectionReveal>

      {examsLoading ? (
        <GridSkeleton count={6} height={192} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
      ) : examsError ? (
        <ErrorContainer category="server" severity="high">
          <h3 className="text-lg font-black text-text-primary">PROTOCOL FAILURE</h3>
          <p className="text-sm text-text-secondary font-medium">{examsError}</p>
          <RetryButton onRetry={onRefresh} loading={examsLoading} label="Re-sync Vault" />
        </ErrorContainer>
      ) : activeFilterResults.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={48} />}
          title={emptyMsg.title}
          subtitle={emptyMsg.subtitle}
        />
      ) : (
        <Grid cols={3} gap={24}>
          {activeFilterResults.map((exam, idx) => (
            <SectionReveal key={exam.id} delay={idx * 0.05}>
              <ExamCard exam={exam} onSelect={onSelectExam} isLive={activeFilter === 'live'} />
            </SectionReveal>
          ))}
        </Grid>
      )}
    </>
  )
})
