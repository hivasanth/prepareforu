import React from 'react';
import { ProgressBar } from '../../common/AntigravityUI';
import { Body, Label } from '../../common/AntigravityTypography';
import type { LeaderboardEntry } from './types';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isMe: boolean;
  isMobile: boolean;
  formatDuration: (secs?: number) => string;
}

export const LeaderboardRow = React.memo(({ entry, isMe, isMobile, formatDuration }: LeaderboardRowProps) => {
  return (
    <tr className={`transition-colors border-b border-border-subtle/30 ${isMe ? 'bg-primary/5' : 'lg:hover:bg-hover-bg/20'}`}>
      <td className="px-2 py-4 text-center">
          <Body className={`text-[14px] md:text-[16px] font-black m-0 ${entry.rank <= 3 ? 'text-[var(--gold-300)]' : 'text-text-muted'}`}>
          {entry.rank.toString().padStart(2, '0')}
        </Body>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-[12px] md:text-[14px] font-black flex-shrink-0 ${isMe ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-hover-bg border border-border-subtle text-text-secondary'}`}>
            {(entry.full_name || 'A').charAt(0)}
          </div>
          <div className="min-w-0">
            <Body className="text-[13px] md:text-[14px] font-bold text-text-primary m-0 uppercase tracking-tight truncate flex items-center gap-2">
              {entry.full_name || 'Anonymous'}
              {isMe &&               <Label className="text-[7px] md:text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-semibold m-0">YOU</Label>}
            </Body>
            {isMobile && (
              <div className="flex items-center gap-2 mt-0.5">
                <Label className="text-text-muted m-0">{entry.score} PTS</Label>
                <span className="w-0.5 h-0.5 rounded-full bg-border-subtle" />
                <Label className="text-success m-0">{entry.accuracy}% ACC</Label>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="hidden sm:table-cell px-4 py-4 text-center text-[14px] font-black text-text-primary">
        {entry.score}
      </td>
      <td className="hidden md:table-cell px-4 py-4 text-center">
        <div className="flex flex-col items-center gap-1">
          <Body className="text-[13px] font-black text-success m-0">{entry.accuracy}%</Body>
          <ProgressBar value={entry.accuracy} color="success" className="w-12 h-1" />
        </div>
      </td>
      <td className="hidden lg:table-cell px-4 py-4 text-center text-[12px] font-bold text-text-muted">
        {formatDuration(entry.duration_seconds)}
      </td>
    </tr>
  );
});

interface MetricItemProps {
  label: string;
  value: string | number;
  color?: string;
  className?: string;
}

export function MetricItem({ label, value, color = "text-text-primary", className = "" }: MetricItemProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Label className="text-[8px] md:text-[9px] font-bold text-text-muted uppercase tracking-widest m-0">{label}</Label>
      <Body className={`text-[13px] md:text-[15px] font-black m-0 ${color}`}>{value}</Body>
    </div>
  );
}
