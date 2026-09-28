/**
 * Upload-method persistence contract (?upload=single | ?upload=bulk).
 *
 * The selected ingestion method on /admin/upload is presentation state that
 * must survive reload and back/forward navigation, so it lives in the URL as
 * the SAME sourcing format the rest of the page context uses (useAdminFilters
 * owns exam/paper/subject; this module owns the method). It is deliberately
 * NOT included in any query cache namespace — the cache stays keyed by data
 * context only (count/topics), never by upload method.
 */

/** Supported upload-method values persisted in the page URL (?upload=…). */
export type UploadMethod = 'single' | 'bulk'

/**
 * Single source of truth for ?upload= parsing.
 * Missing, empty, or any unrecognized value → null (Method Selection).
 * Never returns an invalid value; the page can only render a valid state.
 */
export function parseUploadMethodParam(raw: string | null): UploadMethod | null {
  return raw === 'single' || raw === 'bulk' ? raw : null
}

/**
 * Produces the next URLSearchParams for an upload-method change.
 * Returns null when nothing would change (caller skips the update).
 *
 * A null type REMOVES only the `upload` key — every other param (exam, paper,
 * subject, …) survives, so Back to Selection never destroys page context.
 */
export function applyUploadMethodParam(
  params: URLSearchParams,
  type: UploadMethod | null
): URLSearchParams | null {
  const current = params.get('upload')
  if (type === null) {
    if (current === null) return null
    const next = new URLSearchParams(params)
    next.delete('upload')
    return next
  }
  if (current === type) return null
  const next = new URLSearchParams(params)
  next.set('upload', type)
  return next
}