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
  SelectionContainer
} from '../../common/AntigravityUI';
import { ExamGroupBar } from '../ExamGroupBar';
import { LoadingSkeleton, ErrorState, EmptyState } from '../../common/SharedComponents';
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
        <SelectionContainer>
          <ExamGroupBar
            ariaLabel="Select exam group"
            options={exams.map(e => ({ 
              id: e.exam_id, 
              label: e.exam_id.replace(/APPSC_/g, '').replace(/_/g, ' ')
            }))}
            activeId={selectedExamId || ''}
            onChange={onExamChange}
            bare
          />
        </SelectionContainer>
      )}

      {/* Card content — scoped loading skeleton */}
      {loading ? (
        <Grid cols={4} gap={24}>
          {[1,2,3,4,5,6,7,8].map(i => <LoadingSkeleton key={i} height={200} borderRadius={20} />)}
        </Grid>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
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
                      disabled={!isValid}
                      disabledMessage={!isValid ? (availabilityMap[paper.id]?.message || "Not Enough Questions") : undefined}
                      onClick={() => {
                        onPaperSelect(paper);
                        onStartPreparation();
                      }}
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
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-11 h-11 rounded-full bg-card-bg shadow-xl border border-border-subtle flex items-center justify-center text-text-primary z-10 active:scale-90 transition-transform"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-11 h-11 rounded-full bg-card-bg shadow-xl border border-border-subtle flex items-center justify-center text-text-primary z-10 active:scale-90 transition-transform"
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
