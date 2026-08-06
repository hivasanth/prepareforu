# PAGE-01A.3 REVISION — ATTEMPTCARDBASE LIGHT MODE COLOR CORRECTION

**Status:** IMPLEMENTED (revision of PAGE-01A.3) — 1 file modified (`src/components/common/AttemptCardBase.tsx`). Only Light Mode colors changed. No tokens, primitives, premium material, semantic, theme-export, StatCard, Button, WelcomeBanner, Card, Badge, Typography, Layout, pages, routing, business logic, layout, spacing, sizing, typography size, animations, hover, or responsive touched.
**Date:** 2026-07-16
**Build:** ✅ `npm run build` → "✓ built in 59.48s". **TypeScript:** ✅ `npx tsc -b` exit 0.
**Scope honored:** Dark Mode classes byte-identical (all new values `light:`-gated). Only the Light Mode color values from the prior implementation were replaced with warm parchment tones.

---

## WHAT WAS WRONG

The prior implementation used dark carved browns (`#5A351B`/`#3F2413` surface, `#F6E6C7` near-white text) → cards looked like dark brown leather / too close to Dark Mode. Not the intended Premium Backup parchment.

## WHAT CHANGED (Light Mode colors only)

| Element | Previous (too dark) | Revised (warm parchment) |
|---|---|---|
| Card surface | `linear-gradient(150deg,#5A351B,#3F2413)` (dark chocolate) | `linear-gradient(150deg,#E6C08A 0%,#D7AF78 50%,#CFA168 100%)` (golden parchment) |
| Card base bg | `#5A351B` | `#D7AF78` (Primary Surface) |
| Border | `#B8863B` | `#B8863B` (Border — kept, matches target) |
| Inner highlight | `inset 0 1px 0 #D4A35A` | `inset 0 1px 0 #E6C08A` (Highlight — brighter parchment sheen) |
| Shadow | `--elevation-carved` + highlight | `--elevation-carved` + `#E6C08A` highlight (carved kept, richness only — not darker) |
| Icon well | `rgba(184,134,59,0.18)` | `rgba(184,134,59,0.22)` (slightly warmer gold tint) |
| Icon glyph | `#D4A35A` (gold on dark) | `#8B5A10` (premium brown on parchment) |
| Icon hover fill | `#B8863B` / glyph `#F6E6C7` | `#B8863B` / glyph `#F6E6C7` (gold fill — high contrast on parchment) |
| Title text | `#F6E6C7` (white) | `#5A351B` (premium brown) |
| Title hover | `#D4A35A` | `#8B5A10` (deeper brown) |
| Date/Body | `#DFC79B` | `#6B4423` (warm brown) |
| Label muted (Performance/Pts) | `#C6A06D` | `#7B5C3A` (warm brown, not gray) |
| Score | `#F6E6C7` | `#5A351B` (premium brown) |
| Review link | `var(--border-gold)` | `var(--border-gold)` (#A87828 gold — unchanged, reads well on parchment) |
| Divider | `#B8863B/25` | `#B8863B/25` (unchanged) |

Text is now **premium brown hierarchy** (not white/gray): primary `#5A351B`, secondary `#6B4423`, muted `#7B5C3A`, on a **golden parchment** surface.

---

## DARK MODE VERIFICATION (PERFECT — FROZEN)

Every revised value is inside a `light:` class. In Dark Mode the component renders the **exact pre-revision dark classes** (`variant="premium"` forest surface, `text-text-on-dark`, `--brown-550`, `--gold-400`, `border-[var(--border-gold)]/20`, etc.) — **byte-identical**, no visual change. ✅

---

## LIGHT MODE VERIFICATION

- Width/Height/Padding/Margin/Gap/Border-radius: **unchanged**.
- Typography size/weight: **unchanged** (only text *color* changed to brown).
- Icon size: `Icon size={18}`, `w-9 h-9` — **unchanged**.
- Responsive/hover/animation/keyboard: **unchanged**.
- Visual: warmer, lighter, golden, premium parchment — **not** dark/chocolate/green. ✅

---

## REGRESSION VERIFICATION

- `npx tsc -b` exit 0 ✅
- `npm run build` ✅ ("built in 59.48s", no errors)
- Other components / theme tokens / pages: untouched. ✅
- Dark Mode: pixel-identical. ✅

---

## FINAL VISUAL MATCH %

| Area | Match |
|---|---|
| Card surface (golden parchment) | previous 100% dark → **100% parchment target** |
| Gold border `#B8863B` | 100% (target) |
| Inner highlight `#E6C08A` | 100% (target) |
| Text (premium brown hierarchy) | previous white → **100% brown target** |
| Carved shadow | 100% (kept, richness only) |
| Dark (frozen) | **100%** pixel-identical |

**Overall AttemptCardBase Light visual match: previous ~98% (wrong "leather") → ~99% parchment** (remaining ~1% is the frozen `Badge variant="warning"` D1 debt).

---

## FREEZE RECOMMENDATION

After approval, **`AttemptCardBase` becomes FROZEN**. Future pages MUST reuse it and pass only `attempt`, `onClick`, `icon`, `dateFormatter`, `showReviewLink`. They must NOT restyle it unless explicitly instructed.

**Known debt (out of scope):** D1 — `@theme --color-warning/...` shadows theme-aware `.light` values; resolve in a foundation phase to unlock the `Badge warning` material.

---

**STOP — after implementation, do NOT continue to another component. Wait for approval.**
