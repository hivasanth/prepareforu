/**
 * Canonical clipboard write helper (single implementation for the whole app).
 *
 * Prefers the async Clipboard API (`navigator.clipboard.writeText`) and falls
 * back to the legacy `document.execCommand('copy')` path — the only mechanism
 * that can still work on a non-secure origin such as a plain-HTTP LAN address.
 *
 * Contract: resolves `true` ONLY when the write demonstrably succeeded, and
 * `false` on every failure. An error is NEVER silently swallowed: it either
 * hands off to the fallback or surfaces as `false` so the caller can render
 * honest failure feedback. Callers MUST gate any "Copied" state on the
 * returned boolean.
 */

export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Clipboard API rejected — try the legacy path before reporting failure.
    }
  }
  return copyTextFallback(text)
}

export function copyTextFallback(text: string): boolean {
  if (typeof document === 'undefined') return false

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'

  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  let success = false
  try {
    success = document.execCommand('copy')
  } catch {
    success = false
  }

  document.body.removeChild(textarea)
  return success
}