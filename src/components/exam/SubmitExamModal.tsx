import type { FC, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { FocusTrap } from 'focus-trap-react';

interface SubmitExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  answeredCount: number;
  notVisitedCount?: number;
  totalCount: number;
  isAutoSubmit?: boolean;
}

export const SubmitExamModal: FC<SubmitExamModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isAutoSubmit = false,
}) => {
  const titleId = 'submit-exam-title';

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusTrap focusTrapOptions={{
          escapeDeactivates: !isAutoSubmit,
          clickOutsideDeactivates: !isAutoSubmit,
          initialFocus: false,
        }}>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={isAutoSubmit ? undefined : onClose}
            />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm overflow-hidden p-8 text-center bg-card-bg border border-border-subtle rounded-[24px] shadow-2xl"
          >
            {isAutoSubmit ? (
              <>
                <IconWrapper autoSubmit>
                  <AlertCircle size={32} className="text-danger" />
                </IconWrapper>
                <h2 id={titleId} className="text-2xl font-black mb-2 text-text-primary">Time's Up!</h2>
                <p className="font-bold mb-8 text-text-secondary">
                  Your time is over. Your responses are being saved automatically.
                </p>
                <div className="flex items-center justify-center gap-3 text-danger font-black italic animate-bounce">
                  <span className="w-2 h-2 rounded-full bg-danger" />
                  Submitting...
                </div>
              </>
            ) : (
              <>
                <IconWrapper>
                  <CheckCircle2 size={32} className="text-primary" />
                </IconWrapper>
                <h2 id={titleId} className="text-2xl font-black mb-2 text-text-primary">Submit Exam</h2>
                <p className="font-bold mb-8 text-text-secondary">
                  Are you sure you want to submit your exam?
                </p>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={onConfirm}
                    className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.97] bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                  >
                    Submit & Review
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.97] bg-hover-bg hover:bg-hover-bg/80 text-text-secondary"
                  >
                    Back to Test
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
};

const IconWrapper: FC<{ children: ReactNode; autoSubmit?: boolean }> = ({ children, autoSubmit }) => (
  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
    autoSubmit ? 'bg-danger/10' : 'bg-primary/10'
  }`}>
    {children}
  </div>
);
