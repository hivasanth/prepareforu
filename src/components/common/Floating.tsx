import { useState } from 'react'
import { createPortal } from 'react-dom'

/* ═══ Floating — canonical portal layer ═════════════════════════════════════
 * DESIGN ROLE:
 *   The ONE overlay escape hatch for transient, trigger-anchored surfaces
 *   (select dropdowns, popovers). Solves two structural failures that cannot
 *   be fixed from inside any local stacking context:
 *
 *   1. CLIPPING  — ancestors with overflow hidden/auto/clip (cards, modal
 *      bodies, table wrappers) clip in-subtree menus.
 *   2. STACKING  — ancestors with transforms (SelectionContainer -translate,
 *      CARD_HOVER hover:-translate-y), filters or backdrop-filter create
 *      atomic stacking contexts; DOM-later surfaces then paint over the whole
 *      subtree regardless of internal z-index.
 *
 *   Portal mounts at <body>; positioning uses position:fixed against the
 *   trigger's viewport rect, so no ancestor can clip or bury the panel.
 *   Z-index comes exclusively from --z-dropdown (themes.css layer scale).
 *   Pair with useAnchoredFloating (./useAnchoredFloating) for coordinates.
 *
 * CONSUMERS: PremiumSelect. Do not fork; extend here.
 * ────────────────────────────────────────────────────────────────────────── */

/** Mounts children into document.body (the canonical overlay root). */
export function Portal({ children }: { children: React.ReactNode }) {
  const [host] = useState(() => (typeof document !== 'undefined' ? document.body : null))
  if (!host) return null
  return createPortal(children, host)
}
