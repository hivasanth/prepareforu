/**
 * Generates a deterministic SHA-256 hash for a question to enable idempotency.
 * 
 * DEF-3 fix: includes paper_id and subject_name to prevent cross-context collisions.
 * A question with identical content in different paper/subject contexts will produce
 * different hashes.
 * 
 * M-06 fix: includes topic_en so two identical questions in different topics do not
 * collide. Same text/options in a different topic is a distinct question — the hash
 * must reflect that or ON CONFLICT (content_hash) DO NOTHING would wrongly reject it.
 * 
 * Includes:
 * - normalized question text
 * - normalized options A, B, C, D
 * - correct option
 * - exam_id
 * - paper_id
 * - subject_name
 * - topic_en
 */
import { sha256 as sha256Fallback } from 'js-sha256'

/**
 * SHA-256 hex digest via the canonical single implementation.
 *
 * Prefers the Web Crypto API (`crypto.subtle.digest`) and falls back to the
 * vetted zero-dependency `js-sha256` implementation on non-secure origins
 * (plain-HTTP localhost LAN IPs expose no `crypto.subtle`). Both paths produce
 * the exact same lowercase hex digest, so hashing is byte-identical wherever it
 * runs.
 */
function sha256WithWebCrypto(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  return crypto.subtle.digest('SHA-256', data).then((hashBuffer) => {
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  })
}

export async function sha256Hex(input: string): Promise<string> {
  // `crypto.subtle` only exists on secure contexts. The typed lib says it is
  // always present, but plain-HTTP LAN origin runtimes genuinely lack it, so
  // the optional-subtle cast is required (and avoids TS2774 on the `?.`).
  const subtle = (crypto as Partial<Crypto>).subtle
  if (typeof subtle?.digest === 'function') {
    try {
      return await sha256WithWebCrypto(input)
    } catch {
      // Web Crypto failed for a reason the fallback can still serve.
    }
  }
  return sha256Fallback(input)
}

export async function generateQuestionHash(question: {
  question_text_en: string;
  option_a_en: string;
  option_b_en: string;
  option_c_en: string;
  option_d_en: string;
  correct_option: string;
  exam_id: string;
  paper_id?: string | null;
  subject_name?: string | null;
  topic_en?: string | null;
}) {
  const normalize = (str: unknown) =>
    str?.toString().trim().toLowerCase().replace(/\s+/g, ' ') || '';

  const baseString = [
    normalize(question.question_text_en),
    normalize(question.option_a_en),
    normalize(question.option_b_en),
    normalize(question.option_c_en),
    normalize(question.option_d_en),
    normalize(question.correct_option),
    normalize(question.exam_id),
    normalize(question.paper_id),
    normalize(question.subject_name),
    normalize(question.topic_en),
].join('|');

  return sha256Hex(baseString);
}
