import type { FC, ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ExamHeaderProps {
  title: string;
  subtitle?: ReactNode;
  timerSlot: ReactNode;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
}

export const ExamHeader: FC<ExamHeaderProps> = ({
  title,
  subtitle,
  timerSlot,
  leftActions,
  rightActions,
}) => {
  const { isDark } = useTheme();

  return (
    <header className={`h-[60px] flex items-center justify-between px-4 sm:px-6 z-50 shadow-sm transition-colors duration-300 mx-4 sm:mx-6 max-sm:mx-[10px] mt-4 mb-2 max-sm:mt-[10px] max-sm:mb-[6px] rounded-2xl max-sm:rounded-xl ${
      isDark ? 'bg-card-bg border-b border-border-subtle' : 'ancient-header'
    }`}>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {leftActions}
        <div className="hidden sm:block min-w-0 flex-1 max-w-[420px]">
          <h1 className="m-0 text-[clamp(13px,1.3vw,15px)] font-black text-text-primary uppercase tracking-widest truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="m-0 text-[10px] font-bold text-primary truncate uppercase mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        {timerSlot}
        {rightActions}
      </div>
    </header>
  );
};
