// Clipboard helper — folder-local utility module.
// Kept separate from ExamSubComponents.tsx so that file exports only
// components (react-refresh/only-export-components).
//
// Contract: resolves true on success, false on any failure. Callers own all
// user-facing feedback (toast) — clipboard failure is NEVER silent.
//
// Implementation delegates to the canonical app-wide helper
// (src/utils/clipboardUtils) so there is exactly ONE clipboard code path.

import { copyText } from '../../../utils/clipboardUtils'

export async function copyToClipboard(text: string): Promise<boolean> {
  return copyText(text)
}
