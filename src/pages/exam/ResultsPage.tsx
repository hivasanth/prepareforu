import {
  Trophy,
  Target,
  Clock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Button,
  PageContainer,
  Stack,
  Grid,
  ScoreCard,
  ResultStatCard,
  Label,
  IconBadge,
} from '../../components/common/AntigravityUI';
import { ExamPageLoading } from '../../components/exam/ExamPageLoading';
import { ExamPageError } from '../../components/exam/ExamPageError';
import { useResults } from '../../components/exam/useResults';

export default function ResultsPage() {
  const {
    loading,
    error,
    statsData,
    loadData,
    attemptId,
    navigate,
    examInfo,
    paperInfo,
  } = useResults();

  if (loading) {
    return <ExamPageLoading message="Compiling Performance Metrics..." />;
  }

  if (error) {
    return (
      <ExamPageError
        title="Analysis Error"
        message={error}
        onRetry={() => loadData()}
        onBack={() => navigate('/dashboard')}
      />
    );
  }

  if (!statsData) return null;

  const sd = statsData;

  return (
    <PageContainer className="py-6 md:py-10">
      <div className="max-w-[1200px] mx-auto">
        <Stack gap={24} className="md:gap-8 lg:gap-10">
          <Stack direction="row" align="center" justify="start" className="px-1 md:px-2 gap-3 sm:gap-4 md:gap-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="shrink-0"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline ml-2">Dashboard</span>
            </Button>
            <div className="text-left flex-1 min-w-0">
              <h2 className="text-[10px] sm:text-[12px] md:text-[16px] font-black text-text-primary tracking-tight uppercase m-0 leading-tight truncate">{examInfo}</h2>
              <p className="text-[8px] sm:text-[10px] md:text-[11px] font-bold text-text-secondary uppercase tracking-widest m-0 truncate">{paperInfo}</p>
            </div>
          </Stack>

          <ScoreCard
            score={sd.score}
            subtitle="Assessment Finalized. Here is a breakdown of your cognitive performance and diagnostic data."
            className="w-full"
          >
            <div className="w-full max-w-2xl mx-auto mt-4 md:mt-6">
              <div className="flex flex-row items-center justify-center gap-4 sm:gap-8 md:gap-12 px-2">
                <Stack align="center" gap={4} className="text-center min-w-[70px]">
                  <IconBadge icon={Target} size="lg" status="secondary" className="md:w-11 md:h-11 rounded-lg md:rounded-xl" />
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[8px] md:text-[9px] text-text-hint">Accuracy</Label>
                    <div className="text-[14px] md:text-[18px] font-black text-text-primary leading-none">{sd.accuracy}%</div>
                  </div>
                </Stack>

                <div className="w-px h-10 bg-border-subtle/30 mx-1 sm:mx-2" />

                <Stack align="center" gap={4} className="text-center min-w-[70px]">
                  <IconBadge icon={Clock} size="lg" className="md:w-11 md:h-11 rounded-lg md:rounded-xl" />
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[8px] md:text-[9px] text-text-hint">Duration</Label>
                    <div className="text-[14px] md:text-[18px] font-black text-text-primary leading-none">
                      {Math.floor(sd.timeTaken / 60)}<span className="text-[10px] ml-0.5 opacity-50 font-bold uppercase">min</span>
                    </div>
                  </div>
                </Stack>

                <div className="w-px h-10 bg-border-subtle/30 mx-1 sm:mx-2" />

                <Stack align="center" gap={4} className="text-center min-w-[70px]">
                  <IconBadge icon={Trophy} size="lg" status="warning" className="md:w-11 md:h-11 rounded-lg md:rounded-xl" />
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[8px] md:text-[9px] text-text-hint">Impact</Label>
                    <div className="text-[14px] md:text-[18px] font-black text-text-primary leading-none">High</div>
                  </div>
                </Stack>
              </div>
            </div>
          </ScoreCard>

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

          <div className="w-full flex justify-center py-2">
            <Button
              size="xl"
              onClick={() => navigate(`/review/${attemptId}`)}
            >
              Review Exam
            </Button>
          </div>
        </Stack>
      </div>
    </PageContainer>
  );
}
