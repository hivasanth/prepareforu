import { describe, it, expect } from 'vitest'
import { normalizeError, classifyError, categoryFromCode } from './errorClassification'

describe('errorClassification :: server recognition (FIND-3 regression)', () => {
  it('classifies "An internal server error has occurred" as server', () => {
    const err = normalizeError(new Error('An internal server error has occurred'))
    expect(err.category).toBe('server')
    expect(err.code).toBe('SERVER_ERROR')
    expect(err.title).toBe('Server Error')
    expect(err.retryable).toBe(true)
  })

  it('classifies "Internal Server Error" (capitalized) as server', () => {
    const err = normalizeError(new Error('Internal Server Error'))
    expect(err.category).toBe('server')
  })

  it('classifies bare "internal error" as server', () => {
    const err = normalizeError(new Error('internal error'))
    expect(err.category).toBe('server')
  })

  it('still classifies numeric 500 / 502 server failures', () => {
    expect(normalizeError(new Error('HTTP 500 status')).category).toBe('server')
    expect(normalizeError(new Error('502 Bad Gateway')).category).toBe('server')
    expect(normalizeError({ message: 'boom', status: 500 }).category).toBe('server')
    expect(normalizeError({ message: 'boom', statusCode: 503 }).category).toBe('server')
  })

  it('does not mis-classify an unrelated message as server', () => {
    const err = normalizeError(new Error('Failed to load exam papers.'))
    expect(err.category).toBe('unknown')
    expect(err.title).toBe('Unexpected Error')
  })

  it('keeps network / auth / authorization classifications intact', () => {
    expect(normalizeError(new Error('Failed to fetch')).category).toBe('network')
    expect(normalizeError(new Error('UNAUTHORIZED_ACCESS: Admin role required')).category).toBe('authorization')
    expect(normalizeError({ message: 'JWT expired during fetch attempt', status: 401 }).category).toBe('authentication')
  })
})

describe('errorClassification :: classifyError + categoryFromCode', () => {
  it('classifyError returns the server category for internal server error', () => {
    const out = classifyError(new Error('An internal server error has occurred'))
    expect(out.category).toBe('server')
    expect(out.code).toBe('SERVER_ERROR')
  })

  it('categoryFromCode maps SERVER_ERROR back to server', () => {
    expect(categoryFromCode('SERVER_ERROR')).toBe('server')
  })
})
