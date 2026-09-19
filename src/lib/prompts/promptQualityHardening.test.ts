import { describe, it, expect } from 'vitest'
import { composeBulkUploadPrompt } from './promptComposer'
import { buildCanonicalOutputContract, buildCanonicalQuestionExample, buildVisualExample, buildAllVisualExamples, QUESTION_OUTPUT_CONTRACT_VERSION } from './dynamicOutputContract'
import { BulkQuestionSchema } from '../../validations/questionSchema'
import { QuestionVisualSchema } from '../../validations/questionVisualSchemas'
import { normalizeVisualInput } from '../../services/questions/visualNormalizer'
import { DYNAMIC_OUTPUT_CONTRACT_MARKER } from './dynamicOutputContractMarker'

// ─── Prompt quality + dynamic contract hardening (task §42) ────────────────────
// Representative legacy input for the single most important category: Ancient
// Indian History, carrying syllabus, a legacy fenced engine, a visual-opportunity
// matrix, and percentage distributions.
const ANCIENT_INDIAN_HISTORY_PROMPT = `# Prompt (pre-canonical template) - Ancient Indian History
# ROLE
You are an expert competitive examination question paper setter for APPSC, UPSC and Banking.
# OBJECTIVE
Generate exactly 50 high-quality MCQs covering: Indus Valley Civilization; Vedic Age;
Jainism and Buddhism; the Mahajanapadas; the Mauryan and Gupta empires; the Sangam Age.
# VISUAL OPPORTUNITIES
Use archaeological site maps, empire extent maps, trade-route maps, comparison tables,
administrative hierarchies and chronology tables where they genuinely aid reasoning.
# OUTPUT JSON STRUCTURE
\`\`\`json
{ "topic_en": "Ancient Indian History", "topic_te": "ప్రాచీన భారతదేశ చరిత్ర",
  "visual_engine": { "render_type": "table", "title": "Sites", "headers_en": ["Site","Feature"], "rows_en": [["Lothal","Dockyard"]] } }
\`\`\`
# DISTRIBUTION
Easy 30%, Medium 50%, Hard 20%.
# QUALITY
Questions must be reasoning-based and must never reveal the answer in the options.`

const ANCIENT_TOPIC = { topic_en: 'Ancient Indian History', topic_te: 'ప్రాచీన భారతదేశ చరిత్ర' }

function extractContract(text: string): string {
  const idx = text.indexOf('CANONICAL OUTPUT CONTRACT v')
  return text.slice(idx)
}

// §13 — the guarded legacy tokens. The FINAL COMPOSED PROMPT (topic body +
// TOPIC IDENTITY + contract) must contain NONE of these. Parser-tole values
// like metadata/headers_en/rows_en still live in the normalizer + schemas
// where they are intentionally handled — those files are NOT scanned.
const FINAL_COMPOSED_PROMPT_FORBIDDEN_TOKENS = [
  'visual_engine',
  'render_type',
  'headers_en',
  'rows_en',
  'title_en',
  'title_te',
  'metadata',
  'diagram',
]

describe('Anciently Indian History prompt — hardened composition', () => {
  it('preserves every academic byte and removes only legacy format fences', () => {
    const out = composeBulkUploadPrompt(ANCIENT_INDIAN_HISTORY_PROMPT, ANCIENT_TOPIC).text
    for (const line of [
      'Generate exactly 50 high-quality MCQs covering: Indus Valley Civilization; Vedic Age;',
      'the Mauryan and Gupta empires; the Sangam Age.',
      'archaeological site maps, empire extent maps, trade-route maps, comparison tables,',
      'Easy 30%, Medium 50%, Hard 20%.',
      'Questions must be reasoning-based and must never reveal the answer in the options.',
    ]) {
      expect(out, `academic content must survive: ${line}`).toContain(line)
    }
    for (const token of ['visual_engine', 'render_type', '"headers_en"', '"rows_en"']) {
      expect(out, `legacy token "${token}" must be absent`).not.toContain(token)
    }
  })

  it('emits the exact live topic identity and ONE versioned contract', () => {
    const out = composeBulkUploadPrompt(ANCIENT_INDIAN_HISTORY_PROMPT, ANCIENT_TOPIC).text
    expect(out).toContain('## TOPIC IDENTITY')
    expect(out).toContain('topic_en = "Ancient Indian History"')
    expect(out).toContain('topic_te = "ప్రాచీన భారతదేశ చరిత్ర"')
    expect((out.match(/CANONICAL OUTPUT CONTRACT v/g) ?? []).length).toBe(1)
    expect(out).toContain(`v${QUESTION_OUTPUT_CONTRACT_VERSION}`)
    expect(out).not.toContain(DYNAMIC_OUTPUT_CONTRACT_MARKER)
  })

  it('forces bilingual completeness and immutable topic identity at the contract level', () => {
    const contract = extractContract(buildCanonicalOutputContract())
    expect(contract).toContain('no null Telugu values')
    expect(contract).toContain('Topic GROUP, never a subtopic')
    expect(contract).toContain('byte-identical across the entire batch')
    expect(contract).toContain('EXACTLY the number of questions the topic instructions specify')
    expect(contract).toContain('INTEGER counts that sum to the required total')
    expect(contract).toContain('internal concept ledger')
  })
})

describe('hardened VISUAL CONTRACT teaching (§9–§16, §33, §35–§38)', () => {
  const contract = extractContract(buildCanonicalOutputContract())

  it('teaches the necessity gate (remove test / answer-leak test / interpretation test)', () => {
    expect(contract).toContain('VISUAL USE — NECESSITY GATE')
    expect(contract).toContain('REMOVE TEST')
    expect(contract).toContain('ANSWER-LEAK TEST')
    expect(contract).toContain('INTERPRETATION TEST')
    expect(contract).toContain('set visual = null')
  })

  it('outlaws decorative visuals and direct-answer visuals', () => {
    expect(contract).toContain('A decorative visual is never acceptable.')
    expect(contract).toContain('directly display the answer')
    expect(contract).toContain('the answer is never a chart label read directly')
  })

  it('requires that the candidate interpret the visual to solve', () => {
    expect(contract).toContain('inspect, compare, calculate, infer,')
    expect(contract).toContain('the candidate infers the')
    expect(contract).toContain('historical/geographic interpretation from the distribution')
  })

  it('forbids the "visual shows the answer" explanation and demands the reasoning', () => {
    expect(contract).toContain('Never write "the visual shows the answer"')
    expect(contract).toContain('explain the comparison, calculation or inference instead')
  })

  it('forbids forcing svg/latex/geometry/venn and allows zero visuals', () => {
    expect(contract).toContain('do NOT force svg, latex, geometry or venn')
    expect(contract).toContain('A high-quality question without a visual beats a forced visual question.')
  })

  it('teaches NO legacy visual tokens', () => {
    for (const token of ['visual_engine', 'render_type', '"type": "marker"', '"title_en"', '"headers_en"', '"rows_en"']) {
      expect(contract, `forbidden token "${token}"`).not.toContain(token)
    }
  })

  it('FINAL COMPOSED PROMPT teaches ONLY canonical output — no legacy tokens anywhere', () => {
    const out = composeBulkUploadPrompt(ANCIENT_INDIAN_HISTORY_PROMPT, ANCIENT_TOPIC).text
    for (const token of FINAL_COMPOSED_PROMPT_FORBIDDEN_TOKENS) {
      expect(out, `legacy token "${token}" must not appear in the final composed prompt`).not.toContain(token)
    }
  })
})

describe('representative AI-output validation through the REAL parser (§42)', () => {
  const TOPIC = ANCIENT_TOPIC

  it('every canonical visual example passes the REAL QuestionVisualSchema + normalizeVisualInput + BulkQuestionSchema', () => {
    for (const example of buildAllVisualExamples()) {
      const schema = QuestionVisualSchema.safeParse(example)
      expect(schema.success, `${example.type}: ${JSON.stringify(schema.success ? '' : schema.error.issues)}`).toBe(true)
      const normalized = normalizeVisualInput(example)
      expect(normalized).not.toBeNull()
      const question = buildCanonicalQuestionExample(TOPIC.topic_en, TOPIC.topic_te, example)
      const r = BulkQuestionSchema.safeParse(question)
      expect(r.success, `${example.type}: ${r.success ? '' : JSON.stringify(r.error.issues)}`).toBe(true)
    }
  })

  it('the chart example teaches EXACTLY ONE authoritative chart structure', () => {
    const chart = buildVisualExample('chart')
    expect(chart).toEqual({
      type: 'chart',
      title: 'Example',
      data: {
        chartType: 'bar',
        labels: ['2019', '2020', '2021'],
        data: [120, 180, 145],
      },
    })
    // No alternative representation keys are taught (datasets, x_axis, colors,
    // y_axis, yAxisLabel, series are all absent from the taught example).
    expect(QuestionVisualSchema.parse(chart).data).toEqual({
      chartType: 'bar',
      labels: ['2019', '2020', '2021'],
      data: [120, 180, 145],
    })
  })

  it('the bilingual mandate names the full APPSC field set with no null Telugu values', () => {
    const contract = extractContract(buildCanonicalOutputContract())
    for (const field of [
      'topic_en', 'topic_te',
      'question_text_en', 'question_text_te',
      'option_a_en', 'option_a_te',
      'option_b_en', 'option_b_te',
      'option_c_en', 'option_c_te',
      'option_d_en', 'option_d_te',
      'explanation_en', 'explanation_te',
    ]) {
      expect(contract, `bilingual field ${field} must be taught`).toContain(field)
    }
    expect(contract).toContain('no null Telugu values')
  })

  it.each([
    ['question with no visual', null],
    ['table reasoning question', buildVisualExample('table')],
    ['chart calculation question', buildVisualExample('chart')],
    ['map inference question', buildVisualExample('map_overlay')],
    ['mermaid hierarchy reasoning question', buildVisualExample('mermaid')],
    ['geometry reasoning question', buildVisualExample('geometry')],
    ['venn reasoning question', buildVisualExample('venn')],
    ['latex formula question', buildVisualExample('latex')],
    ['svg spatial question', buildVisualExample('svg')],
  ] as const)('%s passes BulkQuestionSchema', (_label, visual) => {
    const question = buildCanonicalQuestionExample(TOPIC.topic_en, TOPIC.topic_te, visual as never)
    if (question.visual) {
      expect(() => normalizeVisualInput(question.visual)).not.toThrow()
    }
    const r = BulkQuestionSchema.safeParse(question)
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
    /**
     * Structural pass is the parser's documented boundary: the parser stays
     * structural-only (BU-10). SEMANTIC quality — "is this visual necessary,
     * non-decorative, reasoning-requiring, answer-safe?" — is enforced by the
     * contract teaching above and asserted in the previous describe block.
     */
  })

  it('chronology question (taught as a table — no unsupported timeline structure) parses', () => {
    const question = buildCanonicalQuestionExample(TOPIC.topic_en, TOPIC.topic_te, {
      type: 'table',
      title: 'Chronology',
      data: {
        headers: ['Event', 'Period'],
        rows: [
          ['Indus Valley Civilization', 'c. 2600–1900 BCE'],
          ['Buddha', '6th century BCE'],
          ['Ashoka', '3rd century BCE'],
          ['Gupta Empire', '4th–6th century CE'],
        ],
      },
    })
    expect(() => normalizeVisualInput(question.visual)).not.toThrow()
    const r = BulkQuestionSchema.safeParse(question)
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
  })

  it('a fully bilingual payload carries every Telugu field (mandate target state)', () => {
    const question = buildCanonicalQuestionExample(
      TOPIC.topic_en,
      TOPIC.topic_te,
      { type: 'table', title: 'Sangam Age', data: { headers: ['Kingdom', 'Region'], rows: [['Chera', 'Tamil Nadu'], ['Pandya', 'Tamil Nadu']] } }
    )
    for (const key of ['topic_te', 'question_text_te', 'option_a_te', 'option_b_te', 'option_c_te', 'option_d_te', 'explanation_te']) {
      expect(typeof question[key], `${key} must be filled for a bilingual topic`).toBe('string')
    }
    const r = BulkQuestionSchema.safeParse(question)
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
  })

  it('the direct-answer visual is rejected by the ANSWER-LEAK teaching, not silently validated', () => {
    const contract = extractContract(buildCanonicalOutputContract())
    // A "Top 5 Population Countries" ranked list whose question asks for the
    // rank is the canonical bad example — the teaching below is what stops it.
    expect(contract).toContain('list whose question asks for the rank')
    // The parser itself is structural-only by design (it WELCOMES legacy shapes
    // too), so the semantic gate lives in the prompt contract — documented.
  })
})