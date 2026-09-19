// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock supabase ──────────────────────────────────────────────────────────

const { supabaseMock, state } = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const state = { topicLookup: { data: null as unknown, error: null as unknown } }
  chain.from = vi.fn(() => chain)
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(async () => ({ data: null, error: null }))
  chain.update = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.limit = vi.fn(async () => state.topicLookup)
  return { supabaseMock: chain, state }
})

vi.mock('../lib/supabase', () => ({ supabase: supabaseMock }))

// ─── Imports ────────────────────────────────────────────────────────────────

import { validatePromptTopicContext, upsertPrompt } from '../lib/repositories/exam.repository'

const SEGMENT = {
  exam_id: 'APPSC_GROUP_1',
  paper_id: 'paper-1',
  subject_name: 'History and Culture',
}

function payload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...SEGMENT,
    topic_id: '11111111-1111-1111-1111-111111111111',
    topic_name: 'Modern History',
    prompt_text: 'Generate questions about modern history.',
    ...overrides,
  }
}

describe('D3: prompt/topic segment integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.topicLookup = { data: [], error: null }
  })

  it('validatePromptTopicContext accepts an exact segment match', async () => {
    state.topicLookup = { data: [{ id: '11111111-1111-1111-1111-111111111111' }], error: null }

    await expect(
      validatePromptTopicContext({ ...SEGMENT, topic_id: '11111111-1111-1111-1111-111111111111' })
    ).resolves.toBeUndefined()
  })

  it('validatePromptTopicContext rejects a topic outside the segment', async () => {
    // lookup scoped by id+exam+paper+subject returned zero rows → foreign segment
    await expect(
      validatePromptTopicContext({ ...SEGMENT, topic_id: '22222222-2222-2222-2222-222222222222' })
    ).rejects.toThrow('does not belong to the selected exam, paper and subject')
  })

  it('validatePromptTopicContext surfaces query errors instead of denying', async () => {
    state.topicLookup = { data: null, error: { message: 'network down' } }

    await expect(
      validatePromptTopicContext({ ...SEGMENT, topic_id: '11111111-1111-1111-1111-111111111111' })
    ).rejects.toMatchObject({ message: 'network down' })
  })

  it('upsertPrompt blocks persistence for a cross-segment topic', async () => {
    await expect(upsertPrompt(payload())).rejects.toThrow(
      'does not belong to the selected exam, paper and subject'
    )
    expect(supabaseMock.insert).not.toHaveBeenCalled()
    expect(supabaseMock.update).not.toHaveBeenCalled()
  })

  it('upsertPrompt blocks updates too (manipulated PATCH shape)', async () => {
    const manipulated = payload({
      id: 'existing-prompt-id',
      topic_id: '33333333-3333-3333-3333-333333333333', // belongs elsewhere
    })

    await expect(upsertPrompt(manipulated)).rejects.toThrow(
      'does not belong to the selected exam, paper and subject'
    )
    expect(supabaseMock.update).not.toHaveBeenCalled()
    expect(supabaseMock.insert).not.toHaveBeenCalled()
  })

  it('upsertPrompt inserts when the topic matches the segment', async () => {
    state.topicLookup = { data: [{ id: '11111111-1111-1111-1111-111111111111' }], error: null }

    await upsertPrompt(payload())

    expect(supabaseMock.insert).toHaveBeenCalledTimes(1)
  })

  it('upsertPrompt updates when the topic matches the segment', async () => {
    state.topicLookup = { data: [{ id: '11111111-1111-1111-1111-111111111111' }], error: null }

    await upsertPrompt(payload({ id: 'existing-prompt-id' }))

    expect(supabaseMock.update).toHaveBeenCalledTimes(1)
  })
})
