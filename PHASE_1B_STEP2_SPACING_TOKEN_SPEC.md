# Phase 1b Step 2 — Spacing Token Specification

Source: Phase 1b Step 1 spacing audit (`PHASE_1B_STEP1_SPACING_AUDIT.md`)
Status: COMPLETE — APPROVED. Tokens created in `src/styles/themes.css`; governance recorded in `FOUNDATION_GOVERNANCE.md` §13 (DS-014).
Scope: Design + creation of the spacing token layer ONLY. No component, page, or Tailwind changes.

## Objective

Define and create the single-layer spacing token system for the repository. Token values are taken verbatim from the values already in use repo-wide (Phase 1b Step 1 audit) — no new scale is invented and no visual change is introduced.

## Design Philosophy — Simple, One Layer

The repository design system explicitly rejects abstraction layers for spacing. There is **no** Primitive → Semantic → Alias token mapping for spacing. The architecture is:

```
Pages → Reusable Components → Spacing Tokens
```

Layout components (PageContainer, Stack, Grid, SectionBlock, ContentContainer) remain reusable components and are **not** a token layer. They simply consume the spacing tokens.

**Framework independence.** The Design System owns the spacing *values*; Tailwind is only one method of consuming them. Tokens are defined purely as values (`--space-4 = 16px`). The Tailwind utility mapping (`p-4`, `gap-4`, `px-4`) belongs to the Step 3 implementation, not to this token definition.

**No additional abstraction layers.** Never introduce primitive, semantic, or alias spacing tokens, and no multi-level spacing mapping. This architecture stays consistent with the Typography, Colors, Radius, and Shadows systems.

## The Token Scale

Tokens follow the existing primitive naming convention `--{category}-{value}`. Each token is a single value — documented simply as `--space-{n} = {value}`. No framework utilities belong in the definition; how utilities map to these values is an implementation decision (Step 3).

| Token | Value | Approx. repo usage |
|---|---|---|
| `--space-0` | 0px | ~180 |
| `--space-1` | 4px | ~250 |
| `--space-2` | 8px | ~340 |
| `--space-3` | 12px | ~290 |
| `--space-4` | 16px | ~450 |
| `--space-5` | 20px | ~85 |
| `--space-6` | 24px | ~240 |
| `--space-8` | 32px | ~120 |
| `--space-10` | 40px | ~38 |
| `--space-12` | 48px | ~24 |
| `--space-16` | 64px | 9 |
| `--space-20` | 80px | 3 |
| `--space-24` | 96px | 4 |

## Values Deliberately Excluded

- `28px` (2 uses) — merges into `--space-8` (32px) during migration
- `10px`, `14px`, `6px` half-step one-offs — component-specific micro-values, kept local until Step 6 review
- `160px` (2 uses: `mr-40`/`mb-40`) — orphan values, removed during cleanup
- **Sizing** (`max-w`, `w`, `h`, `min-w`) — a separate system, not spacing
- **Decorative positioning** (absolute offsets, safe-area insets, decorative blob placement, carousel `px-[3px]`) — not spacing tokens

## Usage Rules

1. **Spacing tokens are the only approved source of spacing values throughout the repository** (`FOUNDATION_GOVERNANCE.md` §13, DS-014). Reusable components must never introduce new spacing values unless they become part of the Design System.
2. Components consume tokens directly: `padding: var(--space-5); gap: var(--space-4); margin-bottom: var(--space-6)`.
3. No intermediate aliases or semantic spacing layers.
4. No hardcoded spacing values in component CSS (enforced from Step 5).
5. Responsive stepping stays in component classes (`p-4 md:p-5`) — tokens are static single values.
6. If a value ever changes, only the token changes.

**Token Approval Policy.** A new spacing token may be added ONLY when ALL of the following hold:
- an existing token cannot satisfy the requirement,
- the value is expected to be reused (not a one-off),
- the value has been reviewed and approved as part of the Design System.

Otherwise, existing spacing tokens must be reused. The goal is to keep the spacing system small, predictable, and consistent. Avoid random `px` values, one-off spacing, and arbitrary spacing additions.

## Consumption Modes (implemented in Steps 3–6)

- **CSS**: `padding: var(--space-4)` for component stylesheets.
- **Tailwind `@theme` wiring (Step 3)**: `--spacing-4: var(--space-4)` etc. in `src/index.css` so existing utilities like `p-4` / `gap-2` resolve through the token with zero JSX churn. This is a direct mapping, not an abstraction layer, and it is an **implementation detail** — the token definition itself stays independent of any CSS framework.

## Scope Guardrails (unchanged from the brief)

- **Tables are NOT standardized in this phase.** The three cell-padding dialects (User `px-4 py-4`, Admin DataGrid `px-6 py-4/5`, Sub-Admin bespoke) remain untouched; they get a dedicated later phase.
- No redesigns, no spacing-rhythm changes, no responsive-behavior changes, no page appearance changes.
- `themes.css` addition is the single, approved change of this phase.

## Migration Roadmap (Steps 3–8)

| Step | Work |
|---|---|
| 3 | Introduce tokens into the Design System (`@theme` wiring in `index.css`) |
| 4 | Layout components become the first consumers of the spacing token system (PageContainer, Stack, Grid, SectionBlock, ContentContainer). These components establish the repository-wide spacing behavior. All other reusable UI components follow the same approach during Step 5. |
| 5 | Reusable UI components consume tokens (Card, Button, Modal, DataGrid/Tabs, Input, etc.) |
| 6 | Repository-wide migration of remaining hardcoded spacing values. Tailwind utilities that already resolve through the spacing token system do not require JSX changes. Only components that still contain raw spacing values are migrated. |
| 7 | Certification — visual AND architecture verification (see Certification Requirements) |
| 8 | Legacy cleanup (orphan `28px`/`160px`, hardcoded values, ancient-card raw paddings) |

## Certification Requirements

Visual parity alone is not sufficient. Repository certification verifies BOTH:

**Visual verification**
- Screenshot diff of User Panel, Admin, Sub-Admin, Auth, Exam, Review at 3+ breakpoints.
- Responsive regression on the PageContainer ladder (`px-2 → sm:px-4 → md:px-5 → lg:px-6 → xl:px-8`).
- Confirm Grid `gap-4 md:gap-5 lg:gap-6` and Stack ladder (`4/8/16/24/32/48`) render identically before/after.

**Architecture verification**
- Reusable components consume spacing tokens.
- Reusable components no longer contain hardcoded spacing values.
- Duplicate spacing values have been removed.
- Spacing token usage is consistent across all reusable components.
- Grep check: no remaining hardcoded spacing values outside the token layer (Step 6 exit criterion).

Architecture verification is equally as important as visual verification.

## Rollback Plan

- The tokens are purely additive CSS in `themes.css`; reverting that one block fully rolls back Step 2.
- The `@theme` mapping is a direct substitution; `git revert` of `src/index.css` restores prior behavior.

## Success Criteria

- `--space-0` … `--space-24` defined in `themes.css`, values matching repo usage.
- Zero visual change (no component, page, or Tailwind modifications).
- No abstraction layers, no aliases, no semantic spacing tokens.
- Spec documents scale, exclusions, usage rules, and the Step 3–8 roadmap.
- Governance rules documented in `FOUNDATION_GOVERNANCE.md` §13 (DS-014) and §14 (Migration Lifecycle).

## Final Approval Criteria (Step 2 completion)

Step 2 is fully complete when:

- spacing tokens are finalized,
- governance rules are documented,
- token ownership is clearly defined,
- migration responsibilities are clarified,
- certification includes both architectural and visual verification,
- repository simplicity has been preserved.

## Final Design Principle

> **The Design System should centralize values — not complexity.**
>
> Every reusable component should consume the same spacing tokens.
>
> Pages should consume reusable components.
>
> The repository should remain simple, consistent, maintainable, and easy to evolve without introducing unnecessary architectural layers.
