# Admin Users — Management Surface Proposal

**Phase 3.7 — Admin Users Visual Language Audit (Discovery only)**
**Status:** CONCEPTUAL DESIGN TARGET ONLY — **NOT an implementation decision. No code. No tokens. No variants. No Foundation changes. No visual changes.**
**Scope:** Admin Users as the validation page; proposal applies to the whole Management Page Standard.
**Related:** `ADMIN_USERS_SURFACE_AUDIT.md`, `ADMIN_USERS_COLOR_AUDIT.md`, `ADMIN_USERS_VISUAL_AUDIT.md`, `ADMIN_USERS_VISUAL_MIGRATION_PLAN.md`.

---

## 1. Purpose

This document proposes a **future** neutral **Management Surface Family** for management pages.
It exists solely to give the migration roadmap a defined target. It is **not** an approved design,
**not** a token spec, and **not** authorization to build anything. Implementation requires a separate
approval gate and a new D-series decision.

---

## 2. Current Repository (evidence — this is how it is today)

### 2.1 Amber / parchment management surfaces

In **light mode**, every management surface resolves to the Legacy Ancient language through frozen
Foundation + theme tokens (full ledger in `ADMIN_USERS_COLOR_AUDIT.md` §2):

| Surface | Resolved light value | Source |
|---|---|---|
| Page canvas | `--bg-app` `#E2CFA6` cream | `themes.css:692` |
| Card family | parchment `#C9A070` + gold `#A87828` border + carved gold shadow | `themes.css:928,1224,1225,757` |
| Card light overrides | gold gradient + carved shadow on default/premium variants | `AntigravityCard.tsx:25,30,33-34` |
| Toolbar / Filter / Selection | parchment/gold | `AntigravityLayout.tsx`, `CollectionFilter.tsx` |
| Primary/Secondary buttons | forest gradient + gold/brown; parchment + gold | `themes.css:1099-1102,1232-1237` |
| Skeleton / Empty | gold `GOLD_SURFACE` | `SharedComponents.tsx:14-53,140` |

Dark mode is fully neutral (slate surfaces, blue accent). **Amber is a light-mode-only phenomenon.**

### 2.2 Existing Foundation ownership (correct, frozen)

- **Card** (DS-001 frozen) owns the card surface; `PREMIUM_LIGHT_OVERRIDES` is the amber source.
- **CollectionCard** (frozen v1.1) maps `premium → premium-dark-neutral`; delegates surface to Card.
- **CollectionToolbar** (frozen 3.2.2), **CollectionFilter** (frozen 3.2.4), **CollectionHeader**,
  **SelectionCheckbox**, **SelectionContainer**, **Tabs**, **Menu**, **Avatar**, **Badge**, **Button**,
  **AdminModal**, **Toast**, **Pagination**, **GridSkeleton/EmptyState** — all frozen Foundation.
- The page itself owns **zero** surface/color classes (Management Page Standard §8.3).

### 2.3 Existing Standard

- `docs/design-system/MANAGEMENT_PAGE_STANDARD.md` (D-133, certified).
- **Rule 12:** "All surfaces belong to the **certified premium family** — one language across
  selection, toolbar, and cards."
- The "certified premium family" **is** the amber/parchment language in light mode. The Users page
  therefore renders amber **because the Standard mandates it**.

---

## 3. Future Direction (conceptual target — NOT implemented)

### 3.1 Management Surface Family definition

A neutral management language, distinct from the Exam/premium gold family:

| Characteristic | Target |
|---|---|
| Light surfaces | neutral white / light-gray, not parchment |
| Dark surfaces | neutral slate (unchanged from today) |
| Borders | neutral, low-chroma (not gold) |
| Elevation / shadows | subtle, soft, neutral (not carved gold) |
| Cards | management-focused, neutral, calm |
| Gold | **accents only** (brand/status highlights), never the surface |
| Status colors | independent (success/danger/warning/info as today) |
| Control family | independent (buttons, inputs, filters neutral) |
| Typography | unchanged (Typography family is theme-consistent) |

### 3.2 Additive Foundation evolution (how it would be introduced)

| Layer | Additive change (proposal) |
|---|---|
| Token namespace | new `--management-*` light tokens (neutral values); **no existing token mutated** |
| `Card` | new **additive** `management` variant (neutral light + neutral dark) — allowed under the DS-001 freeze rule ("new variants that do NOT change existing variants"); existing variants stay pixel-identical |
| `CollectionCard` | new **additive** `management` variant mapped to the new Card surface; `premium` unchanged |
| `CollectionToolbar` / `CollectionFilter` / Buttons | consume the new neutral management tokens via their existing role namespaces (`--toolbar-*`, `--filter-*`, `--button-*`) |
| Skeleton / Empty | neutral management variant alongside the gold `GOLD_SURFACE` |
| Selection / Tabs | neutral management surfaces; gold confined to active-state accents |

**Hard constraint:** additive-only. Any mutation of a frozen component's existing render (incl.
`PREMIUM_LIGHT_OVERRIDES`) is **forbidden** without a re-audit + explicit approval (freeze register,
Engineering Standard V3.1).

### 3.3 Standard amendment (proposal)

- Amend Management Page Standard **rule 12** from "certified premium family" to the **Management
  Surface Family** as the one surface language for management pages, with gold reserved for accents.
- Requires a new D-series decision **before** any Foundation evolution begins.

### 3.4 Repository-wide migration & one-language rule (proposal)

- **Permanent rule:** the repository must never permanently contain two different visual languages
  for management pages. There is **one Management Surface language**.
- Migration order (from the approved roadmap): Users (validation) → Questions → Students → Exams →
  Sub Admins → Leaderboard → future management pages.
- Amber/parchment management surfaces are treated as a **legacy language** identified in this audit,
  superseded page-by-page as the neutral family rolls out.

---

## 4. What This Proposal Does NOT Do

| Not done | Because |
|---|---|
| No tokens created | Proposal only; `--management-*` is illustrative |
| No `Card` variant created | Freeze-safe additive; requires Foundation-phase approval |
| No `CollectionCard` change | Frozen v1.1; page phase touches nothing |
| No Management Page Standard edit | Rule 12 amendment requires a D-series decision |
| No amber removed | Phase 3.7 is discovery only |
| No code / visual change | Zero implementation in this phase |

---

## 5. Risks of the Future Direction (recorded for planning only)

| Risk | Mitigation (future) |
|---|---|
| Additive variant proliferation | Keep the management family additive and single-sourced; no parallel "third" dialect |
| Two management languages during migration | Enforce the one-language rule; migrate page-by-page with no permanent divergence |
| Frozen-component mutation | Never mutate existing renders; only add variants/tokens |
| Light/dark drift | New tokens resolve in both themes with a documented value table |
| Questions divergence | Questions is the first Standard implementation; it migrates in P4 to keep one language |
