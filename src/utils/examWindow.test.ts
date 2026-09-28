import { describe, it, expect } from 'vitest'
import { classifyExamWindow, type ExamWindowInput } from './examWindow'

const iso = (s: string) => new Date(s)

describe('classifyExamWindow', () => {
  const within = (nowIso: string, startIso: string, endIso: string) =>
    classifyExamWindow({ start_time: startIso, end_time: endIso } as ExamWindowInput, iso(nowIso))

  it('classified upcoming when before start', () => {
    expect(within('2026-01-01T09:30:00Z', '2026-01-01T10:00:00Z', '2026-01-01T12:00:00Z')).toBe('upcoming')
  })

  it('classified upcoming at exactly start - 1s', () => {
    expect(within('2026-01-01T09:59:59Z', '2026-01-01T10:00:00Z', '2026-01-01T12:00:00Z')).toBe('upcoming')
  })

  it('classified live exactly at start', () => {
    expect(within('2026-01-01T10:00:00Z', '2026-01-01T10:00:00Z', '2026-01-01T12:00:00Z')).toBe('live')
  })

  it('classified live 1s after start', () => {
    expect(within('2026-01-01T10:00:01Z', '2026-01-01T10:00:00Z', '2026-01-01T12:00:00Z')).toBe('live')
  })

  it('classified live mid-window', () => {
    expect(within('2026-01-01T11:00:00Z', '2026-01-01T10:00:00Z', '2026-01-01T12:00:00Z')).toBe('live')
  })

  it('classified live at exactly end (existing app boundary)', () => {
    expect(within('2026-01-01T12:00:00Z', '2026-01-01T10:00:00Z', '2026-01-01T12:00:00Z')).toBe('live')
  })

  it('classified published 1s after end', () => {
    expect(within('2026-01-01T12:00:01Z', '2026-01-01T10:00:00Z', '2026-01-01T12:00:00Z')).toBe('published')
  })

  it('classified published after end', () => {
    expect(within('2026-01-01T12:01:00Z', '2026-01-01T10:00:00Z', '2026-01-01T12:00:00Z')).toBe('published')
  })

  it('handles midnight crossing', () => {
    expect(within('2026-01-02T00:30:00Z', '2026-01-01T23:00:00Z', '2026-01-02T01:00:00Z')).toBe('live')
  })

  it('handles multi-day windows', () => {
    expect(within('2026-01-03T12:00:00Z', '2026-01-01T00:00:00Z', '2026-01-05T00:00:00Z')).toBe('live')
  })

  it('handles live when browser tz differs from stored UTC', () => {
    const storedUtcStart = '2026-06-15T05:00:00Z' // IST 10:30 AM
    const storedUtcEnd = '2026-06-15T06:30:00Z'   // IST 12:00 PM
    // observer in Asia/Kolkata sees the window as 10:30-12:00; comparison uses instants
    expect(classifyExamWindow(
      { start_time: storedUtcStart, end_time: storedUtcEnd },
      new Date('2026-06-15T06:00:00Z'),
    )).toBe('live')
  })

  it('missing start_time is never live/upcoming', () => {
    expect(classifyExamWindow({ start_time: null, end_time: '2026-01-01T12:00:00Z' }, iso('2026-01-01T09:00:00Z'))).toBe('published')
  })

  it('missing end_time is never live', () => {
    expect(classifyExamWindow({ start_time: '2026-01-01T10:00:00Z', end_time: null }, iso('2026-01-01T11:00:00Z'))).toBe('published')
  })

  it('invalid dates are never live', () => {
    expect(classifyExamWindow({ start_time: 'not-a-date', end_time: '2026-01-01T12:00:00Z' }, iso('2026-01-01T11:00:00Z'))).toBe('published')
  })

  it('end before start is never live/upcoming', () => {
    expect(classifyExamWindow({ start_time: '2026-01-02T00:00:00Z', end_time: '2026-01-01T00:00:00Z' }, iso('2026-01-01T00:30:00Z'))).toBe('published')
  })
})
