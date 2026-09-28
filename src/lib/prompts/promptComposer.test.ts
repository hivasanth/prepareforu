import { describe, it, expect } from 'vitest'
import {
  composeBulkUploadPrompt,
  ensureDynamicContractMarker,
  DYNAMIC_OUTPUT_CONTRACT_MARKER,
} from './promptComposer'
import { QUESTION_OUTPUT_CONTRACT_VERSION, buildCanonicalOutputContract } from './dynamicOutputContract'

const SYLLABUS = `# Polity Basics - Indian Constitution
SYLLABUS
1. Making of the Constitution: constituent assembly and salient features.
2. Fundamental Rights and Directive Principles of State Policy.
3. Union Executive, Parliament and the Judiciary.
Generate exactly 20 bilingual MCQs.`

function legacyFencedOutputExample(): string {
  return [
    '```json',
    '[',
    '  {',
    '    "topic_en": "Polity Basics",',
    '    "topic_te": "పాలిటీ ప్రాథమికాలు",',
    '    "question_text_en": "Who heads the Union Executive?",',
    '    "visual_engine": {',
    '      "render_type": "table",',
    '      "title": "Union Executive",',
    '      "headers": ["Body", "Head"],',
    '      "rows": [["Cabinet", "PM"]]',
    '    },',
    '    "option_a_en": "President",',
    '    "option_b_en": "Prime Minister",',
    '    "option_c_en": "Speaker",',
    '    "option_d_en": "Chief Justice",',
    '    "correct_option": "A",',
    '    "explanation_en": "The executive authority is vested in the President."',
    '  }',
    ']',
    '```',
  ].join('\n')
}

function bilingualVisualExample(): string {
  return [
    '```json',
    '{',
    '  "type": "table",',
    '  "title_en": "Fundamental Rights",',
    '  "headers_en": ["Article", "Right"],',
    '  "rows_en": [["14", "Equality"]]',
    '}',
    '```',
  ].join('\n')
}

function emptyVisualEnginePlaceholder(): string {
  return '```json\n{ "visual_engine": {} }\n```'
}

describe('composeBulkUploadPrompt (Phases 7/11/12/15)', () => {
  it('preserves ALL topic syllabus content byte-for-byte', () => {
    const prompt = [SYLLABUS, legacyFencedOutputExample(), bilingualVisualExample(), emptyVisualEnginePlaceholder()].join('\n\n')
    const out = composeBulkUploadPrompt(prompt).text
    for (const line of SYLLABUS.split('\n')) {
      expect(out).toContain(line)
    }
  })

  it('removes legacy fenced visual_engine / render_type examples', () => {
    const out = composeBulkUploadPrompt(`${SYLLABUS}\n\n${legacyFencedOutputExample()}`).text
    expect(out).not.toContain('visual_engine')
    expect(out).not.toContain('render_type')
  })

  it('removes fenced bilingual visual examples (title_en/headers_en/rows_en)', () => {
    const out = composeBulkUploadPrompt(`${SYLLABUS}\n\n${bilingualVisualExample()}`).text
    expect(out).not.toContain('title_en')
    expect(out).not.toContain('headers_en')
    expect(out).not.toContain('rows_en')
  })

  it('removes empty visual_engine placeholders', () => {
    const out = composeBulkUploadPrompt(`${SYLLABUS}\n\n${emptyVisualEnginePlaceholder()}`).text
    expect(out).not.toContain('visual_engine')
  })

  it('injects the live canonical output contract EXACTLY once', () => {
    const out = composeBulkUploadPrompt(SYLLABUS).text
    const count = (out.match(/CANONICAL OUTPUT CONTRACT v/g) ?? []).length
    expect(count).toBe(1)
    expect(out).toContain(buildCanonicalOutputContract())
    expect(out).toContain(`v${QUESTION_OUTPUT_CONTRACT_VERSION}`)
  })

  it('never shows the internal marker to the AI', () => {
    const withMarker = `${SYLLABUS}\n\n${DYNAMIC_OUTPUT_CONTRACT_MARKER}`
    const out = composeBulkUploadPrompt(withMarker)
    expect(out.markerUsed).toBe(true)
    expect(out.text).not.toContain(DYNAMIC_OUTPUT_CONTRACT_MARKER)
    expect(out.text).toContain(buildCanonicalOutputContract())
  })

  it('is idempotent — composing an already-composed prompt changes nothing', () => {
    const first = composeBulkUploadPrompt(SYLLABUS).text
    const second = composeBulkUploadPrompt(first).text
    expect(second).toBe(first)
  })

  it('appends the contract when no marker exists; content first', () => {
    const out = composeBulkUploadPrompt(SYLLABUS).text
    expect(out.indexOf('# Polity Basics')).toBe(0)
    expect(out.indexOf('CANONICAL OUTPUT CONTRACT v')).toBeGreaterThan(out.indexOf('Generate exactly 20 bilingual MCQs.'))
  })
})

describe('composeBulkUploadPrompt — topic identity injection (hardening §2/§3/§21/§22)', () => {
  const TOPIC = { topic_en: 'Ancient Indian History', topic_te: 'ప్రాచీన భారతదేశ చరిత్ర' }

  it('injects the exact live topic bytes as a TOPIC IDENTITY block before the contract', () => {
    const out = composeBulkUploadPrompt(SYLLABUS, TOPIC).text
    const idPos = out.indexOf('## TOPIC IDENTITY')
    const enPos = out.indexOf('topic_en = "Ancient Indian History"')
    const tePos = out.indexOf('topic_te = "ప్రాచీన భారతదేశ చరిత్ర"')
    const contractPos = out.indexOf('CANONICAL OUTPUT CONTRACT v')
    expect(idPos).toBeGreaterThan(-1)
    expect(enPos).toBeGreaterThan(idPos)
    expect(tePos).toBeGreaterThan(enPos)
    expect(contractPos).toBeGreaterThan(tePos)
    expect(out).toContain('Copy these values VERBATIM into every question object.')
  })

  it('teaches that topic fields hold the Topic GROUP, never a subtopic', () => {
    const out = composeBulkUploadPrompt(SYLLABUS, { topic_en: 'Ancient Indian History', topic_te: 'ప్రాచీన భారతదేశ చరిత్ర' }).text
    expect(out).toContain('NOT free text and NOT a subtopic')
    expect(out).toContain('the Indus Valley Civilization under "Ancient Indian History") still carries the topic')
  })

  it('declares the bilingual mandate when the topic has a Telugu name', () => {
    const out = composeBulkUploadPrompt(SYLLABUS, TOPIC).text
    expect(out).toContain('every Telugu field')
    expect(out).toContain('no null values')
  })

  it('declares null-tolerant guidance when the topic has no Telugu name', () => {
    const out = composeBulkUploadPrompt(SYLLABUS, { topic_en: 'General Paper', topic_te: null }).text
    expect(out).toContain('topic_te = null (this topic has no Telugu name)')
    expect(out).toContain('Telugu content fields may be null or omitted.')
  })

  it('replaces the internal marker AND injects topic identity in one composition', () => {
    const withMarker = `${SYLLABUS}\n\n${DYNAMIC_OUTPUT_CONTRACT_MARKER}`
    const out = composeBulkUploadPrompt(withMarker, TOPIC)
    expect(out.markerUsed).toBe(true)
    expect(out.text).not.toContain(DYNAMIC_OUTPUT_CONTRACT_MARKER)
    expect(out.text).toContain('## TOPIC IDENTITY')
    expect(out.text).toContain(buildCanonicalOutputContract())
    expect((out.text.match(/CANONICAL OUTPUT CONTRACT v/g) ?? []).length).toBe(1)
  })

  it('stays idempotent when re-composed with the same topic identity', () => {
    const first = composeBulkUploadPrompt(SYLLABUS, TOPIC).text
    const second = composeBulkUploadPrompt(first, TOPIC).text
    expect(second).toBe(first)
  })
})

describe('ensureDynamicContractMarker (storage form)', () => {
  it('appends the marker exactly once when absent', () => {
    const stored = ensureDynamicContractMarker(SYLLABUS)
    expect((stored.match(/\[PREPAREFORU_DYNAMIC_OUTPUT_CONTRACT\]/g) ?? []).length).toBe(1)
    expect(stored).toContain(SYLLABUS)
  })

  it('strips legacy fenced format examples while storing', () => {
    const stored = ensureDynamicContractMarker(`${SYLLABUS}\n\n${legacyFencedOutputExample()}`)
    expect(stored).not.toContain('visual_engine')
    expect(stored).not.toContain('render_type')
    expect((stored.match(/\[PREPAREFORU_DYNAMIC_OUTPUT_CONTRACT\]/g) ?? []).length).toBe(1)
  })

  it('collapses duplicate markers to exactly one', () => {
    const doubled = `${SYLLABUS}\n\n${DYNAMIC_OUTPUT_CONTRACT_MARKER}\n\n${DYNAMIC_OUTPUT_CONTRACT_MARKER}`
    expect((ensureDynamicContractMarker(doubled).match(/\[PREPAREFORU_DYNAMIC_OUTPUT_CONTRACT\]/g) ?? []).length).toBe(1)
  })
})