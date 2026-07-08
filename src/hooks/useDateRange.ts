import { useMemo, useState } from 'react'
import { startOfMonth, endOfMonth, addDays, subMonths, format, isWithinInterval } from 'date-fns'

export interface DateRange {
  id: string
  name: string
  start: Date
  end: Date
}

export function useDateRange() {
  const ranges = useMemo(() => {
    const now = new Date()
    const allRanges: DateRange[] = []

    const generateForMonth = (monthDate: Date, isCurrent: boolean) => {
      const start = startOfMonth(monthDate)
      const end = endOfMonth(monthDate)
      let current = start
      const monthRanges: DateRange[] = []

      while (current <= end) {
        const rangeEnd = addDays(current, 6) > end ? end : addDays(current, 6)

        if (!isCurrent || current <= now) {
          monthRanges.push({
            id: `${format(current, 'yyyy-MM-dd')}_${format(rangeEnd, 'yyyy-MM-dd')}`,
            name: `${format(current, 'MMM d')}-${format(rangeEnd, 'd')}`,
            start: current,
            end: rangeEnd,
          })
        }
        current = addDays(rangeEnd, 1)
      }
      return monthRanges.reverse()
    }

    allRanges.push(...generateForMonth(now, true))
    allRanges.push(...generateForMonth(subMonths(now, 1), false))

    return allRanges
  }, [])

  const initialRange = useMemo(() => {
    const now = new Date()
    const current = ranges.find(r => isWithinInterval(now, { start: r.start, end: r.end }))
    return current?.id || ranges[0]?.id
  }, [ranges])

  const [selectedRangeId, setSelectedRangeId] = useState<string>(initialRange)

  const selectedRange = useMemo(
    () => ranges.find(r => r.id === selectedRangeId),
    [ranges, selectedRangeId],
  )

  return { ranges, selectedRangeId, setSelectedRangeId, selectedRange }
}
