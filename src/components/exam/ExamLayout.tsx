import type { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface ExamLayoutProps {
  children: ReactNode;
  showFullscreenPrompt?: boolean;
  onRequestFullscreen?: () => void;
  fullscreenViolations?: number;
}

export const ExamLayout: FC<ExamLayoutProps> = ({
  children,
  showFullscreenPrompt,
  onRequestFullscreen,
  fullscreenViolations
}) => {
  const { isDark } = useTheme();

  return (
    <div className={`fixed inset-0 bg-app-bg flex flex-col select-none overflow-hidden transition-colors duration-300 ${!isDark ? 'light' : 'dark'}`}>
      {showFullscreenPrompt && onRequestFullscreen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="z-50 w-full bg-amber-500 flex items-center justify-between px-4 py-2 gap-3"
        >
          <span className="flex items-center gap-2 text-white text-[11px] font-black uppercase tracking-widest">
            Fullscreen is required for this exam
          </span>
          <button
            onClick={onRequestFullscreen}
            className="flex items-center gap-1.5 bg-white text-amber-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-amber-50 active:scale-95 transition-all"
          >
            Enter Fullscreen
          </button>
        </motion.div>
      )}
      {children}
    </div>
  );
};
