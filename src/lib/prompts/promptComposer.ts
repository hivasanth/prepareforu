// Dynamic prompt composer for Admin Bulk Upload (Phases 7, 11, 12, 15).
//
//   composeBulkUploadPrompt(topicPrompt)
//     → topic-specific academic content
//       + the LIVE canonical output contract (exactly once)
//
// The stored topic prompt keeps ONLY topic-specific content (syllabus,
// coverage, distributions, visual opportunities) and, when applicable, the
// internal marker [PREPAREFORU_DYNAMIC_OUTPUT_CONTRACT]. All application-
// format guidance is generated HERE from the single source of truth
// (dynamicOutputContract.ts), so contract changes never require editing any
// topic prompt. The marker is replaced at runtime and therefore never reaches
// the AI model, the clipboard, or the on-screen instructions.

import {
  buildCanonicalOutputContract,
  CONTRACT_IDEMPOTENCY_RE,
} from './dynamicOutputContract'
import {
  ensureSingleContractMarker,
  sanitizeLegacyApplicationFormat,
} from './promptContentSanitizer'
import { DYNAMIC_OUTPUT_CONTRACT_MARKER } from './dynamicOutputContractMarker'

export { DYNAMIC_OUTPUT_CONTRACT_MARKER } from './dynamicOutputContractMarker'

const MARKER_RE = new RegExp(DYNAMIC_OUTPUT_CONTRACT_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')

export interface ComposedPrompt {
  text: string
  markerUsed: boolean
}

/** The current topic's canonical identity, injected by the caller. When the
 *  workspace is topic-scoped these are the LIVE exam_topics.topic_en/topic_te
 *  bytes — the exact values the STRICT REJECT service guards against. */
export interface TopicIdentity {
  topic_en: string
  topic_te?: string | null
}

function countMarkers(text: string): number {
  return (text.match(MARKER_RE) ?? []).length
}

/** §2/§3/§21/§22 — a TOPIC IDENTITY block naming the current topic's exact
 *  bytes, injected ahead of the canonical contract. Teaches that the topic
 *  fields identify the Topic GROUP (never a subtopic) and must stay
 *  byte-identical across the whole batch, plus the bilingual mandate that
 *  follows from whether the topic has a Telugu name. */
export function buildTopicIdentityBlock(topic: TopicIdentity): string {
  const te = topic.topic_te ?? null
  const bilingual = te !== null && te.trim() !== ''
  return [
    '## TOPIC IDENTITY',
    '',
    'Every question in this batch belongs to EXACTLY this topic group. The `topic_en`',
    'and `topic_te` fields are NOT free text and NOT a subtopic: they identify the',
    'selected Topic GROUP and MUST be byte-identical in every question object.',
    '',
    `topic_en = "${topic.topic_en}"`,
    bilingual
      ? `topic_te = "${te}"`
      : 'topic_te = null (this topic has no Telugu name)',
    '',
    'Copy these values VERBATIM into every question object. Never rename, shorten,',
    'paraphrase, translate or "correct" them. A question about a subtopic (for example',
    `the Indus Valley Civilization under "${topic.topic_en}") still carries the topic`,
    'group name in topic_en/topic_te.',
    '',
    bilingual
      ? 'This topic is bilingual: EVERY question MUST fill every Telugu field'
        + ' (question_text_te, option_a_te..option_d_te, explanation_te) — no null values.'
      : 'Because this topic has no Telugu name, Telugu content fields may be null or omitted.',
    '',
  ].join('\n')
}

/**
 * Compose a topic prompt into its final copy/display form: legacy fenced
 * format examples are stripped, the marker is replaced in place (or the
 * contract is appended when no marker exists), the current topic's identity
 * block is injected when the caller provides it, and the canonical contract is
 * present EXACTLY once. Idempotent: an already-composed prompt passes through
 * unchanged.
 */
export function composeBulkUploadPrompt(
  topicPrompt: string,
  topic?: TopicIdentity | null
): ComposedPrompt {
  if (CONTRACT_IDEMPOTENCY_RE.test(topicPrompt)) {
    return { text: topicPrompt, markerUsed: true }
  }

  const cleaned = sanitizeLegacyApplicationFormat(topicPrompt).replace(/\s+$/, '')
  const identity = topic ? `\n\n${buildTopicIdentityBlock(topic).replace(/\s+$/, '')}` : ''
  const contract = buildCanonicalOutputContract()

  if (countMarkers(cleaned) === 0) {
    return { text: `${cleaned}${identity}\n\n${contract}`, markerUsed: false }
  }

  const singleMarker = ensureSingleContractMarker(cleaned)
  const withoutMarker = singleMarker.replace(MARKER_RE, '').replace(/\s+$/, '')
  return { text: `${withoutMarker}${identity}\n\n${contract}`, markerUsed: true }
}

/**
 * Prepare a prompt for STORAGE: legacy fenced format examples are removed and
 * the internal marker is ensured exactly once, so the stored template stays a
 * clean topic-focused body that integrates with the dynamic contract at copy
 * time.
 */
export function ensureDynamicContractMarker(promptText: string): string {
  const cleaned = sanitizeLegacyApplicationFormat(promptText)
  return ensureSingleContractMarker(cleaned)
}