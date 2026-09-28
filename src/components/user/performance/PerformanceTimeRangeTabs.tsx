import { memo } from 'react'
import { SegmentedFilter } from '../../common/AntigravityUI'
import type { TimeRange } from './types'

interface PerformanceTimeRangeTabsProps {
  selectedTimeRange: TimeRange
  onChange: (val: TimeRange) => void
}

export const PerformanceTimeRangeTabs = memo(function PerformanceTimeRangeTabs({ selectedTimeRange, onChange }: PerformanceTimeRangeTabsProps) {
  return (
    <SegmentedFilter
      ariaLabel="Performance time range"
      options={[
        { id: '7d', label: '7 Days' },
        { id: '30d', label: '30 Days' },
        { id: 'all', label: 'All Time' }
      ]}
      value={selectedTimeRange}
      onChange={(val) => onChange(val as TimeRange)}
    />
  )
})
