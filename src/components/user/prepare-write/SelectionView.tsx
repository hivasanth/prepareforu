import { useRef, type FC } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import {
  ExamCard,
  MetricBlock,
  Stack,
  Tabs,
  SelectionContainer
} from '../../common/AntigravityUI';
import { EmptyState } from '../../common/SharedComponents';
import { SelectionCardSkeleton } from './PrepareWriteSkeletons';
import type { ExamConfig, ExamPaper } from '../../../types/exam.types';

interface SelectionViewProps {
  userSelection: string;
  exams: ExamConfig[];
  papers: ExamPaper[];
  selectedExamId: string | null;
  selectedPaper: ExamPaper | null;
  availabilityMap: Record<string, { valid: boolean; message?: string }>;
  loading: boolean;
  actionLoading: boolean;
  onExamChange: (id: string) => void;
  onStartPreparation: (paper: ExamPaper) => void;
}

export const SelectionView: FC<SelectionViewProps> = ({
  userSelection,
  exams,
  papers,
  selectedExamId,
  selectedPaper,
  availabilityMap,
  loading,
  actionLoading,
  onExamChange,
  onStartPreparation
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth + 16;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <Stack gap={32}>
      {/* Group Tabs — always mounted when available */}
      {(userSelection === 'APPSC_GROUPS' || userSelection === 'APPSC') && exams.length > 0 && (
        <SelectionContainer>
          <div className="md:flex md:justify-center">
            <Tabs
              ariaLabel="Select exam group"
              options={exams.map(e => ({ 
                id: e.exam_id, 
                label: e.exam_id.replace(/APPSC_/g, '').replace(/_/g, ' ')
              }))}
              activeId={selectedExamId || ''}
              onChange={onExamChange}
              bare
            />
          </div>
        </SelectionContainer>
      )}

      {/* Card content — scoped loading skeleton.
          Mirrors ExamCard geometry via SelectionCardSkeleton (icon + status
          + title + 2×2 metric grid + footer button). The mobile carousel
          and desktop grid wrappers around the cards stay mounted to avoid
          layout shift on exam change. */}
      {loading ? (
        <>
          <div className="sm:hidden">
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 px-[3px] -mx-[3px] pb-4">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="min-w-full snap-center snap-always">
                  <SelectionCardSkeleton />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden sm:block w-full">
            <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 w-full auto-rows-stretch">
              {[1,2,3,4,5,6,7,8].map(i => (
                <SelectionCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </>
      ) : papers.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} />}
          title="No Papers Found"
          subtitle="We couldn't find any papers for this category yet."
        />
      ) : (
        <div className="relative group/grid">
          {/* Mobile Carousel Layout */}
          <div className="sm:hidden relative">
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 px-[3px] -mx-[3px] pb-4 scroll-smooth"
            >
              {papers.map((paper) => {
                const isSelected = selectedPaper?.id === paper.id;
                const isValid = availabilityMap[paper.id]?.valid === true;
                
                return (
                  <div key={paper.id} className="min-w-full snap-center snap-always">
                    <ExamCard 
                      title={paper.paper_name}
                      status={paper.stage || 'Live'}
                      isStarting={isSelected && actionLoading}
                      disabled={!isValid || (actionLoading && !isSelected)}
                      disabledMessage={!isValid ? (availabilityMap[paper.id]?.message || "Not Enough Questions") : (actionLoading && !isSelected ? 'Loading…' : undefined)}
                      onClick={() => onStartPreparation(paper)}
                    >
                      <MetricBlock variant="metric" label="Questions" value={paper.total_questions || 100} />
                      <MetricBlock variant="metric" label="Duration" value={`${paper.duration_minutes}m`} />
                      <MetricBlock variant="metric" label="Marks" value={paper.total_marks || paper.total_questions} />
                      <MetricBlock 
                        variant="metric"
                        label="Negative" 
                        value={paper.negative_marking ? `-${paper.negative_mark_value}` : 'None'} 
                        color={paper.negative_marking ? 'var(--danger)' : undefined}
                      />
                    </ExamCard>
                  </div>
                );
              })}
            </div>

            {/* Navigation Arrows */}
            {papers.length > 1 && (
              <>
                <button 
                  onClick={() => scroll('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-11 h-11 rounded-full bg-card-bg shadow-xl border border-border-subtle flex items-center justify-center text-text-primary z-10 active:brightness-95 transition-interaction duration-fast ease-standard ${FOCUS_RING}"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-11 h-11 rounded-full bg-card-bg shadow-xl border border-border-subtle flex items-center justify-center text-text-primary z-10 active:brightness-95 transition-interaction duration-fast ease-standard ${FOCUS_RING}"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Tablet/Desktop Grid Layout */}
          <div className="hidden sm:block w-full">
            <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 w-full auto-rows-stretch">
              {papers.map((paper) => {
                const isSelected = selectedPaper?.id === paper.id;
                const isValid = availabilityMap[paper.id]?.valid === true;
                
                return (
                  <div key={paper.id}>
                    <ExamCard 
                      title={paper.paper_name}
                      status={paper.stage || 'Live'}
                      isStarting={isSelected && actionLoading}
                      disabled={!isValid || (actionLoading && !isSelected)}
                      disabledMessage={!isValid ? (availabilityMap[paper.id]?.message || "Not Enough Questions") : (actionLoading && !isSelected ? 'Loading…' : undefined)}
                      onClick={() => onStartPreparation(paper)}
                    >
                      <MetricBlock variant="metric" label="Questions" value={paper.total_questions || 100} />
                      <MetricBlock variant="metric" label="Duration" value={`${paper.duration_minutes}m`} />
                      <MetricBlock variant="metric" label="Marks" value={paper.total_marks || paper.total_questions} />
                      <MetricBlock 
                        variant="metric"
                        label="Negative" 
                        value={paper.negative_marking ? `-${paper.negative_mark_value}` : 'None'} 
                        color={paper.negative_marking ? 'var(--danger)' : undefined}
                      />
                    </ExamCard>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Stack>
  );
};
