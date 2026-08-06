import { memo } from 'react'
import { Search } from 'lucide-react'
import { Input, CollectionFilter, CollectionToolbar } from '../../common/AntigravityUI'

interface UsersActionsProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  statusFilter: string
  onStatusFilterChange: (val: string) => void
}

export const UsersActions = memo(function UsersActions({
  searchQuery, onSearchChange, statusFilter, onStatusFilterChange,
}: UsersActionsProps) {
  return (
    <CollectionToolbar variant="management">
      {/* Search & Filter Group */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
        <div className="flex-1">
          <Input
            variant="management"
            placeholder="Search students by name or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={Search}
            className="w-full"
            aria-label="Search students"
          />
        </div>

        <CollectionFilter
          variant="management"
          label="Status"
          ariaLabel="Filter by status"
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active Only' },
            { id: 'inactive', label: 'Banned Only' },
          ]}
          className="w-full sm:w-fit"
        />
      </div>
    </CollectionToolbar>
  )
})
