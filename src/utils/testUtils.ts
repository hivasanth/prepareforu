export function cleanOptionText(text: string): string {
  if (typeof text !== 'string') return text;
  return text.replace(/^[a-d]\s*[.)]\s*/i, '').trim();
}
