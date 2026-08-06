import { memo } from 'react'
import { SelectionCheckbox } from './SelectionCheckbox'

interface CollectionHeaderProps {
  /** Whether every visible item on the current page is selected. */
  checked?: boolean
  /** Toggle select-all for the visible page. Omit to render the range-only header. */
  onToggleSelectAll?: () => void
  /** Select-all affordance label (defaults to the management phrasing). */
  selectAllLabel?: string
  /** Range text — first visible index (1-based). */
  rangeStart: number
  /** Range text — last visible index (1-based). */
  rangeEnd: number
  totalCount: number
  className?: string
}

/**
 * CollectionHeader — reusable top row for collection pages: optional select-all
 * checkbox (reuses `SelectionCheckbox`) + "Showing X–Y of Z" range summary.
 * Pass `checked` + `onToggleSelectAll` for collections that support selection
 * (e.g. Questions); omit both to render the range-only header with no
 * placeholder space (e.g. Users). Shared by every management collection
 * (Questions, Users, Students, Leaderboard, Topics, Exams). Presentation only —
 * selection state stays in the page.
 */
export const CollectionHeader = memo(function CollectionHeader({
  checked,
  onToggleSelectAll,
  selectAllLabel = 'Select all on this page',
  rangeStart,
  rangeEnd,
  totalCount,
  className = '',
}: CollectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-3 px-1 ${className}`}>
      {onToggleSelectAll ? (
        <SelectionCheckbox checked={!!checked} onChange={onToggleSelectAll} label={selectAllLabel} />
      ) : null}
      <span className="text-[10px] sm:text-[11px] font-bold text-text-muted uppercase tracking-wider">
        Showing {rangeStart}–{rangeEnd} of {totalCount}
      </span>
    </div>
  )
})
