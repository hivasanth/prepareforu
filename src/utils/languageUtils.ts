/**
 * LANGUAGE UTILITIES
 * Central source of truth for all multilingual logic.
 * All language resolution MUST go through these helpers.
 *
 * ─── Phase 6 Contract (LOCKED) ───────────────────────────────────────────────
 * _en fields are the ONLY source of truth for question content.
 * Legacy fields (question_text, option_a/b/c/d, explanation) are REMOVED
 * from the database and MUST NOT be reintroduced.
 *
 * Supported languages: 'en' (English) | 'te' (Telugu)
 * Default: 'en'
 * Fallback strategy: Telugu → English (never blank)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type SupportedLanguage = 'en' | 'te';
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

/**
 * Normalizes a language value to a safe SupportedLanguage.
 * Prevents bad values from context/localStorage corrupting the system.
 */
export function normalizeLang(lang: unknown): SupportedLanguage {
  return lang === 'te' ? 'te' : 'en';
}

/**
 * Resolves a single bilingual field value.
 * Guards against whitespace-only Telugu — always falls back to English.
 */
export function resolveLangValue(
  en: string | null | undefined,
  te: string | null | undefined,
  lang: SupportedLanguage
): string {
  const teValid = te != null && te.trim().length > 0;
  if (lang === 'te') return teValid ? te!.trim() : (en?.trim() || '');
  return en?.trim() || '';
}

/**
 * Checks if a question has at least a Telugu question text translation.
 * Strict check: only question_text_te needed for badge/hint purposes.
 */
export function hasTeluguTranslation(question: BilingualQuestion): boolean {
  return !!(question.question_text_te && question.question_text_te.trim().length > 0);
}

/**
 * Maps a raw question object from the database into a display-ready
 * question object for the given language.
 *
 * Preserves ALL original fields (backward compatible).
 * Adds a `display` object with resolved language values.
 */
export function mapQuestionForLang<T extends BilingualQuestion>(
  question: T,
  lang: SupportedLanguage
): T & { display: QuestionDisplay } {
  return {
    ...question,
    display: {
      question_text: resolveLangValue(
        question.question_text_en,
        question.question_text_te,
        lang
      ),
      option_a: resolveLangValue(
        question.option_a_en,
        question.option_a_te,
        lang
      ),
      option_b: resolveLangValue(
        question.option_b_en,
        question.option_b_te,
        lang
      ),
      option_c: resolveLangValue(
        question.option_c_en,
        question.option_c_te,
        lang
      ),
      option_d: resolveLangValue(
        question.option_d_en,
        question.option_d_te,
        lang
      ),
      explanation: resolveLangValue(
        question.explanation_en,
        question.explanation_te,
        lang
      ),
    },
  };
}

/**
 * Maps an array of questions for the given language.
 */
export function mapQuestionsForLang<T extends BilingualQuestion>(
  questions: T[],
  lang: SupportedLanguage
): Array<T & { display: QuestionDisplay }> {
  return questions.map(q => mapQuestionForLang(q, lang));
}


// ─── Type Definitions ────────────────────────────────────────────────────────

/**
 * The bilingual schema for the questions table.
 * Phase 6: _en fields are required. _te fields are optional (admin-filled).
 * Legacy fields (question_text, option_a/b/c/d, explanation) have been removed.
 */
export interface BilingualQuestion {
  // English fields — required, sole source of truth
  question_text_en?: string | null;
  option_a_en?: string | null;
  option_b_en?: string | null;
  option_c_en?: string | null;
  option_d_en?: string | null;
  explanation_en?: string | null;

  // Telugu fields — optional, admin-filled
  question_text_te?: string | null;
  option_a_te?: string | null;
  option_b_te?: string | null;
  option_c_te?: string | null;
  option_d_te?: string | null;
  explanation_te?: string | null;
}

/**
 * The resolved display values for a question in a specific language.
 * Use q.display.* in Telugu-aware rendering components.
 * English-only components read q.question_text_en / q.option_*_en directly.
 */
export interface QuestionDisplay {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  explanation: string;
}

// ─── Data Guard ───────────────────────────────────────────────────────────────

/**
 * Asserts that every question in the array has valid _en content fields.
 * Throws on the first violation so bugs surface at the service layer —
 * before a blank question ever silently renders in the exam UI.
 *
 * Call this after fetching questions from the DB in any service.
 *
 * @example
 *   const questions = await fetchQuestionsForPaper(paperId, subjects);
 *   assertValidEnFields(questions, 'fetchQuestionsForPaper');
 */
export function assertValidEnFields(questions: BilingualQuestion[], context = 'unknown'): void {
  for (const q of questions) {
    const id = (q as any).id ?? '(no id)';
    if (!q.question_text_en?.trim()) {
      throw new Error(`[${context}] Question id=${id} is missing question_text_en. Check DB integrity.`);
    }
    if (!q.option_a_en?.trim() || !q.option_b_en?.trim() ||
        !q.option_c_en?.trim() || !q.option_d_en?.trim()) {
      throw new Error(`[${context}] Question id=${id} has one or more missing option_*_en fields.`);
    }
  }
}
