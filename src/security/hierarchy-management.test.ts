import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/repositories/exam.repository', () => ({
  findExamConfigById: vi.fn(),
  fetchPapersByExamId: vi.fn(),
  findPaperById: vi.fn(),
  fetchSubjectsByPaperId: vi.fn(),
  fetchTopicsBySubject: vi.fn(),
  insertExamPaper: vi.fn(),
  insertExamSubject: vi.fn(),
  insertTopicStrict: vi.fn(),
  updateTopicNames: vi.fn(),
  countActiveQuestionsForTopicSegment: vi.fn(),
  countPromptsForTopic: vi.fn(),
  syncQuestionTeluguForTopic: vi.fn(),
  fetchTopicById: vi.fn(),
}))

vi.mock('../utils/queryCache', () => ({
  queryCache: { invalidateByPrefix: vi.fn(), invalidate: vi.fn(), fetchWithDedup: vi.fn(), get: vi.fn() },
}))

import * as repo from '../lib/repositories/exam.repository'
import { queryCache } from '../utils/queryCache'
import { adminService } from '../services/adminService'
import type { UserProfile } from '../types/auth.types'

const admin = { id: 'u-admin', role: 'admin' } as unknown as UserProfile
const subAdmin = { id: 'u-sub', role: 'sub_admin' } as unknown as UserProfile
const normalUser = { id: 'u-user', role: 'user' } as unknown as UserProfile
const ctxAdmin = { user: admin }
const ctxSub = { user: subAdmin }

/* eslint-disable @typescript-eslint/no-explicit-any -- test fixtures intentionally mock loose DB row shapes */
const CONFIG = { exam_id: 'APPSC_GROUP_1', name: 'APPSC Group 1', exam_selection: 'APPSC_GROUPS' } as any
const PAPER = { id: 'p-1', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 1', stage: 'PRELIMS' } as any
const TOPIC = { id: 't-1', exam_id: 'APPSC_GROUP_1', paper_id: 'p-1', subject_name: 'History', topic_en: 'Ancient India', topic_te: null }

const m = (fn: unknown) => fn as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('hierarchy management - createPaper', () => {
  it('creates a paper under a live exam with normalized name and next display order', async () => {
    m(repo.findExamConfigById).mockResolvedValue(CONFIG)
    m(repo.fetchPapersByExamId).mockResolvedValue([{ ...PAPER }])
    m(repo.insertExamPaper).mockResolvedValue({ id: 'p-new', paper_name: 'Paper 2' })

    const created = await adminService.createPaper(ctxAdmin, {
      exam_id: 'APPSC_GROUP_1', paper_name: '  Paper   2 ', stage: 'SINGLE',
      total_questions: 100, total_marks: 100, duration_minutes: 120,
    })

    expect(created.paper_name).toBe('Paper 2')
    const payload = m(repo.insertExamPaper).mock.calls[0][0]
    expect(payload.paper_name).toBe('Paper 2')
    expect(payload.display_order).toBe(2)
    expect(m(queryCache.invalidateByPrefix)).toHaveBeenCalledWith('papers_config_')
    expect(m(queryCache.invalidateByPrefix)).toHaveBeenCalledWith('appsc_papers_')
    expect(m(queryCache.invalidateByPrefix)).toHaveBeenCalledWith('user_papers_')
  })

  it('rejects duplicates within the same stage with a friendly message (no DB write)', async () => {
    m(repo.findExamConfigById).mockResolvedValue(CONFIG)
    m(repo.fetchPapersByExamId).mockResolvedValue([{ ...PAPER, paper_name: 'Paper 1' }])

    await expect(adminService.createPaper(ctxAdmin, {
      exam_id: 'APPSC_GROUP_1', paper_name: ' Paper  1 ', stage: 'PRELIMS',
      total_questions: 1, total_marks: 1, duration_minutes: 1,
    })).rejects.toThrow(/DUPLICATE: A paper named "Paper 1" already exists/)

    expect(repo.insertExamPaper).not.toHaveBeenCalled()
  })

  it('rejects creation under an exam that does not exist', async () => {
    m(repo.findExamConfigById).mockResolvedValue(null)
    await expect(adminService.createPaper(ctxAdmin, {
      exam_id: 'GHOST_EXAM', paper_name: 'X', stage: 'SINGLE',
      total_questions: 1, total_marks: 1, duration_minutes: 1,
    })).rejects.toThrow(/does not exist/)
    expect(repo.insertExamPaper).not.toHaveBeenCalled()
  })

  it('maps the DB unique-violation race (23505) to the friendly duplicate error', async () => {
    m(repo.findExamConfigById).mockResolvedValue(CONFIG)
    m(repo.fetchPapersByExamId).mockResolvedValue([])
    const err: any = new Error('duplicate key'); err.code = '23505'
    m(repo.insertExamPaper).mockRejectedValue(err)

    await expect(adminService.createPaper(ctxAdmin, {
      exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 9', stage: 'SINGLE',
      total_questions: 1, total_marks: 1, duration_minutes: 1,
    })).rejects.toThrow(/DUPLICATE/)
  })

  it('normal users are rejected by role policy before any query runs', async () => {
    await expect(adminService.createPaper({ user: normalUser }, {
      exam_id: 'APPSC_GROUP_1', paper_name: 'X', stage: 'SINGLE',
      total_questions: 1, total_marks: 1, duration_minutes: 1,
    })).rejects.toThrow()
    expect(repo.findExamConfigById).not.toHaveBeenCalled()
  })
})

describe('hierarchy management - createSubject', () => {
  it('creates a subject under a verified paper and invalidates subject caches', async () => {
    m(repo.findPaperById).mockResolvedValue(PAPER)
    m(repo.findExamConfigById).mockResolvedValue(CONFIG)
    m(repo.fetchSubjectsByPaperId).mockResolvedValue([{ id: 's-1', subject_name: 'History' }])
    m(repo.insertExamSubject).mockResolvedValue({ id: 's-new', subject_name: 'Telugu' })

    await adminService.createSubject(ctxAdmin, { paper_id: 'p-1', subject_name: 'Telugu', question_count: 30, marks_per_question: 1 })

    const payload = m(repo.insertExamSubject).mock.calls[0][0]
    expect(payload.exam_id).toBe('APPSC_GROUP_1')
    expect(payload.display_order).toBe(2)
    expect(m(queryCache.invalidateByPrefix)).toHaveBeenCalledWith('subjects_paper_')
    expect(m(queryCache.invalidateByPrefix)).toHaveBeenCalledWith('subjects_exam_')
    expect(m(queryCache.invalidateByPrefix)).toHaveBeenCalledWith('subject_counts_')
  })

  it('rejects a paper that does not exist (wrong parent)', async () => {
    m(repo.findPaperById).mockResolvedValue(null)
    await expect(adminService.createSubject(ctxAdmin, { paper_id: 'ghost', subject_name: 'X', question_count: 1, marks_per_question: 1 }))
      .rejects.toThrow(/Selected paper does not belong/)
    expect(repo.insertExamSubject).not.toHaveBeenCalled()
  })

  it('rejects duplicate subject within the paper (normalized compare)', async () => {
    m(repo.findPaperById).mockResolvedValue(PAPER)
    m(repo.findExamConfigById).mockResolvedValue(CONFIG)
    m(repo.fetchSubjectsByPaperId).mockResolvedValue([{ id: 's-1', subject_name: 'History' }])
    await expect(adminService.createSubject(ctxAdmin, { paper_id: 'p-1', subject_name: 'HISTORY', question_count: 5, marks_per_question: 1 }))
      .rejects.toThrow(/DUPLICATE: A subject named "History" already exists/)
    expect(repo.insertExamSubject).not.toHaveBeenCalled()
  })
})

describe('hierarchy management - createTopic', () => {
  const baseInput = { exam_id: 'APPSC_GROUP_1', paper_id: 'p-1', subject_name: 'History', topic_en: 'Genetics' }

  it('creates a canonical topic after verifying exam->paper->subject chain (sub_admin allowed)', async () => {
    m(repo.findPaperById).mockResolvedValue(PAPER)
    m(repo.findExamConfigById).mockResolvedValue(CONFIG)
    m(repo.fetchSubjectsByPaperId).mockResolvedValue([{ id: 's-1', subject_name: 'History' }])
    m(repo.fetchTopicsBySubject).mockResolvedValue([
      { id: 't-a', topic_en: 'Ancient India', topic_te: null, display_order: 1 },
    ])
    m(repo.insertTopicStrict).mockResolvedValue({ ...TOPIC, topic_en: 'Genetics', id: 't-new' })

    const created = await adminService.createTopic(ctxSub, { ...baseInput, topic_en: '  Genetics  ', topic_te: '  Janeyu Saastram  ' })

    expect(created.id).toBe('t-new')
    const payload = m(repo.insertTopicStrict).mock.calls[0][0]
    expect(payload.topic_en).toBe('Genetics')
    expect(payload.topic_te).toBe('Janeyu Saastram')
    expect(payload.display_order).toBe(2)
    expect(m(queryCache.invalidateByPrefix)).toHaveBeenCalledWith('topics_')
    expect(m(queryCache.invalidateByPrefix)).toHaveBeenCalledWith('topic_counts_')
  })

  it('blank topic names are rejected before any parent query', async () => {
    await expect(adminService.createTopic(ctxSub, { ...baseInput, topic_en: '   ' })).rejects.toThrow(/English topic name is required/)
    expect(repo.findPaperById).not.toHaveBeenCalled()
  })

  it('rejects a paper that belongs to a DIFFERENT exam (parent validation)', async () => {
    m(repo.findPaperById).mockResolvedValue({ ...PAPER, exam_id: 'BANK_EXAMS' })
    await expect(adminService.createTopic(ctxAdmin, baseInput)).rejects.toThrow(/HIERARCHY: The selected paper does not belong/)
    expect(repo.insertTopicStrict).not.toHaveBeenCalled()
  })

  it('rejects a subject that does not belong to the paper (parent validation)', async () => {
    m(repo.findPaperById).mockResolvedValue(PAPER)
    m(repo.findExamConfigById).mockResolvedValue(CONFIG)
    m(repo.fetchSubjectsByPaperId).mockResolvedValue([{ id: 's-1', subject_name: 'Polity' }])
    await expect(adminService.createTopic(ctxAdmin, baseInput)).rejects.toThrow(/HIERARCHY: The selected subject does not belong/)
    expect(repo.insertTopicStrict).not.toHaveBeenCalled()
  })

  it('maps the unique-constraint race to the friendly duplicate error', async () => {
    m(repo.findPaperById).mockResolvedValue(PAPER)
    m(repo.findExamConfigById).mockResolvedValue(CONFIG)
    m(repo.fetchSubjectsByPaperId).mockResolvedValue([{ id: 's-1', subject_name: 'History' }])
    m(repo.fetchTopicsBySubject).mockResolvedValue([])
    const err: any = new Error('duplicate key'); err.code = '23505'
    m(repo.insertTopicStrict).mockRejectedValue(err)

    await expect(adminService.createTopic(ctxAdmin, baseInput)).rejects.toThrow(/DUPLICATE: A topic named "Genetics" already exists/)
  })

  it('normal users can NEVER create topics', async () => {
    await expect(adminService.createTopic({ user: normalUser }, baseInput)).rejects.toThrow()
    expect(repo.insertTopicStrict).not.toHaveBeenCalled()
  })
})

describe('hierarchy management - rename safety (dependency-aware)', () => {
  it('blocks the English rename while dependent questions exist and reports exact counts', async () => {
    m(repo.fetchTopicById).mockResolvedValue(TOPIC)
    m(repo.countActiveQuestionsForTopicSegment).mockResolvedValue(12)
    m(repo.countPromptsForTopic).mockResolvedValue(0)

    await expect(adminService.renameTopic(ctxAdmin, 't-1', { topic_en: 'Early India' }))
      .rejects.toThrow(/RENAME_BLOCKED: 12 question\(s\) and 0 prompt\(s\) depend/)

    expect(repo.updateTopicNames).not.toHaveBeenCalled()
  })

  it('blocks any rename while prompts embed the canonical names', async () => {
    m(repo.fetchTopicById).mockResolvedValue(TOPIC)
    m(repo.countActiveQuestionsForTopicSegment).mockResolvedValue(0)
    m(repo.countPromptsForTopic).mockResolvedValue(3)

    await expect(adminService.renameTopic(ctxAdmin, 't-1', { topic_en: 'Early India' }))
      .rejects.toThrow(/3 prompt\(s\) depend/)
    await expect(adminService.renameTopic(ctxAdmin, 't-1', { topic_te: 'Kotha Peru' }))
      .rejects.toThrow(/RENAME_BLOCKED: 3 prompt\(s\) embed/)

    expect(repo.updateTopicNames).not.toHaveBeenCalled()
    expect(repo.syncQuestionTeluguForTopic).not.toHaveBeenCalled()
  })

  it('allows a clean English rename when zero dependencies exist', async () => {
    m(repo.fetchTopicById).mockResolvedValue(TOPIC)
    m(repo.countActiveQuestionsForTopicSegment).mockResolvedValue(0)
    m(repo.countPromptsForTopic).mockResolvedValue(0)

    const res = await adminService.renameTopic(ctxSub, 't-1', { topic_en: 'Early India' })

    expect(res.syncedQuestions).toBe(0)
    expect(m(repo.updateTopicNames).mock.calls[0][1]).toEqual({ topic_en: 'Early India' })
    expect(m(queryCache.invalidate)).toHaveBeenCalledWith('topic_record_t-1')
  })

  it('syncs dependent questions when renaming Telugu with only question dependencies', async () => {
    m(repo.fetchTopicById).mockResolvedValue({ ...TOPIC, topic_te: 'Old Te' })
    m(repo.countActiveQuestionsForTopicSegment).mockResolvedValue(7)
    m(repo.countPromptsForTopic).mockResolvedValue(0)
    m(repo.syncQuestionTeluguForTopic).mockResolvedValue(7)

    const res = await adminService.renameTopic(ctxAdmin, 't-1', { topic_te: 'New Te' })

    expect(res.syncedQuestions).toBe(7)
    expect(m(repo.syncQuestionTeluguForTopic).mock.calls[0]).toEqual([
      'APPSC_GROUP_1', 'p-1', 'History', 'Ancient India', 'New Te',
    ])
    expect(m(repo.updateTopicNames).mock.calls[0][1]).toEqual({ topic_te: 'New Te' })
  })

  it('no-op renames perform zero writes', async () => {
    m(repo.fetchTopicById).mockResolvedValue(TOPIC)
    const res = await adminService.renameTopic(ctxAdmin, 't-1', { topic_en: 'Ancient India', topic_te: null })
    expect(res.syncedQuestions).toBe(0)
    expect(repo.updateTopicNames).not.toHaveBeenCalled()
  })

  it('fetchTopicRenameImpact reports dependency counts', async () => {
    m(repo.fetchTopicById).mockResolvedValue(TOPIC)
    m(repo.countActiveQuestionsForTopicSegment).mockResolvedValue(4)
    m(repo.countPromptsForTopic).mockResolvedValue(2)
    const impact = await adminService.fetchTopicRenameImpact(ctxAdmin, 't-1')
    expect(impact).toEqual({ questions: 4, prompts: 2 })
  })
})
