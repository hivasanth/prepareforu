import type { FC } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, IconBadge } from '../common/AntigravityUI';
import { AdminModal } from '../common/AdminModal';
import { Card } from '../common/AntigravityCard';

interface SubmitExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  answeredCount: number;
  notVisitedCount?: number;
  markedCount?: number;
  totalCount: number;
  isAutoSubmit?: boolean;
}

/**
 * Submit confirmation modal.
 *
 * Visual:
 *   Light: white stats surface (bg-app-bg), no elevated bg-hover-bg container.
 *   Auto-submit: gentle pulse animation instead of animate-bounce.
 *   Uses canonical AdminModal (never custom overlay).
 */
export const SubmitExamModal: FC<SubmitExamModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  answeredCount,
  markedCount,
  totalCount,
  isAutoSubmit = false,
}) => {
  if (isAutoSubmit) {
    return (
      <AdminModal
        isOpen={isOpen}
        onClose={() => {}}
        title="Time's Up!"
        maxWidth="sm:max-w-sm"
        showCloseButton={false}
      >
        <div className="text-center">
          <IconBadge icon={AlertCircle} size="4xl" shape="circle" status="danger" className="mx-auto mb-6" />
          <p className="font-bold mb-8 text-text-secondary">
            Your time is over. Your responses are being saved automatically.
          </p>
          <div className="flex items-center justify-center gap-3 text-danger font-bold">
            <span className="w-2 h-2 rounded-full bg-danger animate-[pulse_2s_ease-in-out_infinite]" />
            Submitting...
          </div>
        </div>
      </AdminModal>
    );
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Exam"
      description="Review your progress before submitting."
      maxWidth="sm:max-w-sm"
      footer={
        <div className="flex flex-col gap-3 w-full">
          <Button
            variant="primary"
            fullWidth
            onClick={onConfirm}
            className="py-4 text-lg"
          >
            Submit & Review
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            className="py-4 text-base"
          >
            Back to Test
          </Button>
        </div>
      }
    >
      <div className="text-center">
        <IconBadge icon={CheckCircle2} size="4xl" shape="circle" status="primary" className="mx-auto mb-6" />
        <p className="font-bold text-text-secondary">
          Are you sure you want to submit your exam?
        </p>
        <Card
          variant="elevated"
          className="mt-6 text-left overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Total Questions</span>
            <span className="font-black text-text-primary tabular-nums">{totalCount}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Answered</span>
            <span className="font-black text-success tabular-nums">{answeredCount}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Unanswered</span>
            <span className="font-black text-danger tabular-nums">{Math.max(0, totalCount - answeredCount)}</span>
          </div>
          {markedCount !== undefined && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Marked for Review</span>
              <span className="font-black text-purple-500 tabular-nums">{markedCount}</span>
            </div>
          )}
        </Card>
      </div>
    </AdminModal>
  );
};
