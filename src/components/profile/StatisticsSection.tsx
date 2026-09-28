import { BookOpen, Target, Flame, ShieldCheck } from 'lucide-react';
import {
  StatCard,
  Stack,
  Grid,
  H3,
  Body,
  IconBadge,
  ErrorContainer,
  RetryButton,
} from '../common/AntigravityUI';
import { StatSkeleton } from '../common/SharedComponents';
import type { DashboardStats } from '../../services/dashboardService';

interface StatisticsSectionProps {
  examSelection: string;
  getReadableExam: (exam: string) => string;
  stats: DashboardStats | null;
  statsLoading: boolean;
  statsError: string | null;
  isRetrying: boolean;
  onRetry: () => void;
}

export function StatisticsSection({
  examSelection,
  getReadableExam,
  stats,
  statsLoading,
  statsError,
  isRetrying,
  onRetry,
}: StatisticsSectionProps) {
  return (
    <Stack gap={24}>
      <div className="flex items-center gap-3 px-1">
        <IconBadge icon={BookOpen} size="xl" shape="rounded" className="shadow-inner" />
        <div>
          <H3 className="uppercase tracking-tight m-0">Academic Statistics</H3>
          <Body className="text-[11px] uppercase tracking-widest font-semibold text-text-hint">Verified Performance Metrics</Body>
        </div>
      </div>

      {statsLoading ? (
        <div role="status" aria-live="polite" aria-label="Loading academic statistics">
          <StatSkeleton decorative columns="grid-cols-2 md:grid-cols-2 lg:grid-cols-4" gap="gap-4 lg:gap-6" />
        </div>
      ) : statsError ? (
        <ErrorContainer category="network" severity="critical">
          <H3>Failed to load statistics</H3>
          <Body>{statsError}</Body>
          <RetryButton onRetry={onRetry} loading={isRetrying} />
        </ErrorContainer>
      ) : (
        <Grid cols={2} md={2} lg={4} gap={24}>
          <StatCard icon={BookOpen} label="SELECTED EXAM" value={getReadableExam(examSelection || '')} status="accent" />
          <StatCard icon={Target} label="ACCURACY" value={`${stats?.accuracy ?? 0}%`} status="success" />
          <StatCard icon={Flame} label="CURRENT STREAK" value={`${stats?.daily_streak ?? 0} DAYS`} status="warning" />
          <StatCard icon={ShieldCheck} label="HIGHEST STREAK" value={`${stats?.highest_streak ?? 0} DAYS`} status="secondary" />
        </Grid>
      )}
    </Stack>
  );
}
