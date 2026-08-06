# Phase 5.3A - Token Consolidation: Low-Risk Dead Namespaces Implementation Report

- **Phase:** 5.3A - Token Consolidation batch A (low-risk dead namespaces)
- **Type:** Deletion-only of dead CSS custom-property definitions. Zero runtime, visual, Foundation, token-value, or page behavior changes.
- **Status:** Complete (verification pending certification)
- **Date:** 2026-08-04
- **Companion docs:** FOUNDATION_TOKEN_VERIFICATION.md, FOUNDATION_TOKEN_CONSUMER_MAP.md, FOUNDATION_TOKEN_DELETE_LIST.md, FOUNDATION_TOKEN_KEEP_LIST.md (Phase 5.2A verified inventory - authoritative), PHASE_5_2_CERTIFICATION.md (prior batch), FOUNDATION_FREEZE_REGISTER.md, PHASE_3_1_EXECUTION_LOG.md, DESIGN_DECISION_LOG.md (D-152)
- **Approval:** Phase 5.3 consolidated batch plan approved by the user. Batch 5.3A = named low-risk namespaces only.

---

## 1. Scope and Constraints

Phase 5.3A executed **only** the approved SAFE REMOVE families from the Phase 5.2A verified inventory:

- L1 primitive color scales (143)
- opacity (22)
- dead navigation (16)
- chart palette (12)
- ancient compatibility (11)
- dead elevations (8 of 9 - see Section 3)
- dead gradients (5)
- pie palette (3)

**Total: 220 unique tokens, 245 definition lines removed** (some tokens are defined in both the dark and light theme blocks).

### Batch rules honored

- **No mixing:** this batch contains only SAFE REMOVE tokens. No MERGE (5.3D), no FREEZE PROTECTED, no KEEP.
- **Independently verifiable:** full gate battery run after the edit (Section 7).
- **Zero deleted live tokens:** all 313 LIVE tokens (KEEP 74 + FREEZE PROTECTED 222 + MERGE 16 + LEGACY COMPATIBILITY 1) re-verified present after the edit.
- **Zero deleted freeze-protected tokens:** all 222 FREEZE PROTECTED present.
- **Every deletion traceable to the verified inventory:** each removed token has a row in `FOUNDATION_TOKEN_DELETE_LIST.md` with category SAFE REMOVE and reason `no-refs` or `refsByDead`.

**Excluded (deferred to later batches, NOT executed):** `--btn-*` (5.3B), radius/shadow/dropdown dead chains (5.3C), the 16 MERGE items (5.3D), freeze-gated corrections (5.3E), plus the remaining dead SAFE REMOVE tokens outside the named 5.3A families (198 tokens: `input-*`, `surface-*`, `text-*` dead scale, `weight-*`/`fw-*`/`lh-*`/`ls-*`, `z-*`, `icon-*`, `bg-*`, `color-*`, `material-*`, `glow-*`, `font-*`, `dropdown-*`, `shadow-*`, `radius-*`, `btn-*`, forest/gold/dark/black/white/other dead tokens - these belong to 5.3B/5.3C or an additional SAFE REMOVE batch).

---

## 2. Files Modified

| File | Change |
|------|--------|
| `src/styles/themes.css` | 234 definition lines removed (1272 -> 1038 lines) |
| `src/index.css` | 11 ancient-alias definition lines removed (1158 -> 1147 lines) |

No other file was modified. No `.tsx`, `.ts`, `.test`, page, component, or config file was touched.

---

## 3. Tokens Removed (220)

### L1 primitive color scales (143)

13 scales x 11 stops, all SAFE REMOVE `no-refs` (no semantic/live token or rule references any of them; the design system's semantic layer uses raw literals or higher tokens, never these primitives):

| Scale | Stops removed |
|-------|---------------|
| gray | 50-950 |
| slate | 50-950 |
| blue | 50-950 |
| green | 50-950 |
| red | 50-950 |
| amber | 50-950 |
| purple | 50-950 |
| emerald | 50-950 |
| teal | 50-950 |
| cyan | 50-950 |
| rose | 50-950 |
| orange | 50-950 |
| indigo | 50-950 |

### opacity (22)

`opacity-0, -5, -10, -15, -20, -25, -30, -35, -40, -45, -50, -55, -60, -65, -70, -75, -80, -85, -90, -95, -100, opacity-disabled`. `opacity-disabled` is `refsByDead: opacity-60` - both removed together; the chain resolves within the batch.

### dead navigation (16)

`nav-surface, nav-surface-footer, nav-text, nav-text-secondary, nav-text-hover, nav-text-active, nav-bg-hover, nav-bg-active, nav-indicator, nav-icon, nav-icon-active, nav-border, nav-hover, nav-active, nav-shadow, nav-focus`. Internal chains (`nav-hover -> nav-bg-hover`, `nav-active -> nav-bg-active`) resolve within the batch. Referenced live tokens (`bg-nav`, `text-nav`, `border-nav`, `icon-nav`, `elevation-1`, `shadow-focus`) are unaffected - only the dead definitions referencing them were removed.

### chart palette (12)

`chart-navy, chart-teal, chart-yellow, chart-orange, chart-coral, chart-indigo, chart-rose, chart-emerald, chart-amber, chart-purple, chart-cyan, chart-pink`.

### ancient compatibility (11)

`ancient-gold, ancient-brown-deep, ancient-brown, ancient-cream, ancient-danger, ancient-danger-hover, ancient-badge-bg, ancient-badge-border, ancient-forest, ancient-amber, ancient-cream-light`. Removed from BOTH `themes.css` (dark + light blocks) and the `index.css` `:root` override block. **Retained:** `ancient-gold-bright` (LIVE - consumed by `PremiumIconContainer.tsx`; FREEZE PROTECTED) and `ancient-cream-light`'s live consumers unaffected.

### dead elevations (8)

`elevation-5, elevation-6, elevation-7` (both theme blocks), `elevation-canvas, elevation-interactive, elevation-floating, elevation-modal, elevation-overlay`.

**Deferred to 5.3C: `elevation-popover`.** Its only definition-line consumer is `--dropdown-shadow: var(--elevation-popover)` (`themes.css:972`). `dropdown-shadow` is a dead `dropdown-*` token that belongs to batch 5.3C. Removing `elevation-popover` now would leave a dangling `var()` in a remaining definition, violating the independent-verifiability rule. Both tokens are removed together in 5.3C.

### dead gradients (5)

`gradient-primary, gradient-success, gradient-danger, gradient-warning, gradient-sidebar` (dark + light blocks). **Retained:** `gradient-header`, `gradient-app`, `gradient-surface` (LIVE - KEEP per inventory).

### pie palette (3)

`pie-forest, pie-gold, pie-green`.

---

## 4. Pre-Edit Verification (safety proof)

Before any edit, each of the 220 tokens was checked against the full source tree:

- **Category:** all 220 confirmed `SAFE REMOVE` in `token_final.csv` (the verified inventory).
- **Consumers:** zero runtime (`var()` in TS/TSX), zero Tailwind utility uses, zero CSS rule-line `var()` refs, zero test references, zero docs refs that are themselves live.
- **No `@theme` registration:** none of the 220 appear in the `@theme` block (they would be LIVE if registered - registration generates utilities).
- **Cross-batch dependency analysis:** a definition graph was built from both CSS files; the ONLY 5.3A token referenced by a non-5.3A definition is `elevation-popover` (by dead `dropdown-shadow`) - deferred (Section 3).
- **No dangling-reference risk:** for every token removed, no remaining (post-edit) definition or rule references it.

---

## 5. Edit Mechanics

Definitions were removed by exact full-line content match (token name + value), not by line number, in both files. Each removed line matched `^\s*--<token>\s*:` exactly. CRLF line endings preserved (verified: 100% CRLF after edit, no byte corruption). The edit removed only definition lines; section-header comments and all non-token CSS were preserved verbatim.

---

## 6. Post-Edit Verification

| Check | Result |
|-------|--------|
| Remaining definitions of any removed token | **0** |
| Dangling `var()` references to any removed token | **0** |
| All 313 LIVE tokens still defined | **PASS** (313/313) |
| All 222 FREEZE PROTECTED still defined | **PASS** |
| SAFE REMOVE still defined | 198 (exactly the deferred set; 418 - 220 = 198) |
| Repo-wide scan for removed tokens (source) | **0 hits** (only stale Android Capacitor bundle artifacts reference `--ancient-gold`; regenerated on next `cap sync`) |
| File integrity | CRLF preserved; line counts 1272->1038 / 1158->1147 |

---

## 7. Gate Battery

| Gate | Result | Evidence |
|------|--------|----------|
| TypeScript (`tsc -b`) | **PASS** | clean, part of build |
| Production build (`npm run build`) | **PASS** | 48.25s, 5589 modules. Only pre-existing chunk-size advisories + 2 logical arbitrary-value CSS warnings (`border-[length:var(...)]` reported twice as ASCII/Unicode ellipsis renderings; `bg-[var(--management-*)]`) - both documented pre-existing (Phase 3.4 / 5.2 reports), unrelated to this batch |
| ESLint (`npm run lint`) | **No new errors** | 344 errors + 53 warnings = 397, exactly the pre-existing baseline; zero introduced |
| Runtime audit (`npx vitest run --config vitest.audit.config.ts`) | **Baseline match** | 33 failed / 301 passed (12 files). ds003=21, ds005=10, ds014=2 - exactly the documented pre-existing drift (DW-1..DW-4). ds007 smoke passes (18/18). None of the failing assertions reference a removed token (they assert `bg-input-bg`, `focus:border-input-focus-border`, `bg-success/15`, `rounded-xl`, `ancient-icon-badge` - all retained) |
| Repository token scan | **PASS** | zero source references to any of the 220 removed tokens |
| Consumer scan | **PASS** | 313 LIVE consumers intact; token-definition count 731 -> 511 |

---

## 8. Before/After

| Metric | Before | After |
|--------|--------|-------|
| Token definitions (`themes.css` + `index.css`) | 731 | **511** |
| `themes.css` lines | 1272 | **1038** (-234) |
| `index.css` lines | 1158 | **1147** (-11) |
| Dead tokens removed (this batch) | 220 | **0 remaining** |

---

## 9. Out of Scope (deferred, NOT executed)

- `--btn-*` (38 tokens) - **5.3B**
- radius/shadow/dropdown dead chains (radius dead, shadow dead, shadow-offset, elevation-popover, dropdown-*) - **5.3C**
- 16 MERGE items - **5.3D**
- Freeze-gated corrections (FG-1..FG-12, certified render changes) - **5.3E** (dedicated approval required)
- Remaining dead SAFE REMOVE tokens (198: input, surface, text-dead, weight/fw/lh/ls, z, icon, bg, color, material, glow, font, forest/gold/dark/black/white/other) - future SAFE REMOVE batches, each independently gated
- No page files, no component files, no test files, no config files touched
