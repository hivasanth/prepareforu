// Conservative cleanup of LEGACY application-format guidance inside stored
// Admin Bulk Upload prompts.
//
// Safety contract (Phases 13 & 23 — never silently change academic content):
//   - Only fenced JSON example blocks, empty `visual_engine` placeholders, and
//     obsolete application-format PROSE lines are ever removed. Syllabus,
//     coverage, distributions, rules, and academic prose are preserved.
//   - A fenced JSON block is removed ONLY when it demonstrably teaches an
//     application-format structure that the modern production parser no longer
//     wants taught (legacy visual_engine / render_type / bilingual-visual
//     objects / old `question`+`options`+`correct` aliases).
//   - A prose LINE is removed ONLY when it references a legacy structural field
//     name (visual_engine / render_type / headers_en / rows_en / title_en /
//     title_te) or a renderer-era `metadata` checklist phrase. The canonical
//     contract (appended by the composer) supersedes every such instruction.
//     Word `diagram(s)` is reworded to `visual(s)` — the same meaning, none of
//     the legacy shape terminology.
//   - The dynamic-output authority banner in composeBulkUploadPrompt overrides
//     any residual legacy prose, so prompts whose format sections are mere text
//     (not fenced examples) still behave correctly.
//
// This module MUST stay dependency-free (plus the pure marker constant): the
// offline DB-migration generator (scripts/generate_prompt_dynamic_contract_migration.ts)
// imports it directly under Node's built-in type-stripping — no zod, no React,
// no bundler, no local imports.

/** Internal integration marker — single definition. Also re-exported by
 *  dynamicOutputContractMarker.ts for the application bundle. */
export const DYNAMIC_OUTPUT_CONTRACT_MARKER = '[PREPAREFORU_DYNAMIC_OUTPUT_CONTRACT]'

/** Bilingual VISUAL keys that are legacy-only (never appear in the canonical
 *  visual contract, whose keys are `title`, `data`, and per-type data fields). */
const BILINGUAL_VISUAL_KEY_RE = /"(?:title|headers|rows)_(?:en|te)"/

/** Unsupported visual type overrides — the canonical type enum lives in
 *  src/types/exam.types → SUPPORTED_VISUAL_TYPES. Only `marker` (a stale map
 *  example) is hard-coded here; it is not in the supported set. */
const UNSUPPORTED_VISUAL_TYPE_RE = /"type"\s*:\s*"marker"/

/** Old alias dialect: `question` + `options` + `correct` (pre-canonical keys). */
const LEGACY_ALIAS_KEYS_RE = /"options"|"correct"\s*:|"question"\s*:/

/** String-form `"metadata": "<embedded payload>"` inside a fenced example. The
 *  canonical contract has no `metadata` key at all; a string value that embeds
 *  markup/base64 is an app-format payload (never academic content). A plain
 *  academic string value is deliberately left for the prose-level rules. */
const LEGACY_METADATA_STRING_RE = /"metadata"\s*:\s*"<(?:svg|html)|"metadata"\s*:\s*"data:image/i

/**
 * Decide whether a fenced JSON example block teaches legacy / unwanted
 * application-format structure. Content-only JSON (syllabus data, reference
 * tables) is never flagged.
 */
export function isLegacyJsonFenceBody(body: string): boolean {
  if (!/{|\[/.test(body.trimStart()[0] ?? '')) return false
  if (body.includes('"visual_engine"')) return true
  if (body.includes('"render_type"')) return true
  if (UNSUPPORTED_VISUAL_TYPE_RE.test(body)) return true
  if (BILINGUAL_VISUAL_KEY_RE.test(body)) return true
  if (LEGACY_ALIAS_KEYS_RE.test(body)) return true
  if (LEGACY_METADATA_STRING_RE.test(body)) return true
  return false
}

// A fence OPEN sits alone on its line (` ``` ` or ` ```json ` with an optional
// legacy `id` attribute); a fence CLOSE is a bare ` ``` ` at end-of-line. The
// closer must not match an opener line: ` ```json ` etc. must never be consumed
// as the close of a previous fence (which mis-pairs consecutive blocks and
// lets a whole legacy fence fall through the net).
const FENCE_OPEN_RE = /```(?:json[^\r\n]*)?[ \t]*\r?\n([\s\S]*?)\r?\n```(?!\S)/g

/**
 * Remove every fenced JSON code block that teaches legacy application-format
 * structure. Non-legacy fences (including canonical examples that a topic
 * prompt already embeds) are left untouched.
 */
export function stripLegacyJsonFences(text: string): string {
  return text.replace(FENCE_OPEN_RE, (match, body: string) => {
    return isLegacyJsonFenceBody(body) ? '' : match
  })
}

const EMPTY_VISUAL_ENGINE_RE = /"visual_engine"\s*:\s*\{\s*\}/g

/**
 * Remove empty `"visual_engine": {}` placeholder entries (unparseable and
 * taught only by pre-canonical prompts).
 */
export function stripEmptyVisualEnginePlaceholders(text: string): string {
  return text.replace(EMPTY_VISUAL_ENGINE_RE, '')
}

/** Legacy structural field names that NEVER appear in academic prose — a line
 *  containing one is obsolete application-format instruction and is dropped. */
const LEGACY_STRUCTURAL_LINE_TOKENS = [
  'visual_engine',
  'render_type',
  'headers_en',
  'rows_en',
  'title_en',
  'title_te',
]

/** Renderer-era `metadata` phrases (checklists / instructions). Bare academic
 *  uses of "metadata" (e.g. inscription metadata) are NEVER pruned. */
const METADATA_RENDERER_LINE_RE = /metadata/i
const METADATA_RENDERER_CONTEXT_RE = /complete|missing|structured\s+json|renderer|generate\s+only|visual\s+metadata|JSON\s+Metadata|educational\s+metadata|✓|✔|✗|[•*]\s*metadata/i

/** Legacy JSON Output objects carry a `"metadata"` key that the canonical
 *  contract no longer has. Its (leaf) objects are relic application-format
 *  duplication, never academic content. */
const METADATA_JSON_OBJECT_RE = /"metadata"\s*:\s*\{[^{}]*\}/gs

/** Legacy shape word → canonical term (semantic-preserving reword). Covers the
 *  standalone words (case-preserving) and legacy snake_case render-type
 *  compounds such as `process_diagram`. */
const LEGACY_SHAPE_WORD_RE = /\b(Diagrams|diagrams|Diagram|diagram|DIAGRAMS|DIAGRAM)\b|_diagram(s)?\b/g

/**
 * Scrub obsolete application-format PROSE (the fenced-example sanitizer above
 * only removes fenced JSON blocks). Legacy instruction/checklist lines that
 * name visual_engine / render_type / the bilingual visual keys / renderer
 * `metadata` are dropped — the canonical contract appended at compose time
 * supersedes them. The word `diagram(s)` is reworded to `visual(s)` so the
 * topic's visual-opportunity language survives with none of the legacy shape
 * vocabulary. Academic content bytes are otherwise preserved.
 */
export function scrubLegacyProseReferences(text: string): string {
  const kept = text.split('\n').filter(raw => {
    const line = raw.trim()
    if (LEGACY_STRUCTURAL_LINE_TOKENS.some(tok => line.includes(tok))) return false
    if (METADATA_RENDERER_LINE_RE.test(line) && METADATA_RENDERER_CONTEXT_RE.test(line)) return false
    return true
  })
  return kept
    .join('\n')
    .replace(METADATA_JSON_OBJECT_RE, '')
    .replace(LEGACY_SHAPE_WORD_RE, word => {
      if (word === 'Diagrams') return 'Visuals'
      if (word === 'diagrams') return 'visuals'
      if (word === '_diagram') return '_visual'
      if (word === '_diagrams') return '_visuals'
      if (word === 'Diagram' || word === 'DIAGRAM') return 'Visual'
      if (word === 'DIAGRAMS') return 'Visuals'
      return 'visual'
    })
}

/**
 * The one sanitizer used both at runtime (composeBulkUploadPrompt) and by the
 * DB-migration generator: strips fenced legacy examples + empty placeholders +
 * obsolete format-prose lines. Academic content is never touched.
 */
export function sanitizeLegacyApplicationFormat(text: string): string {
  return scrubLegacyProseReferences(stripEmptyVisualEnginePlaceholders(stripLegacyJsonFences(text)))
}

/** Every top-level candidate for a "format section" header that the generator
 *  additionally prunes from the 33 KNOWN prompt bodies. Keep in sync with
 *  scripts/generate_prompt_dynamic_contract_migration.ts. */
export const KNOWN_FORMAT_SECTION_HEADERS = [
  '# FINAL OUTPUT FORMAT',
  '# OUTPUT JSON STRUCTURE',
  '# JSON OUTPUT STRUCTURE',
  '# SUPPORTED VISUAL TYPES',
  '# VISUAL QUALITY EXAMPLES',
  '# VISUAL GENERATION REQUIREMENT',
] as const

/**
 * Remove a whole top-level section whose header is a KNOWN legacy format
 * header, ending at the next `# `-header or a `---` divider. OPT-IN: used only
 * by the DB-migration generator for prompt bodies whose exact text ships in
 * the repository (never by the runtime composer, which must stay safe for
 * unknown live bodies).
 */
export function stripKnownFormatSections(text: string): string {
  let out = text
  for (const header of KNOWN_FORMAT_SECTION_HEADERS) {
    const re = new RegExp(
      `^${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?((?=^# )|(?=^---)|\\z)`,
      'gm'
    )
    out = out.replace(re, '')
  }
  return out
}

const MARKER_LITERAL_RE = new RegExp(DYNAMIC_OUTPUT_CONTRACT_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')

/** Ensure the stored template carries EXACTLY ONE dynamic contract marker.
 *  Absent → append at the end; multiple → collapse to one (last surviving). */
export function ensureSingleContractMarker(text: string): string {
  const count = (text.match(MARKER_LITERAL_RE) ?? []).length
  if (count === 0) return `${text.replace(/\s+$/, '')}\n\n${DYNAMIC_OUTPUT_CONTRACT_MARKER}`
  if (count === 1) return text
  const without = text.replace(MARKER_LITERAL_RE, '').replace(/\s+/g, ' ').trim()
  return `${without}\n\n${DYNAMIC_OUTPUT_CONTRACT_MARKER}`
}