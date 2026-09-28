import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { BilingualToggle } from '../../common/BilingualToggle'
import { Button, Card, IconBadge, Label, Body, Stack, H2, Badge, ErrorContainer, RetryButton } from '../../common/AntigravityUI'
import { Skeleton } from '../../common/Skeleton'
import { EmptyState, GridSkeleton } from '../../common/SharedComponents'
import { TopicInfoButton } from '../../common/TopicInfoButton'
import type { ManualEntryTopic } from './useAdminUpload'

interface SubjectTopicsGridProps {
  topics: ManualEntryTopic[]
  loading: boolean
  error: string | null
  onRetry: () => void
  /** Card action label — identical card surface for every consuming flow. */
  actionLabel: string
  onTopicAction: (topic: ManualEntryTopic) => void
  /** LIVE per-topic question counts, keyed by the canonical topic name
   *  (topic_en) — the segment-unique key questions denormalize against. */
  topicCounts: Record<string, number>
  countsLoading: boolean
  /** H1 — a failed count surfaces as an error in the card, NEVER a fake 0. */
  countsError: string | null
  onRetryCounts: () => void
}

/* ── Topic workspace grid ─────────────────────────────────────────────────────
 * ONE reusable topic-card implementation shared by Manual Entry AND Bulk
 * Upload on /admin/upload. One card per LIVE topic of the selected subject.
 * Visual reference is the User Panel Topic Exams grid (TopicPortalView): same
 * Card variant ("premium-dark-neutral"), IconBadge, Body typography, grid
 * geometry, skeleton — with the action slot swapped per flow via actionLabel.
 *
 * Each card carries the LIVE per-topic question count from the single
 * topic_counts aggregate query (no N+1). Loading renders the count skeleton
 * bar; failure renders "Unable to load count" (never 0).
 *
 * ONE global language toggle (same component/pattern/placement as the
 * reference page) sits above the grid and drives DISPLAY only; each card
 * carries the shared TopicInfoButton which reveals the full LIVE topic name.
 * Neither control affects the saved topic identity (canonical id).
 * ────────────────────────────────────────────────────────────────────────── */
export function SubjectTopicsGrid({ topics, loading, error, onRetry, actionLabel, onTopicAction, topicCounts, countsLoading, countsError, onRetryCounts }: SubjectTopicsGridProps) {
  const [lang, setLang] = useState<'en' | 'te'>('en')

  const renderCount = (name_en: string) => {
    if (countsLoading) {
      // Decorative (aria-hidden): ONE live region below announces the count
      // load, so a grid of N cards never fires N simultaneous announcements.
      return (
        <div aria-hidden className="w-fit">
          <Skeleton variant="management" type="text" lines={1} width={172} height={14} borderRadius={9999} />
        </div>
      )
    }
    if (countsError) {
      return (
        <div className="flex items-center justify-between gap-2 w-full min-h-7">
          <Body secondary className="text-[11px] font-semibold leading-tight">Unable to load count</Body>
          <RetryButton onRetry={onRetryCounts} size="xs" />
        </div>
      )
    }
    return (
      <Badge variant="primary" className="text-[10px] py-0 px-2 w-fit">
        {topicCounts[name_en] ?? 0} Questions Available
      </Badge>
    )
  }

  return (
    <Stack gap="lg">
      <div className="flex justify-end">
        <div className="flex flex-col gap-2 min-w-[140px]">
          <Label className="uppercase font-bold tracking-widest text-[11px] text-text-muted">Language</Label>
          <BilingualToggle
            displayLang={lang}
            onChange={setLang}
          />
        </div>
      </div>

      <div>
        <Label className="uppercase font-bold tracking-widest text-[11px] text-text-muted block mb-4">Select Topic</Label>

        {/* No aria-live on the grid below: the topics role="status" region
            owns the load transition announcement, and language toggling is a
            display-only change that must not re-announce every card. */}
        {loading ? (
          <div role="status" aria-label="Loading topics" className="w-full">
            <GridSkeleton count={6} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" gap="gap-4" decorative />
          </div>
        ) : error ? (
          <ErrorContainer category="unknown" variant="inline">
            <H2>Could not load topics</H2>
            <Body>{error}</Body>
            <RetryButton onRetry={onRetry} />
          </ErrorContainer>
        ) : topics.length === 0 ? (
          <EmptyState title="No topics available" subtitle="This subject has no registered topics to upload into." />
        ) : (
          <>
            {/* ONE live region for the entire per-topic count load — never one
                per card (nested/parallel live regions double-fire). */}
            {countsLoading && (
              <div className="sr-only" role="status" aria-label="Loading topic question counts">Loading topic question counts</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map(t => {
              const hasTelugu = !!t.name_te;
              const displayTitle = (lang === 'te' && hasTelugu) ? t.name_te! : t.name_en;

              return (
                <Card key={t.id ?? t.name_en} variant="premium-dark-neutral" padding={20} className="relative text-left flex flex-col gap-4">
                  <div className="flex items-center justify-between w-full">
                    <IconBadge icon={BookOpen} size="xl" shape="rounded" className="rounded-button-md" />
                    <TopicInfoButton displayTitle={displayTitle} />
                  </div>
                  <div title={displayTitle} className="min-w-0">
                    <Body className="text-[14px] font-bold text-text-primary leading-tight break-words uppercase tracking-tight block w-full m-0">
                      {displayTitle}
                    </Body>
                  </div>
                  <div className="mt-auto flex flex-col gap-4">
                    {renderCount(t.name_en)}
                    <Button variant="primary" fullWidth onClick={() => onTopicAction(t)}>
                      {actionLabel}
                    </Button>
                  </div>
                </Card>
              );
            })}
            </div>
          </>
        )}
      </div>
    </Stack>
  )
}
