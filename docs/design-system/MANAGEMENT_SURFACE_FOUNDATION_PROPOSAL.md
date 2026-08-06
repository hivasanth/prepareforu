# Management Surface Foundation Proposal

**Phase 3.8 — Repository-Level Design Decision (Foundation Before Migration)**
**Status:** PROPOSAL ONLY — the *conceptual* Foundation evolution. **No code, token, variant, component, or Foundation changes are made here.**
**Purpose:** Step 4 of the brief — decide the single **Foundation evolution strategy** and document the proposed (not-yet-approved) implementation shape that a later phase would execute.
**Related:** `MANAGEMENT_SURFACE_FOUNDATION_ARCHITECTURE.md`, `MANAGEMENT_SURFACE_DECISION_MATRIX.md`, `MANAGEMENT_SURFACE_MIGRATION_STRATEGY.md`, `MANAGEMENT_SURFACE_RISK_ASSESSMENT.md`.

---

## 1. Step 4 — Foundation Evolution Strategy

### 1.1 Options evaluated

| # | Strategy | How it would work | Verdict |
|---|---|---|---|
| 1 | **New variant** (additive) | Add `Card` `management` + `CollectionCard` `management` variants. New variants, existing variants pixel-identical. | ✅ **Core mechanism** — freeze-safe (DS-001 allows new variants that don't change existing renders; `FOUNDATION_GOVERNANCE.md` API Evolution). |
| 2 | **New token family** | Add `--management-*` namespace (light + dark neutral values). | ✅ **Required substrate** — no existing token is touched; the variant needs a neutral token source. |
| 3 | **New component** | Build a new management-only surface component beside `Card`. | ❌ REJECT — duplicates the surface authority; violates "one owner per surface" (D-107) and the golden-owner principle (`Card` is the surface owner). |
| 4 | **Alias** | Point new tokens at existing neutral values / alias existing tokens to new ones. | ❌ REJECT as the *primary* mechanism — no existing token resolves neutral in light for surfaces; aliasing old→new can't produce a new light value without mutating the source. Aliases may be used *internally* inside the new namespace where a value already matches (documented in §2.2), but never to re-tint existing tokens. |
| 5 | **Inheritance** | Have management variants inherit from `default`/`premium-neutral` with light overrides. | ❌ REJECT as the *primary* mechanism — `premium-neutral`/`premium-dark-neutral` inherit `PREMIUM_LIGHT_OVERRIDES` (`AntigravityCard.tsx:33-34`), i.e. the amber source; inheritance would re-introduce amber. The management variant must inherit only the recipe *shape*, with a neutral token set. |

### 1.2 Recommendation

**Primary strategy: additive new variants (Option 1) hosted on a new token family (Option 2)** — executed together as the single evolution strategy.

```
New token family:  --management-*        (light + dark neutral values; nothing existing mutates)
        ↓
New variant:       Card variant="management"   (same recipe shape as premium; neutral values)
        ↓
New variant:       CollectionCard variant="management"  (maps to Card management surface)
        ↓
Re-anchor:         management consumers (toolbar, filter, buttons, skeleton, selection)
                   → management tokens via existing role namespaces
```

- **Why variants + token family together:** the token family without a variant has no freeze-safe host (rejecting Option C in the matrix); the variant without its own token namespace would re-inherit the amber `PREMIUM_LIGHT_OVERRIDES`. They are inseparable halves of one strategy.
- **Why not alias/inheritance/new component:** documented in §1.1. Additive is the only strategy that satisfies the permanent freeze while expressing a genuinely new neutral light value.

---

## 2. Proposed Implementation Shape (CONCEPTUAL — not executed)

> Everything in this section is a **target description** for a future approved phase. Zero values, tokens, or components exist today. Verified: `--management-*` currently has **zero occurrences** in `src/styles/themes.css`.

### 2.1 Proposed token namespace (illustrative values — NOT created)

| Token (proposed) | Light (proposed) | Dark (proposed) | Replaces in management path |
|---|---|---|---|
| `--management-surface` | neutral light gray (e.g. near-white) | `#1F2937` (today's dark `bg-card-bg`) | `--bg-surface`/`--card-bg` parchment `#C9A070` |
| `--management-surface-muted` | subtle gray fill | `#374151` | `--bg-hover-bg`/`--surface-stat` gold gradient |
| `--management-border` | low-chroma neutral | `#374151` | `--border-gold`/`--card-premium-border` `#A87828`, `--border-subtle` gold-tint |
| `--management-border-strong` | slightly darker neutral | `#4B5563` | amber border emphasis |
| `--management-shadow` | soft neutral shadow | `--elevation-2` | `--card-shadow` carved, `--shadow-premium-card` |
| `--management-hover` | subtle lift shadow | existing neutral hover | `--shadow-card-premium` gold hover |
| `--management-accent` | existing `--color-primary` (blue accent) | same | gold accent → status/brand only |

**Rule:** proposed light values must be **achromatic/neutral**; gold is never a surface in this namespace. Dark values stay the certified neutral values already proven today (`themes.css` dark block), so dark mode is pixel-unchanged.

### 2.2 Proposed internal aliases (only where a value already matches)

Where a proposed management value is identical to an existing neutral token, the future implementation may **reference** the existing token (e.g. dark management shadow = `--elevation-2`, dark surface = existing `--card-bg` dark value) rather than duplicate a constant. This is *internal* to the new namespace and never re-tints an existing token.

### 2.3 Proposed Card variant (additive — existing variants pixel-identical)

```
Card variant="management"  (AntigravityCard.tsx)
  rounded-2xl
  bg-[var(--management-surface)]
  border-[1.8px] border-[var(--management-border)]      ← same border-width dialect as premium
  shadow-[var(--management-shadow)]
  transition-[transform,box-shadow] duration-200
  hover:-translate-y-0.5 hover:shadow-[var(--management-hover)]
  ← NO PREMIUM_LIGHT_OVERRIDES (no light:stat-card-surface / light:shadow-premium-card)
```

Freeze compliance: a **new** variant entry in `variantClasses` + `defaultPaddingMap`; all existing variant strings untouched. Passes the DS-001 additive rule and `FOUNDATION_GOVERNANCE.md` API Evolution (≥3 management consumers; backward compatible; Foundation-owned).

### 2.4 Proposed CollectionCard variant (additive)

```
CollectionCard.tsx VARIANT_MAP:
  management: { surface: 'management' }        ← new Card surface
  premium: unchanged (→ premium-dark-neutral)  ← Exam/premium consumers pixel-identical
```

### 2.5 Proposed management-consumer re-anchoring

| Consumer | Today (amber in L) | Proposed (management namespace) |
|---|---|---|
| `CollectionToolbar` | premium Card recipe (`light:stat-card-surface`) | consume `--management-*` via toolbar surface tokens |
| `CollectionFilter` | `--card-*`/`--shadow-card-premium` trigger | consume `--management-*` via `--filter-*` role tokens (D-121) |
| Search `Input` | `--border-subtle` gold-tint | neutral management border (token-level) |
| `Button` primary | gold/brown `:1099-1102` | neutral primary material via `--button-*` (gold accent remains for status) |
| `Button` secondary | parchment+gold `:1232-1237` | neutral secondary material via `--button-*` |
| `GridSkeleton`/`EmptyState` | gold `GOLD_SURFACE` (`SharedComponents.tsx`) | neutral management variant alongside `GOLD_SURFACE` |
| `SelectionContainer`/`Tabs` | gold selection surface | neutral management selection; gold→active-state accent only (see Risk Assessment — Navigation-family caution) |
| Modal panel / Toast | `bg-card-bg` parchment | neutral management surface |

**Status-hued controls (row Activate/Deactivate, status badges, severity hues) are unchanged** — Status family is independent.

### 2.6 Proposed Management Page Standard amendment (rule 12)

Amend rule 12 from "all surfaces belong to the **certified premium family**" to "all surfaces belong to the **certified Management Surface Family** (neutral; gold confined to accents)". This is a Standard text change requiring a new D-series decision **before** the Foundation evolution begins.

---

## 3. What This Proposal Does NOT Do

| Item | Not done because |
|---|---|
| No tokens created | `--management-*` is illustrative; phase is decision-only |
| No `Card`/`CollectionCard` variant created | Freeze-safe additive; requires Foundation-phase approval (D-series) |
| No `themes.css` change | Token creation belongs to the approved evolution phase |
| No Management Page Standard edit | Rule 12 amendment requires its own D-series decision |
| No page migration | Foundation-before-pages is the phase's core rule |
| No code / visual change | Zero implementation in Phase 3.8 |

---

## 4. Approval Gate (this proposal)

Approval of this proposal authorizes **only** the next phase (P2 Foundation evolution) — never a page migration. Required before implementation:

1. D-series decision approving the `--management-*` token namespace + `management` variants.
2. Rule 12 Standard amendment decision.
3. Foundation-phase verification gate per component (Light/Dark/Hover/Focus/Disabled/Responsive/A11y/Build/TypeScript; `FOUNDATION_GOVERNANCE.md` Verification Rules).

Until then this remains a proposal. Full plan in `MANAGEMENT_SURFACE_MIGRATION_STRATEGY.md`; risks in `MANAGEMENT_SURFACE_RISK_ASSESSMENT.md`.
