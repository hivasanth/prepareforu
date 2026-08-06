# Foundation Typography Audit

**Phase 3.4 P2 — Wave 3 (Typography Family)**
**Date:** 2026-08-02
**Scope:** The single type hierarchy — `--text-*`/`--lh-*`/`--fw-*`/`--ls-*`/`--tt-*`
tokens and every typography primitive that renders them (`AntigravityTypography.tsx`,
`AdminText.tsx`, `BrandTitle`, raw heading/label markup in reusable components).
Cross-checked against `FOUNDATION_TOKEN_OWNERSHIP.md` (Typography owns the type scale).
**Rule:** previously certified visual behaviour remains unchanged unless the change
is required by architectural ownership, explicitly approved, and logged in
`DESIGN_DECISION_LOG.md`.

---

## 1. Audit Method

1. Read the type-token block (`themes.css:556-572`) and the `--text-display` block
   (`themes.css:556`, responsive sizes `index.css:228,499,509,524,539`).
2. Read `AntigravityTypography.tsx` (spacing, H1/H2/H3, Body, Display, Caption,
   Label, BrandTitle) and `AdminText.tsx` (style→`var(--text-*)` map + cinzel/garamond
   variants).
3. Counted raw pixel-size classes (`text-[8px]…text-[18px]`) and raw `<h1/h2/h3>`
   tags across reusable components (`src/components/common`).
4. Checked for hardcoded brand colours and duplicated typography primitives.

## 2. Type Token Inventory

- Scale: `--text-display`/`--text-h1`/`--text-h2`/`--text-h3`/`--text-body`/
  `--text-caption`/`--text-label`/`--text-stat-value`/`--text-badge` with paired
  `--lh-*`, `--fw-*`, `--ls-*`, `--tt-*` (`themes.css:556-572`). Responsive display
  sizes live in `index.css:499-539`.
- Consumed by `AdminText` (`:7-14`), `AntigravityTypography` (inline styles), and a
  Tailwind mapping so `text-[var(--text-h1)]`-style utilities resolve.

## 3. Findings

### 3.1 HIGH

#### T-1 — Brand gold gradient is hardcoded in `BrandTitle`
- Evidence: `AntigravityTypography.tsx:159` —
  `bg-gradient-to-b from-[#f5e0be] to-[#b88c3a]`. Raw hex, not tokenized.
- Impact: brand text gradient is outside the token system (theme cannot restyle it;
  amber/gold policy cannot track it).
- Fix direction (Wave 3): add a `--brand-text-gradient` (or reuse the light
  `--gradient-header` family) token and consume `bg-[image:var(--…)]`. Values must
  match exactly → render-neutral.
- Status: plan (render-neutral if token values copied exactly).

### 3.2 MEDIUM

#### T-2 — Raw pixel sizes in reusable components bypass the type scale
- Counted in `src/components/common` (reusable components only):
  `text-[8px]`×2, `text-[9px]`×11, `text-[10px]`×29, `text-[11px]`×17,
  `text-[12px]`×6, `text-[13px]`×16, `text-[14px]`×10, `text-[15px]`×4,
  `text-[16px]`×5, `text-[18px]`×2 — **≈102 ad-hoc sizes**.
- Representative consumers: `AdminModal.tsx:92` (`text-[10px] sm:text-xs`),
  `Alert.tsx:53` (`text-[11px]`), `AntigravityLayout.tsx:198` (`text-[11px]`),
  `AntigravityDashboard.tsx:49` (`text-[10px]`), `AntigravityForm.tsx:126`
  (`text-[10px]`), `DiagramRenderer.tsx:51` (`text-[10px]`), `Pagination.tsx:53`
  (`text-[11px]`), `NotificationPanel.tsx:114` (`text-[10px]`).
- Most of these are the caption/label/badge/stat-value roles rendered ad hoc
  instead of via `Caption`/`Label`/`--text-*` tokens.
- Fix direction (Wave 3): in reusable components, map these onto the semantic roles
  (a render-identical class swap where the pixel value equals the role token, e.g.
  `text-[10px]` uppercase → `Label`/`--text-label`). Page-level raw sizes are
  Phase 3.5 (page migration) territory.
- Status: **approval-gated** (render changes).

#### T-3 — Two parallel typography primitives
- `AntigravityTypography.tsx` (H1/H2/H3/Body/Caption/Label/Display, semantic,
  `--text-*`-backed) and `AdminText.tsx` (style map + cinzel/garamond font variants
  gated on `isDark`, `:35-38`). Both are exported and used across the app.
- Impact: two heading/label APIs for the same roles; font-variant behaviour (cinzel
  only in light) is not tokenized.
- Fix direction (Wave 3): single Typography composite; `AdminText` font variants
  become props on it. Keep both exports as thin wrappers during transition so
  consumers are unaffected.
- Status: plan (no render change).

### 3.3 LOW

#### T-4 — `spacing` JS export duplicates the token spacing system
- `AntigravityTypography.tsx:3-11` exports a JS `{xs..xxl, section}` scale with no
  token backing. Verify live usage; replace with `var(--space-*)`/Tailwind spacing
  or remove. Status: plan.

#### T-5 — No `StatValue` primitive (documented, not a gap)
- `AdminText` maps `stat-value → var(--text-stat-value)` (`:13`); `StatCard`/
  `ResultStatCard` own the role. Typography family does not need a new primitive.
  Status: note only.

#### T-6 — Raw heading tags in two reusable components
- `AdminModal.tsx:88` (`<h2 className="text-xl sm:text-2xl font-black …">`) and
  `AntigravityLayout.tsx:196` use raw headings instead of `H2`/`AdminText`. These are
  inside certified overlay/layout components; consolidate onto the primitive
  (render-identical) during Wave 3/5. Status: plan.

## 4. Amber Verification (Typography family)
- `#f5e0be`/`#b88c3a` are gold-family but **not** `#C9A070`; no amber surface usage.
  The brand gradient must still be tokenized (T-1) so gold-language stays trackable.
  ✅ No `#C9A070`.

## 5. Wave 3 Close-out Checklist
- [ ] T-1: `--brand-text-gradient` token consumed by `BrandTitle` (value-identical).
- [ ] T-2: reusable-component raw sizes → semantic roles where pixel-identical.
- [ ] T-3: single Typography composite + wrapper compat.
- [ ] T-6: `AdminModal`/`AntigravityLayout` raw headings → primitives.
- [ ] Repo-wide re-check: no reusable component renders a type role without the
  family primitives; raw sizes only where a role token intentionally differs.
