import { memo } from 'react'
import { Tabs, SelectionContainer } from '../../../components/common/AntigravityUI'
import { CarouselDots } from '../../../components/user/CarouselDots'
import { ExamPaperCard } from '../../../components/common/ExamPaperCard'
import { SectionReveal } from '../../../components/common/AntigravityAnimation'
import { H2 } from '../../../components/common/AntigravityUI'
import type { ExamPaper } from '../../../types/exam.types'

interface ExamPaperGridProps {
  isAppsc: boolean
  groupOptions: { id: string; label: string }[]
  activeGroup: string
  onGroupChange: (id: string) => void
  displayedPapers: ExamPaper[]
  availabilityMap: Record<string, { valid: boolean; message?: string }>
  isStarting: string | null
  onStartExam: (paper: ExamPaper) => void
  currentIndex: number
  onScroll: () => void
  onScrollToCard: (index: number) => void
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}

export const ExamPaperGrid = memo(function ExamPaperGrid({
  isAppsc,
  groupOptions,
  activeGroup,
  onGroupChange,
  displayedPapers,
  availabilityMap,
  isStarting,
  onStartExam,
  currentIndex,
  onScroll,
  onScrollToCard,
  scrollContainerRef,
}: ExamPaperGridProps) {
  return (
    <>
      {isAppsc && groupOptions.length > 0 && (
        <SectionReveal className="w-full">
          <SelectionContainer>
            <Tabs
              ariaLabel="Select exam group"
              options={groupOptions}
              activeId={activeGroup}
              onChange={onGroupChange}
              variant="primary"
              bare
            />
          </SelectionContainer>
        </SectionReveal>
      )}

      {displayedPapers.length > 0 ? (
        <div role="region" aria-label="Exam papers">
          <div
            ref={scrollContainerRef}
            onScroll={onScroll}
            className="flex w-full gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-[3px] -mx-[3px] pb-4 scroll-smooth
                       sm:grid sm:grid-cols-2 sm:overflow-visible sm:snap-none sm:scroll-auto sm:px-0 sm:-mx-0 sm:pb-0 sm:gap-6 sm:auto-rows-stretch lg:grid-cols-2 xl:grid-cols-4"
          >
            {displayedPapers.map((paper) => (
              <div key={paper.id} className="min-w-full snap-center snap-always sm:min-w-0 sm:snap-none">
                <ExamPaperCard
                  paper={paper}
                  isStarting={isStarting === paper.id}
                  isValid={availabilityMap[paper.id]?.valid === true}
                  availabilityMessage={
                    availabilityMap[paper.id]?.valid === false
                      ? availabilityMap[paper.id]?.message || 'Not Enough Questions'
                      : undefined
                  }
                  onClick={() => onStartExam(paper)}
                />
              </div>
            ))}
          </div>
          {displayedPapers.length > 1 && (
            <div className="sm:hidden">
              <CarouselDots
                count={displayedPapers.length}
                currentIndex={currentIndex}
                onClick={onScrollToCard}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">📚</span>
          <H2 className="text-xl mb-2 tracking-normal">
            No Exams Available
          </H2>
          <p className="text-text-muted max-w-md">
            There are no exams available for this selection. Please check your exam
            selection or contact your administrator.
          </p>
        </div>
      )}
    </>
  )
})
