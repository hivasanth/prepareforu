# FOUNDATION_CONSUMER_IMPACT_REPORT — Phase 6.X

- **Phase:** 6.X (Foundation Visual Refinement)
- **Status:** IMPLEMENTED 2026-08-07
- **Purpose:** Enumerate every place consumer (page/feature) code was touched by the Foundation
  refinement, classify each change, and confirm the certified token/component API is **not broken** —
  the refinement re-assigns token values and hoists a shared hover composite, but adds/renames no
  certified API contract.

---

## 1. Principle

Phase 6.X must refine the Foundation without requiring consumer migration. Two distinct surfaces
therefore exist:

1. **Foundation-internal surface** — `WelcomeBanner`, `AntigravityCard` (incl. StatCard),
   `Skeleton`, `themes.css`, `index.css`. These are the refinement atoms themselves.
2. **Consumer surface** — page/feature components that happen to host a card/list hover or a banner.
   The only permitted consumer change is re-pointing a hover recipe at the now-shared `CARD_HOVER`
   composite (a base-Foundation API) — **no layout/content/data change**.

---

## 2. Consumer-surface inventory (finite)

### 2.1 Hover-recipe re-pointings (the ONLY consumer comps changed)

| Consumer | Prior hover | Now | Class |
|---|---|---|---|
| `TopicCard.tsx` | `hover:shadow-card-premium` | `hover:shadow-card-hover-shadow` + `hover:bg-hover-bg/40` + `duration-fast` (`CARD_HOVER`) | presentational hover re-alias |
| `SubjectCardItem.tsx` | `ancient-3d-lift` (dead recipe incl. `duration-slow`) | `CARD_HOVER` | dead-recipe removal + hover re-alias |
| `LeaderboardView.tsx` | `hover:brightness-[1.02]` | `hover:bg-hover-bg/40` (`CARD_HOVER` color half) | presentational hover re-alias |

None of the three change geometry, content, padding, z-order, or data. They only erase a
per-component hover behavior in favor of the single card-hover language (Task 4).

### Consumer | Markup-only (no visual-size/API change)

| # | Detail | Class |
|---|---|---|
| StatCard metric ladder (`AntigravityCard` StatCard) | value classes `text-sm sm:text-base lg:text-lg` → `text-base sm:text-lg lg:text-xl` + `tabular-nums` | size/value change visible only to a StatCard instance; consumed by consumers that already render StatCard |
| `WelcomeBanner.tsx` | is a **shared Foundation consumer** (used by user dashboard); banner markup refined in place | Foundation-owned; rendered via its single consumer path |
| `DashboardRecentActivity.tsx` | heading `mb-5` spacing | whitespace-only on page |

---

## 3. What is NOT a consumer contract change

- **Token names** — `text-on-dark`, `text-text-secondary`, `shadow-card-hover-shadow`, `bg-hover-bg`,
  `--card-shadow`, `--bg-app`/`--bg-elevated`/`--bg-hover`/`--bg-active`, `--skeleton-*`, and the light
  nav tokens are all **pre-existing names**. The `.light` identifiers mutated are **values only**.
- **Component API** — no `AntigravityCard`, `Skeleton`, `Typography`, `Pill`, `Menu`, `Navigation`,
  `DataGrid`, `Pill`, `Card` prop or signature changed.
- **Foundation barrel** — no new export added/removed; `CARD_HOVER` is an exported composite in
  `AntigravityCard.tsx` (already public), not a new component.
- **Routing / data / services / layout / guards** — untouched.

---

## 4. Migration analysis

Because the refinement is (a) token-value-only in `themes.css`, (b) inside-`Foundation` in
`WelcomeBanner`/`AntigravityCard`/`Skeleton`, and (c) hover-recipe re-pointing on the three consumer
files — there is **no consumer-migration debt**. A forward-ported page that already built
on the certified Card/premium-surface ladder and the semantic hover tokens automatically inherits
the refined hover and light brightness the moment it composes `CARD_HOVER` / the `.light` tokens.

The only remaining consumer cleanup (deferred, already logged in earlier phases) is the broader
`ancient-*`**/gold-* ruler** sweep owned by the 5.4G repository migration — not this phase.

---

## 5. Verification of the claim "cert API not modified"

| Claim | Evidence |
|---|---|
| No component API contract changed | `git diff` on `src/components/*.tsx` contains only className/class-string edits + the value ladder — zero prop/type/signature changes |
| No new token namespace | `themes.css` `.light` diff = reassignments of existing `--bg-*`/`--skeleton-*` names + two additive light-nav tokens (`--bg-nav-active`,`--text-nav-active`); grep list of token names unchanged |
| Freeze register intact | no DS-016/17/18/19 row value mutated (governance): DS-020 is a **new** additive row |
| No page migration | no `src/pages/**` file in the 6.X scope (only a `UserDashboard.tsx`-unrelated spacing-adjacent consumer `DashboardRecentActivity`); `App.tsx` untouched |

---

## 6. Conclusion

The consumer footprint of Phase 6.X is **three hover-recipe re-points**, one spacing tweak, and the
Foundation-internal refinements — all presentational, data-neutral, and API-neutral. The certified
token/component API is unchanged; `.light` surface shift is a value re-assignment only. No consumer-migration
work is required to adopt the refinement set.