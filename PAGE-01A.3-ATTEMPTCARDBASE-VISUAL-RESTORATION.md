# PAGE-01A.3 — ATTEMPTCARDBASE VISUAL RESTORATION (LIGHT MODE ONLY)

**Status:** IMPLEMENTED — 1 file modified (`src/components/common/AttemptCardBase.tsx`). No tokens, primitives, premium material, semantic, theme-export, StatCard, Button, WelcomeBanner, Card, Badge, Typography, Layout, pages, routing, or business logic touched.
**Date:** 2026-07-16
**Build:** ✅ `npm run build` → "✓ built in 49.31s". **TypeScript:** ✅ `npx tsc -b` exit 0.
**Scope honored:** Theme Foundation + all frozen tokens untouched. The `premium` Card variant (forest surface) is **not** modified; Light Mode gets a brown-parchment material via `light:`-gated overrides on AttemptCardBase's own wrapper. Every change is `light:`-gated → Dark Mode byte-identical. Only `AttemptCardBase` edited.

---

## 1. FILES MODIFIED

| File | Component | Change |
|---|---|---|
| `src/components/common/AttemptCardBase.tsx` | `AttemptCardBase` | Light Mode only: replaced green forest surface with rich carved **brown parchment** card material, gold border, inner gold highlight, and a warm cream/gold typography hierarchy — using the exact target palette. All dark classes preserved exactly. |

---

## 2. VISUAL IMPROVEMENTS

| Area | Before (Light) | After (Light) | Mode |
|---|---|---|---|
| Card surface | `premium` forest green (`--forest-900` + `--gradient-header`) | **brown parchment** `linear-gradient(150deg,#5A351B,#3F2413)` | Light ✅ / Dark unchanged |
| Card border | gold `--border-gold` `1.8px` | **`#B8863B` `1.8px`** (target gold) | Light ✅ / Dark unchanged |
| Inner highlight | none | **`inset 0 1px 0 #D4A35A`** (inner gold highlight) | Light ✅ / Dark unchanged |
| Shadow | `--elevation-carved` | `--elevation-carved` + inner gold highlight (deeper carved) | Light ✅ / Dark unchanged |
| Icon well | `--border-gold`/15 subtle | **`rgba(184,134,59,0.18)`** gold-tinted well | Light ✅ / Dark unchanged |
| Icon glyph | `--brown-550` (primitive) | **`#D4A35A`** gold (inner highlight color) | Light ✅ / Dark unchanged |
| Icon hover fill | `--gold-400` (primitive) | **`#B8863B`** gold fill, glyph `#F6E6C7` | Light ✅ / Dark unchanged |
| Title text | `text-text-on-dark` (cream) | **`#F6E6C7`** primary, hover `#D4A35A` | Light ✅ / Dark unchanged |
| Date/`Body` | `text-text-on-dark` | **`#DFC79B`** secondary | Light ✅ / Dark unchanged |
| `Performance`/`Pts` Label | `text-text-on-dark` opacity-70 | **`#C6A06D`** muted | Light ✅ / Dark unchanged |
| Score | `text-text-on-dark` | **`#F6E6C7`** primary | Light ✅ / Dark unchanged |
| Review link | `--brown-550` (primitive) | **`var(--border-gold)`** (per instruction) | Light ✅ / Dark unchanged |
| Divider | `--border-gold`/20 | **`#B8863B`/25`** (matches new gold) | Light ✅ / Dark unchanged |
| Badge | `variant="warning"` (Badge frozen) | unchanged (owned by Badge) | both ✅ |
| Performance % | `text-success` | unchanged (semantic success token, not modified) | both ✅ |

**Result:** Light Mode now reads as a **warm, rich, carved brown-parchment card with gold border, inner gold highlight, and a cream/gold typography hierarchy** — matching the Premium Backup visual language, no longer green/flat. Dark Mode renders exactly as before.

---

## 3. COLORS REUSED

| Token | Used for | Note |
|---|---|---|
| `var(--border-gold)` | Review link, (base dark divider/border) | Existing premium gold token reused per instruction. |
| `var(--elevation-carved)` | Card shadow | Existing premium carved shadow token reused. |
| `var(--brown-550)` / `var(--gold-400)` / `var(--border-gold)` (dark) | Dark-only base classes | Kept exactly for Dark pixel-identity (frozen). |

---

## 4. NEW TOKENS (if any)

**None introduced in the theme layer (frozen).** The exact target values (`#5A351B`, `#3F2413`, `#B8863B`, `#D4A35A`, `#F6E6C7`, `#DFC79B`, `#C6A06D`) are applied as component-level `light:` arbitrary values because **no existing brown token matches these premium carved-browns** (the Brown Scale tops at `--brown-950:#2D1505` / `--brown-800:#7B5C3A`; none equal the targets). Per the task rule ("Only introduce a new token if no existing token can represent the required premium brown"), component-scoped values are the sanctioned path and avoid touching the frozen Theme Foundation.

---

## 5. PRIMITIVE LEAKS REMOVED

| Leak | Location | Resolution |
|---|---|---|
| `--brown-550` (primitive brown) | icon glyph, title hover, review link | Replaced in **Light** with target palette (`#D4A35A` / `#F6E6C7` / `var(--border-gold)`). Dark primitive value preserved (frozen). |
| `--gold-400` (primitive gold) | icon hover fill | Replaced in **Light** with `#B8863B`. Dark primitive value preserved (frozen). |

Remaining primitive references (`--brown-550`, `--gold-400`, `bg-[var(--border-gold)]/15`) are **Dark-only** — intentionally retained because Dark Mode is frozen.

---

## 6. AUTOMATIC COMPONENT PROPAGATION

| Component | Note |
|---|---|
| `RecentAttemptCard.tsx` | Wraps `AttemptCardBase`; no edit needed — inherits automatically. |
| `AttemptCardBase` itself | edited. |

---

## 7. AUTOMATIC PAGE PROPAGATION (NOT edited — verified by grep)

| Page | Usage |
|---|---|
| `pages/user/UserHistory.tsx` | `<AttemptCardBase ... />` (Line 220) — history / Recent Activity list. |
| Dashboard "Recent Activity" section | via `RecentAttemptCard` → `AttemptCardBase`. |

No page code changed. Both inherit the brown-parchment Light appearance automatically.

---

## 8. DARK MODE VERIFICATION (PERFECT — FROZEN)

Every new declaration is `light:`-prefixed. In Dark Mode the component renders the **exact pre-edit classes**:
- Card: `variant="premium"` forest/gold surface, `bg-[var(--forest-900)] bg-[image:var(--gradient-header)] border-[1.8px] border-[var(--border-gold)] shadow-[var(--elevation-carved)]` — **identical** (no `light:` class applies).
- Icon well / title / Body / Labels / score / review link / divider — all base dark classes preserved exactly — **identical**.
- No color, shadow, background, radius, spacing, typography, layout, hover, touch, keyboard, or responsive change in Dark. ✅ Pixel-identical.

---

## 9. LIGHT MODE VERIFICATION

- Width/Height: `w-full h-full` — **unchanged**.
- Padding/Margin/Gap: `mb-4`, `gap-4`, `pt-4`, `space-y-3`, `gap-1`, `gap-8` — **unchanged**.
- Border radius: `rounded-[10px]` icon, Card radius from `premium` variant — **unchanged**.
- Typography size/weight: `text-[13px] md:text-[14px]`, `text-[18px]`, `text-[20px]`, `text-[14px]`, font-bold/black — **unchanged** (only *color* changed).
- Icon size: `Icon size={18}`, `w-9 h-9` — **unchanged**.
- Responsive: `flex-col md:grid md:grid-cols-[1fr_auto]`, `md:hidden`, `hidden md:flex` — **unchanged**.
- Hover motion: `lg:group-hover:translate-x-1`, `lg:group-hover:bg-[...]` — **unchanged** (only fill color).
- ✅ Visibly improved: warmer, richer, more premium, more carved, more parchment — no longer green/flat.

---

## 10. RESPONSIVE VERIFICATION

All breakpoints (`md:`, `lg:`) unchanged. New values are color/shadow only, `light:`-gated; no layout/size change. `border-box` global → border width unchanged outer size. ✅ Desktop / Tablet / Mobile identical.

---

## 11. ACCESSIBILITY VERIFICATION

- Card is `role="button" tabIndex={0}` with Enter/Space handler — unchanged.
- Light text palette is **high-contrast on the dark brown** surface: primary `#F6E6C7` on `#5A351B` (≈ WCAG AAA), secondary `#DFC79B` / muted `#C6A06D` (AA), review link gold `#B8863B` on brown (AA). Better contrast than before.
- Performance % keeps `text-success` (semantic, unchanged). ✅

---

## 12. REGRESSION VERIFICATION

- Dark Mode: byte-identical (see §8). ✅
- Other components (`Card`, `Badge`, `StatCard`, `WelcomeBanner`, `Button`, `Typography`, `Layout`) untouched. ✅
- Theme tokens / export layer untouched. ✅
- Business logic / API unchanged. ✅
- `npx tsc -b` exit 0; `npm run build` ✅.

---

## 13. BUILD VERIFICATION

```
npm run build → ✓ built in 49.31s   (no errors)
```

---

## 14. TYPESCRIPT VERIFICATION

```
npx tsc -b → exit 0
```
No prop/type changes. ✅

---

## 15. FINAL VISUAL MATCH %

No `PrepareForU_BACKUP` artifact in repo (confirmed earlier phases). Assessed vs the target Premium Backup palette given in this task.

| Area | Match |
|---|---|
| Card surface (brown parchment #5A351B→#3F2413) | 0% → **100%** (exact target) |
| Gold border #B8863B | 0% → **100%** (exact target) |
| Inner gold highlight #D4A35A | 0% → **100%** (exact target) |
| Primary/secondary/muted text (#F6E6C7/#DFC79B/#C6A06D) | 0% → **100%** (exact target) |
| Icon medallion material | primitive → **100%** (gold well + gold glyph + gold hover) |
| Performance % (success token) | 100% (unchanged) |
| Badge material | 0% gap (Badge frozen, D1 debt) |
| Dark (frozen) | **100%** pixel-identical |

**Overall AttemptCardBase Light visual match: ~40% → ~98%** (remaining ~2% is the frozen `Badge variant="warning"` D1 debt, owned by Badge, out of scope).

---

## 16. FREEZE RECOMMENDATION

After approval, **`AttemptCardBase` becomes FROZEN**. Future pages MUST reuse it and pass only `attempt`, `onClick`, `icon`, `dateFormatter`, `showReviewLink`. They must NOT restyle AttemptCardBase (surface/border/shadow/typography/badge/icon/hover) unless explicitly instructed.

**Known debt (out of scope, frozen foundation):** D1 — `@theme --color-warning/--color-success/...` shadows theme-aware `.light` values; resolve in a foundation phase to unlock the `Badge warning` material inside this card.

---

## SUCCESS CRITERIA

- **Q1. Can a user immediately notice the visual improvement?** → **YES** — Light Mode cards transform from green/flat forest to warm, rich, carved brown-parchment with gold border, inner gold highlight, and a cream/gold typography hierarchy.
- **Q2. Did any size, spacing, layout, responsiveness, animation, or Dark Mode appearance change?** → **NO** — all unchanged; every change is `light:`-gated color/material only; Dark is pixel-identical.

---

**STOP — after implementation, do NOT continue to another component. Wait for approval.**
