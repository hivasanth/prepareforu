// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { promptTemplateSchema, topicMetadataSchema } from './adminSchemas'

// ─── promptTemplateSchema ─────────────────────────────────────────────────────

describe('promptTemplateSchema', () => {
  const VALID = {
    topic_name: 'Indian History - Modern India',
    prompt_text: 'Generate MCQs based on the syllabus below.',
  }

  it('accepts a valid prompt template', () => {
    expect(promptTemplateSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects an empty topic name', () => {
    expect(promptTemplateSchema.safeParse({ ...VALID, topic_name: '' }).success).toBe(false)
  })

  it('rejects whitespace-only topic name', () => {
    expect(promptTemplateSchema.safeParse({ ...VALID, topic_name: '   ' }).success).toBe(false)
  })

  it('rejects an empty prompt text', () => {
    expect(promptTemplateSchema.safeParse({ ...VALID, prompt_text: '' }).success).toBe(false)
  })

  it('rejects whitespace-only prompt text', () => {
    expect(promptTemplateSchema.safeParse({ ...VALID, prompt_text: '\n  ' }).success).toBe(false)
  })
})

// ─── topicMetadataSchema ──────────────────────────────────────────────────────

describe('topicMetadataSchema', () => {
  it('accepts valid metadata with empty youtube url', () => {
    expect(topicMetadataSchema.safeParse({ display_order: 1, youtube_url: '' }).success).toBe(true)
  })

  it('accepts valid metadata with a valid youtube url', () => {
    expect(topicMetadataSchema.safeParse({ display_order: 2, youtube_url: 'https://youtube.com/watch?v=abc' }).success).toBe(true)
  })

  it('rejects display order of 0', () => {
    expect(topicMetadataSchema.safeParse({ display_order: 0, youtube_url: '' }).success).toBe(false)
  })

  it('rejects negative display order', () => {
    expect(topicMetadataSchema.safeParse({ display_order: -1, youtube_url: '' }).success).toBe(false)
  })

  it('rejects display order as float', () => {
    expect(topicMetadataSchema.safeParse({ display_order: 1.5, youtube_url: '' }).success).toBe(false)
  })

  it('rejects an invalid youtube url', () => {
    expect(topicMetadataSchema.safeParse({ display_order: 1, youtube_url: 'not-a-url' }).success).toBe(false)
  })
})
