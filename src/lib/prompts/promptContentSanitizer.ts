// Conservative cleanup of LEGACY and GENERIC application-format guidance inside
// stored Admin Bulk Upload prompts.
//
// Safety contract (Phases 13, 23, 26 — never silently change academic content):
//   - Only fenced JSON example blocks, empty `visual_engine` placeholders,
//     obsolete application-format PROSE lines, and provably GENERIC duplicated
//     application-level visual teaching are ever removed. Syllabus, coverage,
//     distributions, rules, visual opportunities and academic prose are
//     preserved.
//   - A fenced JSON block is removed ONLY when it demonstrably teaches an
//     application-format structure that the modern production parser no longer
//     wants taught (legacy visual_engine / render_type / bilingual-visual
//     objects / old `question`+`options`+`correct` aliases).
//   - A prose LINE is removed ONLY when it references a legacy structural field
//     name (visual_engine / render_type / headers_en / rows_en / title_en /
//     title_te) or a renderer-era `metadata` checklist phrase. The canonical
//     contract (appended by the composer) supersedes every such instruction.
//     Word `diagram(s)` is reworded to `visual(s)` — the same meaning, none of
//     the legacy shape terminology. The dynamic-output authority banner in
//     composeBulkUploadPrompt overrides any residual legacy prose, so prompts
//     whose format sections are mere text (not fenced examples) still behave
//     correctly.
//   - stripGenericVisualTeaching removes only the GENERIC application-level
//     visual scaffolding (quality checklists, GOOD/BAD exemplars, supported
//     type enums, generation/coverage/engine rules). Every MIXED section is
//     refactored, never deleted: the topic-specific portion is retained under
//     a descriptive heading, and a section containing ZERO generic lines
//     passes through verbatim (heading included).
//
// This module MUST stay dependency-free (plus the pure marker constant): the
// offline DB-migration generators (scripts/generate_prompt_full_normalization_migration.ts
// and scripts/generate_prompt_generic_visual_removal_migration.ts) import it
// directly under Node's built-in type-stripping — no zod, no React, no bundler,
// no local imports.

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

/** A legacy VISUAL WRAPPER: a top-level `"visual": {` JSON fragment (the
 *  pre-canonical envelope that wraps a bilingual headers/rows table, e.g.
 *  `"visual": { "metadata": { "headers_te": [...], "rows_te": [...] } }`).
 *  Any such fragment is application-format teaching, never academic content —
 *  its fence must be stripped even when the body does not open with `{`/`[`. */
const LEGACY_VISUAL_WRAPPER_RE = /^\s*"visual"\s*:\s*[{[]/m

/**
 * Decide whether a fenced JSON example block teaches legacy / unwanted
 * application-format structure. Content-only JSON (syllabus data, reference
 * tables) is never flagged.
 *
 * The first JSON-ish character is `{`, `[` or `"` — a legacy body may also be
 * a JSON FRAGMENT (e.g. `"visual": {...}`) that does not open with `{`/`[`, and
 * such fragments must still be evaluated against the structural indicators
 * below. Plain prose blocks (never JSON-ish) are never flagged.
 */
export function isLegacyJsonFenceBody(body: string): boolean {
  const first = body.trimStart()[0] ?? ''
  if (first !== '{' && first !== '[' && first !== '"') return false
  if (LEGACY_VISUAL_WRAPPER_RE.test(body)) return true
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

// ---------------------------------------------------------------------------
// PHASE 2 — GENERIC (APPLICATION-LEVEL) VISUAL TEACHING STRIP
//
// The dynamic output contract (appended at compose time) is the single
// canonical home of generic visual teaching: GOOD/BAD exemplars, the
// supported-type enum, generation/coverage rules, engine rules and the visual
// quality checklist. The heading families below duplicate that teaching across
// the topic bodies with varying specificity. Classification (locked off-DB
// against the 171-body corpus):
//
//   * GENERIC_QUALITY heads (`# VISUAL QUALITY RULES`, GOOD/BAD VISUAL
//     EXAMPLES) -> REMOVE the whole section. The contract owns exactly one copy.
//   * MIXED heads (`# SUPPORTED VISUAL TYPES`, `# VISUAL GENERATION
//     REQUIREMENT`, `VISUAL ENGINE RULES`) -> REFACTOR: strip the generic
//     application lines and keep the topic-specific portion (visual
//     opportunities, coverage targets, per-topic usage guidance) under a
//     descriptive heading.
//   * TOPIC_SPECIFIC sections (e.g. the "Visual Mandatory" Data-Interpretation
//     topic's `# VISUAL GENERATION REQUIREMENT (MANDATORY)`, which contains
//     ZERO generic lines) -> preserved verbatim, heading included.
//
// A section is refactored ONLY when at least one line is provably generic;
// otherwise it passes through untouched. OPT-IN generator-only helper (like
// stripLegacyVisualQualitySection): used by the Phase-2 migration generator
// for the stored bodies. Never called by the runtime composer, which must stay
// safe for unknown live bodies.
// ---------------------------------------------------------------------------

const GENERIC_VISUAL_REMOVE_HEADS = new Set([
  '# VISUAL QUALITY RULES',
  '# GOOD VISUAL EXAMPLES',
  '# GOOD VISUAL EXAMPLE',
  '# BAD VISUAL EXAMPLES',
  '# BAD VISUAL EXAMPLE',
  '# ✅ GOOD VISUAL EXAMPLES',
  '# ✅ GOOD VISUAL EXAMPLE',
  '# ❌ BAD VISUAL EXAMPLES',
  '# ❌ BAD VISUAL EXAMPLE',
  '# PROMPT METADATA',
  '# PROMPT METADATA (LEGACY)',
  '# PROMPT METADATA (RENDERER)',
])

/** `# (🖼|⚙️) VISUAL ENGINE RULES[(MANDATORY)]` — including the body-68
 *  `# VISUAL ENGINE REQUIREMENT` variant. Classified per-section by content. */
const ENGINE_HEAD_RE =
  /^#\s+(?:[🖼⚙]\uFE0F?\s*)?VISUAL ENGINE (?:RULES|REQUIREMENT)(?:\s*\(MANDATORY\))?\s*$/u

/** `# VISUAL GENERATION REQUIREMENT` and its bespoke `(MANDATORY)` variant.
 *  Both go through the same content rule, so a fully topic-specific body
 *  (the Data-Interpretation "Visual Mandatory" prompt) survives verbatim. */
const GENERATION_HEAD_RE = /^#\s+VISUAL GENERATION REQUIREMENT(?:\s*\(MANDATORY\))?\s*$/u

const SUPPORTED_TYPES_HEAD_RE = /^#\s+SUPPORTED VISUAL TYPES\s*$/u

const VISUAL_COVERAGE_HEADING = '# VISUAL COVERAGE TARGET'
const VISUAL_USAGE_HEADING = '# VISUAL USAGE GUIDANCE FOR THIS TOPIC'
const VISUAL_OPPORTUNITIES_HEADING = '# VISUAL OPPORTUNITIES FOR THIS TOPIC'

/** Provably generic application-line rejects (anchored, case-insensitive).
 *  A topic line names topic content and almost never starts with these; each
 *  rule is deliberately narrow. Bullets and `## `-sub-headings are evaluated
 *  against their own narrower sets below, and `---` dividers are never
 *  consumed by these rules. */
const GENERIC_LINE_REJECT: RegExp[] = [
  /^the ai must intelligently (?:determine|decide) whether a visual (?:is required|is necessary|is needed)(?: for each question)?\.?$/i,
  /^only (?:one|a single) visual is (?:permitted|allowed) per question\.?$/i,
  /^maintain approximately:\s*$/i,
  /^target visual usage:\s*$/i,
  /^the remaining questions\b/i,
  /^a visual should be generated (?:\*\*)?only when it significantly improves (?:comprehension|understanding|conceptual understanding)(?:\*\*)?\.?$/i,
  /^the objective of visuals is/i,
  /^generate a visual (?:only|only when|only if|only once|once|when|if)\b/i,
  /^if (?:a|no) visual (?:is not required|is unnecessary|is necessary|is required)\b/i,
  /^do \*\*?not\*\*? (?:generate|include)/i,
  /^and do \*\*?not\*\*? include the field/i,
  /^never generate/i,
  /^-\s*never generate/i,
  /^క్రింది వాటిని/i,
  /^ఈ విధంగా/i,
  /^a visual must never/i,
  /^visuals must be/i,
  /^do not\s+(?:force|use|include) visuals?\.?$/i,
  /^the visual (?:must|should) (?:be|provide|include)/i,
  /^the (?:information|correct answer) required/i,
  /^for almost every question generate:\s*$/i,
  /^generate(?: a visual)?:\s*$/i,
  /^add extra metadata(?: or database fields)?\.?$/i,
  /^do \*\*?not\*\*? (?:add|include) extra metadata(?: or database fields)?\.?$/i,
]

/** Bullet lines that are generic (coverage remainder + legacy renderer bans).
 *  All OTHER bullets (topic visual opportunities / usage lists) are kept. */
const GENERIC_BULLET_REJECT: RegExp[] = [
  /^(?:[*•-]\s*)?remaining questions\b/i,
  /^\*\s*(?:images|urls|svg|html|css|base64 ?images?|screenshots)\s*$/i,
  /^add extra metadata(?: or database fields)?\.?$/i,
  /^do \*\*?not\*\*? (?:add|include) extra metadata(?: or database fields)?\.?$/i,
]

/** Banners that introduce KEPT topic bullets (never rejected even though they
 *  start like a generic trigger). */
const ENGINE_BANNER_KEEP = /^generate a visual ONLY if it genuinely helps (?:explain|represent)/i
const ENGINE_USAGE_KEEP = /^use visuals (?:\*\*)?(?:only for|for|only when)/i
const ENGINE_SUITABLE_KEEP = /^suitable visual questions include:/i

const CHART_TYPE_INTRO_RE = /^(?:supported|allowed|accepted) chart types?:?\s*$/i
const CHART_TYPE_FENCE_BODY_RE = /^"chartType"\s*:\s*"[a-z_]+"$/i
const EXAMPLE_STUB_RE = /^example:?\s*$/i

function isChartNameBullet(raw: string): boolean {
  return /^[*•-]\s*(?:bar|pie|line|area|donut|scatter|histogram|column|stacked)(?:\s+(?:charts?|graphs?))?\s*$/i.test(raw.trim())
}

/** The top-level section span starting at `lines[start]` (its heading line)
 *  through just before the next `# ` heading (or EOF). */
export function sectionSpan(start: number, lines: string[]): { body: string[]; end: number } {
  const body: string[] = []
  let i = start
  for (; i < lines.length; i++) {
    if (i > start && /^#\s/.test(lines[i]!.trim())) break
    body.push(lines[i]!)
  }
  return { body, end: i }
}

/** True when a section line (or bullet) is provably generic application-format
 *  visual teaching — the canonical contract owns the rule it states. Markdown
 *  emphasis is normalized out first so `**NOT**`/`**only**` spellings do not
 *  bypass the rejects. Bullet lines additionally fall through to the line
 *  rejects on their de-bulleted core, so legacy renderer-ban lists such as
 *  `- Never generate image URLs.` and `- If no visual is required, always
 *  return:` classify as generic too. Export: the migration generator re-uses
 *  this classifier to prove no MIXED engine section survives verbatim. */
export function isGenericVisualLine(raw: string, kind: 'engine' | 'generation'): boolean {
  const t = raw.trim()
  if (!t || /^#{2,3}\s/.test(t) || /^---$/.test(t)) return false
  const nt = t.replace(/\*\*|__/g, '')
  if (/^(?:[*•-])\s/.test(nt)) {
    const core = nt.replace(/^[*•-]\s+/, '')
    if (GENERIC_BULLET_REJECT.some(re => re.test(nt) || re.test(core))) return true
    return GENERIC_LINE_REJECT.some(re => re.test(core))
  }
  if (kind === 'engine') {
    if (ENGINE_BANNER_KEEP.test(nt) || ENGINE_USAGE_KEEP.test(nt) || ENGINE_SUITABLE_KEEP.test(nt)) return false
  }
  return GENERIC_LINE_REJECT.some(re => re.test(nt))
}

/** Coverage-target sections carry a literal percentage (e.g. the
 *  "Approximately **10%–20%** of the 50 questions…" family). */
function hasCoveragePercent(lines: string[]): boolean {
  return lines.some(l => /\d{1,3}(?:%|–\s*\d{1,3}%)/.test(l))
}

/** Emit the retained body of a renamed `# SUPPORTED VISUAL TYPES` section:
 *  empty `Example` placeholder stubs, `Supported chart type:` intros and their
 *  `"chartType":"…"` JSON fences, plus any chart-name bullet list that follows
 *  such an intro, are pruned. All topic content (per-type `Use for` bullets,
 *  `###` sub-headings, per-type question guidance) survives. */
function appendSupportedVisualSection(rest: string[], out: string[]): void {
  let pendingIntro: string | null = null
  let afterChartIntro = false
  let i = 0
  while (i < rest.length) {
    const raw = rest[i]!
    const t = raw.trim()

    if (afterChartIntro && isChartNameBullet(t)) {
      i++
      continue
    }
    afterChartIntro = false

    if (EXAMPLE_STUB_RE.test(t)) {
      i++
      continue
    }

    if (pendingIntro !== null) {
      if (t === '') {
        i++
        continue
      }
      if (/^```/.test(t)) {
        let j = i + 1
        while (j < rest.length && !/^```/.test(rest[j]!.trim())) j++
        const interior = rest.slice(i + 1, j).map(l => l.trim())
        const isChartType = interior.length === 1 && CHART_TYPE_FENCE_BODY_RE.test(interior[0]!)
        if (j < rest.length && isChartType) {
          afterChartIntro = true
          i = j + 1
          pendingIntro = null
          continue
        }
        out.push(pendingIntro)
        pendingIntro = null
      } else {
        out.push(pendingIntro)
        pendingIntro = null
      }
    }

    if (CHART_TYPE_INTRO_RE.test(t)) {
      pendingIntro = raw
      afterChartIntro = true
      i++
      continue
    }

    out.push(raw)
    i++
  }
  if (pendingIntro !== null) out.push(pendingIntro)
}

/** Collapse runs of 2+ blank lines to a single blank line (idempotent). */
function collapseBlankRuns(lines: string[]): string[] {
  const out: string[] = []
  let prevBlank = false
  for (const line of lines) {
    const blank = line.trim() === ''
    if (blank && prevBlank) continue
    out.push(line)
    prevBlank = blank
  }
  return out
}

/**
 * Remove / refactor the GENERIC (application-level) visual teaching that
 * duplicates the dynamic output contract, keeping every byte of topic-specific
 * visual guidance:
 *   * `# VISUAL QUALITY RULES` and the GOOD/BAD VISUAL EXAMPLE(S) sections are
 *     removed wholesale — the contract owns that teaching exactly once.
 *   * `# SUPPORTED VISUAL TYPES` is renamed `# VISUAL OPPORTUNITIES FOR THIS
 *     TOPIC` with its empty `Example` stubs, `Supported chart type:` intros and
 *     `"chartType":"…"` JSON fences pruned (the type enum lives in the
 *     contract); every per-type `Use for` opportunity survives.
 *   * `# VISUAL GENERATION REQUIREMENT` bodies are refactored into
 *     `# VISUAL COVERAGE TARGET` (generic opener/objective/one-visual/remainder
 *     lines dropped; coverage target + topic "understanding of …" + "correspond
 *     exactly to …" sentences retained). A body with ZERO generic lines (the
 *     bespoke `(MANDATORY)` Data-Interpretation section) passes through
 *     verbatim.
 *   * `VISUAL ENGINE RULES` / `VISUAL ENGINE REQUIREMENT` sections are
 *     classified per-content: pure legacy renderer bans and pure generic prose
 *     are removed; MIXED sections keep their topic bullet lists / "does not
 *     require visuals" judgments under `# VISUAL USAGE GUIDANCE FOR THIS
 *     TOPIC` (or `# VISUAL COVERAGE TARGET` when a literal percentage target is
 *     the retained content).
 *
 * Preserved verbatim (never matched): `# VISUAL OPPORTUNITY MATRIX`, the
 * VISUAL DECISION RULES/RULE/FRAMEWORK families, `# MAP USAGE RULES`,
 * `# CURRENT AFFAIRS VALIDATION RULE`, `# VISUAL SUITABILITY ANALYSIS`, and all
 * success/final-validation topic checklists.
 *
 * OPT-IN generator-only: used by the Phase-2 migration generator for the
 * stored bodies. Never called by the runtime composer, which must stay safe
 * for unknown live bodies. Idempotent.
 */
export function stripGenericVisualTeaching(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!
    const t = raw.trim()

    if (GENERIC_VISUAL_REMOVE_HEADS.has(t)) {
      const { end } = sectionSpan(i, lines)
      i = end - 1
      continue
    }

    if (SUPPORTED_TYPES_HEAD_RE.test(t)) {
      const { body, end } = sectionSpan(i, lines)
      out.push(VISUAL_OPPORTUNITIES_HEADING)
      appendSupportedVisualSection(body.slice(1), out)
      i = end - 1
      continue
    }

    if (GENERATION_HEAD_RE.test(t) || ENGINE_HEAD_RE.test(t)) {
      const kind: 'engine' | 'generation' = GENERATION_HEAD_RE.test(t) ? 'generation' : 'engine'
      const { body, end } = sectionSpan(i, lines)
      const rest = body.slice(1)
      const kept: string[] = []
      let genericFound = false
      for (const line of rest) {
        if (isGenericVisualLine(line, kind)) genericFound = true
        else kept.push(line)
      }
      if (!genericFound) {
        out.push(body[0]!, ...rest)
      } else if (kept.some(l => l.trim() !== '')) {
        const heading = kind === 'generation' || hasCoveragePercent(kept)
          ? VISUAL_COVERAGE_HEADING
          : VISUAL_USAGE_HEADING
        out.push(heading, ...kept)
      }
      i = end - 1
      continue
    }

    if (!isGenericVisualLine(raw, 'generation')) out.push(raw)
  }
  return collapseBlankRuns(out)
    .join('\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n+$/, '\n')
}

const MARKER_LITERAL_RE = new RegExp(DYNAMIC_OUTPUT_CONTRACT_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')

/** Template sub-headings that belong inside the legacy duplicated
 *  `# VISUAL QUALITY EXAMPLES` section: per-type GOOD/BAD guidance plus the
 *  closing `# VISUAL VALIDATION` checklist. Any OTHER top-level heading found
 *  inside the span is treated as topic-specific content and preserved. */
const VISUAL_QUALITY_SECTION_PART_HEADERS = new Set([
  '# TABLE',
  '# MAP OVERLAY',
  '# MERMAID',
  '# CHART',
  '# SVG',
  '# LATEX',
  '# GEOMETRY',
  '# GRAPH',
  '# TIMELINE',
  '# VENN Visual',
  '# Visual',
  '# FLOWCHART',
  '# VISUAL VALIDATION',
])

const VISUAL_QUALITY_OPEN_HEADER = '# VISUAL QUALITY EXAMPLES'

/**
 * Remove the legacy duplicated `# VISUAL QUALITY EXAMPLES` section (header,
 * intro prose, per-type GOOD/BAD guidance and the closing `# VISUAL
 * VALIDATION` checklist) from a stored topic body, so the composed prompt
 * contains the visual-quality teaching EXACTLY ONCE (the canonical copy in the
 * dynamic output contract).
 *
 * The whole contiguous span `[header .. last visual-quality sub-section]` is
 * dropped. Topic-specific top-level sections that sit INSIDE the span (e.g. a
 * topic's own validation rule placed between the per-type guidance and the
 * checklist) are preserved; when that happens, the trailing standalone
 * `# VISUAL VALIDATION` block is still removed alongside the span. Non-header
 * prose and sub-headings (`##`, `###`) under a section part are consumed with
 * it. OPT-IN: used only by the DB-migration generator for repo-shipped bodies
 * (never by the runtime composer, which must stay safe for unknown live bodies).
 */
export function stripLegacyVisualQualitySection(text: string): string {
  const lines = text.split('\n')
  const open = lines.findIndex(line => line.trim() === VISUAL_QUALITY_OPEN_HEADER)
  if (open < 0) return text

  let end = lines.length
  for (let j = open + 1; j < lines.length; j++) {
    const t = lines[j].trim()
    if (/^#\s/.test(t) && !VISUAL_QUALITY_SECTION_PART_HEADERS.has(t)) {
      end = j
      break
    }
  }

  let kept = lines.slice(0, open).concat(lines.slice(end))
  const validationConsumed = lines.slice(open, end).some(line => line.trim() === '# VISUAL VALIDATION')
  if (!validationConsumed) {
    const vv = kept.findIndex(line => line.trim() === '# VISUAL VALIDATION')
    if (vv >= 0) {
      let vvEnd = kept.length
      for (let j = vv + 1; j < kept.length; j++) {
        if (/^#\s/.test(kept[j].trim())) {
          vvEnd = j
          break
        }
        vvEnd = j + 1
      }
      kept = kept.slice(0, vv).concat(kept.slice(vvEnd))
    }
  }

  return kept.join('\n')
}

/** Ensure the stored template carries EXACTLY ONE dynamic contract marker.
 *  Absent → append at the end; multiple → collapse to one (last surviving). */
export function ensureSingleContractMarker(text: string): string {
  const count = (text.match(MARKER_LITERAL_RE) ?? []).length
  if (count === 0) return `${text.replace(/\s+$/, '')}\n\n${DYNAMIC_OUTPUT_CONTRACT_MARKER}`
  if (count === 1) return text
  const without = text.replace(MARKER_LITERAL_RE, '').replace(/\s+/g, ' ').trim()
  return `${without}\n\n${DYNAMIC_OUTPUT_CONTRACT_MARKER}`
}

/** A top-level `# heading` in a stored body. Sub-headings (`## X`, `### X`) are
 *  body content, exactly like the OFF-DB estimator that builds the cross-topic
 *  removal keys (scripts/generate_prompt_full_normalization_migration.ts); they
 *  never start a new removable span. */
const TOP_LEVEL_HEADING_RE = /^(#\s+.+)$/

/** Collapse a section's content to one neutral key: body lines joined, every
 *  whitespace run → one space, trimmed. The HEADING line is excluded — a "##"
 *  sub-heading inside the body is ordinary content. This MUST match the
 *  estimator's keying exactly, or a removal key would never match its body. */
export function normalizeSectionContentKey(bodyLines: string[]): string {
  return bodyLines.join('\n').replace(/\s+/g, ' ').trim()
}

/** Split a stored body into its top-level sections: [heading, ...bodyLines]
 *  per `# ` heading. Lines before the first heading (the preamble) are dropped
 *  from the section list and preserved verbatim by the remover. */
export function splitTopLevelSections(text: string): string[][] {
  const sections: string[][] = []
  let cur: string[] | null = null
  for (const line of text.split('\n')) {
    if (TOP_LEVEL_HEADING_RE.exec(line.trim())) {
      if (cur) sections.push(cur)
      cur = [line]
    } else if (cur) {
      cur.push(line)
    }
  }
  if (cur) sections.push(cur)
  return sections
}

/**
 * Remove every non-first top-level section whose normalized CONTENT key (the
 * classifier's `norm(sec.text)` — heading excluded, whitespace-collapsed) is
 * in `removalContentKeys`. The body's FIRST `# ` section is never removed, so a
 * topic's leading identity/objective block always survives; preamble lines
 * before the first heading are preserved verbatim.
 *
 * OPT-IN generator-only helper: used by the DB-migration generator after the
 * cross-topic duplicated generic sections (output/option/quality/visual
 * scaffolds shared byte-identical across many topic bodies) have been
 * classified OFF-DB against the full 171-body corpus. Never called by the
 * runtime composer, which must stay safe for unknown live bodies.
 */
export function stripCrossTopicGenericSections(
  text: string,
  removalContentKeys: ReadonlySet<string>
): string {
  if (removalContentKeys.size === 0) return text
  const lines = text.split('\n')
  const kept: string[] = []
  let cur: string[] | null = null
  let firstSection = true
  for (const line of lines) {
    if (TOP_LEVEL_HEADING_RE.exec(line.trim())) {
      if (cur) {
        const key = normalizeSectionContentKey(cur.slice(1))
        if (firstSection || !removalContentKeys.has(key)) kept.push(...cur)
      }
      cur = [line]
      firstSection = false
    } else if (cur) {
      cur.push(line)
    } else {
      kept.push(line)
    }
  }
  if (cur) {
    const key = normalizeSectionContentKey(cur.slice(1))
    if (firstSection || !removalContentKeys.has(key)) kept.push(...cur)
  }
  return kept.join('\n')
}