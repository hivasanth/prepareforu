import type { FC } from 'react'
import { Button } from '../../common/AntigravityUI'

interface AdminPaginationProps {
  page: number
  setPage: (page: number) => void
  hasMore: boolean
  totalCount: number
  pageSize: number
  label?: string
}

export const AdminPagination: FC<AdminPaginationProps> = ({
  page,
  setPage,
  hasMore,
  totalCount,
  pageSize,
  label = 'questions'
}) => {
  const startRange = page * pageSize + 1
  const endRange = Math.min((page + 1) * pageSize, totalCount)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-2 gap-4">
      <div className="text-[11px] sm:text-xs font-black text-text-secondary uppercase tracking-[0.2em]">
        Showing <span className="text-text-primary px-1">{startRange}</span> to 
        <span className="text-text-primary px-1">{endRange}</span> of 
        <span className="text-primary px-1">{totalCount}</span> {label}
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          className="px-6 py-2 rounded-xl bg-card-bg border border-border-subtle text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-hover-bg transition-colors active:scale-95 !h-auto"
        >
          Prev
        </Button>
        <Button
          variant="secondary"
          onClick={() => setPage(page + 1)}
          disabled={!hasMore}
          className="px-6 py-2 rounded-xl bg-card-bg border border-border-subtle text-[10px] font-black uppercase tracking-widest text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-hover-bg transition-colors active:scale-95 border-primary/20 !h-auto"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
