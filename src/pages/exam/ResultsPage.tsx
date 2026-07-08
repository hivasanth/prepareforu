import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  Target, 
  Clock, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  Button, 
  PageContainer, 
  Stack, 
  Grid, 
  ScoreCard, 
  ResultStatCard, 
  H3,
  Body,
  Label,
  IconBadge
} from '../../components/common/AntigravityUI';

import { useAuth } from '../../context/AuthContext';
import { fetchAttemptResult } from '../../services/examService';
import { computeExamStatistics } from '../../utils/examStateCalculator';
import type { ExamStatistics } from '../../utils/examStateCalculator';

export default function ResultsPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Helper to normalize the result from either the RPC response format or database attempt format
  const normalizeResult = (res: any): ExamStatistics & { duration_seconds: number } => {
    const correct = typeof res.correct !== 'undefined' ? res.correct : (res.correct_count || 0);
    const wrong = typeof res.wrong !== 'undefined' ? res.wrong : (res.wrong_count || 0);
    const skipped = typeof res.skipped !== 'undefined' ? res.skipped : (res.skipped_count || 0);
    const answered = correct + wrong;
    const total = answered + skipped;
    const duration_seconds = typeof res.duration_seconds !== 'undefined' ? res.duration_seconds : (res.duration || 0);
    return {
      total,
      answered,
      correct,
      wrong,
      skipped,
      marked: 0,
      visited: total,
      notVisited: 0,
      score: res.score || 0,
      accuracy: res.accuracy || 0,
      timeTaken: duration_seconds,
      duration_seconds,
    };
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<ExamStatistics & { duration_seconds: number } | null>(() => {
    if (location.state?.result) {
      return normalizeResult(location.state.result);
    }
    return null;
  });

  const loadData = useCallback(async () => {
    if (!attemptId) return;
    
    try {
      if (!location.state?.result) {
        setLoading(true);
      }
      setError(null);
      const { attempt, answers } = await fetchAttemptResult(attemptId, user?.id || '');
      if (attempt.status === 'completed' || attempt.status === 'auto_submitted') {
        const questions = attempt.questions_snapshot || [];
        const stats = computeExamStatistics(
          questions, {}, new Set(), new Set(answers.map(a => a.question_id)), answers, attempt.duration_seconds ?? undefined,
        );
        setStatsData({ ...stats, duration_seconds: attempt.duration_seconds || 0 });
      } else {
         setError("This exam attempt is still in progress. Please complete the exam first.");
      }
    } catch (err: any) {
      if (!location.state?.result) {
        setError("Failed to retrieve result metrics. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [attemptId, location.state, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-app-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-base font-semibold text-text-secondary">Compiling Performance Metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
          <IconBadge icon={AlertCircle} size="4xl" className="rounded-[18px]" darkClassName="bg-danger/10 text-danger" />
          <Stack gap={8}>
            <H3>Analysis Error</H3>
            <Body secondary>{error}</Body>
          </Stack>
          <Stack gap={12} className="w-full max-w-xs">
            <Button onClick={() => loadData()} fullWidth>Retry Analysis</Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard')} fullWidth>Return Home</Button>
          </Stack>
        </div>
      </PageContainer>
    );
  }

  if (!statsData) return null;

  const examInfo = location.state?.examTitle || "Competitive Assessment";
  const paperInfo = location.state?.paperName || "Diagnostic Module";
  const sd = statsData;

  return (
    <PageContainer className="py-6 md:py-10">
      <div className="max-w-[1200px] mx-auto">
        <Stack gap={24} className="md:gap-8 lg:gap-10">
          {/* 1. Header Alignment */}
          <Stack direction="row" align="center" justify="start" className="px-1 md:px-2 gap-3 sm:gap-4 md:gap-6">
            <Button
              variant="secondary"
              onClick={() => navigate('/dashboard')}
              className="h-10 sm:px-4 rounded-xl shrink-0"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline ml-2">Dashboard</span>
            </Button>
            <div className="text-left flex-1 min-w-0">
              <h2 className="text-[10px] sm:text-[12px] md:text-[16px] font-black text-text-primary tracking-tight uppercase m-0 leading-tight truncate">{examInfo}</h2>
              <p className="text-[8px] sm:text-[10px] md:text-[11px] font-bold text-text-secondary uppercase tracking-widest opacity-50 m-0 truncate">{paperInfo}</p>
            </div>
          </Stack>

          {/* 2. Score Card (Final Score Block) */}
          <ScoreCard 
            score={sd.score} 
            subtitle="Assessment Finalized. Here is a breakdown of your cognitive performance and diagnostic data."
            className="w-full"
          >
            {/* 3. Stats Section (Accuracy / Duration / Rank) */}
            <div className="w-full max-w-2xl mx-auto mt-4 md:mt-6">
              <div className="flex flex-row items-center justify-center gap-4 sm:gap-8 md:gap-12 px-2">
                 <Stack align="center" gap={4} className="text-center min-w-[70px]">
                    <IconBadge icon={Target} size="lg" className="md:w-11 md:h-11 rounded-lg md:rounded-xl" darkClassName="bg-secondary/10 text-secondary" />
                   <div className="flex flex-col gap-0.5">
                     <Label className="text-[8px] md:text-[9px] opacity-40">Accuracy</Label>
                     <div className="text-[14px] md:text-[18px] font-black text-text-primary leading-none">{sd.accuracy}%</div>
                   </div>
                 </Stack>
                 
                 <div className="w-px h-10 bg-border-subtle/30 mx-1 sm:mx-2" />

                 <Stack align="center" gap={4} className="text-center min-w-[70px]">
                    <IconBadge icon={Clock} size="lg" className="md:w-11 md:h-11 rounded-lg md:rounded-xl" />
                   <div className="flex flex-col gap-0.5">
                     <Label className="text-[8px] md:text-[9px] opacity-40">Duration</Label>
                     <div className="text-[14px] md:text-[18px] font-black text-text-primary leading-none">
                       {Math.floor(sd.timeTaken / 60)}<span className="text-[10px] ml-0.5 opacity-50 font-bold uppercase">min</span>
                     </div>
                   </div>
                 </Stack>

                 <div className="w-px h-10 bg-border-subtle/30 mx-1 sm:mx-2" />

                 <Stack align="center" gap={4} className="text-center min-w-[70px]">
                    <IconBadge icon={Trophy} size="lg" className="md:w-11 md:h-11 rounded-lg md:rounded-xl" darkClassName="bg-warning/10 text-warning" />
                   <div className="flex flex-col gap-0.5">
                     <Label className="text-[8px] md:text-[9px] opacity-40">Impact</Label>
                     <div className="text-[14px] md:text-[18px] font-black text-text-primary leading-none">High</div>
                   </div>
                 </Stack>
              </div>
            </div>
          </ScoreCard>

          {/* 4. Result Summary Cards */}
          <div className="w-full max-w-[1100px] mx-auto">
            <Grid cols={3} className="gap-4 md:gap-5 lg:gap-6">
              <ResultStatCard 
                label="Correct Answers" 
                value={sd.correct} 
                icon={CheckCircle2} 
                variant="success" 
              />
              <ResultStatCard 
                label="Incorrect Answers" 
                value={sd.wrong} 
                icon={XCircle} 
                variant="danger" 
              />
              <ResultStatCard 
                label="Skipped" 
                value={sd.skipped} 
                icon={AlertCircle} 
                variant="default" 
              />
            </Grid>
          </div>

          {/* 5. CTA Section */}
          <div className="w-full flex justify-center py-2">
            <Button 
              onClick={() => navigate(`/review/${attemptId}`)}
              className="h-12 md:h-14 px-10 uppercase tracking-wider shadow-xl"
            >
              Review Exam
            </Button>
          </div>
        </Stack>
      </div>
    </PageContainer>
  );
}
