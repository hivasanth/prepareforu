import { useRef, type FC } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText 
} from 'lucide-react';
import {
  Grid, 
  ExamCard, 
  MetricBlock, 
  Stack, 
  H3, 
  Body,
  IconBadge
} from '../../../components/common/AntigravityUI';
import { ExamGroupBar } from '../../../components/user/ExamGroupBar';
import { LoadingSkeleton, ErrorState } from '../../../components/common/SharedComponents';
import type { ExamPaper } from '../../../types/exam.types';

interface SelectionViewProps {
  userSelection: string;
  exams: any[];
  papers: ExamPaper[];
  selectedExamId: string | null;
  selectedPaper: ExamPaper | null;
  availabilityMap: Record<string, { valid: boolean; message?: string }>;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  onExamChange: (id: string) => void;
  onPaperSelect: (paper: ExamPaper) => void;
  onStartPreparation: () => void;
  onRetry: () => void;
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
  error,
  onExamChange,
  onPaperSelect,
  onStartPreparation,
  onRetry
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

  if (error && !exams.length) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  return (
    <Stack gap={32}>
      {/* Group Tabs — always mounted when available */}
      {(userSelection === 'APPSC_GROUPS' || userSelection === 'APPSC') && exams.length > 0 && (
        <ExamGroupBar
          options={exams.map(e => ({ 
            id: e.exam_id, 
            label: e.exam_id.replace(/APPSC_/g, '').replace(/_/g, ' ')
          }))}
          activeId={selectedExamId || ''}
          onChange={onExamChange}
        />
      )}

      {/* Card content — scoped loading skeleton */}
      {loading ? (
        <Grid cols={4} gap={24}>
          {[1,2,3,4,5,6,7,8].map(i => <LoadingSkeleton key={i} height={200} borderRadius={20} />)}
        </Grid>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : papers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-card-bg/50 rounded-3xl border border-dashed border-border-subtle">
          <IconBadge icon={FileText} size="4xl" shape="rounded" className="mb-4" darkClassName="rounded-2xl bg-hover-bg text-text-secondary mb-4" />
          <H3>No Papers Found</H3>
          <Body secondary>We couldn't find any papers for this category yet.</Body>
        </div>
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
                      disabled={!isValid}
                      disabledMessage={!isValid ? (availabilityMap[paper.id]?.message || "Not Enough Questions") : undefined}
                      onClick={() => {
                        onPaperSelect(paper);
                        onStartPreparation();
                      }}
                    >
                      <div className="bg-hover-bg/30 p-3 rounded-xl border border-border-subtle/50">
                        <MetricBlock label="Questions" value={paper.total_questions || 100} />
                      </div>
                      <div className="bg-hover-bg/30 p-3 rounded-xl border border-border-subtle/50">
                        <MetricBlock label="Duration" value={`${paper.duration_minutes}m`} />
                      </div>
                      <div className="bg-hover-bg/30 p-3 rounded-xl border border-border-subtle/50">
                        <MetricBlock label="Marks" value={paper.total_marks || paper.total_questions} />
                      </div>
                      <div className="bg-hover-bg/30 p-3 rounded-xl border border-border-subtle/50">
                        <MetricBlock 
                          label="Negative" 
                          value={paper.negative_marking ? `-${paper.negative_mark_value}` : 'None'} 
                          color={paper.negative_marking ? 'var(--danger)' : undefined}
                        />
                      </div>
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
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-10 h-10 rounded-full bg-card-bg shadow-xl border border-border-subtle flex items-center justify-center text-text-primary z-10 active:scale-90 transition-transform"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-10 h-10 rounded-full bg-card-bg shadow-xl border border-border-subtle flex items-center justify-center text-text-primary z-10 active:scale-90 transition-transform"
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
                      disabled={!isValid}
                      disabledMessage={!isValid ? (availabilityMap[paper.id]?.message || "Not Enough Questions") : undefined}
                      onClick={() => {
                        onPaperSelect(paper);
                        onStartPreparation();
                      }}
                    >
                      <div className="bg-hover-bg/30 p-3 rounded-xl border border-border-subtle/50">
                        <MetricBlock label="Questions" value={paper.total_questions || 100} />
                      </div>
                      <div className="bg-hover-bg/30 p-3 rounded-xl border border-border-subtle/50">
                        <MetricBlock label="Duration" value={`${paper.duration_minutes}m`} />
                      </div>
                      <div className="bg-hover-bg/30 p-3 rounded-xl border border-border-subtle/50">
                        <MetricBlock label="Marks" value={paper.total_marks || paper.total_questions} />
                      </div>
                      <div className="bg-hover-bg/30 p-3 rounded-xl border border-border-subtle/50">
                        <MetricBlock 
                          label="Negative" 
                          value={paper.negative_marking ? `-${paper.negative_mark_value}` : 'None'} 
                          color={paper.negative_marking ? 'var(--danger)' : undefined}
                        />
                      </div>
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
