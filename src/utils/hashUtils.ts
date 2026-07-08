/**
 * Generates a deterministic SHA-256 hash for a question to enable idempotency.
 * 
 * Includes:
 * - normalized question text
 * - normalized options A, B, C, D
 * - correct option
 * - exam_id
 */
export async function generateQuestionHash(question: {
  question_text_en: string;
  option_a_en: string;
  option_b_en: string;
  option_c_en: string;
  option_d_en: string;
  correct_option: string;
  exam_id: string;
}) {
  const normalize = (str: any) =>
    str?.toString().trim().toLowerCase().replace(/\s+/g, ' ') || '';

  const baseString = [
    normalize(question.question_text_en),
    normalize(question.option_a_en),
    normalize(question.option_b_en),
    normalize(question.option_c_en),
    normalize(question.option_d_en),
    normalize(question.correct_option),
    normalize(question.exam_id),
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(baseString);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
