import { memo } from 'react'
import { ExamGroupBar } from '../../../components/user/ExamGroupBar'
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
          <ExamGroupBar
            ariaLabel="Select exam group"
            options={groupOptions}
            activeId={activeGroup}
            onChange={onGroupChange}
            bare
          />
        </SectionReveal>
      )}

      {displayedPapers.length > 0 ? (
        <div className="relative group/grid">
          <div
            className="sm:hidden relative"
            role="region"
            aria-label="Exam papers"
          >
            <div
              ref={scrollContainerRef}
              onScroll={onScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 px-[3px] -mx-[3px] pb-4 scroll-smooth"
            >
              {displayedPapers.map((paper) => (
                <div key={paper.id} className="min-w-full snap-center snap-always">
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
              <CarouselDots
                count={displayedPapers.length}
                currentIndex={currentIndex}
                onClick={onScrollToCard}
              />
            )}
          </div>

          <div className="hidden sm:block w-full" role="region" aria-label="Exam paper grid">
            <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 w-full auto-rows-stretch">
              {displayedPapers.map((paper) => (
                <ExamPaperCard
                  key={paper.id}
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
              ))}
            </div>
          </div>
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
