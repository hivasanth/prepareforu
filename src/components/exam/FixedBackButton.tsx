import type { FC } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface FixedBackButtonProps {
  onClick: () => void;
  label?: string;
}

export const FixedBackButton: FC<FixedBackButtonProps> = ({ onClick, label = 'Back' }) => {
  const { isDark } = useTheme();

  return (
    <button
      onClick={onClick}
      className={`fixed top-6 left-6 z-40 flex items-center gap-2 px-5 py-2.5 text-xs rounded-xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
        isDark
          ? 'bg-hover-bg text-text-secondary hover:bg-hover-bg/80 border border-border-subtle'
          : 'ancient-btn-secondary'
      }`}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
};
