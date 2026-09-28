import { useState, useRef, useEffect, useMemo, type FC, type ReactNode } from 'react';
import { Trophy, Target, CheckCircle2, XCircle, Clock, Layers, AlertCircle, Eye, Search } from 'lucide-react';
import { IconBadge, StatCard, Input } from '../common/AntigravityUI';
import { BilingualToggle } from '../common/BilingualToggle';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../common/AntigravityUI';
import { FOCUS_RING } from '../common/AntigravityMotion';
import { GOLD_LIGHT_MATERIAL } from '../common/AntigravityCard';
import { SegmentedFilter, type SegmentedFilterOption } from '../common/SegmentedFilter';
import { NumberBadge } from '../common/NumberBadge';

interface ReviewStats {
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  notVisited: number;
  score: number;
  accuracy: number;
  timeTaken: number;
}

interface ReviewLayoutProps {
  examTitle: string;
  stats: ReviewStats;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  filterCounts: Record<string, number>;
  displayLang: 'en' | 'te';
  onToggleLang: (lang: 'en' | 'te') => void;
  onBack: () => void;
  children: ReactNode;
}

/**
 * Review layout:
 *   Report Header — floating premium card with stats.
 *   Controls Panel — premium card pinned to top via JS when scrolled past
 *   (CSS sticky is blocked by SidebarLayout's contain:content + overflow-hidden).
 *   Question Cards — standalone container below the controls.
 *   Filter overflow: pills scroll horizontally inside a fixed-width container.
 */
export const ReviewLayout: FC<ReviewLayoutProps> = ({
  examTitle,
  stats,
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  filterCounts,
  displayLang,
  onToggleLang,
  onBack,
  children,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [controlsHeight, setControlsHeight] = useState(0);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const stuck = !entry.isIntersecting;
        setIsStuck(stuck);
        if (stuck && controlsRef.current) {
          setControlsHeight(controlsRef.current.offsetHeight);
        }
      },
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isStuck || !controlsRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setControlsHeight(entry.contentRect.height);
    });
    ro.observe(controlsRef.current);
    return () => ro.disconnect();
  }, [isStuck]);

  const filterOptions: SegmentedFilterOption[] = useMemo(() => [
    { id: 'all', label: 'All', badge: <NumberBadge value={filterCounts.all || 0} variant="rank" className="w-6 h-6 text-[9px]" /> },
    { id: 'correct', label: 'Correct', badge: <NumberBadge value={filterCounts.correct || 0} variant="rank" className="w-6 h-6 text-[9px]" /> },
    { id: 'wrong', label: 'Wrong', badge: <NumberBadge value={filterCounts.wrong || 0} variant="rank" className="w-6 h-6 text-[9px]" /> },
    { id: 'skipped', label: 'Skipped', badge: <NumberBadge value={filterCounts.skipped || 0} variant="rank" className="w-6 h-6 text-[9px]" /> },
    { id: 'not_visited', label: 'Not Visited', badge: <NumberBadge value={filterCounts.not_visited || 0} variant="rank" className="w-6 h-6 text-[9px]" /> },
  ], [filterCounts]);

  return (
    <div className="min-h-screen bg-app-bg">
      <Button variant="secondary" size="sm" onClick={onBack} className={`fixed top-6 left-6 z-40 ${FOCUS_RING}`} aria-label="Go back">
        <ArrowLeft size={16} />
        Back
      </Button>

      <div className="max-w-[1200px] mx-auto px-4 py-6 md:py-10 space-y-8">
        {/* Report Header — floating premium card */}
        <div className={`bg-card-bg border border-border-subtle shadow-2xl p-8 md:p-10 text-center space-y-6 relative overflow-hidden rounded-[32px] ${GOLD_LIGHT_MATERIAL}`}>
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-primary" />
          <IconBadge icon={Trophy} size="6xl" shape="circle" status="primary" className="mx-auto mb-4" />
          <div>
            <h1 className="text-[clamp(22px,3.5vw,42px)] font-black text-text-primary uppercase tracking-tighter m-0">Performance Report</h1>
            <p className="text-[clamp(11px,1.2vw,14px)] font-medium text-text-muted uppercase tracking-widest mt-2">{examTitle}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-border-subtle">
            <StatCard icon={Target} label="Accuracy" value={`${stats.accuracy}%`} color="var(--primary)" />
            <StatCard icon={CheckCircle2} label="Correct" value={stats.correct} color="var(--success)" />
            <StatCard icon={XCircle} label="Wrong" value={stats.wrong} color="var(--danger)" />
            <StatCard icon={Clock} label="Time" value={`${Math.floor(stats.timeTaken / 60)}m`} color="var(--info)" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm font-bold text-text-secondary">
            <span><Layers size={14} className="inline mr-1 text-text-muted" />Total: {stats.total}</span>
            <span><AlertCircle size={14} className="inline mr-1 text-text-muted" />Skipped: {stats.skipped}</span>
            <span><Eye size={14} className="inline mr-1 text-text-muted" />Not Visited: {stats.notVisited}</span>
            <span><Trophy size={14} className="inline mr-1 text-text-muted" />Score: {stats.score}</span>
          </div>
        </div>

        {/* Sentinel — zero-height marker for IntersectionObserver */}
        <div ref={sentinelRef} className="h-0 w-full" aria-hidden />

        {/* Placeholder reserves space when controls go fixed */}
        {isStuck && <div style={{ height: controlsHeight }} />}

        {/* Controls Panel — compact, premium surface, JS-pinned on scroll */}
        <div
          ref={controlsRef}
          className={`bg-card-bg border border-border-subtle shadow-xl p-4 md:p-6 space-y-4 rounded-[32px] ${GOLD_LIGHT_MATERIAL} ${
            isStuck
              ? 'fixed top-0 left-1/2 -translate-x-1/2 w-[min(1168px,calc(100%-2rem))] z-30 shadow-2xl border-b-2 border-primary/30'
              : 'relative z-20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                leftIcon={Search}
                placeholder="Search questions or subjects..."
                aria-label="Search questions or subjects"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full"
              />
            </div>
            <BilingualToggle displayLang={displayLang} onChange={onToggleLang} minimal className="shrink-0 bg-white dark:bg-card-bg shadow-sm" />
          </div>

          <div className="flex justify-center">
            <SegmentedFilter
              options={filterOptions}
              value={filter}
              onChange={onFilterChange}
              size="md"
              className="overflow-x-auto"
              ariaLabel="Filter questions by status"
            />
          </div>
        </div>

        {/* Question Cards — standalone container */}
        <div className="space-y-16">
          {children}
        </div>

        {(!children || (Array.isArray(children) && children.length === 0)) && (
          <div className="py-24 text-center border-2 border-dashed rounded-[32px] border-border-subtle">
            <IconBadge icon={Search} size="4xl" className="rounded-2xl mx-auto mb-6" darkClassName="bg-hover-bg text-text-disabled" />
            <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">No matching results</h3>
            <p className="text-text-secondary mt-2">Adjust your filter to explore different segments.</p>
          </div>
        )}
      </div>
    </div>
  );
};
