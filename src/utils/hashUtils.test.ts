import { describe, it, expect } from 'vitest'
import { generateQuestionHash } from './hashUtils'

const base = {
  question_text_en: 'What is the capital of France?',
  option_a_en: 'London',
  option_b_en: 'Paris',
  option_c_en: 'Berlin',
  option_d_en: 'Madrid',
  correct_option: 'B',
  exam_id: 'APPSC_GROUP_1',
}

describe('generateQuestionHash', () => {
  it('returns a 64-char hex string', async () => {
    const hash = await generateQuestionHash(base)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is deterministic for same input', async () => {
    const h1 = await generateQuestionHash(base)
    const h2 = await generateQuestionHash(base)
    expect(h1).toBe(h2)
  })

  it('differs when paper_id changes (DEF-3)', async () => {
    const h1 = await generateQuestionHash({ ...base, paper_id: 'paper-A' })
    const h2 = await generateQuestionHash({ ...base, paper_id: 'paper-B' })
    expect(h1).not.toBe(h2)
  })

  it('differs when subject_name changes (DEF-3)', async () => {
    const h1 = await generateQuestionHash({ ...base, subject_name: 'History' })
    const h2 = await generateQuestionHash({ ...base, subject_name: 'Geography' })
    expect(h1).not.toBe(h2)
  })

  it('same hash when paper_id and subject_name are both null', async () => {
    const h1 = await generateQuestionHash({ ...base, paper_id: null, subject_name: null })
    const h2 = await generateQuestionHash({ ...base, paper_id: null, subject_name: null })
    expect(h1).toBe(h2)
  })

  it('differs when question text differs', async () => {
    const h1 = await generateQuestionHash(base)
    const h2 = await generateQuestionHash({ ...base, question_text_en: 'What is the capital of Germany?' })
    expect(h1).not.toBe(h2)
  })

  it('differs when correct_option differs', async () => {
    const h1 = await generateQuestionHash(base)
    const h2 = await generateQuestionHash({ ...base, correct_option: 'A' })
    expect(h1).not.toBe(h2)
  })

  it('is case-insensitive after normalization', async () => {
    const h1 = await generateQuestionHash(base)
    const h2 = await generateQuestionHash({
      ...base,
      question_text_en: '  WHAT IS THE CAPITAL OF FRANCE?  ',
      option_a_en: 'london',
    })
    expect(h1).toBe(h2)
  })

  it('collapses whitespace during normalization', async () => {
    const h1 = await generateQuestionHash(base)
    const h2 = await generateQuestionHash({
      ...base,
      question_text_en: 'What   is   the   capital   of   France?',
    })
    expect(h1).toBe(h2)
  })

  it('same question in different exam contexts produces different hash', async () => {
    const h1 = await generateQuestionHash({ ...base, exam_id: 'APPSC_GROUP_1' })
    const h2 = await generateQuestionHash({ ...base, exam_id: 'APPSC_GROUP_2' })
    expect(h1).not.toBe(h2)
  })

  it('undefined optional fields produce same hash as null', async () => {
    const h1 = await generateQuestionHash({ ...base, paper_id: undefined, subject_name: undefined })
    const h2 = await generateQuestionHash({ ...base, paper_id: null, subject_name: null })
    expect(h1).toBe(h2)
  })
})
