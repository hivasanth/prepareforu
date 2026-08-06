import { Mail, Calendar } from 'lucide-react';
import {
  Card,
  H2,
  Label,
  Body,
} from '../common/AntigravityUI';
import type { UserProfile } from '../../types/auth.types';

interface ProfileHeaderProps {
  user: UserProfile;
  memberSince: string;
}

export function ProfileHeader({ user, memberSince }: ProfileHeaderProps) {
  return (
    <Card variant="premium-neutral" className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
      <div className="relative shrink-0">
        <div
          className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] bg-primary flex items-center justify-center text-white text-4xl md:text-5xl font-black shadow-2xl shadow-primary/30"
          aria-label={`${user.full_name}'s avatar`}
          role="img"
        >
          {user.full_name?.charAt(0).toUpperCase()}
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 md:w-10 md:h-10 bg-success border-4 border-card-bg rounded-full shadow-lg" aria-label="Verified account" />
      </div>

      <div className="flex-1 text-center md:text-left space-y-6">
        <div className="space-y-1">
          <H2 className="m-0 text-[24px] md:text-[32px] font-black text-text-primary tracking-tighter leading-none">{user.full_name}</H2>
          <Label className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] opacity-60">Academic Portfolio</Label>
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
          <div className="h-10 flex items-center gap-3 px-4 bg-hover-bg/50 border border-border-subtle rounded-xl">
            <Mail size={16} className="text-primary opacity-60" />
            <Body className="text-text-secondary font-bold text-[13px] tracking-tight m-0">{user.email}</Body>
          </div>
          <div className="h-10 flex items-center gap-3 px-4 bg-hover-bg/50 border border-border-subtle rounded-xl">
            <Calendar size={16} className="text-primary opacity-60" />
            <Label className="text-text-muted font-bold text-[11px] uppercase tracking-widest m-0">Joined {memberSince}</Label>
          </div>
        </div>
      </div>
    </Card>
  );
}
