import { memo } from 'react'
import { Calendar } from 'lucide-react'
import { SegmentedFilter, FilterSelect } from '../../../components/common/AntigravityUI'
import { H3, Label } from '../../../components/common/AntigravityTypography'
import type { TeacherExamStatus } from '../../../types/exam.types'

interface TeacherExamFilterBarProps {
  activeTab: TeacherExamStatus
  onTabChange: (tab: TeacherExamStatus) => void
  selectedMonth: string
  onMonthChange: (month: string) => void
  monthsList: { id: string; name: string }[]
}

export const TeacherExamFilterBar = memo(function TeacherExamFilterBar({
  activeTab, onTabChange, selectedMonth, onMonthChange, monthsList,
}: TeacherExamFilterBarProps) {
  return (
    <>
      <div className="flex justify-center w-full">
        <SegmentedFilter
          options={[
            { id: 'live', label: 'Live Sessions' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'ended', label: 'History' },
          ]}
          value={activeTab}
          onChange={(id) => onTabChange(id as TeacherExamStatus)}
        />
      </div>

      {activeTab === 'ended' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border-subtle/30 pb-4">
          <H3 className="m-0 text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Exam Archive
          </H3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Label className="text-text-muted uppercase tracking-widest leading-none m-0">
              Select Month
            </Label>
            <FilterSelect
              icon={Calendar}
              value={selectedMonth}
              onChange={onMonthChange}
              options={monthsList}
              className="w-full sm:w-52"
            />
          </div>
        </div>
      )}
    </>
  )
})
