import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Label, Body } from '../common/AntigravityTypography';

interface ExamDetailRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export const ExamDetailRow = React.memo(({ icon: Icon, label, value }: ExamDetailRowProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-hover-bg/50 flex items-center justify-center text-text-muted shrink-0">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <Label className="font-semibold text-text-muted uppercase tracking-widest leading-none mb-1">{label}</Label>
        <Body className="text-[12px] font-bold text-text-primary uppercase truncate leading-none">{value}</Body>
      </div>
    </div>
  );
});
