import { Tabs, useTheme } from '../../common/AntigravityUI'

export const EXAM_TABS = [
  { label: 'ALL', id: 'all' },
  { label: 'APPSC', id: 'APPSC_GROUPS' },
  { label: 'BANK EXAMS', id: 'BANK_EXAMS' },
]

interface ExamTabsProps {
  selectedExam: string
  setSelectedExam: (exam: string) => void
  hideAll?: boolean
  className?: string
}

export function ExamTabs({ 
  selectedExam, 
  setSelectedExam, 
  hideAll = false,
  className = ""
}: ExamTabsProps) {
  const { isDark } = useTheme();
  const tabs = hideAll ? EXAM_TABS.filter(t => t.id !== 'all') : EXAM_TABS

  return (
    <div role="tablist" aria-label="Filter by exam" className={className}>
      <Tabs 
        options={tabs}
        activeId={selectedExam}
        onChange={setSelectedExam}
        variant="primary"
        className="w-full"
        pillClassName={!isDark ? 'ancient-tab-pill' : ''}
      />
    </div>
  )
}
