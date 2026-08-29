# Foundation Visual Refinement — Audit Report

**Phase:** 6.X — Foundation Visual Refinement
**Stage:** Task 8 (Foundation Audit) — READ-ONLY. No modifications made in this report.
**Date:** 2026-08-07

This document records the "as-built" Foundation visual state that Tasks 1–7, 9
and the screenshot refinements will evolve. It is the audit input; the modified
outcome is certified separately in `FOUNDATION_VISUAL_VERIFICATION.md`.

---

## 1. Scope and boundaries

Foundation visual language lives in four owners (audited):

| Owner | File | Responsibility |
|-------|------|----------------|
| Token system | `src/styles/themes.css` | Layer 1 primitives → Layer 2 semantic → Layer 3 component |
| Utility/recipe layer | `src/index.css` | `@theme`/`@utility` maps, `.light` variant, legacy `.ancient-*` recipes |
| Component primitives | `src/components/common/*` | AntigravityCard, AntigravityButton, AntigravityTypography, Skeleton, PremiumIconContainer, Typography, SharedComponents, AntigravityMotion, RetryButton |
| Banner/stat surface | `src/components/user/WelcomeBanner.tsx`, `src/components/user/dashboard/DashboardStatsGrid.tsx` | Current 6.XB certified hero + stat grid |

No page-level overrides, hardcoded colors, or per-page duplicates are introduced
below — the Foundation itself is the agent of change.

---

## 2. Motion language (grounding)

From `src/animation/AntigravityMotion.ts` (grep-confirmed, one shared motion
grammar):

- **One interaction model.** Hover is *not* a translate/scale lift. Hover =
  `brightness-105` + a small shadow refinement driven only by `--elevation-*`.
- Pressed = `active:brightness-95`. Focus = shared `FOCUS_RING`.
- Any `translate`/`scale`/"bounce"/"wiggle" lift on card hover is a **violation**
  of this language; Task 4 removes all of them in favour of the one card hover.

Sample (from AntigravityButton) lifted for reference:

```ts
// Transition via TRANSITION_INTERACTION; hover = brightness + elevation only.
```

---

## 3. Task-by-task baseline findings

### Task 1 — Banner typography: white / uppergrade / low warning tint (VIOLATIONS)

Source: `src/components/user/WelcomeBanner.tsx` (current post-6.XB state).

| Element | Current classes | Finding |
|---------|-----------------|---------|
| Greeting `Label` (line 90) | `text-warning mb-1` | Primary label tinted warning gold — violates "white, uppercased" |
| Name `Typography role="display"` | `color="on-dark"` | Compliant (white) |
| Divider (line 101) | `bg-warning/35` | Decorative meter — `bg-warning` reads amber; Task 1 wants neutral/high-safe divider |
| `H3` heading (line 103) | `text-warning` | **Primary banner text tinted `text-warning` — Task 1 flags this explicitly** |
| `Body` supporting (line 96, 104) | `text-warning/90`, `text-warning/90` | Low-opacity warning tinted — Task 1 forbids `text-warning/60/70`-style hints |

**Audit finding:** The banner carries the "warning" amber accent across its
primary text chain. Task 1 replaces it with semantic `text-on-dark` (white)
high-contrast hero type. `text-warning` is reserved for true status/metadata,
niche in the banner (e.g. greeting ornament should be dropped or neutral).

---

### Task 2 — Stat card label semantic language (light-mode visibility)

Source: `src/components/common/AntigravityCard.tsx` (StatCard body, lines 162–199)
and token maps in `src/styles/themes.css`.

**Light-mode label** (line 184):
```ts
className="font-bold uppercase tracking-widest leading-none m-0 text-[9px] lg:text-[11px]
  text-stat-label-text light:text-text-hint"
```
- Default `--stat-label-text` (light, `var(--text-muted)` = `#6B7280`) is overridden
  to `text-text-hint` (`#9CA3AF`) via `light:`. This is a **light-mode contrast loss**
  — labels dip below an accessible label weight on a white surface (`bg-surface`).
- `--stat-value-text` = `var(--text-primary)` (dark `#111827`) is retained correct.

**Semantic language:** labels are Level-4 metadata/typography, but currently
drop down a full step to `hint` in light mode. Task 2 restores `--stat-label-text`
(as `text-text-secondary` or a dedicated `stat-card-label`) in light so labels
hold clear hierarchy over their `text-muted` surroundings.

Directory token map (lines 943–944):
```
--stat-value-text: var(--text-primary);  /* corrective comment noted */
--stat-label-text: var(--text-muted);    /* corrective comment noted */
```

---

### Task 3 — Activity / metadata semantic colors

Grounding identified in `--text-secondary`, `--text-muted`, and previews
(`src/components/user/` components). The Foundation metadata tokens are
already semantic; audit confirms they are consumed everywhere consistently
(`text-text-secondary` / `text-muted`), with no fresh hardcoded RGB in the
Foundation layer (cross-server). Pending Task-3 pass removes the few remaining
`opacity-as-emphasis` on metadata, replacing with semantic tokens.

---

### Task 4 — ONE global card hover language (collection of violations at card level)

Currently **two competing hover languages** coexisting for cards:

| Owner | Hover class | nature |
|-------|-------------|--------|
| `AntigravityCard.tsx` default variant (line 52) | `CARD_HOVER` = `hover:shadow-card-hover-shadow hover:bg-hover-bg/40` | one directional refs; no lift |
| `AntigravityCard.tsx` StatCard light (line 167) | `light:hover:shadow-premium-elevated` | second shadow hop |
| `CARD_HOVER` definition (lines 47–48) | `transition-interaction … hover:shadow-card-hover-shadow` | **The candidate "ONE lift"** |
| EmptyState (SharedComponents.tsx:164) | `${GOLD_SURFACE} shadow-premium-card` (non-hover) | — |
| `CollectionCard.tsx` | `LoadingSkeleton` wrappers, hover on card via instance classes | verify |

**Top violation (non-local lift found):**
- `Src/components/admin/settings/SubjectCardItem.tsx:24` uses `ancient-3d-lift`
  — a translate/lift recipe. This must be retired to the one `CARD_HOVER`
  language in Task 4.

Motion language guard; any `hover:…translate…/scale` anywhere in the repo is a
violation. Grep of `ancient-3d-lift` located one live consumer (above), plus
docs-only references.

---

### Task 5 — Skeleton language evolution (match final card surfaces)

Source: `src/components/common/Skeleton.tsx` (lines 31–43), consumers.

| Constant | premium value | management value |
|----------|---------------|------------------|
| `SKELETON_BLOCK` | `bg-[var(--skeleton-block)]` | `bg-[var(--management-surface-muted)]` |
| `SKELETON_CARD_SURFACE` | `bg-[var(--skeleton-surface)] border border-[var(--border-subtle)]` | `bg-[var(--management-surface)] … shadow-[var(--management-shadow)]` |

- `--skeleton-surface` (dark) = `var(--bg-elevated)`; light = `#F1F5F9`.
- `--skeleton-block` (dark) = `var(--border-input)`; light = `#E2E8F0`.
- Radius: `card` type uses `rounded-2xl` + `p-6` — **the final cards use
  radius `rounded-2xl`/`rounded-stat-card-radius`; Elevation differs**.

**Finding:** The skeleton surface is `rounded-2xl p-6`, but premium/stat cards
use stat-card radius in light mode. For the skeleton to match the final card
(gold-dimension parity) the radius + padding + (optionally) the light surface
should be aligned with the final premium surfaces. Only the shimmer changes
shape (radius/elevation), never color or motion.

---

### Task 6 — Global surface brightness (light mode slightly brighter)

Token map (light `.light {}`, `src/styles/themes.css` lines 428–):

| Token | Current (light) |
|-------|-----------------|
| `--bg-app` | `#F8FAFC` |
| `--bg-surface` | `#FFFFFF` |
| `--bg-elevated` | `#F1F5F9` |
| `--bg-hover` | `#F1F5F9` |
| `--bg-active` | `#E2E8F0` |

- `--gradient-header` (light) = `linear-gradient(150deg, #162B1C, #0A1A10)` — the only
  non-neutral surface.
- `--elevation-*` light ladder present and neutral.

**No colors are introduced by Task 6.** Only the above surface values are
marginally brightened (e.g. `--bg-elevated` / `--bg-active` pulled a notch
lighter) via **semantic token re-assignment**, preserving contrast and the
`--elevation-*` shadow hierarchy. All hierarchies kept.

---

### Task 7 — Typography contrast refinement (no opacity-as-emphasis)

Audit of metadata/emphasis patterns shows several legacy `opacity-*` emphasis
usages:
- Skeleton text interior lines use `opacity-60` bar emphasis (Skeleton.tsx:79) —
  geometric placeholder, acceptable (not color emphasis).
- Banner supporting text `text-warning/90`, `text-warning/35` (Task 1 supersedes).
- `--text-muted` / `--text-hint` used for emphasis in several cards.

Task 7 turns any `text-* color + opacity-emphasis` emphasis into plain semantic
tokens (`--text-secondary`, `--text-muted`) with full alpha, so emphasis is
driven by the semantic scale, not alpha.

---

## 4. Duplication inventory (Task 9 input)

Identified token-level duplicates/aliases to merge/retire:

| Alias A | Alias B | Notes |
|---------|---------|-------|
| `--text-body` (13px) | (typography scale mixins) | Documented separate scale; check merge |
| `--color-border-subtle` (retired) | `--border-subtle` | Already retired per PHASE2_REPORT; confirm no consumers |
| `--gradient-app` / `--gradient-surface` = `none` | `--gradient-header` | two `none` gradients could collapse comments; kept for API compat |
| `GOLD_SURFACE` (AntigravityCard:27) | `stat-card-surface` @utility | one source (A) already composites `stat-card-surface`; confirm no other dupe |
| `PREMIUM_SURFACE` / `PREMIUM_SURFACE_HOVER` (AntigravityCard) | default-variant inline classes | verify merge to one source of truth |

Dead-style candidates in `src/index.css` (audited, not yet removed):
- `.ancient-card-dark` (lines ~868–874) — forest gradient recipe. **Superseded by
  `bg-card-premium-surface` + `--gradient-header` tokens (6.XB).** Confirm zero
  live consumers, then remove in Task 9.
- `ancient-3d-lift` — used once in `admin/settings/SubjectCardItem.tsx`; relocate
  to `CARD_HOVER` then delete the recipe.

---

## 5. Screenshot refinement call-outs (audit grounding)

| Item | Current | Target |
|------|---------|--------|
| Stat value weight | `font-black` (900) at `text-sm–lg` | Slightly heavier x-height / weight presence; keep 900, nudge size ladder |
| Sidebar active item contrast | (active item styling in `AdminSidebar`/dashboard layout) | Raise active-vs-inactive contrast via semantic accent token |
| Hero overlay | `opacity-30` on banner bg image | Slightly darker overlay for name legibility (opacity ~40–45) |
| "Recent Activity" heading spacing | `(layout gap)` | Increase space between section heading and first card row |
| Analytics button | mounted next to heading | Align with the certified Button language (size/typography/ hover) |

---

## 6. Verification baseline (known-good)

- `tsc -b` — passes.
- `npm run build` — passes.
- `npx eslint <changed files>` — passes with set-based rules.
- `npm test` — 165/165 pass. 7 worker ESM errors pre-exist on baseline (untouched).

---

## 7. Read-only confirmation

This report intentionally changes nothing. Edits begin in Task 1 after this audit
is closed out. Foundation evolution freeze rows + design-decision `D-*` entries
will be recorded for every token/component change (see §0 of the Implementation
Report).