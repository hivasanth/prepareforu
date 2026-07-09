import { useAuth } from '../../context/AuthContext'
import {
  EmptyState,
  ErrorState
} from '../../components/common/SharedComponents'
import {
  PageContainer,
  Stack,
} from '../../components/common/AntigravityUI'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
import { PerformanceSkeleton } from '../../components/user/PerformanceSkeleton'
import { PerformanceMetricsGrid } from '../../components/user/PerformanceMetricsGrid'
import { PerformanceAnalyticsSection } from '../../components/user/PerformanceAnalyticsSection'
import { PerformanceTimeRangeTabs } from '../../components/user/PerformanceTimeRangeTabs'

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

  const isAppsc = user?.exam_selection === 'APPSC_GROUPS' || user?.exam_selection === 'APPSC';

  const attemptsCacheKey = useMemo(() => {
    return user?.id ? `${PERF_ATTEMPTS_PREFIX}${user.id}` : '';
  }, [user?.id]);

  const metaCacheKey = useMemo(() => {
    return user?.exam_selection ? `${PERF_METADATA_PREFIX}${user.exam_selection}` : '';
  }, [user?.exam_selection]);

  // ── State
  const [allAttempts, setAllAttempts] = useState<Attempt[]>(() => {
    if (!attemptsCacheKey || !user) return [];
    return getCachedAttempts(user.id) || [];
  });
  const [allAnswers, setAllAnswers] = useState<Answer[]>([])
  const [metadata, setMetadata] = useState<PerformanceMetadata>(() => {
    if (!metaCacheKey || !user) return { exams: [], papers: [], subjects: [] };
    return getCachedMetadata(user.exam_selection ?? '') || { exams: [], papers: [], subjects: [] };
  });

  const [loading, setLoading] = useState(() => {
    if (authLoading) return true;
    if (!attemptsCacheKey || !user) return true;
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

  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

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

        <PerformanceTimeRangeTabs
          selectedTimeRange={selectedTimeRange}
          onChange={setSelectedTimeRange}
        />

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
            <PerformanceMetricsGrid metrics={metrics} />
            <PerformanceAnalyticsSection
              trendData={trendData}
              hasEnoughTrendData={hasEnoughTrendData}
              distribution={distribution}
              subjectStats={subjectStats}
            />
          </div>
        )}
      </Stack>
    </PageContainer>
  )
}
