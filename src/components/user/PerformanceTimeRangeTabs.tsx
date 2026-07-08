import { Tabs } from '../common/AntigravityUI'
import { useBreakpoint } from '../../hooks/useBreakpoint'

type TimeRange = '7d' | '30d' | 'all'

interface PerformanceTimeRangeTabsProps {
  selectedTimeRange: TimeRange
  onChange: (val: TimeRange) => void
}

export function PerformanceTimeRangeTabs({ selectedTimeRange, onChange }: PerformanceTimeRangeTabsProps) {
  const { isXs, isSm } = useBreakpoint()
  const isMobile = isXs || isSm

  if (isMobile) return null

  return (
    <div className="w-fit max-w-full">
      <Tabs
        options={[
          { id: '7d', label: '7 Days' },
          { id: '30d', label: '30 Days' },
          { id: 'all', label: 'All Time' }
        ]}
        activeId={selectedTimeRange}
        variant="secondary"
        onChange={(val) => onChange(val as TimeRange)}
      />
    </div>
  )
}
