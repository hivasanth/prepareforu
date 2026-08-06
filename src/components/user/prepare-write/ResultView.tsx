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
} from '../../common/AntigravityUI';
import { H1, Label } from '../../common/AntigravityTypography';
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
          <H1 className="text-[40px] font-black text-text-primary tracking-tighter uppercase m-0 leading-none">Simulation Over</H1>
          <Body secondary className="text-[13px] font-semibold text-text-muted uppercase tracking-[0.3em]">Professional Evaluation Engine</Body>
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

      <Card variant="premium-dark-neutral" className="p-12 text-center space-y-10">
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
              size="xl"
              onClick={onReview} 
            >
              <Brain size={20} />
              <Label>Diagnostic Review</Label>
            </Button>
            <Button 
              variant="secondary" 
              size="xl"
              onClick={onNewSession} 
            >
              <Label>New Session</Label>
              <RefreshCw size={20} />
            </Button>
         </div>
      </Card>
    </Stack>
  );
};
