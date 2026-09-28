import type { ExamTopicConfig } from '../../../../types/exam.types'

export type ConfigMode = 'exam' | '20' | '30' | '50'

/** Authoritative minimum per topic — mirrors the live RPC rule
 *  (`INVALID_THRESHOLD: required_questions must be >= 1`). */
export const TOPIC_MIN_REQUIRED = 1

/**
 * Deterministic even split of `total` across `topicCount` topics.
 * base = floor(total / n); the first `total % n` topics receive base + 1.
 * Example: 6 topics / 20 questions → [4, 4, 3, 3, 3, 3].
 */
export function computeEvenDistribution(topicCount: number, total: number): number[] {
  if (topicCount <= 0 || total <= 0) return []
  const base = Math.floor(total / topicCount)
  const remainder = total % topicCount
  return Array.from({ length: topicCount }, (_, i) => (i < remainder ? base + 1 : base))
}

/** Sum all topic thresholds for a given mode. */
export function getTopicThresholdSum(topics: ExamTopicConfig[], mode: ConfigMode): number {
  switch (mode) {
    case 'exam': return topics.reduce((sum, t) => sum + t.required_questions, 0)
    case '20': return topics.reduce((sum, t) => sum + t.test_20_required, 0)
    case '30': return topics.reduce((sum, t) => sum + t.test_30_required, 0)
    case '50': return topics.reduce((sum, t) => sum + t.test_50_required, 0)
  }
}

/** Get a single topic's threshold value for the given mode. */
export function getTopicThreshold(topic: ExamTopicConfig, mode: ConfigMode): number {
  switch (mode) {
    case 'exam': return topic.required_questions
    case '20': return topic.test_20_required
    case '30': return topic.test_30_required
    case '50': return topic.test_50_required
  }
}

/** Shared topic input className. */
export const TOPIC_INPUT_CLASS =
  'min-w-[72px] w-20 py-1 text-[12px] font-bold text-center flex-shrink-0'
