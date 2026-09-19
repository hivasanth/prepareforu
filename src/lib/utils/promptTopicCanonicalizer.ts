// Surgical output-schema topic canonicalizer for question-generation prompts.
//
// Authority chain (FINAL DATA ARCHITECTURE):
//   prompt_templates.topic_id → exam_topics.id → canonical topic_en/topic_te.
// This module rewrites ONLY the embedded output-schema example's topic_en /
// topic_te VALUES inside prompt_text. Every other byte — markdown, fences,
// indentation, comments, generation rules, visual metadata, prose — is
// preserved verbatim. It never regenerates or templates a prompt.

export interface CanonicalTopicNames {
  topic_en: string
  topic_te: string | null
}

export interface EmbeddedTopicNames {
  en: string | null
  te: string | null
}

/** Keys that identify the real output-schema example object (not prose mentions). */
const SCHEMA_INDICATORS = [
  '"question_text_en"',
  '"option_a_en"',
  '"visual_engine"',
  '"correct_option"',
  '"explanation_en"',
  '"difficulty"',
]

/** Matches a JSON string VALUE for a given key, tolerating any whitespace style. */
const keyValueRe = (key: string): RegExp => new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`)

/**
 * Locate every "topic_en" occurrence that belongs to an output-schema object.
 * A mention qualifies when a structural sibling key appears shortly after it,
 * which prose explanations / variable references never exhibit.
 */
function findSchemaTopicEnPositions(text: string): number[] {
  const positions: number[] = []
  const re = /"topic_en"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const lookahead = text.slice(m.index, m.index + 700)
    if (SCHEMA_INDICATORS.some(k => lookahead.includes(k))) {
      positions.push(m.index)
      re.lastIndex = m.index + '"topic_en"'.length
    }
  }
  return positions
}

function decodeJsonString(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`)
  } catch {
    return raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }
}

function encodeJsonString(value: string): string {
  return JSON.stringify(value).slice(1, -1)
}

interface RegionSpan {
  start: number
  end: number
  replacement: string | null // null → byte-identical, nothing to write
}

/**
 * Build the replacement span for one schema region: the exact original slice
 * covering `"topic_en": "<old>"` plus (when required) the adjacent
 * `"topic_te"` entry, rewritten with canonical values.
 */
function buildRegionSpan(text: string, position: number, canonical: CanonicalTopicNames): RegionSpan {
  const rest = text.slice(position)
  const enMatch = keyValueRe('topic_en').exec(rest)
  if (!enMatch) return { start: position, end: position, replacement: null }

  const absStart = position + enMatch.index
  const enSegment = enMatch[0]
  // Prefix = everything up to and including the OPENING quote of the value,
  // so the original key spelling and whitespace style survive verbatim.
  const colonIdx = enSegment.indexOf(':')
  const openQuoteIdx = enSegment.indexOf('"', colonIdx)
  const enPrefix = enSegment.slice(0, openQuoteIdx + 1)

  let replacement = enPrefix + encodeJsonString(canonical.topic_en) + '"'
  let endRel = enSegment.length

  if (canonical.topic_te != null) {
    // Same-object bound for topic_te: stop before any next "topic_en".
    const windowStart = enSegment.length
    const nextEnRel = rest.indexOf('"topic_en"', enMatch.index + '"topic_en"'.length)
    const ceilAbs = Math.min(nextEnRel === -1 ? Infinity : position + nextEnRel, absStart + 1600)
    const windowEnd = (ceilAbs === Infinity ? text.length : ceilAbs) - absStart
    const window = rest.slice(windowStart, Math.max(windowStart, windowEnd))
    const teMatch = keyValueRe('topic_te').exec(window)
    if (teMatch) {
      const teColonIdx = teMatch[0].indexOf(':')
      const teOpenQuoteIdx = teMatch[0].indexOf('"', teColonIdx)
      const betweenAndTePrefix = window.slice(0, teMatch.index) + teMatch[0].slice(0, teOpenQuoteIdx + 1)
      const encodedTe = encodeJsonString(canonical.topic_te)
      replacement += betweenAndTePrefix + encodedTe + '"'
      // Span runs to the CLOSING quote of the old TE value (teMatch[0] ends there).
      endRel = windowStart + teMatch.index + teMatch[0].length
    } else {
      // Key absent while canonical Telugu exists → minimal valid-JSON insert.
      replacement += `, "topic_te": "${encodeJsonString(canonical.topic_te)}"`
    }
  }
  // canonical.topic_te === null → any existing entry is left untouched (§7).
  return { start: absStart, end: absStart + endRel, replacement }
}

/** Extract the embedded output-schema topic names (first schema region wins). */
export function extractEmbeddedTopicNames(promptText: string): EmbeddedTopicNames {
  const positions = findSchemaTopicEnPositions(promptText)
  for (const pos of positions) {
    const m = keyValueRe('topic_en').exec(promptText.slice(pos))
    if (!m) continue
    const en = decodeJsonString(m[1])
    const after = promptText.slice(pos + m[0].length, pos + m[0].length + 1500)
    const nextEn = after.indexOf('"topic_en"')
    const window = nextEn === -1 ? after : after.slice(0, nextEn)
    const teM = keyValueRe('topic_te').exec(window)
    return { en, te: teM ? decodeJsonString(teM[1]) : null }
  }
  return { en: null, te: null }
}

/**
 * Rewrite EVERY output-schema region so its topic_en/topic_te equal the
 * canonical LIVE exam_topics record. Returns the new text plus how many
 * regions actually changed bytes.
 */
export function canonicalizePromptTopics(
  promptText: string,
  canonical: CanonicalTopicNames
): { text: string; changedRegions: number } {
  const positions = findSchemaTopicEnPositions(promptText)
  if (positions.length === 0) return { text: promptText, changedRegions: 0 }

  const spans = positions
    .map(p => buildRegionSpan(promptText, p, canonical))
    .filter((s): s is RegionSpan & { replacement: string } => s.replacement !== null)

  let changed = 0
  // Apply right-to-left so earlier offsets stay valid.
  let result = promptText
  for (let i = spans.length - 1; i >= 0; i--) {
    const s = spans[i]
    const original = promptText.slice(s.start, s.end)
    if (original !== s.replacement) changed++
    result = result.slice(0, s.start) + s.replacement + result.slice(s.end)
  }
  return { text: result, changedRegions: changed }
}
