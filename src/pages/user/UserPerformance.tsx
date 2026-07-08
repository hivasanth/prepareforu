import { 
  BookOpen, Target, TrendingUp, Trophy
} from 'lucide-react'
import { Suspense, lazy } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { 
  LoadingSkeleton,
  EmptyState,
  ErrorState
} from '../../components/common/SharedComponents'
import { 
  Card, 
  StatCard, 
  PageContainer,
  Tabs,
  Stack,
  useTheme,
  IconBadge
} from '../../components/common/AntigravityUI'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useStableFetch } from '../../hooks/useStableFetch'
import { 
  fetchPerformanceAttempts, 
  fetchPerformanceAnswers,
  fetchPerformanceMetadata,
  clearPerformanceCache,
  PERF_ATTEMPTS_PREFIX,
  PERF_METADATA_PREFIX,
  getCachedAttempts,
  getCachedMetadata,
  type PerformanceMetadata
} from '../../services/performanceService'
import { getAllowedExamIds } from '../../utils/examUtils'
import { UserSelectionTabs } from '../../components/user/UserSelectionTabs'
import { SectionReveal } from '../../components/common/AntigravityAnimation'

import { SubjectInsightsCard } from './PerformanceViews/SubjectInsightsCard'

// Lazy load heavy chart components
const PerformanceCharts = lazy(() => import('./PerformanceCharts'))

// ─── Types ──────────────────────────────────────────────────────────────────
interface Attempt {
  id: string;
  paper_id: string;
  exam_id: string;
  score: number;
  accuracy: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  submitted_at: string;
  exam_papers: { paper_name: string } | null;
  exam_configs: { name: string } | null;
}

interface Answer {
  attempt_id: string;
  subject_name: string;
  is_correct: boolean;
}

type TimeRange = '7d' | '30d' | 'all'

// ─── Component ──────────────────────────────────────────────────────────────
export default function UserPerformance() {
  const { user, loading: authLoading } = useAuth()
  const { isDark } = useTheme()
  
  const { isXs, isSm } = useBreakpoint()
  const isMobile = isXs || isSm
  const isAppsc = user?.exam_selection === 'APPSC_GROUPS' || user?.exam_selection === 'APPSC';

  const attemptsCacheKey = useMemo(() => {
    return user?.id ? `${PERF_ATTEMPTS_PREFIX}${user.id}` : '';
  }, [user?.id]);

  const metaCacheKey = useMemo(() => {
    return user?.exam_selection ? `${PERF_METADATA_PREFIX}${user.exam_selection}` : '';
  }, [user?.exam_selection]);

  // ── State
  const [allAttempts, setAllAttempts] = useState<Attempt[]>(() => {
    if (!attemptsCacheKey) return [];
    return getCachedAttempts(user.id) || [];
  });
  const [allAnswers, setAllAnswers] = useState<Answer[]>([])
  const [metadata, setMetadata] = useState<PerformanceMetadata>(() => {
    if (!metaCacheKey) return { exams: [], papers: [], subjects: [] };
    return getCachedMetadata(user.exam_selection) || { exams: [], papers: [], subjects: [] };
  });

  const [loading, setLoading] = useState(() => {
    if (authLoading) return true;
    if (!attemptsCacheKey) return true;
    return !getCachedAttempts(user.id);
  });
  const [error, setError] = useState<string | null>(null)
  const { nextId, isStale } = useStableFetch();
  
  // ── Filters
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [selectedPaperId, setSelectedPaperId] = useState<string>('')
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('all')
  const handleExamChange = useCallback((val: string) => {
    setSelectedExamId(val);
    const firstPaper = metadata.papers
      .filter(p => p.exam_id === val)
      .sort((a, b) => a.name.localeCompare(b.name))[0];
    if (firstPaper) setSelectedPaperId(firstPaper.id);
  }, [metadata.papers])

  // ── Initial Fetch
  const loadInitialData = useCallback(async (force = false) => {
    if (authLoading) return
    if (!user?.id || !user?.exam_selection) return
    const id = nextId()
    
    if (force) {
      clearPerformanceCache(user.id)
    } else if (getCachedAttempts(user?.id || '')?.length) {
      // Data exists, refresh in background
    } else {
      setLoading(true)
    }
    
    setError(null)
    try {
      const allowedIds = getAllowedExamIds(user.exam_selection)
      const [rawAttempts, meta] = await Promise.all([
        fetchPerformanceAttempts(user.id, force),
        fetchPerformanceMetadata(user.exam_selection)
      ])

      if (isStale(id)) return

      const attempts = (rawAttempts || []).filter(a => allowedIds.includes(a.exam_id))
      setAllAttempts(attempts)
      const m = meta || { exams: [], papers: [], subjects: [] }
      setMetadata(m)

    } catch (err: any) {
      if (isStale(id)) return
      console.error('[Performance-Fetch-Error]', err.message)
      setError(err.message || 'The analytics sync was interrupted. Please check your connection and try again.')
    } finally {
      if (!isStale(id)) setLoading(false)
    }
  }, [authLoading, user?.id, user?.exam_selection, attemptsCacheKey, isAppsc])

  useEffect(() => {
    loadInitialData(true)
  }, [loadInitialData])

  // Auto-select first exam when metadata loads
  useEffect(() => {
    if (!metadata.exams.length || selectedExamId) return;
    const sortedExams = [...metadata.exams].sort((a, b) => a.name.localeCompare(b.name));
    const firstExamId = sortedExams[0].id;
    setSelectedExamId(firstExamId);

    if (isAppsc) {
      const firstPaper = metadata.papers
        .filter(p => p.exam_id === firstExamId)
        .sort((a, b) => a.name.localeCompare(b.name))[0];
      if (firstPaper) setSelectedPaperId(firstPaper.id);
    }
  }, [metadata.exams, metadata.papers, selectedExamId, isAppsc]);

  // ── Filter Logic
  const filteredAttempts = useMemo(() => {
    let filtered = [...allAttempts]
    if (selectedExamId) filtered = filtered.filter(a => a.exam_id === selectedExamId)
    if (selectedPaperId) filtered = filtered.filter(a => a.paper_id === selectedPaperId)
    if (selectedTimeRange !== 'all') {
      const now = new Date()
      const days = selectedTimeRange === '7d' ? 7 : 30
      const threshold = new Date(now.setDate(now.getDate() - days))
      filtered = filtered.filter(a => new Date(a.submitted_at) >= threshold)
    }
    return filtered
  }, [allAttempts, selectedExamId, selectedPaperId, selectedTimeRange])

  useEffect(() => {
    let isCancelled = false;
    const attemptIds = filteredAttempts.map(a => a.id).sort();
    const loadAnswers = async () => {
      if (attemptIds.length === 0) {
        if (!isCancelled && isMounted.current) setAllAnswers([])
        return
      }
      try {
        const answers = await fetchPerformanceAnswers(attemptIds)
        if (!isCancelled && isMounted.current) setAllAnswers(answers)
      } catch (err) {
        console.error('[Answers-Fetch-Error]', err instanceof Error ? err.message : err)
      }
    }
    const timer = setTimeout(loadAnswers, 300)
    return () => { isCancelled = true; clearTimeout(timer); }
  }, [filteredAttempts])

  const metrics = useMemo(() => {
    const total = filteredAttempts.length
    if (total === 0) return null
    const scores = filteredAttempts.map(a => Number(a.score) || 0)
    const accuracies = filteredAttempts.map(a => Number(a.accuracy) || 0)
    const avgScore = scores.reduce((acc, curr) => acc + curr, 0) / total
    const avgAccuracy = accuracies.reduce((acc, curr) => acc + curr, 0) / total
    const bestScore = Math.max(...scores)
    return {
      total,
      avgScore: Math.round(avgScore * 10) / 10,
      avgAccuracy: Math.round(avgAccuracy),
      bestScore
    }
  }, [filteredAttempts])

  const subjectStats = useMemo(() => {
    if (allAnswers.length === 0) return []
    const subjects: Record<string, { correct: number; total: number }> = {}
    allAnswers.forEach(ans => {
      if (!subjects[ans.subject_name]) subjects[ans.subject_name] = { correct: 0, total: 0 }
      subjects[ans.subject_name].total += 1
      if (ans.is_correct) subjects[ans.subject_name].correct += 1
    })
    return Object.entries(subjects).map(([name, data]) => {
      const accuracy = Math.round((data.correct / data.total) * 100)
      return {
        subject: name,
        accuracy,
        correct: data.correct,
        total: data.total,
        status: accuracy >= 70 ? 'Strong' : accuracy <= 50 ? 'Weak' : 'Average',
        color: accuracy >= 70 ? '#22C55E' : accuracy <= 50 ? '#EF4444' : '#F59E0B'
      }
    }).sort((a, b) => b.accuracy - a.accuracy)
  }, [allAnswers])

  const trendData = useMemo(() => {
    return filteredAttempts
      .map(a => {
        const d = new Date(a.submitted_at);
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          sortKey: d.getTime(),
          accuracy: Number(a.accuracy) || 0,
          score: Number(a.score) || 0,
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredAttempts])

  const distribution = useMemo(() => {
    const correct = filteredAttempts.reduce((acc, curr) => acc + (Number(curr.correct_count) || 0), 0)
    const wrong = filteredAttempts.reduce((acc, curr) => acc + (Number(curr.wrong_count) || 0), 0)
    const skipped = filteredAttempts.reduce((acc, curr) => acc + (Number(curr.skipped_count) || 0), 0)
    return [
      { name: 'Correct', value: correct, color: '#22C55E' },
      { name: 'Wrong', value: wrong, color: '#EF4444' },
      { name: 'Skipped', value: skipped, color: '#64748b' }
    ].filter(d => d.value > 0)
  }, [filteredAttempts])

  const examOptions = useMemo(() => {
    return metadata.exams
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(e => ({
        ...e,
        displayName: e.name.replace(/APPSC[\s_]*/gi, '').replace(/_/g, ' ')
      }))
  }, [metadata.exams])

  const paperOptions = useMemo(() => {
    const filtered = metadata.papers.filter(p => p.exam_id === selectedExamId)
    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [metadata.papers, selectedExamId])

  if (loading) return <PerformanceSkeleton />
  if (error) return (
    <PageContainer>
      <ErrorState 
        message={error} 
        onRetry={() => loadInitialData(true)} 
      />
    </PageContainer>
  )
  if (allAttempts.length === 0) return (
    <PageContainer>
      <div className="py-8">
        <EmptyState 
          icon="📈"
          title="No exam activity yet" 
          subtitle="Complete exams in the Exams tab to see your performance analytics here." 
          actionLabel="Start Today's Exam"
          onAction={() => window.location.href = '/exams'}
        />
      </div>
    </PageContainer>
  )

  const hasEnoughTrendData = trendData.length >= 2

  return (
    <PageContainer>
      <Stack gap="lg">
        {isAppsc && (
          <SectionReveal className="w-full">
            <UserSelectionTabs
              selectedExam={selectedExamId}
              setSelectedExam={handleExamChange}
              selectedPaper={selectedPaperId}
              setSelectedPaper={setSelectedPaperId}
              customExamTabs={examOptions.map(e => ({ label: e.displayName, id: e.id }))}
              customPapers={paperOptions.map(p => ({ label: p.name, id: p.id }))}
              showSubjects={false}
              hideAll={true}
              className="bg-transparent border-none p-0 w-full"
            />
          </SectionReveal>
        )}

        {!isMobile && (
          <div className="w-fit max-w-full">
            <Tabs 
              options={[
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'all', label: 'All Time' }
              ]}
              activeId={selectedTimeRange}
              variant="secondary"
              onChange={(val) => setSelectedTimeRange(val as TimeRange)}
            />
          </div>
        )}

      {filteredAttempts.length === 0 ? (
        <EmptyState 
          icon="🔍"
          title="No data found"
          subtitle="Try adjusting your filters to see results, or start a new exam to build your performance profile."
          actionLabel="Start Today's Exam"
          onAction={() => window.location.href = '/exams'}
        />
      ) : (
        <div className="space-y-8">
        {/* ── Summary Metrics ── */}
        <section className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
            <StatCard icon={BookOpen} label="Total Exams" value={metrics?.total || 0} color="#2563EB" />
            <StatCard icon={Target} label="Avg Accuracy" value={`${metrics?.avgAccuracy || 0}%`} color="#7C3AED" />
            <StatCard icon={TrendingUp} label="Average Score" value={metrics?.avgScore || 0} color="#0891B2" />
            <StatCard icon={Trophy} label="Best Score" value={metrics?.bestScore || 0} color="#16A34A" />
          </section>

        {/* ── Analytics Section ── */}
        <section className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            
          {/* Performance Trend (Span 2 on L/XL) */}
          <Card className="col-span-1 lg:col-span-2 p-6 shadow-xl relative overflow-hidden group border border-border-subtle hover:border-primary/50 transition-colors duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={`text-[14px] lg:text-[16px] font-bold text-text-primary uppercase tracking-tight mb-1 m-0 ${!isDark ? 'font-cinzel' : ''}`}>Accuracy Trend</h3>
                    <p className={`text-[11px] text-text-secondary opacity-50 uppercase tracking-widest m-0 ${!isDark ? 'font-garamond italic' : ''}`}>Accuracy percentage over time</p>
                  </div>
                  <IconBadge icon={TrendingUp} size="xl" shape="rounded" className="group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="h-[260px] lg:h-[300px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <Suspense fallback={<LoadingSkeleton height="100%" borderRadius={16} />}>
                    <PerformanceCharts type="trend" data={trendData} hasEnoughData={hasEnoughTrendData} isDark={isDark} />
                  </Suspense>
                </div>
              </div>
            </Card>

            {/* Answer Distribution */}
            <Card className="p-6 shadow-xl flex flex-col">
              <h3 className={`text-[14px] lg:text-[16px] font-bold text-text-primary uppercase tracking-tight mb-2 m-0 ${!isDark ? 'font-cinzel' : ''}`}>Answer Distribution</h3>
              <p className={`text-[11px] text-text-secondary opacity-50 uppercase tracking-widest mb-6 m-0 ${!isDark ? 'font-garamond italic' : ''}`}>Response breakdown</p>
              <div className="flex-1 min-h-[220px]">
                <Suspense fallback={<LoadingSkeleton height="100%" borderRadius={16} />}>
                    <PerformanceCharts type="distribution" data={distribution} isDark={isDark} />
                </Suspense>
              </div>
            </Card>

          {/* Subject Insights */}
            <SubjectInsightsCard subjectStats={subjectStats} />
          </section>

        </div>
      )}
      </Stack>
    </PageContainer>
  )
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function PerformanceSkeleton() {
  return (
    <PageContainer>
      <div className="space-y-8 animate-in fade-in duration-500">
      <LoadingSkeleton height={80} borderRadius={24} />
      <LoadingSkeleton height={140} borderRadius={24} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         {[1,2,3,4].map(i => <LoadingSkeleton key={i} height={80} borderRadius={20} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <LoadingSkeleton height={400} borderRadius={24} />
        </div>
        <LoadingSkeleton height={400} borderRadius={24} />
      </div>
      </div>
    </PageContainer>
  )
}
