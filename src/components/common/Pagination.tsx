import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from './AntigravityButton'

interface PaginationProps {
  /** Zero-based current page index. */
  page: number
  /** Total page count (for bounded pagination). Omit when using `hasMore`. */
  totalPages?: number
  /** Infinite/load-more style: whether another page exists after the current one. */
  hasMore?: boolean
  onPageChange: (page: number) => void
  /** Optional range label context. */
  totalCount?: number
  pageSize?: number
  /** Label for the range text, e.g. 'questions'. */
  label?: string
  className?: string
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  hasMore,
  onPageChange,
  totalCount,
  pageSize,
  label = '',
  className = '',
}) => {
  const bounded = typeof totalPages === 'number'
  const atStart = page <= 0
  const atEnd = bounded ? page >= totalPages - 1 : !hasMore

  const handlePrev = () => {
    if (!atStart) onPageChange(page - 1)
  }
  const handleNext = () => {
    if (!atEnd) onPageChange(page + 1)
  }

  const showRange = typeof totalCount === 'number' && typeof pageSize === 'number'
  const startRange = showRange ? page * pageSize + 1 : null
  const endRange = showRange ? Math.min((page + 1) * pageSize, totalCount!) : null

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-2 ${className}`}
      role="navigation"
      aria-label="Pagination"
    >
      {showRange ? (
        <div className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wide">
          Showing{' '}
          <span className="text-text-primary px-1">{startRange}</span> to{' '}
          <span className="text-text-primary px-1">{endRange}</span> of{' '}
          <span className="text-primary px-1">{totalCount}</span> {label}
        </div>
      ) : (
        <div className="text-[10px] sm:text-xs lg:text-sm text-text-secondary font-semibold pl-2 sm:pl-4">
          Page{' '}
          <span className="text-text-primary px-1 sm:px-2 py-0.5 sm:py-1 rounded bg-card-bg border border-border-subtle">
            {page + 1}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-4">
        <IconButton
          size="sm"
          onClick={handlePrev}
          disabled={atStart}
          aria-label="Previous page"
          focusRing
          disabledOpacity={30}
        >
          <ChevronLeft size={16} />
        </IconButton>
        <IconButton
          size="sm"
          onClick={handleNext}
          disabled={atEnd}
          aria-label="Next page"
          focusRing
          disabledOpacity={30}
        >
          <ChevronRight size={16} />
        </IconButton>
      </div>
    </div>
  )
}
