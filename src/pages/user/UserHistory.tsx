import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  AlertCircle
} from 'lucide-react'
import { useStableFetch } from '../../hooks/useStableFetch'
import { useAuth } from '../../context/AuthContext'
import { 
  fetchPerformanceAttempts, 
  clearPerformanceCache,
  fetchPerformanceMetadata,
  PERF_ATTEMPTS_PREFIX,
  PERF_METADATA_PREFIX,
  getCachedAttempts,
  getCachedMetadata,
  type PerformanceMetadata 
 } from '../../services/performanceService'
 import { 
  Button,
  PageContainer,
  Stack,
  H3,
  Body,
  IconBadge,
} from '../../components/common/AntigravityUI'
import { LoadingSkeleton, EmptyState } from '../../components/common/SharedComponents'
import { formatDateDDMMYYYY } from '../../utils/dateUtils'
import { UserSelectionTabs } from '../../components/user/UserSelectionTabs'
import { SectionReveal } from '../../components/common/AntigravityAnimation'
import { AttemptCardBase, type AttemptWithRelations } from '../../components/common/AttemptCardBase'
// Type is now centralized in AttemptWithRelations

// ─── Main Component ──────────────────────────────────────────────────────────
export default function UserHistory() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const isAppsc = user?.exam_selection === 'APPSC_GROUPS' || user?.exam_selection === 'APPSC';
  
  const attemptsCacheKey = useMemo(() => {
    return user?.id ? `${PERF_ATTEMPTS_PREFIX}${user.id}` : '';
  }, [user?.id]);

  const metaCacheKey = useMemo(() => {
    return user?.exam_selection ? `${PERF_METADATA_PREFIX}${user.exam_selection}` : '';
  }, [user?.exam_selection]);

  const [allAttempts, setAllAttempts] = useState<AttemptWithRelations[]>(() => {
    return getCachedAttempts(user?.id || '');
  });
  const [metadata, setMetadata] = useState<PerformanceMetadata>(() => {
    return getCachedMetadata(user?.exam_selection || '');
  });
  
  const [loading, setLoading] = useState(() => {
    if (authLoading) return true;
    return !user?.id || !getCachedAttempts(user.id).length || !getCachedMetadata(user.exam_selection)?.exams?.length;
  });
  
  const [error, setError] = useState<string | null>(null)
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [selectedPaperId, setSelectedPaperId] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { nextId, isStale } = useStableFetch();

  const loadHistory = useCallback(async (force = false) => {
    if (authLoading) return;
    if (!user?.id || !user?.exam_selection) return
    const id = nextId()

    if (force) {
      setIsRefreshing(true)
      clearPerformanceCache(user.id)
    }

    if (!force && (!getCachedAttempts(user?.id || '')?.length || !getCachedMetadata(user?.exam_selection || '')?.exams?.length)) {
      setLoading(true)
    }
    
    setError(null)

    try {
      const [historyData, metaData] = await Promise.all([
        fetchPerformanceAttempts(user.id, force),
        fetchPerformanceMetadata(user.exam_selection)
      ])

      if (isStale(id)) return
      
      setAllAttempts(historyData || [])
      setMetadata(metaData || { exams: [], papers: [], subjects: [] })
    } catch (err: any) {
      if (isStale(id)) return
      setError(err.message || 'The data sync was interrupted. Please check your internet connection.')
    } finally {
      if (!isStale(id)) {
        setLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [authLoading, user?.id, user?.exam_selection, isAppsc])

  // Auto-select first exam/paper when metadata loads
  useEffect(() => {
    if (metadata.exams.length > 0 && !selectedExamId) {
      const sorted = [...metadata.exams].sort((a, b) => a.name.localeCompare(b.name));
      const first = sorted[0].id;
      setSelectedExamId(first);

      if (isAppsc) {
        const firstPaper = metadata.papers
          .filter(p => p.exam_id === first)
          .sort((a, b) => a.name.localeCompare(b.name))[0];
        setSelectedPaperId(firstPaper?.id ?? '');
      } else {
        setSelectedPaperId('');
      }
    }
  }, [metadata, selectedExamId, isAppsc]);

  // Reload history whenever user context hydrates, user shifts selected exam, or ID changes
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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

  const filteredAttempts = useMemo(() => {
    let list = [...allAttempts]

    if (selectedExamId) {
      list = list.filter(a => a.exam_id === selectedExamId)
    }

    if (selectedPaperId) {
      list = list.filter(a => a.paper_id === selectedPaperId)
    }

    return list.sort((a, b) => {
      const timeA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const timeB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      return timeB - timeA;
    })
  }, [allAttempts, selectedExamId, selectedPaperId])

  if (loading) return (
    <PageContainer>
      <Stack gap="xxl">
        <LoadingSkeleton height={40} width={200} borderRadius={12} />
        <Stack gap="xl">
          {[1,2,3,4,5].map(i => <LoadingSkeleton key={i} height={180} borderRadius={18} />)}
        </Stack>
      </Stack>
    </PageContainer>
  )

  if (error) return (
    <PageContainer>
      <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
        <IconBadge icon={AlertCircle} size="5xl" shape="circle" className="mx-auto" darkClassName="rounded-full bg-danger/10 text-danger" />
        <Stack gap={8}>
          <H3>Backend Sync Interrupted</H3>
          <Body secondary className="max-w-md mx-auto">
            We encountered an issue while retrieving your latest exam history. This is usually due to a temporary network glitch.
          </Body>
        </Stack>
        <Button 
          onClick={() => loadHistory(true)} 
          loading={isRefreshing}
          className="w-full max-w-[200px]"
        >
          Retry Secure Sync
        </Button>
      </div>
    </PageContainer>
  )

  const handleExamChange = (val: string) => { 
    setSelectedExamId(val); 
    const firstPaper = metadata.papers
      .filter(p => p.exam_id === val)
      .sort((a, b) => a.name.localeCompare(b.name))[0];
    if (firstPaper) setSelectedPaperId(firstPaper.id);
    else setSelectedPaperId('');
  };

  return (
    <PageContainer>
      <Stack gap="lg">
        {isAppsc && metadata.exams.length > 0 && (
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

        {/* ── Attempts List ── */}
        {filteredAttempts.length === 0 ? (
          <EmptyState 
            icon={<span role="img" aria-label="No data">📊</span>}
            title="No data found"
            subtitle="You haven't attempted any exams for this selection yet. Start your preparation today!"
            actionLabel="Start Today's Exam"
            onAction={() => navigate('/exams')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAttempts.map((attempt) => (
              <AttemptCardBase 
                key={attempt.id}
                attempt={attempt} 
                dateFormatter={formatDateDDMMYYYY}
                onClick={() => navigate(`/review/${attempt.id}`)}
              />
            ))}
          </div>
        )}
      </Stack>
    </PageContainer>
  );
}
