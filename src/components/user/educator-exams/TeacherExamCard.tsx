import { memo } from 'react'
import { Calendar, ChevronRight, CheckCircle2, Lock, FileText, Trophy, Play } from 'lucide-react'
import { Card, Button, Badge } from '../../../components/common/AntigravityUI'
import { H3, Body } from '../../../components/common/AntigravityTypography'
import { IconBadge } from '../../../components/common/IconBadge'
import { ExamDetailRow } from '../../../components/user/ExamDetailRow'
import type { TeacherExamWithAttempt, TeacherExamStatus } from '../../../types/exam.types'

interface TeacherExamCardProps {
  exam: TeacherExamWithAttempt
  activeTab: TeacherExamStatus
  isStarting: boolean
  onStart: (exam: TeacherExamWithAttempt) => void
  onLeaderboard: (exam: TeacherExamWithAttempt) => void
}

export const TeacherExamCard = memo(function TeacherExamCard({
  exam, activeTab, isStarting, onStart, onLeaderboard
}: TeacherExamCardProps) {
  const attempt = exam.attempts?.[0]
  const isDone = attempt?.status === 'completed' || attempt?.status === 'auto_submitted'
  const isInProgress = attempt?.status === 'in_progress'

  return (
    <Card
      variant="premium-dark-neutral"
      className="p-4 flex flex-col min-h-[220px] group"
    >
      <div className="flex justify-between items-start mb-4">
        <IconBadge icon={FileText} size="xl" shape="rounded" status="muted" className="lg:group-hover:text-primary lg:group-hover:bg-primary/5 transition-interaction duration-fast ease-standard" />
        {isDone ? (
          <Badge variant="success" icon={CheckCircle2}>ATTEMPTED</Badge>
        ) : isInProgress ? (
          <span role="status" aria-label="Attempt in progress">
            <Badge variant="warning" pulse>
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />IN PROGRESS
            </Badge>
          </span>
        ) : activeTab === 'live' ? (
          <Badge variant="danger">LIVE NOW</Badge>
        ) : activeTab === 'ended' ? (
          <Badge variant="warning">MISSED</Badge>
        ) : null}
      </div>

      <div className="space-y-1 mb-4">
        <H3 className="m-0 text-[15px] font-bold text-text-primary uppercase tracking-tight truncate lg:group-hover:text-primary transition-interaction duration-fast ease-standard">
          {exam.title}
        </H3>
        <Body className="m-0 text-[11px] text-text-muted line-clamp-1">
          {exam.instructions || 'Standard examination protocols applied.'}
        </Body>
      </div>

      <div className="space-y-2 mb-4">
        <ExamDetailRow icon={Calendar} label="DATED" value={new Date(exam.start_time).toLocaleDateString()} />
        {isDone && attempt && (
          <ExamDetailRow
            icon={Trophy}
            label="SCORE"
            value={`${attempt.score}/${exam.total_marks}`}
          />
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        {isDone ? (
          <>
            <Button
              fullWidth
              variant="primary"
              onClick={() => onStart(exam)}
              aria-label={`Review attempt for ${exam.title}`}
            >
              <CheckCircle2 size={14} className="mr-2" /> Review Attempt
            </Button>
            {activeTab === 'ended' && (
              <Button
                fullWidth
                variant="secondary"
                onClick={() => onLeaderboard(exam)}
                aria-label={`View leaderboard for ${exam.title}`}
              >
                <Trophy size={14} className="mr-2" /> Leaderboard
              </Button>
            )}
          </>
        ) : isInProgress ? (
          <Button
            fullWidth
            variant="primary"
            onClick={() => onStart(exam)}
            aria-label={`Resume attempt for ${exam.title}`}
          >
            <Play size={14} className="mr-2" /> Resume
          </Button>
        ) : activeTab === 'ended' ? (
          <Button
            fullWidth
            variant="primary"
            onClick={() => onLeaderboard(exam)}
            aria-label={`View leaderboard for ${exam.title}`}
          >
            <Trophy size={14} className="mr-2" /> Leaderboard
          </Button>
        ) : (
          <Button
            fullWidth
            disabled={activeTab === 'upcoming' || isStarting}
            onClick={() => onStart(exam)}
            variant="primary"
            className={activeTab === 'upcoming' ? 'opacity-40 cursor-not-allowed' : ''}
            loading={isStarting}
            aria-label={activeTab === 'upcoming' ? `${exam.title} is locked` : `Start attempt for ${exam.title}`}
          >
            {activeTab === 'upcoming' ? (
              <>Locked <Lock size={14} /></>
            ) : (
              <>Start Attempt <ChevronRight size={16} /></>
            )}
          </Button>
        )}
      </div>
    </Card>
  )
})
