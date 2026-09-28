import { memo } from 'react'
import { Search } from 'lucide-react'
import { Input, CollectionToolbar, PremiumSelect } from '../../common/AntigravityUI'

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

        <PremiumSelect
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={[
            { id: 'all', name: 'All' },
            { id: 'active', name: 'Active Only' },
            { id: 'inactive', name: 'Banned Only' },
          ]}
          placeholder="Status"
          className="w-full sm:w-fit"
        />
      </div>
    </CollectionToolbar>
  )
})
