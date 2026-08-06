import { BookOpen, Target, Flame, ShieldCheck } from 'lucide-react';
import {
  StatCard,
  Stack,
  Grid,
  H3,
  Body,
  IconBadge,
} from '../common/AntigravityUI';
import type { UserProfile } from '../../types/auth.types';

interface StatisticsSectionProps {
  user: UserProfile;
  getReadableExam: (exam: string) => string;
}

export function StatisticsSection({ user, getReadableExam }: StatisticsSectionProps) {
  return (
    <Stack gap={24}>
      <div className="flex items-center gap-3 px-1">
        <IconBadge icon={BookOpen} size="xl" shape="rounded" className="shadow-inner" />
        <div>
          <H3 className="uppercase tracking-tight m-0">Academic Statistics</H3>
          <Body className="text-[11px] uppercase tracking-widest font-semibold text-text-hint">Verified Performance Metrics</Body>
        </div>
      </div>

      <Grid cols={4} gap={24}>
        <StatCard icon={BookOpen} label="SELECTED EXAM" value={getReadableExam(user.exam_selection || '')} color="var(--primary)" />
        <StatCard icon={Target} label="ACCURACY" value={`${user.overall_accuracy ?? 0}%`} color="var(--success)" />
        <StatCard icon={Flame} label="CURRENT STREAK" value={`${user.streak ?? 0} DAYS`} color="#F59E0B" />
        <StatCard icon={ShieldCheck} label="HIGHEST STREAK" value={`${user.longest_streak ?? 0} DAYS`} color="#6366F1" />
      </Grid>
    </Stack>
  );
}
