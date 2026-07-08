import { describe, it, expect } from 'vitest'
import {
  computeQuestionState,
  computeQuestionStates,
  computeExamStatistics,
  computeAnswerStatus,
  convertAnswersRecord,
} from './examStateCalculator'
import type { Question, AttemptAnswer } from '../types/exam.types'

const qs: Question[] = [
  { id: 'q1', exam_id: '', paper_id: '', subject_name: '', correct_option: 'A', difficulty: 'easy', negative_marks: 0 },
  { id: 'q2', exam_id: '', paper_id: '', subject_name: '', correct_option: 'B', difficulty: 'easy', negative_marks: 0 },
  { id: 'q3', exam_id: '', paper_id: '', subject_name: '', correct_option: 'C', difficulty: 'easy', negative_marks: 0 },
]

const makeAnswer = (
  questionId: string,
  selected: 'A' | 'B' | 'C' | 'D' | null,
  correct: 'A' | 'B' | 'C' | 'D',
  isCorrect: boolean | null,
  opts?: { visited?: boolean; markedForReview?: boolean },
): AttemptAnswer => ({
  id: '',
  attempt_id: '',
  question_id: questionId,
  selected_option: selected,
  correct_option: correct,
  is_correct: isCorrect,
  marks_awarded: 0,
  time_spent_secs: 0,
  visited: opts?.visited ?? true,
  marked_for_review: opts?.markedForReview ?? false,
  last_visited_at: null,
})

// ─── computeQuestionState ──────────────────────────────────────────────────────

describe('computeQuestionState', () => {
  it('returns NotVisited for fresh exam', () => {
    const s = computeQuestionState('q1', 0, 0, {}, new Set(), new Set())
    expect(s).toMatchObject({ questionId: 'q1', index: 0, isCurrent: true, isAnswered: false, isMarked: false, isVisited: false, isSkipped: false, isNotVisited: true, selectedAnswer: null })
  })

  it('marks as Current', () => {
    const s = computeQuestionState('q2', 1, 1, {}, new Set(), new Set())
    expect(s.isCurrent).toBe(true)
    expect(s.isNotVisited).toBe(true)
  })

  it('marks as Visited', () => {
    const s = computeQuestionState('q1', 0, 1, {}, new Set(), new Set(['q1']))
    expect(s.isVisited).toBe(true)
    expect(s.isNotVisited).toBe(false)
  })

  it('marks as Answered', () => {
    const s = computeQuestionState('q1', 0, 0, { q1: 'A' }, new Set(), new Set(['q1']))
    expect(s.isAnswered).toBe(true)
    expect(s.isSkipped).toBe(false)
    expect(s.selectedAnswer).toBe('A')
  })

  it('marks as Skipped (visited + not answered + not marked)', () => {
    const s = computeQuestionState('q1', 0, 0, { q1: null }, new Set(), new Set(['q1']))
    expect(s.isVisited).toBe(true)
    expect(s.isAnswered).toBe(false)
    expect(s.isMarked).toBe(false)
    expect(s.isSkipped).toBe(true)
  })

  it('marks as Marked for Review', () => {
    const s = computeQuestionState('q1', 0, 0, {}, new Set(['q1']), new Set(['q1']))
    expect(s.isMarked).toBe(true)
    expect(s.isNotVisited).toBe(false)
  })

  it('marks as Answered+Marked', () => {
    const s = computeQuestionState('q1', 0, 0, { q1: 'B' }, new Set(['q1']), new Set(['q1']))
    expect(s.isAnswered).toBe(true)
    expect(s.isMarked).toBe(true)
  })

  it('prefers Answered+Marked over Marked over Skipped', () => {
    const answeredMarked = computeQuestionState('q1', 0, 0, { q1: 'A' }, new Set(['q1']), new Set(['q1']))
    expect(answeredMarked.isAnswered).toBe(true)
    expect(answeredMarked.isMarked).toBe(true)
    expect(answeredMarked.isSkipped).toBe(false)

    const justMarked = computeQuestionState('q1', 0, 0, { q1: null }, new Set(['q1']), new Set(['q1']))
    expect(justMarked.isMarked).toBe(true)
    expect(justMarked.isSkipped).toBe(false)

    const skipped = computeQuestionState('q1', 0, 0, { q1: null }, new Set(), new Set(['q1']))
    expect(skipped.isSkipped).toBe(true)
  })

  it('handles not-in-map selectedAnswers as null', () => {
    const s = computeQuestionState('q1', 0, 0, {}, new Set(), new Set(['q1']))
    expect(s.selectedAnswer).toBe(null)
    expect(s.isAnswered).toBe(false)
    expect(s.isSkipped).toBe(true)
  })

  it('handles invalid question id gracefully', () => {
    const s = computeQuestionState('nonexistent', 99, 0, {}, new Set(), new Set())
    expect(s.questionId).toBe('nonexistent')
    expect(s.index).toBe(99)
    expect(s.isNotVisited).toBe(true)
  })
})

// ─── computeQuestionStates ─────────────────────────────────────────────────────

describe('computeQuestionStates', () => {
  it('returns states for all questions', () => {
    const states = computeQuestionStates(qs, 0, { q1: 'A' }, new Set(['q2']), new Set(['q1', 'q2']))
    expect(states).toHaveLength(3)
    expect(states[0].isAnswered).toBe(true)
    expect(states[1].isMarked).toBe(true)
    expect(states[2].isNotVisited).toBe(true)
  })
})

// ─── computeAnswerStatus ───────────────────────────────────────────────────────

describe('computeAnswerStatus', () => {
  it('returns not_visited for null/undefined answer', () => {
    const r1 = computeAnswerStatus(null)
    expect(r1).toEqual({ isCorrect: null, isSkipped: false, isNotVisited: true, status: 'not_visited' })

    const r2 = computeAnswerStatus(undefined)
    expect(r2).toEqual({ isCorrect: null, isSkipped: false, isNotVisited: true, status: 'not_visited' })
  })

  it('returns skipped for answer with null selected_option (visited=true)', () => {
    const a = makeAnswer('q1', null, 'A', null)
    const r = computeAnswerStatus(a)
    expect(r).toEqual({ isCorrect: null, isSkipped: true, isNotVisited: false, status: 'skipped' })
  })

  it('returns not_visited for answer with visited=false even if selected_option null', () => {
    const a = makeAnswer('q1', null, 'A', null, { visited: false })
    const r = computeAnswerStatus(a)
    expect(r).toEqual({ isCorrect: null, isSkipped: false, isNotVisited: true, status: 'not_visited' })
  })

  it('returns correct for correct answer', () => {
    const a = makeAnswer('q1', 'A', 'A', true)
    const r = computeAnswerStatus(a)
    expect(r).toEqual({ isCorrect: true, isSkipped: false, isNotVisited: false, status: 'correct' })
  })

  it('returns wrong for incorrect answer', () => {
    const a = makeAnswer('q1', 'B', 'A', false)
    const r = computeAnswerStatus(a)
    expect(r).toEqual({ isCorrect: false, isSkipped: false, isNotVisited: false, status: 'wrong' })
  })
})

// ─── convertAnswersRecord ──────────────────────────────────────────────────────

describe('convertAnswersRecord', () => {
  it('converts answered questions to AttemptAnswer array', () => {
    const result = convertAnswersRecord(qs, { q1: 'A', q2: null })
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ question_id: 'q1', selected_option: 'A', is_correct: true })
    expect(result[1]).toMatchObject({ question_id: 'q2', selected_option: null, is_correct: null })
    expect(result[2]).toMatchObject({ question_id: 'q3', selected_option: null, is_correct: null })
  })

  it('handles empty questions array', () => {
    const result = convertAnswersRecord([], {})
    expect(result).toHaveLength(0)
  })

  it('handles missing entries as null', () => {
    const result = convertAnswersRecord(qs, {})
    expect(result[0].selected_option).toBe(null)
    expect(result[1].selected_option).toBe(null)
  })
})

// ─── computeExamStatistics ─────────────────────────────────────────────────────

describe('computeExamStatistics (live, no answerDetails)', () => {
  it('returns zeros for empty exam', () => {
    const stats = computeExamStatistics([], {}, new Set(), new Set())
    expect(stats).toEqual({ total: 0, answered: 0, correct: 0, wrong: 0, skipped: 0, marked: 0, visited: 0, notVisited: 0, score: 0, accuracy: 0, timeTaken: 0 })
  })

  it('returns durationSeconds as timeTaken', () => {
    const stats = computeExamStatistics([], {}, new Set(), new Set(), undefined, 125)
    expect(stats.timeTaken).toBe(125)
  })

  it('counts answered correctly', () => {
    const stats = computeExamStatistics(qs, { q1: 'A', q2: 'B' }, new Set(), new Set(['q1', 'q2']))
    expect(stats.answered).toBe(2)
    expect(stats.visited).toBe(2)
    expect(stats.notVisited).toBe(1)
    expect(stats.skipped).toBe(0)
  })

  it('counts skipped (visited - answered)', () => {
    const stats = computeExamStatistics(qs, { q1: 'A', q2: null, q3: 'C' }, new Set(), new Set(['q1', 'q2', 'q3']))
    expect(stats.answered).toBe(2)
    expect(stats.visited).toBe(3)
    expect(stats.skipped).toBe(1)
    expect(stats.notVisited).toBe(0)
  })

  it('counts marked', () => {
    const stats = computeExamStatistics(qs, { q1: 'A' }, new Set(['q2', 'q3']), new Set(['q1', 'q2']))
    expect(stats.marked).toBe(2)
  })

  it('handles all not visited', () => {
    const stats = computeExamStatistics(qs, {}, new Set(), new Set())
    expect(stats.answered).toBe(0)
    expect(stats.visited).toBe(0)
    expect(stats.notVisited).toBe(3)
    expect(stats.skipped).toBe(0)
  })

  it('handles all answered', () => {
    const stats = computeExamStatistics(qs, { q1: 'A', q2: 'B', q3: 'C' }, new Set(), new Set(['q1', 'q2', 'q3']))
    expect(stats.answered).toBe(3)
    expect(stats.notVisited).toBe(0)
    expect(stats.skipped).toBe(0)
  })

  it('handles mixed states', () => {
    const stats = computeExamStatistics(
      qs,
      { q1: 'A', q3: null },
      new Set(['q2']),
      new Set(['q1', 'q2', 'q3']),
    )
    expect(stats.answered).toBe(1)
    expect(stats.marked).toBe(1)
    expect(stats.visited).toBe(3)
    expect(stats.skipped).toBe(2)
    expect(stats.notVisited).toBe(0)
  })
})

describe('computeExamStatistics (with answerDetails)', () => {
  it('computes correct and wrong from answer records', () => {
    const details: AttemptAnswer[] = [
      makeAnswer('q1', 'A', 'A', true),
      makeAnswer('q2', 'B', 'C', false),
      makeAnswer('q3', null, 'D', null),
    ]
    const stats = computeExamStatistics(qs, {}, new Set(), new Set(), details)
    expect(stats.correct).toBe(1)
    expect(stats.wrong).toBe(1)
    expect(stats.answered).toBe(2)
    expect(stats.skipped).toBe(1)
    expect(stats.visited).toBe(3)
    expect(stats.notVisited).toBe(0)
  })

  it('returns durationSeconds as timeTaken with answerDetails', () => {
    const stats = computeExamStatistics([], {}, new Set(), new Set(), [], 3600)
    expect(stats.timeTaken).toBe(3600)
  })

  it('marks correct from answer records (using marked_for_review on record)', () => {
    const details: AttemptAnswer[] = [
      makeAnswer('q1', 'A', 'A', true),
      makeAnswer('q2', 'B', 'B', true, { markedForReview: true }),
      makeAnswer('q3', null, 'C', null),
    ]
    const stats = computeExamStatistics(qs, {}, new Set(), new Set(), details)
    expect(stats.correct).toBe(2)
    expect(stats.wrong).toBe(0)
    expect(stats.marked).toBe(1)
    expect(stats.skipped).toBe(1)
  })

  it('computes accuracy as correct / total', () => {
    const details: AttemptAnswer[] = [
      makeAnswer('q1', 'A', 'A', true),
      makeAnswer('q2', 'B', 'B', true),
      makeAnswer('q3', null, 'C', null),
    ]
    const stats = computeExamStatistics(qs, {}, new Set(), new Set(), details)
    expect(stats.accuracy).toBe(67)
  })

  it('handles empty answerDetails', () => {
    const stats = computeExamStatistics(qs, {}, new Set(), new Set(), [])
    expect(stats.visited).toBe(0)
    expect(stats.notVisited).toBe(3)
  })

  it('handles single question', () => {
    const oneQ = qs.slice(0, 1)
    const details: AttemptAnswer[] = [
      makeAnswer('q1', 'A', 'A', true),
    ]
    const stats = computeExamStatistics(oneQ, {}, new Set(), new Set(), details)
    expect(stats.total).toBe(1)
    expect(stats.correct).toBe(1)
    expect(stats.accuracy).toBe(100)
  })

  it('handles last question only (partial answerDetails)', () => {
    const details: AttemptAnswer[] = [
      makeAnswer('q3', 'C', 'C', true),
    ]
    const stats = computeExamStatistics(qs, {}, new Set(), new Set(), details)
    expect(stats.visited).toBe(1)
    expect(stats.correct).toBe(1)
    expect(stats.notVisited).toBe(2)
  })

  it('all correct — 100% accuracy', () => {
    const details: AttemptAnswer[] = [
      makeAnswer('q1', 'A', 'A', true),
      makeAnswer('q2', 'B', 'B', true),
      makeAnswer('q3', 'C', 'C', true),
    ]
    const stats = computeExamStatistics(qs, {}, new Set(), new Set(), details)
    expect(stats.correct).toBe(3)
    expect(stats.accuracy).toBe(100)
  })

  it('all skipped — 0% accuracy', () => {
    const details: AttemptAnswer[] = [
      makeAnswer('q1', null, 'A', null),
      makeAnswer('q2', null, 'B', null),
      makeAnswer('q3', null, 'C', null),
    ]
    const stats = computeExamStatistics(qs, {}, new Set(), new Set(), details)
    expect(stats.skipped).toBe(3)
    expect(stats.answered).toBe(0)
    expect(stats.accuracy).toBe(0)
  })

  it('score from marks_awarded', () => {
    const details: AttemptAnswer[] = [
      { ...makeAnswer('q1', 'A', 'A', true), marks_awarded: 4 },
      { ...makeAnswer('q2', 'B', 'C', false), marks_awarded: -1 },
    ]
    const stats = computeExamStatistics(qs, {}, new Set(), new Set(), details)
    expect(stats.score).toBe(3)
  })
})
