# Phase 1a Step 4 — Final Implementation Plan

**Status**: Approved, pre-implementation
**Authority**: Design System architecture

---

## Core Rule

**Legacy Token Stability**: Step 4 does NOT redefine any existing typography token. All legacy tokens, utilities, and consumers remain unchanged.

Step 4 is purely additive — introduces new canonical tokens alongside the existing system.

---

## Phase Breakdown

| Phase | Action | Tokens Affected |
|-------|--------|-----------------|
| **Step 4** (Infrastructure) | Add new canonical tokens | Display, Body, Caption, StatValue, Badge — new only |
| **Step 4.5** (Certification) | Verify legacy system unchanged | — |
| **Step 5a** (Component Alignment) | Migrate existing components to new tokens | Components switch from hardcoded to new token values |
| **Step 5b** (Consumer Migration) | Migrate repository consumers | Raw headings → canonical components |
| **Step 5c** (Cleanup) | Remove legacy tokens, aliases, obsolete mappings | h4-h6, sub-1/2, body-1/2, overline, button |

---

## Step 4 — Infrastructure Tasks (Additive Only)

### 4a — Add New Semantic Tokens to themes.css

**File**: `src/styles/themes.css`

Add these new tokens. Do NOT modify any existing token declarations.

```
--text-display, --lh-display, --fw-display, --ls-display
--text-body, --lh-body, --fw-body
--text-caption, --lh-caption, --fw-caption
--text-stat-value, --lh-stat-value, --fw-stat-value, --ls-stat-value
--text-badge, --lh-badge, --fw-badge, --ls-badge, --tt-badge
```

**Values** (from `PHASE_1a_STEP4_TYPOGRAPHY_TOKEN_SPEC.md`):

| Token | XS | MD (768px) | LG (1024px) |
|-------|----|------------|-------------|
| `--text-display` | 1.75rem (28px) | 2.25rem (36px) | 2.5rem (40px) |
| `--text-body` | 0.8125rem (13px) | 0.875rem (14px) | 0.875rem (14px) |
| `--text-caption` | 0.6875rem (11px) | 0.75rem (12px) | 0.75rem (12px) |
| `--text-stat-value` | 1.75rem (28px) | 2.0rem (32px) | 2.25rem (36px) |
| `--text-badge` | 0.5625rem (9px) | 0.625rem (10px) | 0.625rem (10px) |

Corresponding line-height, font-weight, letter-spacing, and text-transform tokens as defined in the Token Specification.

**Risk**: None — purely additive. No existing token is modified.

### 4b — Add New @theme Mappings in index.css

**File**: `src/index.css` (append to @theme block at lines 39-181)

Add new Tailwind utility mappings:
```
--text-display: 1.75rem
--text-body: 0.8125rem
--text-caption: 0.6875rem
--text-stat-value: 1.75rem
--text-badge: 0.5625rem
```

Do NOT modify any existing @theme mapping (legacy `--text-h1` through `--text-h6`, `--text-body-1/2`, `--text-label`, `--text-button` remain unchanged).

**Risk**: None — purely additive. No existing utility is modified.

### 4c — Add Responsive Overrides for New Tokens in index.css

**File**: `src/index.css` (add new media query blocks or extend existing ones)

Add breakpoint overrides for the new tokens. Do NOT modify existing breakpoint overrides for legacy tokens.

Example (SM 480px):
```css
@media (min-width: 480px) {
  :root {
    --text-display: 2.0rem;
  }
}
```

Media query structure mirrors existing pattern (lines 416-451).

**Risk**: None — responsive overrides for new tokens only. Legacy overrides untouched.

---

## What Step 4 Does NOT Change

| Concern | Status |
|---------|--------|
| `--text-h1` (1.75rem) | **Unchanged** — legacy value preserved |
| `--text-h2` (1.375rem) | **Unchanged** |
| `--text-h3` (1.125rem) | **Unchanged** |
| `--text-h4` through `--text-h6` | **Unchanged** — still defined, still deprecated |
| `--text-body-1` / `--text-body-2` | **Unchanged** |
| `--text-label` (0.75rem / 12px) | **Unchanged** — legacy value preserved |
| `--text-sub-1`, `--text-sub-2`, `--text-overline`, `--text-button` | **Unchanged** |
| Base `h1 { }` `h2 { }` `h3 { }` rules | **Unchanged** — still reference legacy `--text-h1` etc. |
| H1 component (hardcoded 22px) | **Unchanged** — not migrated yet |
| H2 component (hardcoded 18px) | **Unchanged** |
| H3 component (hardcoded 14px) | **Unchanged** |
| Body component (hardcoded 13px) | **Unchanged** |
| Label component (hardcoded 10px) | **Unchanged** |
| BrandTitle | **Unchanged** — not removed, not annotated |
| Legacy @theme utility `text-h1` | **Unchanged** — still maps to 1.75rem |
| All existing consumers | **Unchanged** — no visual difference |

---

## Implementation Order

```
Step 4a: themes.css — Add 5 new token families (Display, Body, Caption, StatValue, Badge)
    ↓
Step 4b: index.css @theme — Add 5 new Tailwind utility mappings
    ↓
Step 4c: index.css media queries — Add responsive overrides for new tokens
    ↓
Step 4d: Verify — legacy system 100% unchanged, new tokens resolve correctly
```

---

## Post-Step-4 Sequence (Certification Required First)

### Step 4.5 — Verify and Certify

Confirm:
- Legacy `--text-h1` through `--text-h6` resolve to original values
- Legacy `--text-body-1/2` resolve to original values
- Legacy `--text-label` resolves to 0.75rem
- Legacy Tailwind utility `text-h1` produces 1.75rem
- New `--text-display` resolves correctly at all breakpoints
- New `--text-body` resolves correctly at all breakpoints
- New `--text-caption` resolves correctly at all breakpoints
- New `--text-stat-value` resolves correctly at all breakpoints
- New `--text-badge` resolves correctly at all breakpoints
- Zero visual change across the entire application

### Step 5a — Component Alignment

After certification:
- H1 component: `text-[22px] md:text-[26px] lg:text-[30px]` → `text-h1-future` or overwrite `--text-h1`
- H2 component: `text-[18px] md:text-[20px]` → `text-h2-future`
- H3 component: `text-[14px] md:text-[15px]` → `text-h3-future`
- Body component: `text-[13px] md:text-[14px]` → `text-body`
- Label component: `text-[10px]` → `text-label-future`
- Badge component: internal sizing → `text-badge` token
- StatCard: internal value rendering → `text-stat-value` token

### Step 5b — Consumer Migration

- Raw `<h1>` → H1 component (or Display component where appropriate)
- Raw `<h2>` → H2 component
- Raw `<h3>` → H3 component
- Metadata overrides → Caption component
- Create Display component
- Create Caption component
- Add H2 `id` prop

### Step 5c — Repository Cleanup

- Remove `--text-h4` through `--text-h6`
- Remove `--text-sub-1/2`
- Remove `--text-body-1/2`
- Remove `--text-overline`
- Remove `--text-button`
- Remove BrandTitle (if approved)
- Remove `h4`/`h5`/`h6` base styles
- Remove legacy @theme mappings

---

## Boundary Verification

| Concern | Step 4 Status |
|---------|---------------|
| Existing typography token values changed? | **No** — all legacy values preserved |
| Existing @theme mappings changed? | **No** — new mappings added alongside |
| Existing media query overrides changed? | **No** — new overrides added alongside |
| Existing base element styles changed? | **No** |
| Existing component implementations changed? | **No** |
| BrandTitle modified? | **No** |
| Deprecated tokens removed? | **No** |
| Any consumer behavior changed? | **No** — zero visual diff |
| New tokens available for future use? | **Yes** — Display, Body, Caption, StatValue, Badge |

---

## Rollback

| Scenario | Action |
|----------|--------|
| New tokens cause unexpected side effect | Revert Step 4a/4b/4c commit |
| Legacy system affected | **Impossible** — Step 4 touches zero legacy declarations |

Each sub-step is a single additive commit. Rollback is `git revert <commit>`.

---
*Generated: 2026-07-30*
*Authority: Technical audit*
