/**
 * EXAM SESSION STORE
 * Stores language selection per exam attempt — locked for the duration of the session.
 * Uses sessionStorage so it survives page refreshes within the tab but NOT across tabs.
 *
 * ⚠️ DO NOT use LanguageContext here. Language is part of the exam session, not a UI preference.
 */

import { mapQuestionsForLang, normalizeLang } from '../utils/languageUtils';
import type { SupportedLanguage } from '../utils/languageUtils';
import type { Question } from '../types/exam.types';

const SESSION_KEY = 'pfu_exam_session';

// ─── Session Shape ─────────────────────────────────────────────────────────────

export interface ExamSession {
  paperId: string;
  language: SupportedLanguage;
  startedAt: string;
  questionCount: number;
}

// ─── Lock ──────────────────────────────────────────────────────────────────────

/**
 * Lock language for an exam session. Call BEFORE starting the attempt.
 * Clears any previous stale session automatically.
 */
export function lockExamLanguage(
  paperId: string,
  lang: SupportedLanguage,
  questionCount: number
): void {
  const session: ExamSession = {
    paperId,
    language: normalizeLang(lang), // Validate on write
    startedAt: new Date().toISOString(),
    questionCount,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// ─── Read ──────────────────────────────────────────────────────────────────────

/**
 * Get the locked language for a specific exam session.
 * Validates paperId match. Returns 'en' if mismatched or missing.
 */
export function getExamSessionLanguage(paperId: string): SupportedLanguage {
  try {
    const session = _readSession();
    if (!session || session.paperId !== paperId) return 'en';
    return normalizeLang(session.language); // Validate on read
  } catch {
    return 'en';
  }
}

/**
 * Get exam language without a paperId (for ReviewPage / ResultsPage).
 * Falls back to 'en' safely.
 */
export function getExamSessionLanguageAny(): SupportedLanguage {
  try {
    const session = _readSession();
    return session ? normalizeLang(session.language) : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Get the full current session metadata (for mismatch detection on reload).
 */
export function getExamSession(): ExamSession | null {
  return _readSession();
}

// ─── Clear ─────────────────────────────────────────────────────────────────────

/**
 * Clear the exam session lock.
 * Call: (1) after successful submission, (2) at the START of initExam to prevent stale leakage.
 */
export function clearExamSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Resolution ────────────────────────────────────────────────────────────────

/**
 * Resolve all questions for display in the locked session language.
 * Call ONCE after questions are fetched and language is locked.
 * Returns a frozen array to prevent accidental mutation.
 *
 * Phase 6: All _en fields are the sole source of truth.
 * For Telugu sessions, mapQuestionsForLang populates the .display object.
 * The UI reads directly from _en / _te fields — no legacy aliases needed.
 */
export function resolveQuestionsForSession(
  questions: Question[],
  paperId: string
): readonly Question[] {
  const lang = getExamSessionLanguage(paperId);

  if (lang === 'en') {
    // English: questions are already correct — freeze and return as-is
    return Object.freeze([...questions]);
  }

  // Telugu: attach .display object with resolved language values (fallback handled internally)
  const mapped = mapQuestionsForLang(questions, lang);
  return Object.freeze(mapped);
}

// ─── Detection ─────────────────────────────────────────────────────────────────

/**
 * Returns true ONLY if every question in the set has a COMPLETE Telugu translation.
 * Requires: question_text_te + all four option_*_te fields to be non-empty.
 *
 * Partial Telugu papers (even one question missing) → force English.
 * This ensures the exam is always in ONE language — never a mixed experience.
 *
 * ✔ Full Telugu   → show Telugu option (all questions qualify)
 * ✗ Partial Telugu → disable Telugu option (force English)
 */
export function detectTeluguAvailability(questions: Question[]): boolean {
  if (questions.length === 0) return false;
  return questions.every(q =>
    !!(q.question_text_te?.trim()) &&
    !!(q.option_a_te?.trim()) &&
    !!(q.option_b_te?.trim()) &&
    !!(q.option_c_te?.trim()) &&
    !!(q.option_d_te?.trim())
  );
}

// ─── Internal ──────────────────────────────────────────────────────────────────

function _readSession(): ExamSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ExamSession;
  } catch {
    return null;
  }
}
