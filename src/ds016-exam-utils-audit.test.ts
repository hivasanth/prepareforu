import { describe, it, expect } from 'vitest'
import { getAllowedExamIds, isExamAllowed } from './utils/examUtils'
import { resolveExamIds, resolveAdminExamId } from './lib/examUtils'

/**
 * DS-016 — RE-1 consolidation: `resolveExamIds` (src/lib/examUtils.ts) MUST be a
 * pure delegate of `getAllowedExamIds` (src/utils/examUtils.ts), the single
 * source of truth for selection → exam-id expansion. Any divergence leaks the
 * APPSC group list into a second module again.
 */
describe('DS-016 exam-id resolution (RE-1 consolidation)', () => {
  it('resolveExamIds delegates exactly to getAllowedExamIds for every candidate', () => {
    const candidates = [
      'all',
      'APPSC',
      'APPSC_GROUPS',
      'APPSC_GROUP_1',
      'APPSC_GROUP_2',
      'APPSC_GROUP_3',
      'APPSC_GROUP_4',
      'BANK_EXAMS',
      'CUSTOM_EXAM',
    ] as const

    for (const selection of candidates) {
      expect(resolveExamIds(selection)).toEqual(getAllowedExamIds(selection))
    }
  })

  it('admin filter "all" resolves to no user-scoped exams', () => {
    expect(resolveExamIds('all')).toEqual([])
    expect(getAllowedExamIds('all')).toEqual([])
  })

  it('APPSC and APPSC_GROUPS expand to the four group ids', () => {
    const expected = ['APPSC_GROUP_1', 'APPSC_GROUP_2', 'APPSC_GROUP_3', 'APPSC_GROUP_4']
    expect(resolveExamIds('APPSC')).toEqual(expected)
    expect(resolveExamIds('APPSC_GROUPS')).toEqual(expected)
  })

  it('BANK_EXAMS matches itself exactly', () => {
    expect(resolveExamIds('BANK_EXAMS')).toEqual(['BANK_EXAMS'])
  })

  it('a specific exam id passes through as a single-element array', () => {
    expect(resolveExamIds('APPSC_GROUP_3')).toEqual(['APPSC_GROUP_3'])
  })

  it('getAllowedExamIds handles null/undefined as empty', () => {
    expect(getAllowedExamIds(undefined)).toEqual([])
    expect(getAllowedExamIds(null)).toEqual([])
    expect(getAllowedExamIds('')).toEqual([])
  })

  it('isExamAllowed derives from the same canonical expansion', () => {
    expect(isExamAllowed('APPSC_GROUPS', 'APPSC_GROUP_4')).toBe(true)
    expect(isExamAllowed('APPSC_GROUPS', 'BANK_EXAMS')).toBe(false)
    expect(isExamAllowed('all', 'APPSC_GROUP_1')).toBe(false)
  })
})

describe('DS-016 admin exam id resolution remains independent', () => {
  it('resolveAdminExamId keeps its insert-time semantics', () => {
    expect(resolveAdminExamId('APPSC_GROUPS')).toBe('APPSC_GROUP_1')
    expect(resolveAdminExamId('all')).toBe('APPSC_GROUP_1')
    expect(resolveAdminExamId('BANK_EXAMS')).toBe('BANK_EXAMS')
  })
})