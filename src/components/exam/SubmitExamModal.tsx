import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
  answeredCount,
  notVisitedCount = 0,
  totalCount,
  isAutoSubmit = false,
}) => {
  const { isDark } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            className={`relative w-full max-w-sm overflow-hidden p-8 text-center ${
              isDark
                ? 'bg-card-bg border border-border-subtle rounded-[24px] shadow-2xl'
                : 'ancient-card !m-0 !w-full rounded-[24px]'
            }`}
          >
            {isAutoSubmit ? (
              <>
                <IconWrapper isDark={isDark} autoSubmit>
                  <AlertCircle size={32} className={isDark ? 'text-danger' : 'text-rose-700'} />
                </IconWrapper>
                <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-[#3D1F08]'}`}>Time's Up!</h2>
                <p className={`font-bold mb-8 ${isDark ? 'text-gray-300' : 'text-[#5E3C1A]'}`}>
                  Your time is over. Your responses are being saved automatically.
                </p>
                <div className="flex items-center justify-center gap-3 text-rose-500 font-black italic animate-bounce">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Submitting...
                </div>
              </>
            ) : (
              <>
                <IconWrapper isDark={isDark}>
                  <CheckCircle2 size={32} className={isDark ? 'text-primary' : 'text-[#1B4D3E]'} />
                </IconWrapper>
                <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-[#3D1F08]'}`}>Submit Exam</h2>
                <p className={`font-bold mb-8 ${isDark ? 'text-gray-300' : 'text-[#5E3C1A]'}`}>
                  Are you sure you want to submit your exam?
                </p>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={onConfirm}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.97] ${
              isDark
                ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
                : 'ancient-btn-primary justify-center'
            }`}
                  >
                    Submit & Review
                  </button>
                  <button
                    onClick={onClose}
          className={`w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.97] ${
              isDark
                ? 'bg-hover-bg hover:bg-hover-bg/80 text-gray-300'
                : 'ancient-btn-secondary justify-center'
            }`}
                  >
                    Back to Test
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const IconWrapper: FC<{ children: React.ReactNode; isDark: boolean; autoSubmit?: boolean }> = ({ children, isDark, autoSubmit }) => (
  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
    isDark
      ? (autoSubmit ? 'bg-danger/10' : 'bg-primary/10')
      : (autoSubmit ? 'bg-rose-500/10 border-2 border-rose-500/30' : 'bg-primary/10 border-2 border-[#A87828]')
  }`}>
    {children}
  </div>
);
