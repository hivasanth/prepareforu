/// <reference types="node" />
import { describe, it, expect } from 'vitest'

import { mapDomainError, teacherExamErrorInfo } from '../utils/errorClassification'

describe('M-2: create_attempt domain codes map to canonical UX', () => {
  it('maps EXAM_NOT_STARTED to a non-retryable business state', () => {
    const info = mapDomainError('EXAM_NOT_STARTED', 'EXAM_NOT_STARTED')
    expect(info.code).toBe('EXAM_NOT_STARTED')
    expect(info.category).toBe('business')
    expect(info.retryable).toBe(false)
    expect(info.message).toMatch(/not started yet/i)
  })

  it('maps EXAM_WINDOW_CLOSED to a non-retryable business state', () => {
    const info = mapDomainError('EXAM_WINDOW_CLOSED', 'EXAM_WINDOW_CLOSED')
    expect(info.code).toBe('EXAM_WINDOW_CLOSED')
    expect(info.category).toBe('business')
    expect(info.retryable).toBe(false)
    expect(info.message).toMatch(/window has closed/i)
  })

  it('maps TEACHER_EXAM_NOT_AVAILABLE to a non-retryable business state', () => {
    const info = mapDomainError('TEACHER_EXAM_NOT_AVAILABLE', 'TEACHER_EXAM_NOT_AVAILABLE')
    expect(info.code).toBe('TEACHER_EXAM_NOT_AVAILABLE')
    expect(info.category).toBe('business')
    expect(info.retryable).toBe(false)
    expect(info.message).toMatch(/not currently available/i)
  })

  it('maps UNAUTHORIZED_ACCESS to a non-retryable authorization state', () => {
    const info = mapDomainError('UNAUTHORIZED_ACCESS', 'UNAUTHORIZED_ACCESS')
    expect(info.code).toBe('UNAUTHORIZED_ACCESS')
    expect(info.category).toBe('authorization')
    expect(info.retryable).toBe(false)
  })
})

describe('M-2: teacherExamErrorInfo scans PostgREST message text for stable codes', () => {
  it('detects the token inside a PostgREST error message', () => {
    const err = Object.assign(new Error('ERROR: EXAM_NOT_STARTED'), { code: 'PGRST_FUNCTION_NOT_APPLIED' })
    const info = teacherExamErrorInfo(err)
    expect(info?.code).toBe('EXAM_NOT_STARTED')
    expect(info?.category).toBe('business')
    expect(info?.retryable).toBe(false)
  })

  it('detects UNAUTHORIZED_ACCESS raised by the access helper', () => {
    const info = teacherExamErrorInfo('UNAUTHORIZED_ACCESS')
    expect(info?.code).toBe('UNAUTHORIZED_ACCESS')
    expect(info?.category).toBe('authorization')
  })

  it('returns null when no known teacher-exam domain token is present', () => {
    expect(teacherExamErrorInfo('relation "attempts" does not exist')).toBeNull()
    expect(teacherExamErrorInfo(null)).toBeNull()
    expect(teacherExamErrorInfo(undefined)).toBeNull()
  })
})