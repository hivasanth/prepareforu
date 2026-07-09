import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useStableFetch } from '../../hooks/useStableFetch';
import { useToast, ToastContainer } from '../../hooks/useToast';
import { LoadingSkeleton } from '../../components/common/SharedComponents';
import { 
  PageContainer,
  Stack,
} from '../../components/common/AntigravityUI';
import { 
  fetchSubjectsByExam, 
  fetchSubjectTestQuestions, 
  clearSubjectTestCache,
  fetchSubjectCounts,
  fetchAppscPapers,
  fetchSubjectsByPaper,
  mapQuestionsToStandard,
} from '../../services/subjectTestService';
import { getAllowedExamIds } from '../../utils/examUtils';
import { getCachedSubjects, getCachedSubjectCounts, getCachedPapers } from '../../services/subjectTestService';
import { getMinQuestions, getDefaultMinQuestions } from '../../services/questionAvailabilityService';

// Views (lazy-loaded)
const SubjectPortalView = lazy(() => import('./SubjectTestViews/SubjectPortalView').then(m => ({ default: m.SubjectPortalView })));
const SubjectConfigView = lazy(() => import('./SubjectTestViews/SubjectConfigView').then(m => ({ default: m.SubjectConfigView })));

// ─── Types ──────────────────────────────────────────────────────────────────
type ViewState = 'PORTAL' | 'CONFIG';

export default function UserSubjectTests() {
  const { user, loading: authLoading } = useAuth();
  const { toasts, showToast } = useToast();
  const navigate = useNavigate();

  // ─── View State ────────────────────────────────────────────────────────────
  const [view, setView] = useState<ViewState>('PORTAL');
  
  // ─── Portal State ──────────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<string[]>(() => {
    if (!user?.exam_selection) return [];
    return getCachedSubjects(user.exam_selection) || [];
  });
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>(() => {
    if (!user?.exam_selection) return {};
    return getCachedSubjectCounts(user.exam_selection) || {};
  });
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(30);
  
  const [minQuestions, setMinQuestions] = useState<number>(getDefaultMinQuestions);
  const [loading, setLoading] = useState(() => {
    if (authLoading) return true;
    if (!user?.exam_selection) return true;
    return !getCachedSubjects(user.exam_selection);
  });
  const [isLaunching, setIsLaunching] = useState(false);

  // ─── APPSC Specific State ──────────────────────────────────────────────────
  const [papers, setPapers] = useState<any[]>(() => {
    if (!user?.exam_selection) return [];
    return getCachedPapers(user.exam_selection) || [];
  });
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { nextId, isStale } = useStableFetch();

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const { isXs, isSm } = useBreakpoint();
  const isMobile = isXs || isSm;
  const isAppsc = user?.exam_selection === 'APPSC_GROUPS' || user?.exam_selection === 'APPSC';

  // ─── Initial Load ──────────────────────────────────────────────────────────
  const initPortal = useCallback(async (force = false) => {
    if (authLoading) return;
    if (!user?.exam_selection) return;
    const id = nextId();
    try {
      if (force) {
        await clearSubjectTestCache(user.exam_selection);
      } else if (getCachedSubjects(user.exam_selection)) {
        // Data exists, but we'll do a background refresh
      } else {
        setLoading(true);
      }
      
      if (isAppsc) {
        const rawPapers = await fetchAppscPapers(user.exam_selection, force);
        if (isStale(id)) return;
        setPapers(rawPapers);
      } else {
        const [subjectsData, countsData] = await Promise.all([
          fetchSubjectsByExam(user.exam_selection, force),
          fetchSubjectCounts(user.exam_selection, undefined, force)
        ]);
        if (isStale(id)) return;
        setSubjects(subjectsData);
        setSubjectCounts(countsData);
      }

      // Fetch backend-driven min questions threshold
      const minQ = await getMinQuestions(user.exam_selection, force);
      if (isStale(id)) return;
      setMinQuestions(minQ);
    } catch (err: any) {
      if (isStale(id)) return;
      showToast(err.message || "Failed to load portal", "error");
    } finally {
      if (!isStale(id)) setLoading(false);
    }
  }, [authLoading, user?.exam_selection, isAppsc])

  useEffect(() => {
    initPortal(true);
  }, [initPortal]);

  // Auto-select first paper when APPSC papers load
  useEffect(() => {
    if (!isAppsc || !papers.length || selectedPaperId) return;
    const firstPaper = papers[0];
    setActiveGroup(firstPaper.exam_id);
    setSelectedPaperId(firstPaper.id);
  }, [isAppsc, papers, selectedPaperId]);

  // Handle APPSC Paper Selection (Secured from race conditions and unmounts)
  useEffect(() => {
    if (!isAppsc || !selectedPaperId || !user?.exam_selection) return;
    let isCurrent = true;

    async function fetchAppscSubjects() {
      try {
        const [subjectsData, countsData] = await Promise.all([
          fetchSubjectsByPaper(selectedPaperId || ''),
          fetchSubjectCounts(user?.exam_selection || '', selectedPaperId || undefined)
        ]);
        if (!isCurrent || !isMounted.current) return;
        setSubjects(subjectsData);
        setSubjectCounts(countsData);

        const minQ = await getMinQuestions(user?.exam_selection || '', false);
        if (isCurrent && isMounted.current) setMinQuestions(minQ);
      } catch (e) {
        console.error(e instanceof Error ? e.message : e);
      }
    }
    fetchAppscSubjects();

    return () => {
      isCurrent = false;
    };
  }, [selectedPaperId, isAppsc, user?.exam_selection]);

  const groupOptions = useMemo(() => {
    const allowedIds = getAllowedExamIds(user?.exam_selection || '');
    return allowedIds.map(id => ({
      id,
      label: id.replace('APPSC_', '').replace('_', ' ')
    }));
  }, [user?.exam_selection]);

  // ─── Launch to Standardized Exam Engine ───
  const launchTest = async () => {
    if (!selectedSubject || isLaunching) return;
    setIsLaunching(true);

    try {
      const examId = isAppsc 
        ? papers.find(p => p.id === selectedPaperId)?.exam_id 
        : user?.exam_selection;

      const rawQuestions = await fetchSubjectTestQuestions({
        examId: examId as string,
        paperId: (isAppsc ? selectedPaperId : undefined) ?? undefined,
        subjectName: selectedSubject!,
        count: questionCount,
        userId: user?.id
      });
      
      if (!isMounted.current) return;

      // Convert SubjectQuestion[] → Question[] for the standard engine
      const questions = mapQuestionsToStandard(rawQuestions);
      const durationMinutes = questionCount;
      const totalMarks = questionCount;

      navigate('/active-exam/subject-test', {
        state: {
          source: 'subject_test',
          questions,
          durationMinutes,
          title: `${selectedSubject} — Subject Test`,
          paperName: `${selectedSubject}`,
          showSubjectName: false,
          negativeMarkValue: 0,
          marksPerQuestion: 1,
          totalMarks,
          subjectName: selectedSubject
        }
      });
    } catch (err: any) {
      if (isMounted.current) {
        showToast(err.message || "Failed to launch", "error");
      }
    } finally {
      if (isMounted.current) {
        setIsLaunching(false);
      }
    }
  };

  if (loading) return (
    <PageContainer>
      <Stack gap={32}>
        <LoadingSkeleton height={120} borderRadius={16} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <Stack gap={32}>
              <LoadingSkeleton height={80} borderRadius={16} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <LoadingSkeleton height={80} borderRadius={16} />
                 <LoadingSkeleton height={80} borderRadius={16} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                 {[1,2,3,4,5,6,7,8].map(i => <LoadingSkeleton key={i} height={140} borderRadius={16} />)}
              </div>
            </Stack>
          </div>
          <div className="lg:col-span-4">
             <LoadingSkeleton height={400} borderRadius={16} />
          </div>
        </div>
      </Stack>
    </PageContainer>
  );

  return (
    <PageContainer>
      {/* ══ PORTAL VIEW ══ */}
      {view === 'PORTAL' && (
        <Suspense fallback={<LoadingSkeleton height={500} borderRadius={24} />}>
          <SubjectPortalView 
            isAppsc={isAppsc}
            isMobile={isMobile}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            groupOptions={groupOptions}
            papers={papers}
            activeGroup={activeGroup}
            selectedPaperId={selectedPaperId}
            onExamChange={(id) => {
              setActiveGroup(id);
              const firstPaper = papers.find(p => p.exam_id === id);
              if (firstPaper) setSelectedPaperId(firstPaper.id);
            }}
            onPaperChange={setSelectedPaperId}
            subjects={subjects}
            subjectCounts={subjectCounts}
            minQuestions={minQuestions}
            onSubjectClick={(s) => {
              const count = subjectCounts[s] || 0;
              if (count < minQuestions) {
                showToast(`Not enough questions. Minimum required: ${minQuestions}. Available: ${count}.`, "error");
                return;
              }
              setSelectedSubject(s);
              setQuestionCount(30);
              setView('CONFIG');
            }}
          />
        </Suspense>
      )}

      {/* ══ CONFIG VIEW ══ */}
      {view === 'CONFIG' && selectedSubject && (
        <Suspense fallback={<LoadingSkeleton height={400} borderRadius={24} />}>
          <SubjectConfigView 
            selectedSubject={selectedSubject}
            subjectCounts={subjectCounts}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
            isLaunching={isLaunching}
            onLaunch={launchTest}
            onBack={() => setView('PORTAL')}
          />
        </Suspense>
      )}

      <ToastContainer toasts={toasts} />
    </PageContainer>
  );
}
