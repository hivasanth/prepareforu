# Phase 5.4 — Motion Language Specification

**Status:** ⏳ AWAITING APPROVAL (design proposal — no implementation until approved)
**Date:** 2026-08-06
**Parent audit:** `VISUAL_LANGUAGE_AUDIT.md`

---

## 1. Purpose

Define the ONE motion system. Every transition — hover, pressed, focused, selected, loading,
modal, drawer, dropdown, toast, tooltip — uses the shared duration/easing scale and scoped
transition channels. No arbitrary durations, no unjustified `transition-all`.

---

## 2. The motion scale (one system)

### 2.1 Durations (canonical, from `themes.css` transition tokens)

| Token | Value | Use |
|---|---|---|
| `--transition-fast` | 150ms | color/background changes, micro-interactions |
| `--transition-base` | 200ms | **default** — the standard interaction duration |
| `--transition-slow` | 300ms | panels, collapses, chevrons, slides |
| `--transition-slower` | 500ms | decorative flourishes (rank icon rotate, leaderboard card) |

Rule: an interaction picks ONE duration from this scale. **No 250ms, no 400ms, no 600ms, no 700ms,
no 1s** outside frozen carved/gold materials.

### 2.2 Easing (canonical)

| Token | Value | Use |
|---|---|---|
| `--ease-out` | cubic-bezier(0.33, 1, 0.68, 1) | **default** — enter/hover states |
| `--ease-in-out` | cubic-bezier(0.65, 0, 0.35, 1) | reveal/toggle channels |
| `--ease-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) | decorative scale flourishes (rank icons, card floats) |

### 2.3 Channels (scoped, never `transition-all`)

| Channel | Property list |
|---|---|
| Color | `color, background-color, border-color, opacity, filter` |
| Transform+shadow | `transform, box-shadow, border-color` |
| Transform | `transform` |
| Opacity | `opacity` |
| Layout | width/height/grid (system `transition-[…]` per need) |

**Rule:** `transition-all` is prohibited except where a certified component deliberately animates
the full box (none currently qualify — all current `transition-all` are H-sweep targets).

---

## 3. Element → motion recipe map

| State / element | Channel | Duration | Easing | Notes |
|---|---|---|---|---|
| Button hover | color/transform | 200ms (recipe channel) + framer `whileHover 1.01` | `--ease-out` | BUTTON spec |
| Button pressed | framer `whileTap 0.98` | instant spring | — | motion-reduced: scale off |
| IconButton hover | color | 150–200ms | `--ease-out` | |
| Card hover lift | transform+shadow | 200ms | `--ease-out` | `hover:-translate-y-0.5` + elevation E2 |
| Card slide / hover chevron | transform | 300ms | `--ease-in-out` | `group-hover:translate-x-1` |
| Table row hover | color | 150ms | `--ease-out` | `hover:bg-hover-bg/30` |
| Menu/dropdown item hover | color | 150ms | `--ease-out` | |
| Sidebar nav active + hover | color/transform | 150ms (color) / 200ms (icon scale) | `--ease-out` | icon `group-hover:scale-110` |
| Tab/pill hover | color | 150–200ms | `--ease-out` | PILL spec |
| Focus ring | none (instant) | — | — | focus-visible ring is not animated |
| Selected / active state | color | 150ms | `--ease-out` | |
| Loading (pulse) | `animate-pulse` | 2s loop | — | skeleton family |
| Spinner | `animate-spin` | 1s linear loop | — | |
| Modal/drawer enter | opacity + transform/scale | 200ms | `--ease-out` | exit ~150ms |
| Dropdown popover | opacity + transform | 150ms | `--ease-out` | |
| Toast enter | translate-x + opacity | 200ms | `--ease-out` | |
| Tooltip | opacity | 150ms | `--ease-out` | |
| Decorative scale/rotate (rank avatar, method icon) | transform | 500ms | `--ease-spring` | `group-hover:scale-110` / `rotate-12` |
| Reveal-on-hover metadata | opacity | 200ms | `--ease-out` | |

---

## 4. Current adoption & findings

**Evidence (from `VISUAL_LANGUAGE_AUDIT.md` §6):**
- Certified recipes already at 150/200ms: buttons (recipe channel), cards (200ms), table rows,
  nav items, tabs, drag (framer 1.01/0.98), scroll.
- **Divergence found:** durations 150/200/300/500ms are all present but inconsistently applied —
  `hover:scale-105` (300ms `transition-all`), `transition-all` (200ms), `shadow-primary/20`
  `group-hover:scale-110` (300ms), `transition-all duration-300`, `duration-500` rotations.
- **`transition-all` occurrences** (H-sweep targets): `MethodSelectionView`, `TopicCard`,
  `TeacherExamCard`, `SubjectCardItem` — all should be scoped channels.
- Decorative 500ms spring flourishes are certified (LeaderboardView rank avatar, MethodSelectionView
  icon, PerformanceAnalyticsSection) — these are the ONLY 500ms uses and are frozen.

---

## 5. Motion issue list (M-*)

| ID | Issue | Action |
|---|---|---|
| M-1 | Duration divergence (150/200/300/500 applied ad hoc) | Map every transition to §2.1 scale; keep frozen 500ms flourishes |
| M-2 | Unscoped `transition-all` | Sweep and scope to channels (§2.3) |
| M-3 | Non-scale durations (any 250/400/600/700ms) | Audit + normalize to scale |
| M-4 | Modal/drawer/dropdown/toast/tooltip timing not centralized | Document + align to §3 recipes (migration verification) |
| M-5 | Motion-safety (`prefers-reduced-motion`) | Verify `motion-reduce` / framer `useReducedMotion` on transforms + springs; disable scale/rotate/lift, keep opacity-only |

---

## 6. Frozen

- `--transition-*` duration tokens (150/200/300/500ms) in `themes.css`.
- Framer `whileHover 1.01` / `whileTap 0.98` (Button), drag constraints.
- 500ms `--ease-spring` decorative flourishes (rank icon rotate, method icon scale, topic chevron).
- `animate-pulse` skeleton motion + `animate-spin` spinner.
- Focus rings are instant (no ring animation).
