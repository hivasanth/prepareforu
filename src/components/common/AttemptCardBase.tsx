import { Card, Badge, Body, Label, PremiumIconContainer } from './AntigravityUI'
import { Typography } from './Typography'
import { FOCUS_RING } from './AntigravityMotion'
import { TrendingUp, ChevronRight, type LucideIcon } from 'lucide-react'
import type { PerformanceAttemptSummary } from '../../types/exam.types'

interface AttemptCardBaseProps {
  attempt: PerformanceAttemptSummary;
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

  // BUG-3 fix: the review gate (`review_accessed`) is one-time. Once an attempt
  // has been reviewed, `/review/:id` is a guaranteed dead-end ("Review access
  // has expired..."). Represent that state instead of inviting a failing
  // navigation: hide the Full Review affordance and stop the card from
  // pretending to be actionable. The security gate itself is never bypassed.
  const reviewed = !!attempt.review_accessed;
  const interactive = !reviewed;
  const handleActivate = () => {
    if (!interactive) return;
    onClick();
  };

  const ariaLabel = reviewed
    ? `${examName} — ${paperName}, Score ${attempt.score}, ${attempt.accuracy}% accuracy. Review already completed.`
    : `${examName} — ${paperName}, Score ${attempt.score}, ${attempt.accuracy}% accuracy. View full review.`;
  
  return (
    <Card 
      className={`w-full h-full group flex flex-col ${interactive ? `cursor-pointer ${FOCUS_RING}` : ''}`}
      onClick={handleActivate}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => handleCardKeyDown(e, onClick) : undefined}
      aria-label={ariaLabel}
    >
      <div className="flex justify-between items-center mb-4">
        <Badge variant="primary">{examName}</Badge>
        <PremiumIconContainer
          icon={Icon}
          iconSize={18}
          className="w-9 h-9 rounded-button-xs"
          darkClassName="bg-hover-bg text-text-secondary"
        />
      </div>

      <div className="flex flex-col md:grid md:grid-cols-[1fr_auto] gap-4">
        <div className="space-y-3">
          <Body className="font-bold leading-tight uppercase tracking-tight transition-interaction duration-fast ease-standard">
            {paperName}
          </Body>
          
          <div className="flex items-center justify-between md:justify-start gap-8">
            <div className="flex flex-col">
              <Body className="font-bold text-text-secondary">
                {attempt.submitted_at ? dateFormatter(attempt.submitted_at) : 'In Progress'}
              </Body>
            </div>
            
            <div className="flex flex-col text-right md:hidden">
              <Typography role="metric" color="success">{attempt.accuracy}% Accuracy</Typography>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col text-right">
          <Label>Performance</Label>
          <Typography role="metric" color="success">{attempt.accuracy}%</Typography>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border-subtle/30 flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <Typography role="metric">{attempt.score}</Typography>
          <Label>Pts</Label>
        </div>
        {showReviewLink && (
          reviewed ? (
            <Label className="uppercase tracking-wide">Already Reviewed</Label>
          ) : (
            <Typography role="link" weight="bold" className="flex items-center gap-1">
              Full Review <ChevronRight size={16} />
            </Typography>
          )
        )}
      </div>
    </Card>
  )
}