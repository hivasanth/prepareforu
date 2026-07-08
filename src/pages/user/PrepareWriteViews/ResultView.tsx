import { useMemo, type FC } from 'react';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Brain, 
  RefreshCw 
} from 'lucide-react';
import { 
  Stack, 
  Grid, 
  StatCard, 
  Card, 
  H3, 
  Body, 
  Button 
} from '../../../components/common/AntigravityUI';
import { computeExamStatistics, convertAnswersRecord } from '../../../utils/examStateCalculator';
import type { Question } from '../../../types/exam.types';

interface ResultViewProps {
  questions: Question[];
  answers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  durationSeconds?: number;
  onReview: () => void;
  onNewSession: () => void;
}

export const ResultView: FC<ResultViewProps> = ({
  questions,
  answers,
  durationSeconds,
  onReview,
  onNewSession
}) => {
  const stats = useMemo(() => {
    const visitedSet = new Set(Object.keys(answers));
    const answerDetails = convertAnswersRecord(questions, answers);
    return computeExamStatistics(questions, answers, new Set(), visitedSet, answerDetails, durationSeconds);
  }, [questions, answers, durationSeconds]);

  return (
    <Stack gap={48} className="max-w-4xl mx-auto py-12">
      <div className="text-center space-y-6">
        <div className="inline-flex p-8 bg-primary/10 text-primary rounded-full mb-2 shadow-inner border border-primary/10">
          <Trophy size={64} />
        </div>
        <Stack gap={8}>
          <h1 className="text-[40px] font-black text-text-primary tracking-tighter uppercase m-0 leading-none">Simulation Over</h1>
          <p className="text-[13px] font-black text-text-secondary uppercase tracking-[0.3em] opacity-60">Professional Evaluation Engine</p>
        </Stack>
      </div>

      <Grid cols={3} gap={24}>
        <StatCard 
          icon={CheckCircle2} 
          label="Correct Answers" 
          value={stats.correct.toString()} 
          color="var(--success)"
        />
        <StatCard 
          icon={XCircle} 
          label="Incorrect" 
          value={stats.wrong.toString()} 
          color="var(--danger)"
        />
        <StatCard 
          icon={Brain} 
          label="Session Accuracy" 
          value={`${stats.accuracy}%`} 
          color="var(--primary)"
        />
      </Grid>

      <Card className="p-12 text-center space-y-10 shadow-2xl border-primary/5 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
         <Stack gap={16}>
           <H3 className="uppercase tracking-tight">Performance Summary</H3>
           <Body secondary className="max-w-md mx-auto text-[15px]">
              You addressed {stats.visited} out of {stats.total} questions. 
             The simulation is complete. Review your diagnostic report to identify knowledge gaps.
           </Body>
         </Stack>

         <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              variant="primary" 
              onClick={onReview} 
              className="px-12 h-14 rounded-2xl shadow-xl shadow-primary/20"
            >
              <Brain size={20} />
              <span>Diagnostic Review</span>
            </Button>
            <Button 
              variant="secondary" 
              onClick={onNewSession} 
              className="px-12 h-14 rounded-2xl"
            >
              <span>New Session</span>
              <RefreshCw size={20} />
            </Button>
         </div>
      </Card>
    </Stack>
  );
};
