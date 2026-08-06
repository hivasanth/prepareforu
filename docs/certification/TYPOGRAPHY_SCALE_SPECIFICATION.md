# Typography Scale Specification (Phase 3.5 · U-2 — Step 8)

**Date:** 2026-08-03
**Gate:** U-2 (Typography Scale) — **APPROVED + IMPLEMENTED (Phase A, D-132)**. Phase B (T-6 micro 8px, T-7 repo-wide `@theme` wiring) remains gated.
**Derived from:** `TYPOGRAPHY_FOUNDATION_AUDIT.md` (Steps 1–7, 9–11).
**Authoritative source values:** `themes.css` (canonical semantic scale) + effective rendered values (Tailwind v4 defaults, audit §4-B).

---

## 1. Purpose

Define the **permanent typography language** for the entire application. Every text node, in every module, resolves to exactly one entry in this scale. After certification, no page invents typography.

## 2. The permanent scale

Each category: **owner** (Layer 1 Repository / Layer 2 Module / Layer 3 Page), **token** (CSS variable), **primitive** (component), **intended usage**, and responsive values.

### 2.1 Display — hero / brand titles

| owner | token | primitive | intended usage |
|---|---|---|---|
| Layer 1 | `--text-display` (28→32→36→40→48px) | `Display` (`<h1>`) / `BrandTitle` (brand gradient) | splash, login hero, 40/48px page heroes, stat heroes |

### 2.2 Headings

| owner | token | primitive | intended usage |
|---|---|---|---|
| Layer 1 | `--text-h1` (22→22→26→30→30px, 900, `-0.025em`) | `H1` | page headings (admin pages use sr-only `H1` + visible `AdminText as="h1"`) |
| Layer 1 | `--text-h2` (18→18→20→20→20px, 700) | `H2` | section headings |
| Layer 1 | `--text-h3` (14→14→15→15→15px, 600) | `H3` | subsection / card headings |
| Layer 1 | `--text-heading` **NEW (T-5, CERTIFIED D-132)** (16px, flat, lh 1.5) | `H3`/`AdminText`/`Body` with `size="heading"` | 16px emphasised title/card text (absorbs `text-base` + `text-[16px]`). **Renamed from `--text-title`** — that name is a pre-existing COLOR token (light `#F9FAFB` / dark `#0A0503`); see audit §4-D note |

### 2.3 Body / reading text

| owner | token | primitive | intended usage |
|---|---|---|---|
| Layer 1 | `--text-body` (13→13→14→14→14px, 500, lh 1.7) | `Body` (`secondary?` → `text-text-secondary`) | primary reading / table body text |
| Layer 1 | `--text-small` **NEW (T-4, CERTIFIED D-132)** (14px, flat, lh `calc(1.25/0.875)` = rendered `text-sm` lh) | `Body`/`AdminText`/`Label` `size="small"` | compact table/cell/panel text (absorbs `text-sm` + `text-[14px]`) |
| Layer 1 | `--text-metadata` **NEW (T-3, CERTIFIED D-132)** (12px, flat, lh `calc(1/0.75)` = rendered `text-xs` lh) | `Body`/`AdminText`/`Label` `size="metadata"` | helper/table metadata/row text (absorbs `text-xs` + `text-[12px]`) |

### 2.4 Labels / overlines

| owner | token | primitive | intended usage |
|---|---|---|---|
| Layer 1 | `--text-label` (10px, 700, `--ls-label` 0.1em, `--tt-label` uppercase) | `Label` | form labels, field captions, uppercase tag strips (`text-[10px] font-bold uppercase tracking-widest` = exact Label contract) |
| Layer 1 | `--text-badge` (9→10px, 700, `--ls-badge` 0.05em, `--tt-badge` uppercase) | `Badge` (token) / `AdminText size="badge"` | pill/tag/badge text (`text-[9px]` pattern) |
| Layer 1 | `--text-micro` **NEW (T-6, REVIEW)** (8px) | `Label`/`Badge` `size="micro"` | sub-label micro tags — **a11y-flagged**, must pass review or retire |

### 2.5 Caption / metadata secondary

| owner | token | primitive | intended usage |
|---|---|---|---|
| Layer 1 | `--text-caption` (11→11→12→12→13px, 500) | `Caption` | secondary/meta text, timestamps, helper copy (`text-[11px]` pattern) |

### 2.6 Stat value

| owner | token | primitive | intended usage |
|---|---|---|---|
| Layer 1 | `--text-stat-value` (28→32→36→36px, 900, `-0.05em`) | `StatCard` / `AdminText size="stat-value"` | large numeric stats / counters |

### 2.7 Module typography (Layer 2)

| owner | token | primitive | intended usage |
|---|---|---|---|
| Layer 2 Admin | canonical `size` map (display/h1/h2/h3/body/caption/stat-value/badge + metadata/small/heading) | `AdminText` (`variant`: cinzel/garamond/cinzel-value/garamond-value/**sans**) | all Admin-module text; `sans` = render-neutral system text; metadata/small/heading added U-2 Phase A (D-132) |
| Layer 2 User | `H3`+`Body` composition | `PerformanceSectionHeader` | user-module section headers |
| Layer 2 Shared | `AdminText` inside | `SectionHeader` | shared section headers |

### 2.8 Code / content (non-UI chrome)

| owner | token | primitive | intended usage |
|---|---|---|---|
| — | `--font-mono` | none (utility on `<code>`) | code, JSON, technical readouts — documented convention, not a UI primitive |
| — | inherited theme text tokens | `FormattedBodyText` | rendered user content (exempt from primitive routing) |

---

## 3. Responsive behaviour

Canonical tokens scale via media-query `:root` overrides (`index.css`) — primitives read `var(--text-*)` inline, so all size tiers are responsive **by construction**. The new flat tiers (heading 16 / small 14 / metadata 12) hold constant across breakpoints; body/caption already grow at MD/XL. Raw arbitrary px do not scale — mapping them to tiers is the mechanism that restores responsive readability.

## 4. Weight / tracking / transform contract

- **Weights** — `--weight-*` primitives (themes.css:348-354). Semantic defaults live on the tiers: Display 900, H1 900, H2 700, H3 600, Body 500, Caption 500, Label 700, StatValue 900, Badge 700. Pages override **verbatim** via `className` where a visual differs (byte-identical rule).
- **Tracking** — `--ls-*` primitives; default `-0.025em` headings, `0.1em` label, `0.05em` badge, `0.05em` stat. `tracking-widest` (0.1em) is preserved verbatim where it appears; folding it into a default is a render-affecting decision.
- **Transform** — `--tt-label`/`--tt-badge` = uppercase. Plain tiers (body/caption/small/metadata/heading) carry no transform; uppercase is a verbatim className where the design demands it.
- **Line height** — `--lh-*` primitives; tier defaults as defined. **Metadata/Small** mirror the rendered line-heights of the size utilities they absorb (`--lh-metadata: calc(1 / 0.75)`, `--lh-small: calc(1.25 / 0.875)`); **Heading** = `1.5` (current consumers keep `leading-*` verbatim — `AdminText` does not apply a line-height for `size="heading"`). `leading-*` overrides remain verbatim.

## 5. Governance

1. **One scale, three tiers.** No new size/weight/tracking value enters the codebase except as a canonical token or a verbatim className on a certified primitive.
2. **Token changes are Foundation decisions** — new tokens (e.g. future Micro retirement, sub-brand tiers) require a decision-log entry (D-series) and the pixel-identical rule.
3. **Arbitrary sizes** are banned on page-owned elements; permitted only via primitive props (`BrandTitle size`, `AdminText className` verbatim, `Display/H1` className overrides).
4. **Per-page migration** proceeds only after the U-2 gate approval, page by page, render-neutral first, render-affecting items individually signed off.
5. This specification supersedes the phantom Layer-1 raw size primitives (audit T-1/T-7) and the dead legacy utilities (T-2).

## 6. Approval checklist (gate decision — Phase A approved D-132)

- [x] Accept the permanent scale (§2) as the single typography language.
- [x] Approve NEW canonical tokens T-3 (metadata 12), T-4 (small 14), T-5 (heading 16) — render-neutral.
- [x] Approve RETIRE T-1 (phantom Layer-1 sizes + dead caption token) and T-2 (legacy utilities) — render-neutral.
- [ ] Decide T-6 (micro 8px) — approve with a11y note or retire the 8px pattern. **Still gated (Phase B).**
- [x] Reject T-7 (wiring Layer-1 into `@theme` — render-affecting).
- [x] Accept §3–§5 governance (verbatim override rule; token changes = Foundation decisions).

**Deviation (logged D-132):** T-5 token named **`--text-heading`**, not `--text-title` — the latter is a pre-existing color token (see §2.2).
