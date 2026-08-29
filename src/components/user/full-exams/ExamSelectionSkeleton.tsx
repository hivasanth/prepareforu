import { memo } from 'react'
import { Skeleton } from '../../../components/common/Skeleton'
import { SelectionContainer } from '../../../components/common/AntigravityUI'

const PILL_WIDTHS = [72, 96, 112, 96, 72]

export const ExamSelectionSkeleton = memo(function ExamSelectionSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading exam selection"
      className="w-full"
    >
      <SelectionContainer>
        <div className="w-full overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1 md:gap-2 min-w-max mx-auto lg:mx-0 h-[44px] md:h-[52px]">
            {PILL_WIDTHS.map((width, i) => (
              <div
                key={i}
                className="shrink-0 h-full flex items-center px-4 md:px-6 rounded-xl border border-[var(--border-subtle)] light:border-[var(--material-tab-pill-border)]"
              >
                <Skeleton width={width} height={12} borderRadius={6} decorative />
              </div>
            ))}
          </div>
        </div>
      </SelectionContainer>
    </div>
  )
})

ExamSelectionSkeleton.displayName = 'ExamSelectionSkeleton'
