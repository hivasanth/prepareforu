import type { DiagramData } from '../../../types/exam.types';

export type { DiagramData };

// Server-enforced maximum questions per exam (H1 in the hardened RPC). This is
// the SINGLE source of truth for the wizard's own caps (custom count input,
// JSON-paste batch limit, review add-question, publish-time guard) so the
// client never drifts from what the database will actually accept.
export const MAX_QUESTIONS = 100

export interface QuestionData {
  // Stable client-side identity for React keys during edit/delete/add — a
  // business field, never persisted to the database (stripped at the service
  // boundary before the RPC payload is formed). display_order remains the
  // canonical ordering field.
  client_id: string
  question_text_en?: string
  question_text_te?: string
  option_a_en?: string
  option_a_te?: string
  option_b_en?: string
  option_b_te?: string
  option_c_en?: string
  option_c_te?: string
  option_d_en?: string
  option_d_te?: string
  explanation_en?: string
  explanation_te?: string
  correct_option: 'A' | 'B' | 'C' | 'D'
  display_order: number
  difficulty?: 'easy' | 'medium' | 'hard'
  diagram?: DiagramData
}

// Stable, collision-resistant client question identifier (React key + edit
// identity). Not persisted. Fallback provided for older runtimes that lack
// crypto.randomUUID (e.g. some test jsdom environments).
export function newQuestionClientId(): string {
  const c = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return c
}

// Strip transient client UI fields before the payload reaches the RPC so no
// editor-only state ever leaks into the database write.
export function toRpcQuestion(q: QuestionData): Omit<QuestionData, 'client_id'> {
  const safe = { ...q } as Record<string, unknown>
  delete safe.client_id
  return safe as Omit<QuestionData, 'client_id'>
}

// Opens an external destination in a new tab. Returns true ONLY when a window
// was actually obtained — i.e. the popup was not blocked. Callers must decide
// success/failure from this return value (never assume the popup opened).
//
// Deliberately NO feature string: passing `noopener`/`noreferrer` in the
// FEATURES argument makes window.open() return null even on success (the
// browser drops the reference for an opener-less window), which would turn every
// successful launch into a false "blocked" failure. Security equivalence is
// restored on the returned handle by severing its opener reference (`opener` is
// still writable cross-origin; the referer trade-off matches the codebase
// precedent in AIToolCards.tsx for the same fixed trusted destinations).
export function openExternalWindow(url: string): boolean {
  try {
    const win = window.open(url, '_blank')
    if (win) {
      win.opener = null
    }
    return win !== null
  } catch {
    return false
  }
}

// Parsed-JSON report carried from Step 2 → Step 3 so the review header can
// show what was accepted, rejected, and deduplicated against the requested
// count. All fields are informational only — the value list is authoritative.
export interface ParseReport {
  requested: number
  received: number
  accepted: number
  duplicateRows: number
  invalidRows: number
  invalidSamples: string[]
}

export interface ExamConfig {
  title: string
  start_time: string
  end_time: string
  duration_minutes: number
  marks_per_question: number
  negative_mark_value: number
}

export const STEPS = [
  { n: 1, label: 'Prompt' },
  { n: 2, label: 'Paste JSON' },
  { n: 3, label: 'Review' },
  { n: 4, label: 'Setup' },
  { n: 5, label: 'Publish' }
]

export function getLocalISOTime(): string {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

// Add `minutes` to a wall-clock ISO string ("YYYY-MM-DDTHH:mm", no offset —
// exactly what the substring helpers above produce). `Date` handles day/hour
// rollover; we re-encode back to the caller's local wall clock so the picker
// never sees a shifted timezone.
export function addMinutesLocalISO(localISO: string, minutes: number): string {
  const d = new Date(localISO)
  if (Number.isNaN(d.getTime())) return localISO
  d.setMinutes(d.getMinutes() + minutes)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

// Convert a naive wall-clock ISO string to a UTC instant ("...Z"). The wizard
// stores wall-clock values for editing; the service boundary converts to UTC
// so Postgres timestamptz columns are never misinterpreted as UTC wall time.
export function localISOToUTC(localISO: string): string {
  const d = new Date(localISO)
  return Number.isNaN(d.getTime()) ? localISO : d.toISOString()
}

// ─── Duplicate detection (language-safe) ──────────────────────────────────────
// Unicode-aware: preserves Telugu chars, only trims/collapses whitespace and
// lowercases Latin letters. Text+options+correct option form the identity.
function normalizeDupKey(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase()
}

function identityOf(raw: unknown): string {
  const q = (raw ?? {}) as Record<string, unknown>
  const txt = String(q.question_text_en ?? q.question_text ?? q.question ?? '')
  const opt = (k: string) => String(q[`option_${k}_en`] ?? q[`option_${k}`] ?? '')
  const correct = String(q.correct_option ?? q.correct ?? '').trim().toUpperCase()
  return [txt, opt('a'), opt('b'), opt('c'), opt('d'), correct]
    .map(normalizeDupKey)
    .join('\u0000')
}

// Map of row index → first-occurrence index for rows that repeat an earlier
// question. Rows not in the map are the canonical copies.
export function computeDuplicateRedundancy(rows: unknown[]): Map<number, number> {
  const seen = new Map<string, number>()
  const duplicates = new Map<number, number>()
  rows.forEach((raw, i) => {
    const key = identityOf(raw)
    const first = seen.get(key)
    if (first === undefined) {
      seen.set(key, i)
    } else {
      duplicates.set(i, first)
    }
  })
  return duplicates
}

export function getPromptText(count: number): string {
  return `You are a strict JSON generator for a production exam system. Your task is to generate high-quality bilingual (English + Telugu) multiple-choice questions for competitive exams like APPSC and UPSC. Generate EXACTLY ${count} questions.
      
Each question must follow this JSON schema:
{
"question_text_en": "string",
"question_text_te": "string",
"option_a_en": "string",
"option_a_te": "string",
"option_b_en": "string",
"option_b_te": "string",
"option_c_en": "string",
"option_c_te": "string",
"option_d_en": "string",
"option_d_te": "string",
"correct_option": "A",
"explanation_en": "string",
"explanation_te": "string"
}

Return ONLY the JSON array. Do not include markdown blocks or any other text.`
}

export function safeParse(str: string): unknown[] {
  const trimmed = str.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const jsonRegex = /\[\s*\{[\s\S]*\}\s*\]/
    const match = trimmed.match(jsonRegex)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        const cleaned = trimmed.replace(/```json/gi, '').replace(/```/g, '').trim()
        try {
          return JSON.parse(cleaned)
        } catch {
          throw new Error('JSON structure is corrupted. Please ensure the AI output follows the requested format exactly.')
        }
      }
    }
    throw new Error('No valid JSON array found. Make sure you copied the entire code block from the AI.')
  }
}

export function getTypo(breakpoint: string, element: string): string {
  const scales: Record<string, Record<string, number>> = {
    title:     { xs: 18, sm: 20, md: 22, lg: 24, xl: 26 },
    stepLabel: { xs: 10, sm: 11, md: 12, lg: 12, xl: 13 },
    body:      { xs: 12, sm: 13, md: 14, lg: 15, xl: 15 },
    json:      { xs: 11, sm: 13, md: 14, lg: 14, xl: 14 },
    cardQ:     { xs: 12, sm: 14, md: 15, lg: 16, xl: 16 },
    cardOpt:   { xs: 11, sm: 13, md: 14, lg: 15, xl: 15 },
    cardExpl:  { xs: 10, sm: 12, md: 13, lg: 14, xl: 14 }
  }
  return `${scales[element][breakpoint] || scales[element].xs}px`
}

export function getDimension(breakpoint: string, element: string): number {
  const scales: Record<string, Record<string, number>> = {
    buttonH:     { xs: 36, sm: 38, md: 40, lg: 42, xl: 42 },
    jsonH:       { xs: 200, sm: 250, md: 280, lg: 300, xl: 300 },
    cardPadding: { xs: 10, sm: 12, md: 14, lg: 16, xl: 16 }
  }
  return scales[element][breakpoint] || scales[element].xs
}
