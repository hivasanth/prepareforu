import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import {
  EmptyState,
} from '../../components/common/SharedComponents'
import {
  SegmentedFilter,
  PageContainer,
  Stack,
  H2,
  Body,
  ErrorContainer,
  RetryButton,
} from '../../components/common/AntigravityUI'
import { UserSelectionTabs } from '../../components/user/UserSelectionTabs'
import { SectionReveal } from '../../components/common/AntigravityAnimation'
import { MOTION_DURATION } from '../../components/common/AntigravityMotion'
import { formatDurationMinutesSeconds } from '../../utils/timeUtils'
import {
  useUserLeaderboard,
  LeaderboardSkeleton,
  LeaderboardContentSkeleton,
  LeaderboardTopCard,
  LeaderboardTable,
  LeaderboardUserCard,
} from '../../components/user/leaderboard'
import type { TimeRange } from '../../components/user/leaderboard'

export default function UserLeaderboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { isXs, isSm } = useBreakpoint()
  const isMobile = isXs || isSm

  const {
    authLoading,
    isInitialLoad,
    isAppsc,
    hasExamSelection,
    leaderboard,
    userRank,
    loading,
    errorState,
    pageError,
    retryError,
    selectedExam,
    handleExamChange,
    selectedPaper,
    setSelectedPaper,
    selectedTimeRange,
    setSelectedTimeRange,
    examOptions,
    paperOptions,
  } = useUserLeaderboard()

  if (authLoading || isInitialLoad) {
    return <LeaderboardSkeleton showSelection={hasExamSelection} showPapers={isAppsc} />
  }

  if (!hasExamSelection) {
    return (
      <PageContainer>
        <Stack gap="lg">
          <div className="py-12">
            <EmptyState
              icon={<Trophy size={48} strokeWidth={1.5} />}
              title="Select your exam to view the leaderboard"
              subtitle="Choose your exam to unlock rankings and see how you compare with your peers."
              actionLabel="Choose Exam"
              onAction={() => navigate('/signup')}
            />
          </div>
        </Stack>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Stack gap="lg">
        {examOptions.length > 0 && (
          <SectionReveal className="w-full">
            <UserSelectionTabs
              selectedExam={selectedExam}
              setSelectedExam={handleExamChange}
              selectedPaper={selectedPaper}
              setSelectedPaper={setSelectedPaper}
              customExamTabs={examOptions}
              customPapers={paperOptions}
              showSubjects={false}
              hideAll
            />
          </SectionReveal>
        )}

        <div className="w-fit max-w-full">
          <SegmentedFilter
            ariaLabel="Leaderboard period"
            options={[
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' }
            ]}
            value={selectedTimeRange}
            onChange={(val) => setSelectedTimeRange(val as TimeRange)}
          />
        </div>

        <Stack gap={isMobile ? 24 : 32} className="relative">
          {loading && !isInitialLoad && (
            <div className="absolute top-0 left-0 w-full h-1 z-50 overflow-hidden rounded-full">
              <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: MOTION_DURATION.verySlow * 2, repeat: Infinity, ease: "linear" }} className="w-full h-full bg-primary" />
            </div>
          )}

          {errorState === 'error' && pageError ? (
            <div className="py-8">
              <ErrorContainer category={pageError.category} severity={pageError.severity}>
                <H2>{pageError.title}</H2>
                <Body>{pageError.message}</Body>
                {pageError.retryable && (
                  <RetryButton onRetry={retryError} />
                )}
              </ErrorContainer>
            </div>
          ) : loading && leaderboard.length === 0 ? (
            <LeaderboardContentSkeleton />
          ) : leaderboard.length === 0 && !loading ? (
            <div className="py-8">
              <EmptyState
                icon={<Trophy size={48} strokeWidth={1.5} />}
                title="No data found"
                subtitle="Be the first to complete an attempt and secure your place on the leaderboard! Start your journey today."
                actionLabel="Start Today's Exam"
                onAction={() => navigate('/exams')}
              />
            </div>
          ) : (
            <div role="region" aria-label="Leaderboard rankings" aria-live="polite">
              <Stack gap={isMobile ? 24 : 32}>
                {leaderboard[0] && <LeaderboardTopCard entry={leaderboard[0]} />}
                <LeaderboardTable
                  leaderboard={leaderboard}
                  userId={user?.id || ''}
                  isMobile={isMobile}
                  formatDuration={formatDurationMinutesSeconds}
                />
              </Stack>
            </div>
          )}
        </Stack>

        {userRank && <LeaderboardUserCard userRank={userRank} formatDuration={formatDurationMinutesSeconds} />}
      </Stack>
    </PageContainer>
  )
}
