/**
 * Controlled name normalization for hierarchy duplicate detection (§22).
 * NFC unicode normalization + trim + collapse of repeated internal whitespace.
 * NO fuzzy matching: two names are duplicates only when their normalized
 * forms are byte-equal.
 */
export function normalizeHierarchyName(raw: string): string {
  return raw.normalize('NFC').trim().replace(/\s+/g, ' ')
}

export function isBlankName(raw: string): boolean {
  return normalizeHierarchyName(raw).length === 0
}
