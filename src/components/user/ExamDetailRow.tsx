import type { LucideIcon } from 'lucide-react';

interface ExamDetailRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export function ExamDetailRow({ icon: Icon, label, value }: ExamDetailRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-hover-bg/50 flex items-center justify-center text-text-secondary/40 shrink-0">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold text-text-secondary opacity-50 uppercase tracking-widest leading-none mb-1">{label}</div>
        <div className="text-[12px] font-bold text-text-primary uppercase truncate leading-none">{value}</div>
      </div>
    </div>
  );
}
