import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStableFetch } from '../../hooks/useStableFetch';
import { LoadingSkeleton, ErrorState } from '../../components/common/SharedComponents';
import {
  PageContainer,
  Stack,
} from '../../components/common/AntigravityUI';
import { ExamGroupBar } from '../../components/user/ExamGroupBar';
import { CarouselDots } from '../../components/user/CarouselDots';
import { SectionReveal } from '../../components/common/AntigravityAnimation';

import { 
  batchCheckAvailability,
  fetchUserPapers
} from '../../services/examService';
import { getAllowedExamIds } from '../../utils/examUtils';
import { ExamPaperCard } from '../../components/common/ExamPaperCard';
import type { ExamPaper } from '../../types/exam.types';

export default function UserExams() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const targetExamIds = useMemo(() => user?.exam_selection ? getAllowedExamIds(user.exam_selection) : [], [user?.exam_selection]);
  
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<string>(localStorage.getItem('selected_exam_group') || '');
  const [isStarting, setIsStarting] = useState<string | null>(null);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, { valid: boolean; message?: string }>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const { nextId, isStale } = useStableFetch();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const isAppsc = user?.exam_selection === 'APPSC_GROUPS' || user?.exam_selection === 'APPSC';
  
  const groupOptions = useMemo(() => {
    const uniqueGroups = Array.from(new Set(papers.map(p => p.exam_id))).sort();
    return uniqueGroups.map(id => ({
      id,
      label: id.replace(/APPSC_/g, '').replace(/_/g, ' ')
    }));
  }, [papers]);

  useEffect(() => {
    async function fetchData() {
      setFetchError(null);
      if (authLoading) return;
      if (!user?.id || !user?.exam_selection) {
        if (mountedRef.current) setLoading(false);
        return;
      }

      const id = nextId();
      try {
        const filteredPapers = await fetchUserPapers(targetExamIds, false);

        if (isStale(id)) return;

        setPapers(filteredPapers);

        // Determine active group before availability check
        let targetGroup = 'DEFAULT';
        if (user.exam_selection === 'APPSC_GROUPS') {
          const saved = localStorage.getItem('selected_exam_group');
          const validGroups = Array.from(new Set(filteredPapers.map(p => p.exam_id)));
          if (saved && validGroups.includes(saved)) {
            targetGroup = saved;
          } else if (validGroups.length > 0) {
            targetGroup = validGroups.sort()[0];
            localStorage.setItem('selected_exam_group', targetGroup);
          }
        }
        setActiveGroup(targetGroup);

        // Check availability for all papers (batched to minimize DB roundtrips)
        if (filteredPapers.length > 0) {
          const results = await batchCheckAvailability(filteredPapers.map(p => p.id));
          if (isStale(id)) return;
          setAvailabilityMap(results);
        }
      } catch (err: any) {
        if (isStale(id)) return;
        setFetchError(err.message || "Failed to load exams.");
        console.error("Failed to fetch exams:", err.message);
      } finally {
        if (!isStale(id)) setLoading(false);
      }
    }

    fetchData();
  }, [user?.id, user?.exam_selection, authLoading, retryKey]);

  const handleGroupChange = useCallback((groupId: string) => {
    setActiveGroup(groupId);
    localStorage.setItem('selected_exam_group', groupId);
    setCurrentIndex(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, []);

  const handleStartExam = useCallback((paper: ExamPaper) => {
    if (!user || isStarting) return;
    const availability = availabilityMap[paper.id];
    if (!availability || !availability.valid) return;
    setIsStarting(paper.id);
    navigate(`/active-exam/${paper.id}`);
  }, [user, isStarting, navigate, availabilityMap]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    if (clientWidth === 0) return;
    const index = Math.round(scrollLeft / clientWidth);
    setCurrentIndex(prev => (prev === index ? prev : index));
  }, []);

  const scrollToCard = useCallback((index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth;
    container.scrollTo({
      left: index * scrollAmount,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  }, []);

  if (fetchError) {
    return (
      <PageContainer>
        <ErrorState message={fetchError} onRetry={() => setRetryKey(k => k + 1)} />
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <Stack gap="lg">
          <div className="flex justify-center">
            <LoadingSkeleton height={44} width={320} borderRadius={14} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <LoadingSkeleton key={i} height={320} borderRadius={18} />)}
          </div>
        </Stack>
      </PageContainer>
    );
  }

  const displayedPapers = isAppsc 
    ? papers.filter(p => p.exam_id === activeGroup)
    : papers;


  const renderCardList = (papers: ExamPaper[]) => papers.map((paper) => (
    <ExamPaperCard 
      key={paper.id}
      paper={paper}
      isStarting={isStarting === paper.id}
      isValid={availabilityMap[paper.id]?.valid === true}
      availabilityMessage={availabilityMap[paper.id]?.valid === false ? (availabilityMap[paper.id]?.message || "Not Enough Questions") : undefined}
      onClick={() => handleStartExam(paper)}
    />
  ));

  return (
    <PageContainer>
      <Stack gap="lg">

        {/* ── Group Tabs (APPSC only) ── */}
        {isAppsc && groupOptions.length > 0 && (
          <SectionReveal className="w-full">
            <ExamGroupBar
              options={groupOptions}
              activeId={activeGroup}
              onChange={handleGroupChange}
            />
          </SectionReveal>
        )}

        {/* ── Exam Cards ── */}
        {displayedPapers.length > 0 ? (
          <div className="relative group/grid">
            {/* Mobile Carousel Layout (< 640px) */}
            <div className="sm:hidden relative" role="region" aria-label="Exam papers">
              <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 px-[3px] -mx-[3px] pb-4 scroll-smooth"
              >
                {displayedPapers.map((paper) => (
                  <div key={paper.id} className="min-w-full snap-center snap-always">
                    <ExamPaperCard 
                      paper={paper}
                      isStarting={isStarting === paper.id}
                      isValid={availabilityMap[paper.id]?.valid === true}
                      availabilityMessage={availabilityMap[paper.id]?.valid === false ? (availabilityMap[paper.id]?.message || "Not Enough Questions") : undefined}
                      onClick={() => handleStartExam(paper)}
                    />
                  </div>
                ))}
              </div>

              {displayedPapers.length > 1 && (
                <CarouselDots
                  count={displayedPapers.length}
                  currentIndex={currentIndex}
                  onClick={scrollToCard}
                />
              )}
            </div>

            {/* Tablet/Desktop Grid Layout (>= 640px) */}
            <div className="hidden sm:block w-full">
              <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 w-full auto-rows-stretch">
                {renderCardList(displayedPapers)}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <ErrorState message="No exams available for this selection." onRetry={() => window.location.reload()} />
          </div>
        )}
      </Stack>

    </PageContainer>
  );
}
