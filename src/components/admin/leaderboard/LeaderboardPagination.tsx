import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  hasMore: boolean
  onPageChange: (page: number) => void
  isFetching: boolean
}

export function LeaderboardPagination({ currentPage, hasMore, onPageChange, isFetching }: PaginationProps) {
  if (currentPage === 0 && !hasMore) return null

  return (
    <div className="flex items-center justify-between gap-4 mt-6 sm:mt-10 lg:mt-12 p-3 bg-card-bg/30 border border-border-subtle rounded-2xl">
      <div className="text-[10px] sm:text-xs lg:text-sm text-text-secondary font-bold pl-2 sm:pl-4">
        Page <span className="text-text-primary px-1 sm:px-2 py-0.5 sm:py-1 rounded bg-card-bg border border-border-subtle">{currentPage + 1}</span>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          aria-label="Previous Page"
          disabled={currentPage === 0 || isFetching}
          className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-card-bg border border-border-subtle hover:border-primary/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 text-text-secondary disabled:opacity-30 transition-all active:scale-90"
        >
          <ChevronLeft size={16} className="sm:size-5 lg:size-6" />
        </button>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next Page"
          disabled={!hasMore || isFetching}
          className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-card-bg border border-border-subtle hover:border-primary/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 text-text-secondary disabled:opacity-30 transition-all active:scale-90"
        >
          <ChevronRight size={16} className="sm:size-5 lg:size-6" />
        </button>
      </div>
    </div>
  )
}
