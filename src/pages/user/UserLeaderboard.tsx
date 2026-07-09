import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useStableFetch } from '../../hooks/useStableFetch';
import {
  fetchLeaderboardMetadata,
  fetchTopRanks,
  fetchUserRank,
  clearLeaderboardCache,
  type LeaderboardEntry,
  type LeaderboardMetadata,
  getCachedLeaderboardMetadata
} from '../../services/leaderboardService';
import {
  LoadingSkeleton,
  GridSkeleton,
  ErrorState,
  EmptyState
} from '../../components/common/SharedComponents';
import {
  Tabs,
  PageContainer,
  Stack,
  Card
} from '../../components/common/AntigravityUI';
import { UserSelectionTabs } from '../../components/user/UserSelectionTabs';
import { SectionReveal } from '../../components/common/AntigravityAnimation';

import { LeaderboardRow, MetricItem } from './LeaderboardViews/LeaderboardComponents';
import { formatDurationMinutesSeconds } from '../../utils/timeUtils';

type TimeRange = 'all' | '30d' | '7d' | 'today';

export default function UserLeaderboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { isXs, isSm } = useBreakpoint();
  const isMobile = isXs || isSm;
  const isAppsc = user?.exam_selection === 'APPSC_GROUPS';

  const [metadata, setMetadata] = useState<LeaderboardMetadata>(() => getCachedLeaderboardMetadata(user?.exam_selection ?? '') || { exams: [], papers: [] });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [selectedPaper, setSelectedPaper] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30d');
  const [isInitialLoad, setIsInitialLoad] = useState(!getCachedLeaderboardMetadata(user?.exam_selection ?? ''));
  const { nextId, isStale } = useStableFetch();

  useEffect(() => {
    const init = async () => {
      if (!user?.id || !user?.exam_selection) return;
      const id = nextId();
      try {
        const meta = await fetchLeaderboardMetadata(user.exam_selection);
        if (isStale(id)) return;

        setMetadata(meta || { exams: [], papers: [] });
        if (meta && meta.exams.length > 0) {
          const firstExam = meta.exams.sort((a, b) => a.name.localeCompare(b.name))[0];
          setSelectedExam(firstExam.id);

          if (isAppsc) {
            const firstExamPapers = meta.papers.filter(p => p.exam_id === firstExam.id).sort((a, b) => a.name.localeCompare(b.name));
            if (firstExamPapers.length > 0) setSelectedPaper(firstExamPapers[0].id);
          } else {
            setSelectedPaper('all');
          }
        }
      } catch (err: any) {
        console.error('Metadata fetch error:', err.message);
        if (!isStale(id)) setError(err.message || "Failed to load leaderboard configuration.");
      } finally {
        if (!isStale(id)) setIsInitialLoad(false);
      }
    };
    init();
  }, [user?.id, user?.exam_selection, isAppsc]);

  const examOptions = useMemo(() => {
    return metadata.exams
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(e => ({
        id: e.id,
        label: e.name.replace(/APPSC[\s_]*/gi, '').replace(/_/g, ' ')
      }));
  }, [metadata.exams]);

  const paperOptions = useMemo(() => {
    return metadata.papers
      .filter(p => p.exam_id === selectedExam)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(p => ({
        id: p.id,
        label: p.name
      }));
  }, [metadata.papers, selectedExam]);

  const loadLeaderboard = useCallback(async (forceRefresh = false) => {
    if (selectedExam === 'all') return;

    const id = nextId();

    if (forceRefresh) {
      clearLeaderboardCache();
    }
    setLoading(true);
    setError(null);

    try {
      const [ranks, currentRank] = await Promise.all([
        fetchTopRanks(selectedExam, selectedPaper, selectedTimeRange),
        fetchUserRank(user?.id || '', selectedExam, selectedPaper, selectedTimeRange)
      ]);
      if (isStale(id)) return;
      setLeaderboard(ranks || []);
      setUserRank(currentRank || null);
    } catch (err: any) {
      if (isStale(id)) return;
      setError(err.message || 'The leaderboard sync was interrupted. Please check your connection and try again.');
    } finally {
      if (!isStale(id)) setLoading(false);
    }
  }, [selectedExam, selectedPaper, selectedTimeRange, user?.id]);

  useEffect(() => {
    if (!isInitialLoad) loadLeaderboard();
  }, [user?.id, selectedExam, selectedPaper, selectedTimeRange, isInitialLoad, loadLeaderboard]);

  const handleExamChange = (val: string) => {
    setSelectedExam(val);
    const firstPaper = metadata.papers
      .filter(p => p.exam_id === val)
      .sort((a, b) => a.name.localeCompare(b.name))[0];
    if (firstPaper) setSelectedPaper(firstPaper.id);
  };

  if (authLoading || isInitialLoad || !metadata) return <LeaderboardSkeleton />;

  return (
    <PageContainer>
        <Stack gap="lg">
          {isAppsc && (
            <SectionReveal className="w-full">
              <UserSelectionTabs
                selectedExam={selectedExam}
                setSelectedExam={handleExamChange}
                selectedPaper={selectedPaper}
                setSelectedPaper={setSelectedPaper}
                customExamTabs={examOptions}
                customPapers={paperOptions}
                showSubjects={false}
                hideAll={true}
                className="bg-transparent border-none p-0 w-full"
              />
            </SectionReveal>
          )}

          {!isMobile && (
            <div className="w-fit max-w-full">
              <Tabs
                options={[
                  { id: 'today', label: 'Today' },
                  { id: '7d', label: 'Last 7 Days' },
                  { id: '30d', label: 'Last 30 Days' }
                ]}
                activeId={selectedTimeRange}
                variant="secondary"
                onChange={(val) => setSelectedTimeRange(val as TimeRange)}
              />
            </div>
          )}

          <Stack gap={isMobile ? 24 : 32} className="relative">
            {loading && !isInitialLoad && (
              <div className="absolute top-0 left-0 w-full h-1 z-50 overflow-hidden rounded-full">
                <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-full h-full bg-primary" />
              </div>
            )}

            {error ? (
              <div className="py-8">
                <ErrorState message={error} onRetry={() => loadLeaderboard(true)} />
              </div>
            ) : leaderboard.length === 0 && !loading ? (
              <div className="py-8">
                <EmptyState
                  icon="🏆"
                  title="No data found"
                  subtitle="Be the first to complete an attempt and secure your place on the leaderboard! Start your journey today."
                  actionLabel="Start Today's Exam"
                  onAction={() => navigate('/exams')}
                />
              </div>
            ) : (
              <Stack gap={isMobile ? 24 : 32}>
                {leaderboard[0] && (
                  <section className="flex justify-center">
                    <div className="w-full max-w-[400px] md:max-w-[500px] lg:max-w-[600px] bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-[24px] shadow-[0_20px_50px_rgba(184,134,11,0.2)] p-6 md:p-8 lg:p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[200px] md:min-h-[240px]">
                      <div className="absolute inset-0 bg-white/10 opacity-0 lg:group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-4 right-4 text-white/20">
                        <Trophy size={isMobile ? 60 : 80} strokeWidth={1} />
                      </div>
                      <span className="text-[10px] md:text-[11px] font-black text-white/60 uppercase tracking-[0.2em] mb-2">CURRENT LEADER</span>
                      <div className="text-[48px] md:text-[64px] font-black text-white italic leading-none mb-4 drop-shadow-2xl">#1</div>
                      <h3 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold text-white uppercase tracking-tight m-0 text-center truncate w-full px-4">{leaderboard[0].full_name}</h3>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-[11px] md:text-[12px] font-bold text-white/80">{leaderboard[0].score} PTS</span>
                        <span className="w-1 h-1 rounded-full bg-white/40" />
                        <span className="text-[11px] md:text-[12px] font-bold text-white/80">{leaderboard[0].accuracy}% ACC</span>
                      </div>
                    </div>
                  </section>
                )}

                <Card className="shadow-2xl overflow-hidden p-0 border-none">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-hover-bg/50 border-b border-border-subtle">
                          <th className="px-4 py-4 text-[11px] font-black text-text-secondary uppercase tracking-widest text-center w-16 md:w-24">Rank</th>
                          <th className="px-4 py-4 text-[11px] font-black text-text-secondary uppercase tracking-widest text-left">Student</th>
                          <th className="hidden sm:table-cell px-4 py-4 text-[11px] font-black text-text-secondary uppercase tracking-widest text-center w-24">Score</th>
                          <th className="hidden md:table-cell px-4 py-4 text-[11px] font-black text-text-secondary uppercase tracking-widest text-center w-32">Accuracy</th>
                          <th className="hidden lg:table-cell px-4 py-4 text-[11px] font-black text-text-secondary uppercase tracking-widest text-center w-24">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry) => (
                          <LeaderboardRow
                            key={entry.user_id}
                            entry={entry}
                            isMe={entry.user_id === user?.id}
                            isMobile={isMobile}
                            formatDuration={formatDurationMinutesSeconds}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </Stack>
            )}
          </Stack>

          {userRank && (
            <div className="sticky bottom-6 z-50"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <Card className="max-w-[1280px] mx-auto border-primary/30 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-center justify-between gap-4 backdrop-blur-md bg-card-bg/90">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary text-white flex flex-col items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                    <span className="text-[7px] md:text-[8px] font-bold uppercase opacity-60">RANK</span>
                    <span className="text-[16px] md:text-[18px] font-black leading-none">{userRank.rank}</span>
                  </div>
                  <div className="hidden xs:block">
                    <h4 className="text-[12px] md:text-[13px] font-bold text-text-primary uppercase m-0 leading-tight">Your Standing</h4>
                    <p className="text-[10px] md:text-[11px] text-text-secondary opacity-60 m-0 uppercase font-medium">Ranked #{userRank.rank} Overall</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:gap-8 lg:gap-12">
                  <MetricItem label="SCORE" value={userRank.score} />
                  <MetricItem label="ACCURACY" value={`${userRank.accuracy}%`} color="text-success" />
                  <MetricItem label="BEST TIME" value={formatDurationMinutesSeconds(userRank.duration_seconds)} className="hidden sm:flex" />
                </div>
              </Card>
            </div>
          )}
        </Stack>
    </PageContainer>
  );
}


function LeaderboardSkeleton() {
  return (
    <PageContainer>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSkeleton height={40} width={300} borderRadius={12} />
          <LoadingSkeleton height={40} width={200} borderRadius={12} />
          <LoadingSkeleton height={40} width={250} borderRadius={12} />
        </div>
        <div className="flex flex-col items-center space-y-6 pt-10">
          <LoadingSkeleton height={240} width="100%" className="max-w-[600px]" borderRadius={24} />
        </div>
        <Card className="p-0 border-none shadow-none">
          <GridSkeleton count={8} height={64} columns="grid-cols-1" />
        </Card>
      </div>
    </PageContainer>
  );
}
