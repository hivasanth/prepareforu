import { describe, it, expect, vi, beforeEach } from 'vitest'
import { adminListQuestionsRpc } from './question.repository'

vi.mock('../supabase', () => ({
  supabase: {
    rpc: vi.fn(async () => ({ data: null, error: null })),
    from: vi.fn(() => ({ select: vi.fn() })),
  },
}))

import { supabase } from '../supabase'

const mockRpc = vi.mocked(supabase.rpc)

const baseParams = {
  resolvedIds: [],
  selectedPaper: 'all',
  selectedSubject: 'all',
  selectedTopic: null,
  difficultyFilter: 'all',
  visualOnly: false,
  searchQuery: '',
  offset: 0,
  pageSize: 30,
} as const

describe('adminListQuestionsRpc — visual filter to RPC boundary', () => {
  beforeEach(() => {
    mockRpc.mockClear()
    mockRpc.mockResolvedValue({ data: null, error: null })
  })

  it('visualOnly:false is sent as p_visual_only:false (the 11-arg call shape)', async () => {
    await adminListQuestionsRpc({ ...baseParams, visualOnly: false })
    expect(mockRpc).toHaveBeenCalledWith(
      'admin_list_questions',
      expect.objectContaining({ p_visual_only: false }),
    )
  })

  it('visualOnly:true is sent as p_visual_only:true (Visuals filter)', async () => {
    await adminListQuestionsRpc({ ...baseParams, visualOnly: true })
    expect(mockRpc).toHaveBeenCalledWith(
      'admin_list_questions',
      expect.objectContaining({ p_visual_only: true }),
    )
  })

  it('keeps difficulty/search/topic wired while p_visual_only is active', async () => {
    await adminListQuestionsRpc({
      ...baseParams,
      visualOnly: true,
      difficultyFilter: 'hard',
      searchQuery: 'motion',
      selectedTopic: 'Kinematics',
    })
    expect(mockRpc).toHaveBeenCalledWith(
      'admin_list_questions',
      expect.objectContaining({
        p_visual_only: true,
        p_difficulty: 'hard',
        p_search: 'motion',
        p_topic_en: 'Kinematics',
      }),
    )
  })

  it('emits the full 11-argument payload (count + rows contract unchanged)', async () => {
    await adminListQuestionsRpc(baseParams)
    const [fn, args] = mockRpc.mock.calls[0] as [string, Record<string, unknown>]
    expect(fn).toBe('admin_list_questions')
    expect(Object.keys(args).sort()).toEqual([
      'p_ascending', 'p_difficulty', 'p_exam_ids', 'p_limit', 'p_offset',
      'p_paper_id', 'p_search', 'p_sort_column', 'p_subject_name', 'p_topic_en',
      'p_visual_only',
    ])
  })

  it('propagates the PostgREST error instead of swallowing it', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error('PGRST202 function not found') })
    await expect(adminListQuestionsRpc(baseParams)).rejects.toThrow('PGRST202 function not found')
  })
})