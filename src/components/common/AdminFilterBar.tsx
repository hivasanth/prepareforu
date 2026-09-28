import { Search, Calendar, CalendarDays, RefreshCcw } from 'lucide-react'
import { FilterBar, Input, FilterSelect, IconButton } from './AntigravityUI'

interface SelectOption {
  id: string
  name: string
}

interface AdminFilterBarProps {
  searchPlaceholder?: string
  searchAriaLabel?: string
  searchValue: string
  onSearchChange: (value: string) => void
  yearValue?: string
  onYearChange?: (value: string) => void
  yearOptions?: SelectOption[]
  monthValue: string
  onMonthChange: (value: string) => void
  monthOptions: SelectOption[]
  monthPlaceholder?: string
  onRefresh: () => void
  loading?: boolean
}

export function AdminFilterBar({
  searchPlaceholder = 'Search...',
  searchAriaLabel = 'Search',
  searchValue,
  onSearchChange,
  yearValue,
  onYearChange,
  yearOptions,
  monthValue,
  onMonthChange,
  monthOptions,
  monthPlaceholder,
  onRefresh,
  loading,
}: AdminFilterBarProps) {
  const hasYear = yearValue !== undefined && onYearChange !== undefined && Array.isArray(yearOptions)
  return (
    <FilterBar>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 max-w-md">
          <Input
            leftIcon={Search}
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
        {hasYear && (
          <FilterSelect
            icon={CalendarDays}
            value={yearValue ?? ''}
            onChange={(v) => onYearChange?.(v)}
            options={yearOptions ?? []}
            label="Year"
            className="min-w-[110px] shrink-0"
          />
        )}
        <FilterSelect
          icon={Calendar}
          placeholder={monthPlaceholder}
          value={monthValue}
          onChange={onMonthChange}
          options={monthOptions}
          label="Month"
          className="min-w-[110px] shrink-0"
        />
      </div>
      <IconButton onClick={onRefresh} loading={loading} className="shrink-0" aria-label="Refresh data">
        <RefreshCcw size={18} />
      </IconButton>
    </FilterBar>
  )
}
