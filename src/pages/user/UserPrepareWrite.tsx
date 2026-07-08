import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStableFetch } from '../../hooks/useStableFetch';
import { useToast, ToastContainer } from '../../hooks/useToast';
import { PageContainer, PageTransition } from '../../components/common/AntigravityUI';
import { ExamLayout } from '../../components/exam';
import { getAllowedExamIds } from '../../utils/examUtils';
import { batchCheckAvailability } from '../../services/examService';
import { 
  fetchExams,
  fetchPapers,
  fetchPaperDistribution, 
  fetchPrepareQuestions 
} from '../../services/prepareWriteService';
import type { Question, ExamPaper } from '../../types/exam.types';

// ─── Sub-Views
import { SelectionView } from './PrepareWriteViews/SelectionView';
import { PreparationView } from './PrepareWriteViews/PreparationView';
import { ExamView } from './PrepareWriteViews/ExamView';
import { ResultView } from './PrepareWriteViews/ResultView';
import { ReviewView } from './PrepareWriteViews/ReviewView';

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewState = 'SELECTION' | 'PREPARATION' | 'EXAM' | 'RESULT' | 'REVIEW';

interface SessionState {
  view: ViewState;
  questions: Question[];
  answers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  markedForReview: Record<string, boolean>;
  selectedPaper: ExamPaper | null;
  selectedExamId: string | null;
  startTime: number | null;
  endTime: number | null;
  currentIndex: number;
}

const SESSION_KEY = 'prepare_write_active_session';

export default function UserPrepareWrite() {
  const { user, loading: authLoading } = useAuth();
  const { toasts, showSuccess, showError } = useToast();
  
  // ─── UI State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, { valid: boolean; message?: string }>>({});
  const [visibleCount, setVisibleCount] = useState(10);
  
  const { nextId, isStale } = useStableFetch();

  // ─── Persistence Logic ─────────────────────────────────────────────────────
  const getInitialState = (): SessionState => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse session state");
      }
    }
    return {
      view: 'SELECTION',
      questions: [],
      answers: {},
      markedForReview: {},
      selectedPaper: null,
      selectedExamId: null,
      startTime: null,
      endTime: null,
      currentIndex: 0
    };
  };

  const [state, setState] = useState<SessionState>(getInitialState());

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }, [state]);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setState({
      view: 'SELECTION',
      questions: [],
      answers: {},
      markedForReview: {},
      selectedPaper: null,
      selectedExamId: null,
      startTime: null,
      endTime: null,
      currentIndex: 0
    });
  }, []);

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const loadInitial = useCallback(async (force = false) => {
    if (!user?.id || !user?.exam_selection) return;
    const id = nextId();
    setLoading(true);
    setError(null);

    try {
      const allowedIds = getAllowedExamIds(user.exam_selection);
      const examsData = await fetchExams(allowedIds, force);
      
      if (isStale(id)) return;
      setExams(examsData);
      
      // Find the target exam ID: either the one from state (if valid for this user) or the first available allowed one
      let targetExamId = state.selectedExamId;
      if (targetExamId && !examsData.some(e => e.exam_id === targetExamId)) {
        targetExamId = null;
      }
      
      if (!targetExamId && examsData.length > 0) {
        targetExamId = examsData[0].exam_id;
      }
      
      if (targetExamId) {
        if (state.selectedExamId !== targetExamId) {
          setState(prev => ({ ...prev, selectedExamId: targetExamId }));
        }
        const papersData = await fetchPapers(targetExamId, allowedIds, force);
        if (isStale(id)) return;
        setPapers(papersData);

        if (papersData.length > 0 && (!state.selectedPaper || state.selectedPaper.exam_id !== targetExamId)) {
          setState(prev => ({ ...prev, selectedPaper: papersData[0] }));
        }

        // Check availability before showing cards (same pattern as UserExams)
        const results = await batchCheckAvailability(papersData.map(p => p.id));
        if (isStale(id)) return;
        setAvailabilityMap(results);
      }
    } catch (err: any) {
      if (isStale(id)) return;
      setError(err.message || "Failed to initialize configuration.");
    } finally {
      if (!isStale(id)) setLoading(false);
    }
  }, [user?.id, user?.exam_selection]);

  useEffect(() => {
    loadInitial();
  }, [user?.exam_selection, loadInitial]);

  const handleExamChange = useCallback(async (examId: string) => {
    const id = nextId();
    setState(prev => ({ ...prev, selectedExamId: examId }));
    setLoading(true);
    try {
      const allowedIds = getAllowedExamIds(user?.exam_selection);
      const papersData = await fetchPapers(examId, allowedIds);
      if (isStale(id)) return;
      setPapers(papersData);
      if (papersData.length > 0) {
        setState(prev => ({ ...prev, selectedPaper: papersData[0] }));
      }

      // Check availability before showing cards
      const results = await batchCheckAvailability(papersData.map(p => p.id));
      if (isStale(id)) return;
      setAvailabilityMap(results);
    } catch (err: any) {
      showError("Failed to load papers.");
    } finally {
      if (!isStale(id)) setLoading(false);
    }
  }, [user?.exam_selection]);

  // ─── Action Handlers ───────────────────────────────────────────────────────
  const startPreparation = useCallback(async () => {
    if (actionLoading || !state.selectedPaper) return;
    setActionLoading(true);
    try {
      const { subjects } = await fetchPaperDistribution(state.selectedPaper.id);
      const questions = await fetchPrepareQuestions(state.selectedPaper.id, subjects, user?.id);
      
      setState(prev => ({
        ...prev,
        view: 'PREPARATION',
        questions,
        answers: {},
        markedForReview: {},
        currentIndex: 0,
        startTime: null,
        endTime: null
      }));
      setVisibleCount(10);
      showSuccess("Preparation mode loaded.");
    } catch (err: any) {
      showError(err.message || "Preparation fetch failed");
    } finally {
      setActionLoading(false);
    }
  }, [state.selectedPaper, user?.id]);

  const startExam = useCallback(() => {
    setState(prev => ({
      ...prev,
      view: 'EXAM',
      startTime: Date.now(),
      currentIndex: 0
    }));
  }, []);

  const handleAnswer = useCallback((questionId: string, option: 'A' | 'B' | 'C' | 'D') => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: option }
    }));
  }, []);

  const handleToggleReview = useCallback((questionId: string) => {
    setState(prev => {
      const current = prev.markedForReview[questionId];
      return {
        ...prev,
        markedForReview: { ...prev.markedForReview, [questionId]: !current }
      };
    });
  }, []);

  const submitExam = useCallback(() => {
    setState(prev => ({
      ...prev,
      view: 'RESULT',
      endTime: Date.now()
    }));
    showSuccess("Exam submitted successfully.");
  }, []);

  const exitSession = useCallback(() => {
    if (state.view !== 'SELECTION' && state.view !== 'RESULT') {
      if (!window.confirm("Are you sure you want to exit? Your progress will be lost.")) return;
    }
    clearSession();
  }, [state.view, clearSession]);

  // ─── Render Logic ──────────────────────────────────────────────────────────
  
  const renderCurrentView = () => {
    switch (state.view) {
      case 'SELECTION':
        return (
          <SelectionView 
            userSelection={user?.exam_selection || ''}
            exams={exams}
            papers={papers}
            selectedExamId={state.selectedExamId}
            selectedPaper={state.selectedPaper}
            availabilityMap={availabilityMap}
            loading={authLoading || loading}
            actionLoading={actionLoading}
            error={error}
            onExamChange={handleExamChange}
            onPaperSelect={(p) => setState(prev => ({ ...prev, selectedPaper: p }))}
            onStartPreparation={startPreparation}
            onRetry={() => state.selectedExamId && handleExamChange(state.selectedExamId)}
          />
        );
      case 'PREPARATION':
        return (
          <PreparationView 
            paper={state.selectedPaper}
            questions={state.questions}
            visibleCount={visibleCount}
            onExit={exitSession}
            onStartExam={startExam}
            onLoadMore={() => setVisibleCount(prev => prev + 10)}
          />
        );
      case 'EXAM':
        return (
          <ExamView 
            paper={state.selectedPaper}
            questions={state.questions}
            currentIndex={state.currentIndex}
            answers={state.answers}
            markedForReview={state.markedForReview}
            startTime={state.startTime}
            onExit={exitSession}
            onSubmit={submitExam}
            onAnswer={handleAnswer}
            onToggleReview={handleToggleReview}
            onJumpToQuestion={(index) => setState(prev => ({ ...prev, currentIndex: index }))}
            onPrev={() => setState(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 }))}
            onNext={() => {
              if (state.currentIndex < state.questions.length - 1) {
                setState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
              } else {
                submitExam();
              }
            }}
          />
        );
      case 'RESULT':
        return (
          <ResultView 
            questions={state.questions}
            answers={state.answers}
            durationSeconds={state.startTime && state.endTime ? Math.floor((state.endTime - state.startTime) / 1000) : undefined}
            onReview={() => setState(prev => ({ ...prev, view: 'REVIEW', currentIndex: 0 }))}
            onNewSession={clearSession}
          />
        );
      case 'REVIEW':
        return (
          <ReviewView 
            questions={state.questions}
            answers={state.answers}
            durationSeconds={state.startTime && state.endTime ? Math.floor((state.endTime - state.startTime) / 1000) : undefined}
            onBackToResult={() => setState(prev => ({ ...prev, view: 'RESULT' }))}
            onCloseReview={clearSession}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {state.view === 'EXAM' ? (
        <ExamLayout>
          {renderCurrentView()}
        </ExamLayout>
      ) : state.view === 'REVIEW' ? (
        renderCurrentView()
      ) : (
        <PageContainer>
          <PageTransition>
            {renderCurrentView()}
          </PageTransition>
        </PageContainer>
      )}
      <ToastContainer toasts={toasts} />
    </>
  );
}
