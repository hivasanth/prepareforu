import { describe, it, expect } from 'vitest'
import { normalizeVisualInput, hasCanonicalVisual, VisualNormalizationError } from './visualNormalizer'
import { SingleQuestionSchema, BulkQuestionSchema } from '../../validations/questionSchema'

const baseQuestion = {
  question_text_en: 'Match the following Harappan sites.',
  option_a_en: 'Mohenjo-daro',
  option_b_en: 'Kalibangan',
  option_c_en: 'Chanhudaro',
  option_d_en: 'Surkotada',
  correct_option: 'B' as const,
  exam_id: 'APPSC_GROUP_1',
  paper_id: '926c7d30-add2-4d03-a040-f011e9282562',
  subject_name: 'History and Culture',
}

describe('visual normalizer — legacy visual_engine input', () => {
  it('normalizes legacy table format to canonical storage shape', () => {
    const out = normalizeVisualInput({
      visual_engine: {
        render_type: 'table',
        metadata: {
          headers: ['Year', 'Amendment'],
          rows: [['1976', '42nd']],
        },
      },
    })
    expect(out).toEqual({
      type: 'table',
      title: null,
      data: { headers: ['Year', 'Amendment'], rows: [['1976', '42nd']] },
    })
  })

  it('normalizes a bare legacy engine object (no wrapper key)', () => {
    const out = normalizeVisualInput({ render_type: 'venn', metadata: { setA: 'Aryans', setB: 'Dravidians' } })
    expect(out?.type).toBe('venn')
    expect(out?.data).toEqual({ setA: 'Aryans', setB: 'Dravidians' })
    expect(out?.title).toBeNull()
  })

  it('normalizes legacy mermaid format', () => {
    const out = normalizeVisualInput({
      visual_engine: { render_type: 'mermaid', metadata: { code: 'graph TD; A-->B;' } },
    })
    expect(out).toEqual({ type: 'mermaid', title: null, data: { code: 'graph TD; A-->B;' } })
  })

  it('accepts the prompt shape: metadata.definition maps to canonical code', () => {
    const out = normalizeVisualInput({
      visual_engine: {
        render_type: 'mermaid',
        metadata: {
          chart_type: 'flowchart',
          definition: 'graph TD;\n  Raya["Raya (Ruler)"] -->|Grants Amaram| Nayaka["Nayaka"];',
        },
      },
    })
    expect(out).toEqual({
      type: 'mermaid',
      title: null,
      data: { code: 'graph TD;\n  Raya["Raya (Ruler)"] -->|Grants Amaram| Nayaka["Nayaka"];' },
    })
  })

  it('preserves mermaid source verbatim, including inner quotes', () => {
    const source = 'graph LR; X[["X (Ruler)"]] --> Y;'
    const out = normalizeVisualInput({ render_type: 'mermaid', metadata: { definition: source } })
    expect(out?.data).toEqual({ code: source })
  })

  it('prefers metadata.code over metadata.definition for mermaid', () => {
    const out = normalizeVisualInput({ render_type: 'mermaid', metadata: { definition: 'ignored', code: 'graph TD; A-->B;' } })
    expect(out?.data).toEqual({ code: 'graph TD; A-->B;' })
  })

  it('rejects a non-string mermaid definition', () => {
    expect(() =>
      normalizeVisualInput({ render_type: 'mermaid', metadata: { definition: ['graph TD;', 'A-->B;'] } })
    ).toThrow()
  })

  it('normalizes a prompt-shaped mermaid row through BulkQuestionSchema', () => {
    const out = BulkQuestionSchema.safeParse({
      question_text_en: 'Arrange the Delhi Sultanate dynasties chronologically.',
      option_a_en: 'Option A',
      option_b_en: 'Option B',
      option_c_en: 'Option C',
      option_d_en: 'Option D',
      correct_option: 'A',
      visual_engine: {
        render_type: 'mermaid',
        metadata: { chart_type: 'flowchart', definition: 'graph TD; Raya --> Nayaka;' },
      },
    })
    expect(out.success).toBe(true)
    if (out.success) {
      expect(out.data.visual).toEqual({ type: 'mermaid', title: null, data: { code: 'graph TD; Raya --> Nayaka;' } })
    }
  })

  it('extracts title from engine or metadata level', () => {
    const out = normalizeVisualInput({
      render_type: 'table',
      title: 'Dynasties',
      metadata: { headers: ['Ruler'], rows: [['Krishnadevaraya']] },
    })
    expect(out?.title).toBe('Dynasties')
  })

  it('uses metadata.data as canonical data when present', () => {
    const out = normalizeVisualInput({
      render_type: 'table',
      metadata: { title: 'T', data: { headers: ['H'], rows: [] } },
    })
    expect(out?.data).toEqual({ headers: ['H'], rows: [] })
  })
})

describe('visual normalizer — canonical input', () => {
  it('keeps canonical visuals unchanged and defaults title to null', () => {
    const canonical = { type: 'table', data: { headers: ['A'], rows: [['1']] } }
    expect(normalizeVisualInput(canonical)).toEqual({ type: 'table', title: null, data: { headers: ['A'], rows: [['1']] } })
  })

  it('returns null for null/undefined', () => {
    expect(normalizeVisualInput(null)).toBeNull()
    expect(normalizeVisualInput(undefined)).toBeNull()
  })
})

describe('visual normalizer — rejections', () => {
  it('rejects unsupported render types', () => {
    expect(() => normalizeVisualInput({ render_type: 'three_d_scene', metadata: {} })).toThrow(VisualNormalizationError)
  })

  it('rejects malformed table data', () => {
    expect(() =>
      normalizeVisualInput({ type: 'table', data: { headers: [], rows: [[]] } })
    ).toThrow()
    expect(() =>
      normalizeVisualInput({ type: 'table', data: { headers: ['H'] } })
    ).toThrow()
  })

  it('rejects oversized payloads', () => {
    const big = { type: 'mermaid', data: { code: 'graph TD;\n' + 'A-->B;\n'.repeat(60_000) } }
    expect(() => normalizeVisualInput(big)).toThrow(/maximum size|exceeds/i)
  })

  it('rejects excessive mermaid source length', () => {
    const longCode = 'x'.repeat(50_001)
    expect(() => normalizeVisualInput({ type: 'mermaid', data: { code: longCode } })).toThrow()
  })

  it('rejects oversized svg payloads at the schema layer', () => {
    const hugeSvg = '<svg>' + '<rect/>'.repeat(30_000) + '</svg>'
    expect(() => normalizeVisualInput({ type: 'svg', data: { svg_content: hugeSvg } })).toThrow()
  })

  it('rejects non-object input', () => {
    expect(() => normalizeVisualInput('table')).toThrow(VisualNormalizationError)
    expect(() => normalizeVisualInput(42)).toThrow(VisualNormalizationError)
  })

  it('rejects unknown top-level shapes', () => {
    expect(() => normalizeVisualInput({ foo: 'bar' })).toThrow(VisualNormalizationError)
  })
})

describe('visual normalizer — canonical AI visual_engine contract (AI prompt is the input contract)', () => {
  it('accepts the EXACT AI prompt shape: render_type + title + top-level headers/rows', () => {
    const out = normalizeVisualInput({
      render_type: 'table',
      title: 'Seating Arrangement',
      headers: ['Position', 'Person'],
      rows: [['1', 'A'], ['2', 'B'], ['3', 'C']],
    })
    expect(out).toEqual({
      type: 'table',
      title: 'Seating Arrangement',
      data: { headers: ['Position', 'Person'], rows: [['1', 'A'], ['2', 'B'], ['3', 'C']] },
    })
  })

  it('normalizes the AI shape carried inside a visual_engine field', () => {
    const out = normalizeVisualInput({
      visual_engine: {
        render_type: 'table',
        title: 'Rulers',
        headers: ['Ruler', 'Period'],
        rows: [['Krishnadevaraya', '1509-1529']],
      },
    })
    expect(out?.type).toBe('table')
    expect(out?.title).toBe('Rulers')
    expect(out?.data).toEqual({ headers: ['Ruler', 'Period'], rows: [['Krishnadevaraya', '1509-1529']] })
  })

  it('accepts AI chart shape with top-level data/labels', () => {
    const out = normalizeVisualInput({
      render_type: 'chart',
      chartType: 'bar',
      labels: ['1976', '1992'],
      data: [42, 73],
    })
    expect(out?.type).toBe('chart')
    expect(out?.data).toMatchObject({ labels: ['1976', '1992'], data: [42, 73], chartType: 'bar' })
  })

  it('accepts AI mermaid shape with top-level code', () => {
    const out = normalizeVisualInput({ render_type: 'mermaid', title: 'Flow', code: 'graph TD; A-->B;' })
    expect(out).toEqual({ type: 'mermaid', title: 'Flow', data: { code: 'graph TD; A-->B;' } })
  })

  it('accepts the AI table shape through BulkQuestionSchema unchanged', () => {
    const r = BulkQuestionSchema.safeParse({
      topic_en: 'Modern Andhra History',
      question_text_en: 'Which Kakatiya ruler built the fort of Warangal?',
      option_a_en: 'Prola II',
      option_b_en: 'Ganapathi Deva',
      option_c_en: 'Rudrama Devi',
      option_d_en: 'Prataparudra II',
      correct_option: 'B',
      difficulty: 'medium',
      visual_engine: {
        render_type: 'table',
        title: 'Kings',
        headers: ['King', 'Contribution'],
        rows: [['Ganapathi Deva', 'Fort of Warangal']],
      },
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.visual).toEqual({
        type: 'table',
        title: 'Kings',
        data: { headers: ['King', 'Contribution'], rows: [['Ganapathi Deva', 'Fort of Warangal']] },
      })
    }
  })

  it('questions without visual_engine remain valid (optional visual)', () => {
    const r = BulkQuestionSchema.safeParse({
      question_text_en: 'Q?',
      option_a_en: 'A',
      option_b_en: 'B',
      option_c_en: 'C',
      option_d_en: 'D',
      correct_option: 'A',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.visual).toBeNull()
  })

  it('still rejects AI shapes whose render_type is unsupported', () => {
    expect(() => normalizeVisualInput({ render_type: 'three_d_scene', title: 'T', headers: [], rows: [] })).toThrow(VisualNormalizationError)
  })

  it('still rejects a bare AI table shape with missing required table data', () => {
    expect(() => normalizeVisualInput({ render_type: 'table', title: 'T' })).toThrow()
  })
})

describe('question schema hardening', () => {
  it('negative_marks below zero is rejected', () => {
    const r = SingleQuestionSchema.safeParse({ ...baseQuestion, negative_marks: -1 })
    expect(r.success).toBe(false)
  })

  it('negative_marks above numeric(4,2) capacity is rejected', () => {
    expect(SingleQuestionSchema.safeParse({ ...baseQuestion, negative_marks: 100 }).success).toBe(false)
    expect(SingleQuestionSchema.safeParse({ ...baseQuestion, negative_marks: 99.99 }).success).toBe(true)
    expect(SingleQuestionSchema.safeParse(baseQuestion).success).toBe(true)
  })

  it('invalid visual data is rejected by the single-question schema', () => {
    const r = SingleQuestionSchema.safeParse({ ...baseQuestion, visual: { type: 'hologram', data: {} } })
    expect(r.success).toBe(false)
  })
})

describe('bilingual visual text (English / Telugu) in ONE canonical visual', () => {
  const telugu = (s: string): boolean => /[\u0C00-\u0C7F]/.test(s)

  const BILINGUAL_VISUALS: Record<string, unknown>[] = [
    {
      type: 'table', title: 'Major Rivers / ప్రధాన నదులు',
      data: { headers: ['River / నది', 'Length (km) / పొడవు (కి.మీ)'], rows: [['Godavari / గోదావరి', 1465]] },
    },
    {
      type: 'mermaid', title: 'Parliament Structure / పార్లమెంటు నిర్మాణం',
      data: { code: 'graph TD; A[Lok Sabha / లోక్ సభ] --> B;' },
    },
    {
      type: 'latex', title: 'Quadratic Formula / ద్విఘాత సూత్రం',
      data: { expression: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
    },
    {
      type: 'svg', title: 'River Course / నది మార్గం',
      data: { svg_content: '<svg xmlns="http://www.w3.org/2000/svg"><text x="1" y="1">River / నది</text></svg>' },
    },
    {
      type: 'geometry', title: 'Triangle / త్రిభుజం',
      data: { shape: 'triangle', labels: { ab: 'Side AB / భుజం AB', bc: 'Side BC / భుజం BC', angleA: 'Angle A / కోణం A' } },
    },
    {
      type: 'venn', title: 'Classification / వర్గీకరణ',
      data: { setA: 'Plants / మొక్కలు', setB: 'Animals / జంతువులు', intersection: 'Both / రెండూ' },
    },
    {
      type: 'chart', title: 'Crop Production / పంట ఉత్పత్తి',
      data: { chartType: 'bar', labels: ['2019', '2020', '2021'], series: [{ name: 'Rice / బియ్యం', value: [120, 180, 145] }] },
    },
    {
      type: 'map_overlay', title: 'Empire Extent / సామ్రాజ్య విస్తీర్ణం',
      data: { center: { lat: 17.385, lng: 78.4867 }, zoom: 7, overlays: [{ lat: 17.385, lng: 78.4867, label: 'Amaravati / అమరావతి', color: '#e31b23' }] },
    },
  ]

  it('every supported visual type ships as ONE canonical visual with preserved bilingual text', () => {
    for (const visual of BILINGUAL_VISUALS) {
      const v = visual as { type: string; title: string }
      const normalized = normalizeVisualInput(visual)
      expect(normalized, `${v.type} must normalize`).not.toBeNull()
      expect(normalized!.title).toBe(v.title)
      const flat = JSON.stringify(normalized)
      expect(flat, `${v.type} must carry the " / " separator`).toContain(' / ')
      expect(telugu(flat), `${v.type} must carry Telugu script`).toBe(true)
      // Language-bearing keys only — never language-suffixed siblings.
      expect(flat).not.toContain('visual_en')
      expect(flat).not.toContain('visual_te')
      expect(flat).not.toContain('title_te')
    }
  })

  it('all 8 bilingual visuals survive BulkQuestionSchema with numerics intact', () => {
    for (const visual of BILINGUAL_VISUALS) {
      const r = BulkQuestionSchema.safeParse({
        topic_en: 'Modern Andhra History',
        question_text_en: 'Reason from the visual.',
        option_a_en: 'A', option_b_en: 'B', option_c_en: 'C', option_d_en: 'D',
        correct_option: 'A',
        difficulty: 'medium',
        visual,
      })
      expect(r.success, JSON.stringify(r.error?.issues ?? '')).toBe(true)
      if (!r.success) continue
      const v = r.data.visual!
      if (v.type === 'map_overlay') {
        expect(v.data.center?.lat).toBe(17.385)
        expect(v.data.overlays?.[0]?.label).toBe('Amaravati / అమరావతి')
      }
      if (v.type === 'chart') {
        expect(Array.isArray(v.data.series)).toBe(true)
        expect(JSON.stringify(v.data.series)).toContain('Rice / బియ్యం')
      }
      if (v.type === 'table') {
        expect(v.data.rows[0][1]).toBe(1465)
        expect(v.data.headers[0]).toBe('River / నది')
      }
      expect(JSON.stringify(v)).toContain(' / ')
    }
  })

  it('all 8 bilingual visuals pass the DB write schema (SingleQuestionSchema)', () => {
    for (const visual of BILINGUAL_VISUALS) {
      const r = SingleQuestionSchema.safeParse({ ...baseQuestion, visual })
      expect(r.success, `${(visual as { type: string }).type}: ${JSON.stringify(r.error?.issues ?? '')}`).toBe(true)
    }
  })

  it('rejects a visual SPLIT across language-specific keys (no visual_en / visual_te)', () => {
    expect(() =>
      normalizeVisualInput({ visual_en: { type: 'table', data: { headers: ['H'], rows: [['1']] } } })
    ).toThrow(VisualNormalizationError)
    // BulkQuestionSchema applies normalizeVisualInput inside its transform, so a
    // split-key visual must be rejected on the way to the DB — never stored.
    expect(() =>
      BulkQuestionSchema.safeParse({
        question_text_en: 'Q?', option_a_en: 'A', option_b_en: 'B', option_c_en: 'C', option_d_en: 'D',
        correct_option: 'A',
        visual: { visual_en: { type: 'table' } },
      })
    ).toThrow()
  })

  it('keeps Telugu and separators byte-exact through normalize + parse (no transliteration, no splits)', () => {
    const source = {
      type: 'table',
      title: 'Revenue Officers / రెవెన్యూ అధికారులు',
      data: { headers: ['Officer / అధికారి', 'Role / పాత్ర'], rows: [['Tahsildar / తహసీల్దార్', 'Land revenue / భూమి రాబడి']] },
    }
    const normalized = normalizeVisualInput(source)
    expect(normalized!.title).toBe('Revenue Officers / రెవెన్యూ అధికారులు')
    const data = normalized!.data as { headers: string[]; rows: (string | number)[][] }
    expect(data.headers[0]).toBe('Officer / అధికారి')
    expect(data.rows[0][0]).toBe('Tahsildar / తహసీల్దార్')
    expect(JSON.stringify(normalized)).toBe(JSON.stringify({ ...source, title: source.title }))
  })
})

describe('hasCanonicalVisual — the shared Visuals-filter predicate', () => {
  it('accepts a canonical QuestionVisual for every supported type', () => {
    const visuals = [
      { type: 'table', data: { headers: ['A'], rows: [['1']] } },
      { type: 'mermaid', data: { code: 'graph TD; A-->B' } },
      { type: 'latex', data: { expression: 'x^2' } },
      { type: 'svg', data: { svg_content: '<svg></svg>' } },
      { type: 'geometry', data: { shape: 'triangle' } },
      { type: 'venn', data: { setA: 'A', setB: 'B' } },
      { type: 'chart', data: { data: [1, 2, 3] } },
      { type: 'map_overlay', data: { center: { lat: 15, lng: 80 } } },
    ]
    for (const visual of visuals) {
      expect(hasCanonicalVisual(visual)).toBe(true)
    }
  })

  it('accepts an optional canonical title', () => {
    expect(hasCanonicalVisual({ type: 'chart', title: 'Growth', data: { data: [1] } })).toBe(true)
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty object', {}],
    ['json null', 'null'],
    ['unsupported type', { type: 'hologram', data: {} }],
    ['legacy visual_engine wrapper', { visual_engine: { render_type: 'table', metadata: { headers: ['A'], rows: [['1']] } } }],
    ['legacy bare engine', { render_type: 'table', metadata: { headers: ['A'], rows: [['1']] } }],
    ['missing type key', { data: { headers: ['A'], rows: [['1']] } }],
    ['array', [{ type: 'table', data: { headers: ['A'], rows: [['1']] } }]],
    ['string', 'svg'],
    ['table with empty headers', { type: 'table', data: { headers: [], rows: [] } }],
    ['mermaid without code', { type: 'mermaid', data: {} }],
    ['chart without data/series/datasets', { type: 'chart', data: { labels: ['A'] } }],
  ])('rejects %s', (_label, visual) => {
    expect(hasCanonicalVisual(visual)).toBe(false)
  })
})
