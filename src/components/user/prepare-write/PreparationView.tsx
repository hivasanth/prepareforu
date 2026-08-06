import type { FC } from 'react';
import { 
  ArrowLeft, 
  Timer, 
  Pen, 
  Brain,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import { BilingualToggle } from '../../common/BilingualToggle';
import { 
  Stack, 
  IconButton, 
  StatCard, 
  Button, 
  Grid, 
  Card 
} from '../../common/AntigravityUI';
import { H2, H3, Body, Label } from '../../common/AntigravityTypography';
import { DiagramRenderer } from '../../common/DiagramRenderer';
import { QuestionVisualizer } from '../../common/QuestionVisualizer';
import type { Question, ExamPaper } from '../../../types/exam.types';

const DIFFICULTY_DOT_CLASS: Record<string, string> = {
  easy: 'bg-success',
  medium: 'bg-warning',
  hard: 'bg-danger',
};

interface PreparationViewProps {
  paper: ExamPaper | null;
  questions: Question[];
  visibleCount: number;
  onExit: () => void;
  onStartExam: () => void;
  onLoadMore: () => void;
}

export const PreparationView: FC<PreparationViewProps> = ({
  paper,
  questions,
  visibleCount,
  onExit,
  onStartExam,
  onLoadMore
}) => {
  const [displayLang, setDisplayLang] = useState<'en' | 'te'>('en');
  return (
    <Stack gap={32}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 bg-app-bg/80 backdrop-blur-xl py-4 border-b border-border-subtle">
        <div className="flex items-center gap-4">
          <IconButton onClick={onExit} aria-label="Exit preparation">
            <ArrowLeft size={20} />
          </IconButton>
          <div>
            <H2 className="text-lg font-black text-text-primary m-0 uppercase leading-none tracking-tight">Preparation</H2>
            <Label className="text-[11px] font-bold text-primary uppercase tracking-widest mt-1 truncate max-w-[200px]">{paper?.paper_name}</Label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <BilingualToggle
            displayLang={displayLang}
            onChange={setDisplayLang}
            shortLabels
          />
          
          <StatCard 
            icon={Timer} 
            label="Est. Time" 
            value={`${paper?.duration_minutes}m`} 
            className="hidden sm:flex"
          />
          <Button variant="primary" onClick={onStartExam}>
            <Pen size={18} />
            <Label>Start Full Exam</Label>
          </Button>
        </div>
      </div>

      <Grid cols={1} gap={24}>
        {questions.slice(0, visibleCount).map((q, i) => (
          <Card key={q.id} variant="premium-dark-neutral" className="p-8 lg:p-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                <div>
                  <Label className="font-semibold text-primary uppercase tracking-widest block m-0">{q.subject_name}</Label>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_DOT_CLASS[q.difficulty] ?? 'bg-gray-400'}`} />
                    <Label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider m-0">{q.difficulty}</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {displayLang === 'te' && !q.question_text_te?.trim() ? (
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3">
                  <Globe className="w-4 h-4 text-amber-500/40" />
                  <Label className="text-[11px] font-bold text-amber-500 uppercase tracking-widest m-0">Telugu Translation Unavailable</Label>
                </div>
              ) : null}
              <H3 className="text-[20px] font-bold text-text-primary leading-snug tracking-tight m-0">
                {displayLang === 'en' 
                  ? (q.question_text_en?.trim() || 'Untitled Question') 
                  : (q.question_text_te?.trim() || q.question_text_en?.trim() || 'Untitled Question')}
              </H3>
            </div>

            {q.visual && <QuestionVisualizer visual={q.visual} />}

            {q.diagram && !q.visual && (
              <div className="p-4 bg-hover-bg/30 rounded-2xl border border-border-subtle">
                <DiagramRenderer diagram={q.diagram} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const label = opt as 'A' | 'B' | 'C' | 'D';
                const lowerOpt = label.toLowerCase();
                const isCorrect = q.correct_option === label;
                
                const enText = (q[`option_${lowerOpt}_en` as keyof Question] as string)?.trim() || '';
                const teText = (q[`option_${lowerOpt}_te` as keyof Question] as string)?.trim() || '';
                const text = displayLang === 'en' ? enText : (teText || enText);
                
                return (
                  <div 
                    key={label}
                    className={`
                      p-5 rounded-2xl border-2 flex items-center gap-4 transition-colors
                      ${isCorrect ? 'border-success bg-success/5' : 'border-border-subtle bg-app-bg opacity-70'}
                    `}
                    role="group"
                    aria-label={isCorrect ? 'Correct answer' : `Option ${label}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isCorrect ? 'bg-success text-white shadow-lg' : 'bg-hover-bg text-text-secondary'}`}>
                      {label}
                    </div>
                    <Body className={`text-[15px] font-bold m-0 ${isCorrect ? 'text-success' : 'text-text-secondary'}`}>
                      {text}
                    </Body>
                    {isCorrect && <CheckCircle2 size={18} className="text-success ml-auto flex-shrink-0" />}
                  </div>
                );
              })}
            </div>

            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <div className="flex items-center gap-3 mb-2 text-text-secondary">
                  <Brain size={18} className="text-primary" />
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-primary m-0">Technical Rationale</Label>
                </div>
                <Body className="text-text-primary/80 leading-relaxed text-[15px] italic m-0">
                  {displayLang === 'en' 
                    ? (q.explanation_en?.trim() || "No detailed explanation provided.") 
                    : (q.explanation_te?.trim() || "తెలుగు వివరణ అందుబాటులో లేదు. (No Telugu explanation provided.)")}
                </Body>
            </div>
          </Card>
        ))}
      </Grid>

      {visibleCount < questions.length && (
        <div className="flex justify-center pt-8">
          <Button variant="secondary" onClick={onLoadMore} className="min-w-[240px]">
            Load More Questions ({questions.length - visibleCount})
          </Button>
        </div>
      )}
    </Stack>
  );
};
