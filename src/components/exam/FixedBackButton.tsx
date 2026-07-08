import type { FC } from 'react';
import { ArrowLeft } from 'lucide-react';

interface FixedBackButtonProps {
  onClick: () => void;
  label?: string;
}

export const FixedBackButton: FC<FixedBackButtonProps> = ({ onClick, label = 'Back' }) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-6 left-6 z-40 flex items-center gap-2 px-5 py-2.5 text-xs rounded-xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 bg-hover-bg text-text-secondary hover:bg-hover-bg/80 border border-border-subtle"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
};
