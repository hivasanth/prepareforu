import { Search, Calendar, RefreshCcw } from 'lucide-react'
import { FilterBar, Input, FilterSelect, IconButton } from '../../common/AntigravityUI'

interface SelectOption {
  id: string
  name: string
}

interface AdminFilterBarProps {
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  monthValue: string
  onMonthChange: (value: string) => void
  monthOptions: SelectOption[]
  monthPlaceholder?: string
  onRefresh: () => void
  loading?: boolean
}

export function AdminFilterBar({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  monthValue,
  onMonthChange,
  monthOptions,
  monthPlaceholder,
  onRefresh,
  loading,
}: AdminFilterBarProps) {
  return (
    <FilterBar>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 max-w-md">
          <Input
            leftIcon={Search}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
        <FilterSelect
          icon={Calendar}
          placeholder={monthPlaceholder}
          value={monthValue}
          onChange={onMonthChange}
          options={monthOptions}
          className="min-w-[140px] shrink-0"
        />
      </div>
      <IconButton onClick={onRefresh} loading={loading} className="shrink-0" aria-label="Refresh data">
        <RefreshCcw size={18} />
      </IconButton>
    </FilterBar>
  )
}
