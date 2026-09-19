import { describe, it, expect } from 'vitest'
import { canonicalizePromptTopics, extractEmbeddedTopicNames } from './promptTopicCanonicalizer'

const CANON_EN = 'Early Medieval India & South Indian Dynasties'
const CANON_TE = 'ప్రారంభ మధ్యయుగ భారతదేశం'

describe('promptTopicCanonicalizer', () => {
  it('rewrites only topic values inside a fenced schema, preserving every other byte', () => {
    const prompt = [
      '# RULES',
      'Use JSON only.',
      '```json',
      '[',
      '  {',
      '    "topic_en": "Wrong Name",',
      '    "topic_te": "తప్పు",',
      '    "question_text_en": "string"',
      '  }',
      ']',
      '```',
      'End.',
    ].join('\n')
    const { text, changedRegions } = canonicalizePromptTopics(prompt, { topic_en: CANON_EN, topic_te: CANON_TE })

    expect(changedRegions).toBe(1)
    expect(text).toContain('"topic_en": "' + CANON_EN + '"')
    expect(text).toContain('"topic_te": "' + CANON_TE + '"')
    expect(text.startsWith('# RULES\nUse JSON only.\n```json')).toBe(true)
    expect(text.endsWith('End.')).toBe(true)
    expect(text).toContain('"question_text_en": "string"')
  })

  it('preserves compact no-space JSON style and leaves TE untouched when canonical TE is null', () => {
    const prompt = '{"topic_en":"X","topic_te":"Y","difficulty":"easy"}'
    const { text } = canonicalizePromptTopics(prompt, { topic_en: CANON_EN, topic_te: null })
    expect(text).toBe('{"topic_en":"' + CANON_EN + '","topic_te":"Y","difficulty":"easy"}')
  })

  it('inserts a missing topic_te key when canonical Telugu exists and result parses as JSON', () => {
    const prompt = '[\n  {"topic_en": "X",\n    "question_text_en": "q"}\n]'
    const { text } = canonicalizePromptTopics(prompt, { topic_en: CANON_EN, topic_te: CANON_TE })
    const parsed = JSON.parse(text)
    expect(parsed[0].topic_en).toBe(CANON_EN)
    expect(parsed[0].topic_te).toBe(CANON_TE)
  })

  it('never mutates prose mentions of topic_en outside the output schema', () => {
    const prompt = 'The field topic_en means topic in English. Schema:\n{"topic_en": "Old", "topic_te": "పాత", "option_a_en": "a"}'
    const { text } = canonicalizePromptTopics(prompt, { topic_en: CANON_EN, topic_te: CANON_TE })
    expect(text.startsWith('The field topic_en means topic in English.')).toBe(true)
    expect(extractEmbeddedTopicNames(text)).toEqual({ en: CANON_EN, te: CANON_TE })
  })

  it('rewrites every schema region in multi-example prompts', () => {
    const region = (en: string, te: string) =>
      `{"topic_en": "${en}", "topic_te": "${te}", "correct_option": "A"}`
    const prompt = `${region('O', 'P')} middle ${region('O2', 'P2')}`
    const { text, changedRegions } = canonicalizePromptTopics(prompt, { topic_en: CANON_EN, topic_te: CANON_TE })
    expect(changedRegions).toBe(2)
    expect((text.match(new RegExp(CANON_EN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length).toBe(2)
  })

  it('is idempotent — second pass changes nothing', () => {
    const prompt = '{"topic_en": "O", "topic_te": "P", "difficulty": "easy"}'
    const first = canonicalizePromptTopics(prompt, { topic_en: CANON_EN, topic_te: CANON_TE })
    const second = canonicalizePromptTopics(first.text, { topic_en: CANON_EN, topic_te: CANON_TE })
    expect(second.text).toBe(first.text)
    expect(second.changedRegions).toBe(0)
  })

  it('extract returns nulls for prompts without an output-schema example', () => {
    expect(extractEmbeddedTopicNames('No schema here at all.')).toEqual({ en: null, te: null })
  })

  it('survives quotes and backslashes inside values via proper JSON escaping', () => {
    const trickyEn = 'India\\s "Golden" Era'
    const { text } = canonicalizePromptTopics('{"topic_en": "Old", "question_text_en": "q"}', { topic_en: trickyEn, topic_te: null })
    expect(JSON.parse(text).topic_en).toBe(trickyEn)
  })
})
