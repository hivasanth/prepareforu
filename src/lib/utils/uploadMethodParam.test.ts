import { describe, it, expect } from 'vitest'
import { parseUploadMethodParam, applyUploadMethodParam } from './uploadMethodParam'

describe('parseUploadMethodParam — ?upload= contract', () => {
  it('missing param → Method Selection (null)', () => {
    expect(parseUploadMethodParam(null)).toBeNull()
  })

  it('?upload=single → single', () => {
    expect(parseUploadMethodParam('single')).toBe('single')
  })

  it('?upload=bulk → bulk', () => {
    expect(parseUploadMethodParam('bulk')).toBe('bulk')
  })

  it('invalid value → Method Selection (null), never a broken state', () => {
    expect(parseUploadMethodParam('foo')).toBeNull()
    expect(parseUploadMethodParam('Single')).toBeNull()
    expect(parseUploadMethodParam('both')).toBeNull()
  })

  it('empty value (?upload=) → Method Selection (null)', () => {
    expect(parseUploadMethodParam('')).toBeNull()
  })
})

describe('applyUploadMethodParam — URL transitions', () => {
  const context = new URLSearchParams({ exam: 'APPSC_GROUP_1', paper: '926c7d30-add2-4d03-a040-f011e9282562', subject: 'History and Culture' })

  it('selecting single sets only upload=single, preserving context', () => {
    const next = applyUploadMethodParam(context, 'single')
    expect(next).not.toBeNull()
    expect(next!.get('upload')).toBe('single')
    expect(next!.get('exam')).toBe('APPSC_GROUP_1')
    expect(next!.get('paper')).toBe('926c7d30-add2-4d03-a040-f011e9282562')
    expect(next!.get('subject')).toBe('History and Culture')
  })

  it('selecting bulk overwrites a prior method (no stale double value)', () => {
    const single = applyUploadMethodParam(context, 'single')!
    const next = applyUploadMethodParam(single, 'bulk')
    expect(next).not.toBeNull()
    expect(next!.get('upload')).toBe('bulk')
    expect(next!.getAll('upload')).toHaveLength(1)
    expect(next!.get('exam')).toBe('APPSC_GROUP_1')
  })

  it('re-selecting the same method is a no-op (returns null)', () => {
    const single = applyUploadMethodParam(context, 'single')!
    expect(applyUploadMethodParam(single, 'single')).toBeNull()
  })

  it('Back to Selection removes ONLY upload, keeping exam/paper/subject', () => {
    const bulk = applyUploadMethodParam(context, 'bulk')!
    const next = applyUploadMethodParam(bulk, null)
    expect(next).not.toBeNull()
    expect(next!.has('upload')).toBe(false)
    expect(next!.toString()).toBe(context.toString())
  })

  it('Back with no upload param is a no-op (returns null)', () => {
    expect(applyUploadMethodParam(context, null)).toBeNull()
  })
})