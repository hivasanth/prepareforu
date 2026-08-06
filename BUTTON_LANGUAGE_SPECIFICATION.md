# Phase 5.4 — Button Language Specification

**Status:** ⏳ AWAITING APPROVAL (design proposal — no implementation until approved)
**Date:** 2026-08-06
**Parent audit:** `VISUAL_LANGUAGE_AUDIT.md`
**Authority:** FOUNDATION_GOVERNANCE.md v1.18.0 — `AntigravityButton.tsx` is the frozen source.

---

## 1. Purpose

Define the ONE button language. Every button in the app — `Button`, `PrimaryButton`,
`IconButton`, and every raw `<button>` — renders through this single language. The recipe below
is the certified current state; the language is unified by **enforcing** it (migrating raw buttons
and outliers), not by redesigning it.

---

## 2. Canonical Button recipe (frozen — AntigravityButton.tsx)

### 2.1 Base (all variants, both themes)
```
uppercase flex items-center justify-center transition-[color,box-shadow,border-color,opacity,filter] duration-200
```

### 2.2 Size scale
| Size | Recipe |
|---|---|
| xs | `h-8 px-3 text-[10px] rounded-[10px]` |
| sm | `h-9 px-4 text-xs rounded-[12px]` |
| md | `h-[48px] px-6 text-[13px] rounded-[14px]` |
| lg | `h-[48px] px-8 text-[14px] rounded-[14px]` |
| xl | `h-14 px-10 text-[15px] rounded-[16px]` |

### 2.3 Motion (all variants)
- `whileHover={{ scale: 1.01 }}` (disabled/loading → 1)
- `whileTap={{ scale: 0.98 }}` (disabled/loading → 1)
- `transition={{ duration: 0.2 }}`

### 2.4 Disabled
```
opacity-30/50 cursor-not-allowed pointer-events-none
```
(`getDisabledCls`; `IconButton` accepts `disabledOpacity?: 30 | 50`, default 50.)

### 2.5 Variant recipes

**Light mode** (`lightVariants`):
| Variant | Recipe |
|---|---|
| primary | `bg-[image:var(--material-button-primary-surface)] text-[var(--material-button-primary-text)] border-[1.8px] border-[var(--material-button-primary-border)] shadow-[var(--material-button-primary-shadow)] hover:shadow-[var(--material-button-primary-shadow)] hover:brightness-110 active:shadow-[var(--material-button-primary-shadow)] active:translate-y-0.5` |
| secondary | `bg-button-surface-secondary text-button-text-secondary border-[1.8px] border-button-border-secondary shadow-button-secondary hover:bg-button-surface-secondary-hover hover:shadow-button-secondary-hover hover:-translate-y-0.5` |
| success | `bg-success text-white border border-transparent shadow-elevation-2 shadow-success/20 hover:shadow-elevation-3 hover:brightness-105` |
| danger | `bg-danger text-white border border-transparent shadow-elevation-2 shadow-danger/20 hover:shadow-elevation-3 hover:brightness-105` |
| soft | `bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:brightness-100` |
| ghost | `bg-button-surface-ghost text-button-text-ghost border border-button-border-ghost shadow-none hover:bg-button-surface-ghost-hover hover:text-button-text-ghost-hover` |

**Dark mode** (`darkVariants`) — baseline identity:
| Variant | Recipe |
|---|---|
| primary | `bg-primary text-white border-transparent shadow-elevation-2 shadow-primary/20 hover:shadow-elevation-3 hover:brightness-100 active:shadow-elevation-3` |
| secondary | `bg-button-surface-secondary text-button-text-secondary border border-button-border-secondary shadow-button-secondary hover:bg-button-surface-secondary-hover hover:shadow-button-secondary-hover` |
| success | `bg-success text-white border-transparent shadow-elevation-2 shadow-success/20 hover:shadow-elevation-3 hover:brightness-100 active:shadow-elevation-3` |
| danger | `bg-danger text-white border-transparent shadow-elevation-2 shadow-danger/20 hover:shadow-elevation-3 hover:brightness-100 active:shadow-elevation-3` |
| soft | `bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:brightness-100` |
| ghost | `bg-button-surface-ghost text-button-text-ghost border border-button-border-ghost shadow-none hover:bg-button-surface-ghost-hover hover:text-button-text-ghost-hover` |

**Management opt-in** (`managementVariants`, both themes, only primary/secondary override):
| Variant | Recipe |
|---|---|
| primary | `bg-[var(--management-accent)] text-white border border-transparent shadow-[var(--management-shadow)] hover:shadow-[var(--management-shadow-hover)] hover:brightness-110 active:translate-y-0.5` |
| secondary | `bg-[var(--management-surface-muted)] text-text-primary border-[1.8px] border-[var(--management-border-strong)] shadow-[var(--management-shadow)] hover:bg-[var(--management-surface-hover)] hover:shadow-[var(--management-shadow-hover)] hover:-translate-y-0.5` |

**Resolution rule:** `resolved = management ? (managementVariants[variant] ?? themeVariants[variant]) : themeVariants[variant]`.
Status variants (success/danger) and soft/ghost stay on theme variants even in management mode.
`PrimaryButton` = `Button size="lg"` with `w-full sm:w-auto sm:min-w-[320px] md:min-w-[400px] lg:min-w-[480px] max-w-full`.

---

## 3. IconButton recipe (frozen)

### 3.1 Base
```
flex items-center justify-center flex-shrink-0 transition-[color,box-shadow,border-color,opacity]
```
Sizes: `sm: w-[36px] h-[36px] rounded-[10px]` · `md: w-[44px] h-[44px] rounded-xl`.
Motion: `whileHover={{ scale: 1.01 }}` / `whileTap={{ scale: 0.95 }}`.

### 3.2 Variants
| Variant | Recipe |
|---|---|
| primary | `bg-primary/10 text-primary hover:bg-primary hover:text-white` |
| ghost | `bg-button-surface-ghost text-button-text-ghost hover:bg-button-surface-ghost-hover hover:text-button-text-ghost-hover` |
| danger | `bg-danger/10 text-danger hover:bg-danger hover:text-white` |
| danger-soft | `bg-primary/10 text-danger hover:bg-primary hover:bg-danger/10 hover:text-white` |
| theme (light) | `selection-surface border-[1.8px] border-button-border-secondary appearance-none hover:shadow-elevation-2` |
| theme (dark) | `selection-surface appearance-none bg-hover-bg/60 border border-border-subtle hover:shadow-elevation-2` |

### 3.3 Focus ring (additive opt-in)
`focusRing` → `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.

---

## 4. Language rules

1. **Every button is `Button` / `IconButton` / `PrimaryButton`.** No raw `<button>` in
   application code except certified retained structural micro-controls (Phase 3.1 §8.2: AIToolCards
   card-CTAs, QuestionForm "Correct?" micro-button, Telugu accordion toggle) — and even those must be
   token-colored. New raw buttons are prohibited.
2. **No local override of the recipes.** `className` may add layout/spacing/margin, not restyle
   color/surface/shadow of the certified recipe. Existing sanctioned overrides (e.g.
   `LeaderboardMobileCard` badge `!h-6 !px-2 !text-[9px]`, `TopicListItem` badge `!text-[9px]`) are
   size-only `!` overrides — permitted (size, not material).
3. **Status color source:** success/danger/warning always via tokens `--color-success`/`--danger`/
   `--warning` (or `bg-success/…`); never `green-500`/`red-500`/`amber-*` (Phase 3.1 P1 cleanup
   completed this; keep it).
4. **Management mode** is theme-independent: same neutral material in both themes; accent follows
   `--management-accent`.
5. **Loading** renders `Spinner size="sm" border-current border-t-transparent` inside the button
   (no layout jump).
6. **A11y:** disabled buttons stay `pointer-events-none`; icon buttons carry `aria-label`/`title`;
   `focusRing` encouraged on icon buttons (already added across admin in Phase 3.1).

---

## 5. Semantic button roles (Part 4)

Design: every button in the app maps to a **semantic role**. Roles express *intent*; variants
express *material*. All roles share the same radius/padding/font/weight/transition/shadow/focus/
disabled/loading recipes — **only color (variant) changes**.

| Semantic role | Maps to variant (theme) | Notes |
|---|---|---|
| Primary / Save / Create / Update / Submit / Next | `primary` | default action |
| Secondary / Cancel / Back / Previous / Close | `secondary` (or `ghost` on elevated surfaces) | neutral action |
| Edit | `secondary` or `soft` | inline row edit |
| Delete / Remove | `danger` (solid) or `danger-soft` (icon) | destructive |
| Warning / Confirm-destructive | `danger` + `shadow-danger/20` | destructive confirm |
| Success / Approve | `success` | positive action (rare) |
| Info | `primary` (accent) | informational primary |
| Navigation / menu | `ghost` / `IconButton variant="ghost"` | in-page nav |
| Toolbar / Filter | `secondary` / `soft` | toolbar buttons, filter chips |
| Reset | `soft` (or `ghost`) | reset defaults |
| Ghost / Text | `ghost` | minimal emphasis |
| Outline | `secondary` (outlined family = border-based) | bordered secondary |
| Management action | management `primary`/`secondary` (on management surfaces) | theme-independent neutral |

**Mapping rules:**
1. **No page chooses its own button colors.** A page picks a *role*; the Foundation picks the
   variant material. (Phase 3.1 already removed page-level palette colors from admin.)
2. Status roles (success/danger/warning/info) only via tokens (`--color-success`/`--danger`/
   `--warning`); never palette classes.
3. Icon buttons default to `IconButton variant="ghost"` for actions, `primary`/`danger` for
   emphasized, `danger-soft` for destructive icons, `theme` for theme toggle (frozen).
4. Destructive confirmations use `variant="danger"`; the sign-out flow already does
   (`SidebarLayout`).
5. `Button` `variant` is the single material selector — consumers never write button classes.

**Current role coverage:** admin + user + auth buttons already render through `Button`/
`IconButton`/`PrimaryButton` (Phase 3.1). The migration adds a **role→variant map in the
component docs** so future buttons choose by role (B-6).

---

## 6. Consistency inventory (current adoption)

| Consumer | Buttons used | Status |
|---|---|---|
| Admin Users / Sub-Admins | `Button`, `IconButton variant="ghost"` (+`focusRing`) | ✅ Certified |
| Admin Questions | `Button`, `IconButton`, `Badge`-wrapped CTAs | ✅ Certified (Phase 3.1) |
| Admin Topics | `IconButton variant="ghost"` (+`focusRing`), `Button size="xs"` | ✅ Certified (Phase 3.1) |
| Admin Leaderboard | `Button`, `IconButton` | ✅ Certified |
| Admin Settings | `Button`, `IconButton`, `Badge` | ✅ Certified |
| Admin Upload | `Button`, `IconButton`, `Badge` | ✅ Certified |
| SidebarLayout | `Button variant="danger" size="sm"`, `IconButton variant="ghost"/"theme"` | ✅ Certified |
| User dashboard / auth | `PrimaryButton`, `Button`, `IconButton` | ✅ Certified reference |

**Raw `<button>` residue (documented retained):** `AIToolCards.tsx` card CTAs,
`QuestionForm.tsx` "Correct?" micro-button + Telugu accordion toggle — token-colored, structurally
necessary, preserved per Phase 3.1 §8.2.

---

## 7. Issue list (B-*) — button backlog

| ID | Item | Change |
|---|---|---|
| B-1 | New raw buttons | Zero-tolerance rule in governance (workflow note); sweep raw `<button>` on every PR touching UI |
| B-2 | `IconButton variant="theme"` string split | Already certified D-123 (dark/light strings). Freeze; no change |
| B-3 | `PrimaryButton` min-width scale | Certified (User/auth). Freeze |
| B-4 | Badge size overrides (`!h-* !px-* !text-[…]`) | Size-only, permitted; document in Pill spec |
| B-5 | Verify all admin `Button`/`IconButton` calls pass no material overrides | Sweep `className=` on Button/IconButton in admin/user — migration-plan verification step |
| B-6 | Semantic role map | Add role→variant map to component docs/governance so pages choose roles, not materials |

---

## 8. Frozen

- `AntigravityButton.tsx` — all variant recipes, sizes, motion, disabled, management opt-in.
- `IconButton` variant strings (incl. `theme` light/dark D-123 strings).
- `PrimaryButton` composition.
- Control role tokens (`--button-*`, `--checkbox-*`, `--radio-*`, `--filter-*`).
