import { describe, it, expect, beforeEach } from 'vitest'
import { queryCache } from '../utils/queryCache'
import {
  clearSubjectTestCache,
  getCachedSubjects,
  getCachedSubjectsByPaper,
  getCachedSubjectCounts,
  getCachedSubjectCountsByPaper,
  getCachedPapers,
} from './subjectTestService'

const EXAM = 'APPSC_GROUPS'
const paper1 = { id: 'p1', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 1' }
const paper2 = { id: 'p2', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 2' }

beforeEach(() => {
  queryCache.clear()
})

describe('FIND-4 :: clearSubjectTestCache invalidation contract', () => {
  it('clears every relevant subject-test cache key', () => {
    queryCache.set(`subjects_exam_${EXAM}`, ['A'])
    queryCache.set(`appsc_papers_${EXAM}`, [paper1, paper2])
    queryCache.set(`subject_counts_${EXAM}_all`, { A: 40 })
    queryCache.set(`subject_counts_${EXAM}_p1`, { A: 40 })
    queryCache.set(`subjects_paper_p1`, ['A'])
    queryCache.set(`subjects_paper_p2`, ['B'])
    queryCache.set(`min_questions_${EXAM}`, 30)

    clearSubjectTestCache(EXAM)

    expect(queryCache.get(`subjects_exam_${EXAM}`)).toBeNull()
    expect(queryCache.get(`appsc_papers_${EXAM}`)).toBeNull()
    expect(queryCache.get(`subject_counts_${EXAM}_all`)).toBeNull()
    expect(queryCache.get(`subject_counts_${EXAM}_p1`)).toBeNull()
    expect(queryCache.get(`subjects_paper_p1`)).toBeNull()
    expect(queryCache.get(`subjects_paper_p2`)).toBeNull()
    expect(queryCache.get(`min_questions_${EXAM}`)).toBeNull()
  })

  it('preserves unrelated caches (other exams / other features)', () => {
    queryCache.set(`subjects_exam_${EXAM}`, ['A'])
    queryCache.set(`subjects_exam_BANK_EXAMS`, ['BANK'])
    queryCache.set(`subjects_paper_other_exam_p99`, ['OTHER'])
    queryCache.set('some_unrelated_key', { x: 1 })

    clearSubjectTestCache(EXAM)

    expect(queryCache.get(`subjects_exam_${EXAM}`)).toBeNull()
    expect(queryCache.get(`subjects_exam_BANK_EXAMS`)).toEqual(['BANK'])
    expect(queryCache.get(`subjects_paper_other_exam_p99`)).toEqual(['OTHER'])
    expect(queryCache.get('some_unrelated_key')).toEqual({ x: 1 })
  })

  it('no-ops safely for an empty exam selection', () => {
    queryCache.set('subjects_exam_X', ['A'])
    clearSubjectTestCache('')
    expect(queryCache.get('subjects_exam_X')).toEqual(['A'])
  })

  it('force retry produces a fresh fetch (cache invalidated then repopulated)', async () => {
    // Simulate the force path: clear, then refetch through the canonical
    // service which dedups requests on the same key.
    queryCache.set(`subjects_exam_${EXAM}`, ['STALE'])
    clearSubjectTestCache(EXAM)
    expect(getCachedSubjects(EXAM)).toBeNull()

    queryCache.set(`subjects_exam_${EXAM}`, ['FRESH'])
    expect(getCachedSubjects(EXAM)).toEqual(['FRESH'])
  })

  it('stale per-paper subjects are not returned after invalidation', () => {
    queryCache.set(`subjects_paper_p1`, ['STALE_PAPER'])
    queryCache.set(`appsc_papers_${EXAM}`, [paper1])
    clearSubjectTestCache(EXAM)
    expect(getCachedSubjectsByPaper('p1')).toBeNull()
  })

  it('min-question data is refreshed by invalidation', () => {
    queryCache.set(`min_questions_${EXAM}`, 50)
    clearSubjectTestCache(EXAM)
    const viaService = queryCache.get(`min_questions_${EXAM}`)
    expect(viaService).toBeNull()
  })

  it('deduplicated concurrent requests remain effective after invalidation', async () => {
    clearSubjectTestCache(EXAM)
    let calls = 0
    const fn = () => {
      calls += 1
      return Promise.resolve(['A'])
    }
    const [a, b] = await Promise.all([
      queryCache.fetchWithDedup(`subjects_exam_${EXAM}`, fn),
      queryCache.fetchWithDedup(`subjects_exam_${EXAM}`, fn),
    ])
    expect(calls).toBe(1)
    expect(a).toEqual(['A'])
    expect(b).toEqual(['A'])
  })
})

describe('FIND-4 :: cache getters read the exact written keys', () => {
  it('getCachedPapers reads appsc_papers_{exam}', () => {
    queryCache.set(`appsc_papers_${EXAM}`, [paper1])
    expect(getCachedPapers(EXAM)).toEqual([paper1])
  })

  it('getCachedSubjectCounts / ByPaper read subject_counts_{exam}_all / _{exam}_{paper}', () => {
    queryCache.set(`subject_counts_${EXAM}_all`, { A: 10 })
    queryCache.set(`subject_counts_${EXAM}_p1`, { A: 5 })
    expect(getCachedSubjectCounts(EXAM)).toEqual({ A: 10 })
    expect(getCachedSubjectCountsByPaper(EXAM, 'p1')).toEqual({ A: 5 })
  })
})
