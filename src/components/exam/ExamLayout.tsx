import type { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FOCUS_RING, MODAL_TRANSITION } from '../common/AntigravityMotion';

interface ExamLayoutProps {
  children: ReactNode;
  showFullscreenPrompt?: boolean;
  onRequestFullscreen?: () => void;
}

export const ExamLayout: FC<ExamLayoutProps> = ({
  children,
  showFullscreenPrompt,
  onRequestFullscreen,
}) => {
  return (
    <div className="fixed inset-0 bg-app-bg flex flex-col select-none overflow-hidden transition-interaction duration-slow ease-standard">
      {showFullscreenPrompt && onRequestFullscreen && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={MODAL_TRANSITION}
          className="z-50 w-full bg-warning flex items-center justify-between px-4 py-2 gap-3"
        >
          <span className="flex items-center gap-2 text-white text-[11px] font-bold uppercase tracking-widest">
            Fullscreen is required for this exam
          </span>
          <button
            onClick={onRequestFullscreen}
            className={`flex items-center gap-1.5 bg-option-surface text-warning text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-warning/10 active:brightness-95 transition-interaction duration-fast ease-standard ${FOCUS_RING}`}
          >
            Enter Fullscreen
          </button>
        </motion.div>
      )}
      {children}
    </div>
  );
};
