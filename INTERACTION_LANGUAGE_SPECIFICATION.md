# Phase 5.4E — Interaction Language Specification

**Status:** ✅ IMPLEMENTED — Phase 5.4E Foundation executed 2026-08-06; **amended 2026-08-10 by Phase 6.Z (D-184)** — cards/containers/rows hover via the **3D lift + deepened shadow** (`CARD_HOVER`/`ROW_HOVER`); controls keep the brightness model; **awaiting user certification**. Consumer migration (Phases 3-7) is separate and gated (5.4G).
**Date:** 2026-08-06 (v1) / 2026-08-10 (v2, D-184)
**Decisions:** D-169 (planning), D-170 (implementation), D-184 (3D-lift hover) in `docs/design-system/DESIGN_DECISION_LOG.md`
**Governance:** `FOUNDATION_GOVERNANCE.md` §4 Hover & Motion Language Contract (PERMANENT, amended v1.32.0); Freeze Register **DS-018**
**Companion specs:** `HOVER_LANGUAGE_SPECIFICATION.md`, `MOTION_LANGUAGE_SPECIFICATION.md`, `FOUNDATION_INTERACTION_AUDIT.md`

---

## 1. Purpose

Define the **ONE interaction-state model** shared by every interactive Foundation surface. All eight
modeled states — **rest / hover / pressed / focused / selected / disabled / loading / read-only** —
resolve through a single grammar: the same scoped transition channel, the same token duration/easing,
the same focus ring, and the same certified hover model — **3D lift for cards/rows, brightness for
controls** (D-184). The pre-5.4E state was divergent
(scale hovers, `transition-all`, inconsistent focus rings, ad hoc durations); this spec is the
canonical statement of the implemented language.

---

## 2. The interaction-state model (DS-018)

| # | State | Contract | Implemented recipe |
|---|---|---|---|
| 1 | **Rest** | the surface's certified material; flat by default | component `variant` material; no shadow unless the surface carries one |
| 2 | **Hover** | cards/containers/rows: **3D lift + deepened shadow** (`hover:-translate-y-1`/`-translate-y-0.5` + `hover:shadow-card-hover-3d` via `CARD_HOVER`/`ROW_HOVER`); controls (buttons/pills/nav/menu): subtle brightness + very small `--elevation-*` shadow refinement — **never scale/rotate** | `CARD_HOVER`/`ROW_HOVER` (lift + depth); `hover:brightness-105` (filled controls) + `hover:shadow-card-hover-shadow`; rows-as-controls `hover:bg-hover-bg/…`; color accents `hover:text-text-primary`; border accents `hover:border-<token>` |
| 3 | **Pressed** | brightness dim; no transform | `active:brightness-95` (buttons/pills/cards); cards/rows release their lift on `:active` if clickable |
| 4 | **Focused** | ONE visible ring; input-role fields keep border-color focus | `FOCUS_RING` = `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2`; focus ring is instant (not animated) |
| 5 | **Selected** | state-owned material per owning system (Pills = Management Surface selection; segments/tabs = `TAB_SPRING` layout + management colors) | DS-017 Pill selected colors (`--management-surface-active`/`--management-accent`/`--management-border-active`); `aria-pressed`/`aria-current` where toggle/nav |
| 6 | **Disabled** | reduced emphasis + cursor; not interactive | `opacity-…` neutral + `cursor-not-allowed` (`CURSOR_NOT_ALLOWED`); native `disabled` on real buttons/inputs |
| 7 | **Loading** | spinner replaces/joins content; announces busy | certified `Spinner` + `aria-busy`; `pointer-events-none` as needed |
| 8 | **Read-only** | not interactive; flat rest material; no hover/pressed/focus affordance | components used without `onClick`/as presentation render no hover/pressed/focus |

---

## 3. Transition channel per state (the only sanctioned channels)

| Channel | Property list | Used for |
|---|---|---|
| `transition-interaction` | color, background-color, border-color, box-shadow, filter, opacity | **default for controls** — hover/pressed/selected/disabled/loading on buttons, pills, rows-controls, menu items, inputs |
| `transition-card-3d` (Phase 6.Z D-184) | translate, box-shadow, background-color, border-color | the **card/row 3D-lift hover** (`CARD_HOVER`/`ROW_HOVER`) — Tailwind v4 `-translate-y-*` drives the CSS `translate` property |
| `transition-transform` | transform | real motion only: chevron rotation, Navigation tooltip slide, switch thumb |
| `transition-[width]` | width | progress bars |

`transition-all` is prohibited. Durations come from `--duration-*`; easings from `--ease-*`
(`TRANSITION_INTERACTION` = `transition-interaction duration-fast ease-standard`).

---

## 4. State coverage by surface family

| Surface family | Hover | Pressed | Focus | Selected | Disabled/Loading |
|---|---|---|---|---|---|
| Buttons / IconButtons | brightness + elevation | brightness dim | `FOCUS_RING` | — | opacity + cursor + spinner |
| Cards (premium/management) | **3D lift + deepened shadow** (`CARD_HOVER`: `-translate-y-1` + `shadow-card-hover-3d`; management keeps surface/shadow/border refinements) | brightness dim | `FOCUS_RING` (clickable) | — | opacity |
| Table rows / list rows | **subtle 3D lift + deepened shadow** (`ROW_HOVER`: `-translate-y-0.5` + `shadow-card-hover-3d`) | surface fill | `FOCUS_RING` (focusable) | row highlight (consumer) | opacity |
| Menu / dropdown / tooltip items | `hover:bg-hover-bg` | surface fill | `FOCUS_RING` | `bg-primary/20 text-primary` (Menu.Item selected) | — |
| Pills / badges | Management Surface fill / brightness + accent border (DS-017) | brightness dim | 2px ring (DS-017) | management-surface active colors | neutral + opacity + spinner |
| Tabs / segments | surface fill | brightness dim | `FOCUS_RING` | `TAB_SPRING` layout + management colors | opacity |
| Input-role fields | `hover:border-<token>` | — | `focus:border-<token>` (border IS the focus) | — | opacity + not-allowed |

---

## 5. Accessibility contract

- **Reduced motion:** `MotionConfig reducedMotion="user"` in `main.tsx` + `prefers-reduced-motion`
  0.01ms CSS overrides in `index.css` neutralize CSS transitions and framer-motion animations for
  users who prefer reduced motion; motion is never essential to understanding content.
- **Focus visibility:** every keyboard-focusable element shows exactly one visible focus indicator
  (`FOCUS_RING`, or border-color focus for input roles).
- **State communicated beyond color:** disabled uses cursor + (native) disabled semantics; loading
  uses `aria-busy`; toggle/nav selection uses `aria-pressed`/`aria-current`.
- **No uncontrolled layout shift:** cards/rows move by the **sanctioned** 3D-lift only
  (`-translate-y-1`/`-translate-y-0.5` via `CARD_HOVER`/`ROW_HOVER`, animated by `transition-card-3d`);
  controls never move or resize on hover (brightness/shadow/surface only).

---

## 6. Compliance map — all resolved in 5.4E

| Finding | Pre-5.4E | 5.4E result |
|---|---|---|
| Scale/rotate hovers (avatar, method icon, topic chevron, rank avatar) | `group-hover:scale-110`, `hover:scale-105`, `rotate-12`, `translate-x-1` | removed — brightness/surface only |
| `transition-all` (4+ components) | `transition-all` in MethodSelectionView, TopicCard, TeacherExamCard, SubjectCardItem | swept — zero remaining |
| Selected-state scale (`SubjectCardItem` `scale-[1.03]`) | scale on selected | removed — color/ring selection only |
| Inline framer durations (0.3/0.5s) + springs | `{ duration: 0.3 }`, spring configs | → `MOTION_DURATION`/`MOTION_EASE`/`TAB_SPRING`/`MODAL_TRANSITION` |
| Pressed translate/scale (ancient buttons, otp) | `translateY(1px)`, `scale(1.1)` | removed — brightness dim |
| Broken `${…}` interpolations (9) | literal `${TRANSITION_INTERACTION}` text in plain `className` strings | fixed — literal class tokens |

---

## 7. Frozen (DS-018, amended 6.Z)

- The 8-state interaction model and the per-family recipes above.
- `FOCUS_RING` as the ONE visible focus ring.
- **Cards/rows:** the sanctioned 3D-lift hover (`CARD_HOVER`/`ROW_HOVER` — `-translate-y-1`/`-translate-y-0.5` + `shadow-card-hover-3d`, `transition-card-3d`); **controls:** the no-lift/no-scale brightness model.
- `transition-interaction` as the default scoped channel for controls; `transition-card-3d` for card/row hover; `transition-all` prohibition.
