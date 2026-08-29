# Foundation Typography Audit

**Phase 5.4C — Typography Language (planning / audit only)**
**Status:** ⏳ AUDIT ONLY — no Foundation evolution, no token changes, no component changes, no consumer migration.
**Role:** Lead Foundation Architect
**Date:** 2026-08-06
**Supersedes:** `docs/design-system/FOUNDATION_TYPOGRAPHY_AUDIT.md` (Phase 3.4 P2, 2026-08-02) — findings T-1…T-6 re-audited, re-scoped, and re-classified below with repository-wide evidence.
**Companion deliverables (this phase):** `TYPOGRAPHY_LANGUAGE_SPECIFICATION.md`, `TYPOGRAPHY_COMPONENT_AUDIT.md`, `TYPOGRAPHY_CONTRAST_REPORT.md`, `TYPOGRAPHY_REUSABLE_COMPONENTS.md`, `TYPOGRAPHY_IMPLEMENTATION_PLAN.md`, `TYPOGRAPHY_CERTIFICATION_CHECKLIST.md`, D-166.

**Plan of record (12-part structure):**
| # | Section | Primary document |
|---|---|---|
| 1 | Executive Summary | this file |
| 2 | Architecture Audit | this file |
| 3 | Typography Inventory | this file |
| 4 | Typography Hierarchy | this file |
| 5 | Duplicate Analysis | this file |
| 6 | Accessibility Audit | `TYPOGRAPHY_CONTRAST_REPORT.md` |
| 7 | Contrast Audit | `TYPOGRAPHY_CONTRAST_REPORT.md` |
| 8 | Reusable Opportunities | `TYPOGRAPHY_REUSABLE_COMPONENTS.md` |
| 9 | Implementation Roadmap | `TYPOGRAPHY_IMPLEMENTATION_PLAN.md` |
| 10 | Risk Assessment | `TYPOGRAPHY_IMPLEMENTATION_PLAN.md` |
| 11 | Verification Plan | `TYPOGRAPHY_CERTIFICATION_CHECKLIST.md` |
| 12 | Certification Checklist | `TYPOGRAPHY_CERTIFICATION_CHECKLIST.md` |

---

## 1. Executive Summary

Phase 5.4C audits the **entire typography language** — token layer, primitive layer, and every consumer — and produces the certification package for it. This is a **planning-only audit**: zero production files are changed. Execution (if approved) happens under a separate dedicated gate.

**The headline:** the Foundation already owns a canonical semantic type scale and neutral text ladder, and there IS a primitive layer (`AntigravityTypography` + `AdminText`). The problem is **not** missing tokens — it is **bypass**. Six parallel sub-languages compete with the canonical scale:

1. **The Tailwind-default size utility layer** (`text-xs` 142×, `text-sm` 62×, `text-base`, `text-lg` 16×, `text-xl` 13×, `text-2xl` 14×) — not token-backed, off-scale.
2. **The arbitrary-pixel micro layer** (`text-[Npx]` = **278 occurrences**, dominated by 10px 111×, 11px 49×, 9px 37×, 8px 11×, 7px 4×) — bypasses `--text-label`/`--text-caption`/`--text-badge`.
3. **The Tailwind-default weight layer** (`font-bold` 296×, `font-black` 125×, `font-semibold` 71×, `font-medium` 44×) — while the token weight systems (`--fw-*` 4 dead, `--weight-*` 5 of 7 dead) sit unused.
4. **The Tailwind-default tracking/leading layer** (`tracking-widest` 132×, `tracking-tight` 51×, `leading-relaxed` 36×, etc.) — while `--ls-*` (7 dead) and `--lh-*` (6 dead) sit unused.
5. **The inline-style layer** — 44 distinct `fontSize` values, direct `var(--text-*)` refs (23 `text-[var(--text-*)]` arbitrary utilities + raw `var()` in primitive sources), letter-spacing/tracking hacks (`-0.05em` 2×, `0.1em` 2×), 1 raw hex (`#a78bfa`, DiagramRenderer).
6. **The status-color-as-text layer** — `text-green-500` 8×, `text-amber-500` 7×, `text-red-500` 6×, `text-red-400` 4×, `text-amber-400` 6× + status tokens used for neutral content.

**Dead-token result:** **41 typography tokens are declared but have zero consumers** (including all `--text-badge`, `--text-link`, `--text-small`, `--text-header`, `--text-emphasis`, `--text-nav-secondary`, `--text-nav-hover`).

**Name-collision hazard:** `text-primary` (92×) resolves to **`--color-accent`** (accent green), while the neutral text token is `text-text-primary` (161×). The same-looking class name means accent in one place and neutral ink in another.

**Contrast result (see Contrast Report):** all neutral text tokens pass AA/AAA on app+surface in both themes **except** `--text-hint` (fails everywhere: 2.4–3.7:1) and `--text-muted` on elevated surfaces (4.06–4.41:1, just under 4.5:1). White-on-accent in **dark** theme (`#FFFFFF` on `#3B82F6`) = 3.68:1 → fails AA for small text; white-on-danger dark (`#F87171`) = 2.77:1 → fails. Light `--text-disabled`/`--placeholder-color` `#9CA3AF` = 2.43:1 on canvas.

---

## 2. Architecture Audit

### 2.1 The token layer (source of truth)

Defined in `src/styles/themes.css` with utility wiring in `src/index.css`:

- **Canonical semantic scale** (`themes.css:314-344`): `--text-display` (1.75rem/900/-0.025em), `--text-h1` (1.375rem/900), `--text-h2` (1.125rem/700), `--text-h3` (0.875rem/600), `--text-body` (0.8125rem/500/lh 1.7), `--text-caption` (0.6875rem/500), `--text-label` (0.625rem/700/0.1em/uppercase), `--text-stat-value` (1.75rem/900), `--text-badge` (0.5625rem/700), `--text-metadata` (0.75rem/500), `--text-small` (0.875rem/500), `--text-heading` (1rem/700), each with paired `--lh-*`, `--fw-*`, `--ls-*`, `--tt-*`.
- **Neutral text-color ladder** (dark `:root` 212-221, light `.light` 446-455): `--text-primary`, `--text-title`, `--text-secondary`, `--text-muted`, `--text-hint`, `--text-disabled`, `--text-on-accent`, `--text-on-danger`, `--text-link`, `--text-on-dark`.
- **Theme wiring (`@theme`)** (`index.css`): **8** color utilities only — `text-text-primary/secondary/muted/hint/disabled/title/on-dark/placeholder`. `--color-primary: var(--color-accent)` (`index.css:41`) creates the `text-primary` accent alias.
- **Responsive size tokens** `--text-h4/h5/h6/caption/label` in `@theme` (`index.css:450-484`) with LG/XL bumps.

### 2.2 The primitive layer

- `src/components/common/AntigravityTypography.tsx` — `H1/H2/H3` (inline `var(--text-*)` + `text-text-title/primary` + `m-0`), `Body` (`secondary` prop), `Label`, `Caption`, `Display`, `BrandTitle` (raw hex brand gradient `from-[#f5e0be] to-[#b88c3a]`, light-only). Consumes `--text-h1/h2/h3/display/body/label/caption` + `--ls-*`.
- `src/components/common/AdminText.tsx` — style map `body→var(--text-body)`, `metadata→var(--text-metadata)`, `heading→var(--text-heading)`; cinzel/garamond/sans variants; serif fonts gated `!isDark` (light-only premium identity).
- `src/components/common/AntigravityUI.tsx:4-8` — barrel exports `H1/H2/H3/Body/Label/Display/Caption/BrandTitle` + `AdminText`.
- Global element rules `index.css:506-511` style raw `h1..h6` from the scale.

### 2.3 Architectural findings

| ID | Finding | Severity |
|---|---|---|
| A-1 | **No Tailwind utility surface for the canonical scale.** `--text-h1…badge` are NOT registered as `text-*` size utilities (only h4/h5/h6/caption/label are, via `@theme`). Consumers cannot write `text-h1`; they fall back to arbitrary `text-[var(--text-*)]` (23×) or bypass entirely (278× `text-[Npx]`). | High |
| A-2 | **Three weight systems, one alive.** `--fw-*` (4 dead), `--weight-*` (5 of 7 dead), and Tailwind default `font-*` utilities (296+125+71+44 uses). The certified weight tokens are bypassed by the default utilities. | High |
| A-3 | **Two line-height systems, one alive.** `--lh-*` (6 of 14 dead; live ones consumed only by primitive inline styles and `h1-h6` rules) vs `leading-*` utilities (36+19+15 uses). | Medium |
| A-4 | **Two letter-spacing systems, one alive.** `--ls-*` (7 of 13 dead) vs `tracking-*` (132+51+31+17+12 uses) + arbitrary `tracking-[0.2em]` 4×. | Medium |
| A-5 | **41 dead typography tokens** (full list §5.3) — declared namespaces with zero consumers; `--text-link`, `--text-badge`, `--text-small` have neither direct refs nor utility wiring. | Medium |
| A-6 | **`text-primary` = accent (green), not ink.** 92 uses resolve to `--color-accent` via `index.css:41`; 161 uses of `text-text-primary` resolve to neutral ink. Name collision is a live semantic trap. | High |
| A-7 | Two primitive APIs for the same roles (`AntigravityTypography` semantic set + `AdminText` style-map set) — T-3 of the old audit, still open. `BrandTitle` raw hex gradient (T-1 old) still open. | Medium |
| A-8 | `--text-hint`/`--text-muted`/accent/danger contrast gaps require a **render-affecting** decision of their own (see Contrast Report §7). | High |

---

## 3. Typography Inventory

Repository-wide counts (all `.tsx`/`.ts` under `src/`, sweep 2026-08-06; utilities counted on className occurrences, inline styles counted per property occurrence).

### 3.1 Arbitrary pixel sizes — `text-[Npx]` (278 total)

| Size | Count | Files |
|---|---|---|
| 10px | 111 | 46 |
| 11px | 49 | — |
| 9px | 37 | — |
| 12px | 18 | — |
| 13px | 17 | — |
| 14px | 14 | — |
| 8px | 11 | — |
| 7px | 4 | DiagramRenderer:352/413, LeaderboardUserCard:18, LanguageSelectionScreen:94 |
| 15px | 4 | — |
| 20px | 3 | — |
| 16px | 3 | — |
| 24px | 2 | — |
| 18px/22px/40px/48px/64px | 1 each | — |

### 3.2 Tailwind-default size utilities (off-scale layer)

`text-xs` **142**, `text-sm` **62**, `text-2xl` 14, `text-lg` 16, `text-xl` 13.

### 3.3 Weight utilities

`font-bold` **296**, `font-black` **125**, `font-semibold` **71**, `font-medium` **44**.

### 3.4 Transform / tracking / leading

`uppercase` **238**, `tracking-widest` **132**, `tracking-tight` 51, `tracking-wide` 31, `tracking-wider` 17, `tracking-tighter` 12; `leading-relaxed` 36, `leading-none` 19, `leading-tight` 15; arbitrary `tracking-[0.2em]` 4, `leading-[1.1]` 2, `leading-[1.15]` 1, `leading-[1.2]` 1, `tracking-[0.15em]` 1, `tracking-[0.3em]` 1, `tracking-[0.35em]` 1.

### 3.5 Text-color utilities

`text-text-primary` **161**, `text-text-secondary` **129**, `text-primary` **92** (accent alias — see A-6), `text-text-muted` **75**, `text-text-hint` **14**, `text-text-title` **14**, `text-text-disabled` 3, `text-text-on-dark` 1, `text-white` 18, `text-danger` 57, `text-success` 18, `text-warning` 11, `text-secondary` 4, `text-primary/70` 4.

### 3.6 Palette leaks on text (status colors used as neutral content)

`text-green-500` 8 (14 files incl. NotificationPanel, CreateStepPublish, QuestionCard, SuccessView, ExamDetailSection, ExamPerformers, ExamQuestionAnalysis), `text-amber-500` 7 (11 files), `text-red-500` 6 (8 files incl. SidebarLayout:21, DiagramRenderer:428, CompactDateTimePicker:154, CreateStepJsonPaste, QuestionCard, ExamDetailSection), `text-red-400` 4 (7 files), `text-amber-400` 6, `text-green-600` 1, `text-rose-500` 1, `text-emerald-500` 1, `text-amber-600` 1.

### 3.7 Arbitrary-var bypass

`text-[var(--text-muted)]` **22**, `text-[var(--text-hint)]` 1. Direct `var(--text-*)` in TS: `--text-muted` 25 (incl. the 22 utilities), `--text-secondary` 16, `--text-primary` 14, `--text-body` 2, `--text-heading` 1, `--text-metadata` 1, `--text-label` 1, `--text-display` 1, `--text-caption` 1, `--text-hint` 1, `--text-title` 1.

### 3.8 Inline style typography

44 distinct `fontSize` values (incl. `14px` 5, `16px` 5, `18px` 4, `13px` 3, `12px` 3, `20px` 2, `1.125rem` 2, `15px` 2, `11px` 2, `10px` 2); `letterSpacing` incl. `-0.05em` 2, `0.1em` 2; `fontWeight`, `lineHeight`, `fontFamily` (via var refs) inline; 1 raw hex `#a78bfa` (DiagramRenderer).

### 3.9 Raw heading tags

`<h1>` 18, `<h2>` 30, `<h3>` 37, `<h4>` 5, `<h5>` 1, `<h6>` 2 (raw tags, not primitives).

### 3.10 Primitive consumption (see Component Audit for detail)

`AdminText` ≈88 usages / 24 files; `BrandTitle` ≈12 / 6 files; plus `H1/H2/H3/Body/Label/Caption/Display` via the barrel.

---

## 4. Typography Hierarchy

### 4.1 The certified hierarchy (the target language)

| Tier | Token | Size | Weight | Tracking | Color | Contrast gate |
|---|---|---|---|---|---|---|
| Display/Stat | `--text-display` / `--text-stat-value` | 1.75rem | 900 | -0.05..-0.025em | `--text-title` | AA |
| H1 | `--text-h1` | 1.375rem | 900 | -0.025em | `--text-title` | AA |
| H2 | `--text-h2` | 1.125rem | 700 | -0.025em | `--text-primary` | AA |
| H3 | `--text-h3` | 0.875rem | 600 | -0.025em | `--text-primary` | AA |
| Heading (card) | `--text-heading` | 1rem | 700 | — | `--text-primary` | AA |
| Body | `--text-body` | 0.8125rem | 500 | — | `--text-primary` | AA |
| Small | `--text-small` | 0.875rem | 500 | — | `--text-primary/secondary` | AA |
| Metadata | `--text-metadata` | 0.75rem | 500 | — | `--text-secondary/muted` | AA |
| Caption | `--text-caption` | 0.6875rem | 500 | — | `--text-muted` | AA |
| Label | `--text-label` | 0.625rem | 700 | 0.1em | `--text-secondary` | AA |
| Badge/Pill | `--text-badge` | 0.5625rem | 700 | 0.05em | variant | AA |
| Micro | 9–13px formal scale | — | ≥600 | — | `--text-primary/secondary/muted` | AA |
| Placeholder | `--placeholder-color` | — | — | — | `--placeholder-color` | AA (see C-3) |
| Disabled | `--text-disabled` | — | — | — | `--text-disabled` | decorative |
| Link | `--text-link` | — | — | — | `--text-link` | AA (see C-2) |
| Status | — | — | — | — | `--color-success/danger/warning` | AA (see C-4) |

### 4.2 Hierarchy drift — same role rendered multiple ways

| Role | Observed in repo | Canonical target |
|---|---|---|
| Section label / eyebrow | 9px/700, 10px/700, 11px/600, 13px, 14px, `text-xs`, `text-sm` | `--text-caption` 11px/600 or `--text-label` 10px/700 |
| Table header | 10px, 11px; 600 vs 700; `text-text-secondary` vs `var(--text-muted)`; tracking-wide vs widest | `--text-label` 10px/700 uppercase, `text-text-secondary` |
| Card title / headline | 13–24px; 700 vs 900; `H1-H6` vs raw `font-black` | `H1-H6` primitives + `--text-*` |
| Metadata / secondary line | 9/10/12px; medium vs bold; `text-text-secondary` vs `var(--text-muted)` | `--text-caption` or `--text-label` + `text-text-muted` |
| Page title | `H1` primitive vs `text-xl`/`text-2xl` `font-black` raw | `--text-h1` / `H1` |
| Micro tag / pill | 7–10px, various weights, opacity fades | formal 9–13px micro scale, ≥600, no opacity |

### 4.3 Opacity as hierarchy

79 className sites combine `opacity-*` with `text-*` (≈52-59 distinct files; e.g. `CreateStepSetup` `opacity-70`, `CreateStepPrompt` `opacity-60`, `TopicCard` `opacity-80`), plus token-alpha-slash (`text-text-muted/40`, `/50`). Hierarchy is expressed by fading the token instead of stepping the ladder.

---

## 5. Duplicate Analysis

### 5.1 Parallel size languages (5 live layers, §2.1-2.2, §3.1-3.4)

| Layer | Mechanism | Uses | Status |
|---|---|---|---|
| Canonical tokens | `var(--text-*)` / `@theme` | primitives + global h1-h6 | ✅ live |
| Tailwind defaults | `text-xs…2xl`, `font-*`, `tracking-*`, `leading-*` | hundreds | ⚠ off-scale |
| Arbitrary pixels | `text-[Npx]` | 278 | ⚠ off-scale |
| Arbitrary vars | `text-[var(--text-*)]` | 23 | ⚠ bypass |
| Inline styles | `style={{fontSize…}}` | 44 distinct values | ⚠ bypass |

### 5.2 Parallel weight systems

`--fw-*` (all 4 dead) + `--weight-*` (5 of 7 dead) + Tailwind `font-*` (536 uses) = three systems.

### 5.3 Dead typography tokens (41) — zero consumers anywhere in `src/`

- **Text colors (7):** `--text-badge`, `--text-link`, `--text-small`, `--text-nav-secondary`, `--text-nav-hover`, `--text-header`, `--text-emphasis`.
- **Weights `--fw-*` (4):** `--fw-regular`, `--fw-medium`, `--fw-semibold`, `--fw-bold`.
- **Weights `--weight-*` (5):** `--weight-thin`, `--weight-light`, `--weight-medium`, `--weight-semibold`, `--weight-black`.
- **Line heights (6):** `--lh-none`, `--lh-tight`, `--lh-snug`, `--lh-normal`, `--lh-relaxed`, `--lh-loose`.
- **Letter spacings (7):** `--ls-tighter`, `--ls-tight`, `--ls-normal`, `--ls-wide`, `--ls-wider`, `--ls-widest`, `--ls-ultra`.
- **Composite (12):** `--lh/fw/ls-stat-value`, `--lh/fw/ls-badge`, `--tt-badge`, `--fw-metadata`, `--lh/fw-small`, `--lh/fw-heading`.

### 5.4 Duplicate primitives (A-7)

`AntigravityTypography` (semantic roles, inline `var()`) and `AdminText` (style map, font variants) both render heading/body/label/caption/metadata roles and are both exported from the `AntigravityUI` barrel. `BrandTitle` carries the only raw brand hex (`#f5e0be`/`#b88c3a`).

### 5.5 Duplicate class semantics (A-6)

`text-primary` (accent, 92×) vs `text-text-primary` (ink, 161×); `--color-text-placeholder` vs `--placeholder-color` both backing placeholder color; `--text-on-dark` vs `--text-on-accent` overlapping white-foreground roles.

---

*End of Foundation Typography Audit (parts 1-5). Continue to `TYPOGRAPHY_CONTRAST_REPORT.md` (parts 6-7), `TYPOGRAPHY_REUSABLE_COMPONENTS.md` (part 8), `TYPOGRAPHY_IMPLEMENTATION_PLAN.md` (parts 9-10), `TYPOGRAPHY_CERTIFICATION_CHECKLIST.md` (parts 11-12). No code changes are authorized by this document.*
