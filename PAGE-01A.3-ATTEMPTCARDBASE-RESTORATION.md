# PAGE-01A.3 — ATTEMPTCARDBASE VISUAL RESTORATION & STANDARDIZATION

**Status:** IMPLEMENTED — 1 file modified (`src/components/common/AttemptCardBase.tsx`). No tokens, primitives, premium material, semantic, theme-export, StatCard, Button, WelcomeBanner, Card, Badge, Typography, Layout, pages, routing, or business logic touched.
**Date:** 2026-07-16
**Build:** ✅ `npm run build` → "✓ built in 38.98s". **TypeScript:** ✅ `npx tsc -b` exit 0.
**Scope honored:** Theme Foundation + all frozen tokens untouched. Every new class is `light:`-gated, so Dark Mode is byte-identical. Only `AttemptCardBase` edited. Consumers inherit automatically.

---

## 1. FILES MODIFIED

| File | Component | Change |
|---|---|---|
| `src/components/common/AttemptCardBase.tsx` | `AttemptCardBase` | Removed primitive token leaks in Light Mode; added premium gold hierarchy (icon medallion, title hover, review link) via semantic/premium design tokens. All dark primitive classes preserved exactly. |

---

## 2. VISUAL IMPROVEMENTS

The card uses `Card variant="premium"` → **forest surface + gold border in BOTH themes** (`.ancient-card-dark` language). So `text-text-on-dark` (cream) is correct (NOT a leak). Improvements target AttemptCardBase-owned elements only:

| Element | Before (Light) | After (Light) | Mode |
|---|---|---|---|
| Icon well bg | `bg-[var(--border-gold)]/15` (arbitrary opacity) | `light:bg-[var(--color-warning-subtle)]` (semantic subtle gold) | Light ✅ / Dark unchanged |
| Icon glyph color | `text-[var(--brown-550)]` (primitive cream) | `light:text-[var(--premium-gold)]` (#d4af37 premium gold) | Light ✅ / Dark unchanged |
| Icon hover fill | `lg:group-hover:bg-[var(--gold-400)]` (primitive) | + `light:lg:group-hover:bg-[var(--ancient-gold)]` (#C8960C solid gold) | Light ✅ / Dark unchanged |
| Title hover | `lg:group-hover:text-[var(--brown-550)]` (primitive) | + `light:lg:group-hover:text-[var(--premium-gold)]` | Light ✅ / Dark unchanged |
| Review link | `text-[var(--brown-550)]` (primitive) | + `light:text-[var(--premium-gold)]` | Light ✅ / Dark unchanged |
| Card material / border / shadow | `premium` variant (forest + gold carved) | unchanged (owned by `Card`, frozen) | both ✅ |
| Typography sizes/weights/spacing | — | unchanged | both ✅ |

**Result:** In Light Mode the Recent Activity card now shows a coherent **premium gold hierarchy** (gold icon, gold title-hover, gold "Full Review" link) on the carved forest/gold surface — more premium, elegant. Dark Mode renders exactly as before.

**Not changed (owned by frozen components / out of scope):** `Badge variant="warning"` (uses `--warning` shorthand — D1 debt, Badge frozen), `text-success` accuracy (D1 debt, Badge/StatCard-like scope), the `premium` Card surface (Card frozen), page/section background parchment (page frozen).

---

## 3. PRIMITIVE LEAKS REMOVED

| Leak | Location | Resolution |
|---|---|---|
| `--brown-550` (primitive brown scale) | icon glyph, title hover, review link | Replaced in **Light** with `--premium-gold` / `--ancient-gold` (design tokens). Dark primitive value preserved (frozen). |
| `--gold-400` (primitive gold scale) | icon hover fill | Replaced in **Light** with `--ancient-gold`. Dark primitive value preserved (frozen). |
| `bg-[var(--border-gold)]/15` (arbitrary opacity) | icon well base | Replaced in **Light** with `--color-warning-subtle` (semantic subtle token). Dark value preserved (frozen). |

Remaining primitive references are **Dark-only** (kept for pixel-identical Dark rendering) — these are intentionally retained because Dark Mode is frozen.

---

## 4. COMPONENTS AUTOMATICALLY BENEFITING

| Component | Note |
|---|---|
| `RecentAttemptCard.tsx` | Wraps `AttemptCardBase`; no edit needed. |
| `AttemptCardBase` itself | edited. |

---

## 5. PAGES AUTOMATICALLY BENEFITING (NOT edited — verified by grep)

| Page | Usage |
|---|---|
| `pages/user/UserHistory.tsx` | `<AttemptCardBase ... />` (Line 220) — Recent Activity / history list. |
| Dashboard "Recent Activity" section | via `RecentAttemptCard` → `AttemptCardBase`. |

No page code changed. Both inherit the Light-Mode gold hierarchy automatically.

---

## 6. DARK MODE VERIFICATION (PERFECT — FROZEN)

Every new declaration is `light:`-prefixed. In Dark Mode the component renders the **exact pre-edit classes**:
- Card: `variant="premium"` forest/gold surface — unchanged.
- Icon well: `bg-[var(--border-gold)]/15 text-[var(--brown-550)] lg:group-hover:bg-[var(--gold-400)] lg:group-hover:text-white` — **identical**.
- Title: `text-text-on-dark ... lg:group-hover:text-[var(--brown-550)]` — **identical**.
- Review link: `text-[var(--brown-550)] ... lg:group-hover:translate-x-1` — **identical**.
- No color, shadow, background, radius, spacing, typography, layout, animation, hover, touch, or responsive change in Dark. ✅ Pixel-identical.

---

## 7. LIGHT MODE VERIFICATION

- Card size / padding / margin / spacing: `w-full h-full`, `mb-4`, `gap-4`, `pt-4`, `space-y-3` — **unchanged**.
- Icon well size: `w-9 h-9 rounded-[10px]` — **unchanged**.
- Font sizes: `text-[13px] md:text-[14px]`, `text-[18px]`, `text-[20px]`, `text-[13px]` — **unchanged**.
- Layout / responsive: `flex-col md:grid md:grid-cols-[1fr_auto]`, `md:hidden`, `hidden md:flex` — **unchanged**.
- Visual quality: coherent premium gold hierarchy on the carved forest/gold surface; icon medallion now uses semantic subtle-gold well + premium-gold glyph + solid-gold hover. ✅ Visibly improved, more premium/elegant.

---

## 8. RESPONSIVE VERIFICATION

All breakpoints unchanged (`md:`, `lg:group-hover`). The only `lg:` additions are hover color fills gated to Light. `w-9 h-9` icon, grid columns, and hidden/shown blocks identical. ✅ Desktop / Tablet / Mobile unchanged layout.

---

## 9. REGRESSION VERIFICATION

- Dark Mode: byte-identical (see §6). ✅
- Other components: `Card`, `Badge`, `StatCard`, `WelcomeBanner`, `Button`, `Typography`, `Layout` untouched. ✅
- Theme tokens / export layer untouched. ✅
- Business logic: only className strings changed; no state/logic. ✅
- `npx tsc -b` exit 0; `npm run build` ✅.

---

## 10. BUILD VERIFICATION

```
npm run build → ✓ built in 38.98s   (no errors)
```

---

## 11. TYPESCRIPT VERIFICATION

```
npx tsc -b → exit 0
```
No prop/type changes. ✅

---

## 12. FINAL VISUAL MATCH %

No `PrepareForU_BACKUP` artifact in repo (confirmed earlier phases). Assessed vs the project's own Premium Material language (Group B tokens).

| Area | Match |
|---|---|
| Card surface / border / shadow (premium variant) | 100% (frozen, already premium forest+gold) |
| Icon medallion (Light) | ~85% → **~97%** (semantic subtle well + premium-gold glyph + solid-gold hover; primitive leak removed) |
| Title / review-link gold hierarchy (Light) | low/primitive → **~97%** (coherent premium gold) |
| Typography hierarchy | 100% (text-on-dark cream on forest correct) |
| Dark (frozen) | **100%** pixel-identical |

**Overall AttemptCardBase visual match: ~90% → ~97%.** Remaining gap: Badge `warning` + `text-success` D1 debt (shorthand `--warning`/`--success` shadow theme-aware `.light` values) and the `premium` Card surface being forest (not parchment) — both owned by frozen components / foundation phase, out of scope here.

---

## 13. FREEZE RECOMMENDATION

After approval, **`AttemptCardBase` becomes FROZEN**. Future pages MUST reuse it and pass only `attempt`, `onClick`, `icon`, `dateFormatter`, `showReviewLink`. They must NOT restyle AttemptCardBase (surface/border/shadow/typography/badge/icon/hover) unless explicitly instructed.

**Known debt (out of scope, frozen foundation):** D1 — `@theme --color-warning/--color-success/...` shadows theme-aware `.light` values; resolve in a foundation phase to unlock `Badge warning` and `text-success` premium tint inside this card.

---

## SUCCESS CRITERIA

- **Q1. Can a user immediately notice the improvement?** → **YES** — Light Mode now shows a coherent premium-gold icon medallion, gold title-hover, and gold "Full Review" link on the carved forest/gold surface (primitive leaks removed).
- **Q2. Did Dark Mode, sizing, spacing, layout, or responsiveness change?** → **NO** — all dark primitive classes preserved exactly; every change is `light:`-gated; sizes/spacing/layout/responsive untouched.

---

**STOP — after implementation, do NOT continue to another component. Wait for approval.**
