import { Card, Badge, Body, Label } from './AntigravityUI'
import { TrendingUp, ChevronRight, type LucideIcon } from 'lucide-react'
import type { Attempt } from '../../types/exam.types'

export interface AttemptWithRelations extends Attempt {
  exam_papers?: { paper_name: string };
  exam_configs?: { name: string };
}

interface AttemptCardBaseProps {
  attempt: AttemptWithRelations;
  onClick: () => void;
  icon?: LucideIcon;
  dateFormatter?: (date: string) => string;
  showReviewLink?: boolean;
}

function handleCardKeyDown(e: React.KeyboardEvent, onClick: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onClick();
  }
}

export function AttemptCardBase({ 
  attempt, 
  onClick, 
  icon: Icon = TrendingUp,
  dateFormatter = (d) => new Date(d).toLocaleDateString(),
  showReviewLink = true
}: AttemptCardBaseProps) {
  const paperName = attempt.exam_papers?.paper_name || 'Practice Paper';
  const examName = attempt.exam_configs?.name || 'Grand Exam';
  
  return (
    <Card 
      className="w-full h-full group cursor-pointer flex flex-col"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => handleCardKeyDown(e, onClick)}
    >
      <div className="flex justify-between items-center mb-4">
        <Badge variant="primary">{examName}</Badge>
        <div className="w-9 h-9 rounded-[10px] bg-hover-bg flex items-center justify-center text-text-secondary lg:group-hover:bg-primary lg:group-hover:text-white transition-all">
          <Icon size={18} />
        </div>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-[1fr_auto] gap-4">
        <div className="space-y-3">
          <p className="!text-[13px] md:!text-[14px] font-bold m-0 transition-colors !leading-tight uppercase tracking-tight lg:group-hover:text-primary">
            {paperName}
          </p>
          
          <div className="flex items-center justify-between md:justify-start gap-8">
            <div className="flex flex-col">
              <Body className="font-bold text-text-secondary">
                {attempt.submitted_at ? dateFormatter(attempt.submitted_at) : 'In Progress'}
              </Body>
            </div>
            
            <div className="flex flex-col text-right md:hidden">
              <span className="text-[14px] font-black text-success">{attempt.accuracy}% Accuracy</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col text-right">
          <Label>Performance</Label>
          <span className="text-[18px] font-black text-success tracking-tight">{attempt.accuracy}%</span>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border-subtle/30 flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-[20px] font-black text-text-primary tracking-tighter">{attempt.score}</span>
          <Label>Pts</Label>
        </div>
        {showReviewLink && (
          <div className="text-[13px] font-bold text-primary flex items-center gap-1 lg:group-hover:translate-x-1 transition-transform">
            Full Review <ChevronRight size={16} />
          </div>
        )}
      </div>
    </Card>
  )
}
