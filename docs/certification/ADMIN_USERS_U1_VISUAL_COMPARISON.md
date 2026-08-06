# Admin Users — U-1 Surface Family Visual Comparison (Phase 3.5 · Page 1 of 11)

**Method:** inspection-based comparison per repo precedent (auth-guarded admin route; no headless
tooling — see `baselines/ADMIN_QUESTIONS_VISUAL_BASELINE.md`). Before = legacy `ancient-card`
recipe (`index.css:845-864`, `:1127-1178`); after = certified `Card variant="default"`
(`AntigravityCard.tsx:30`).

---

## 1. Attribute-by-attribute comparison

### Dark mode

| Attribute | Before (`ancient-card`) | After (`Card default`) | Delta |
|---|---|---|---|
| Background | `--surface-primary` = `--bg-surface` `#1F2937` (+ `--gradient-surface` = none) | `bg-card-bg` = `--bg-surface` `#1F2937` | none |
| Border | 1px `--border-subtle` `#374151` | 1px `border-card-border` `rgba(55,65,81,.5)` | imperceptible grey shift |
| Radius | `--radius-card` = `--radius-3xl` = 20px | `rounded-2xl` = 16px | −4px (same family) |
| Shadow | `--elevation-surface` = `--shadow-sm` | `shadow-card-shadow` = `--elevation-2` | slightly deeper (same family) |
| Hover | `--elevation-raised` + `--border-hover` | `-translate-y-0.5` + `hover:shadow-card-hover-shadow` (= `--elevation-raised`) | equivalent lift; border keeps `card-border` |
| Texture | none (`micro-light` gradient = none in dark) | none | none |
| Motion | `all .2s cubic-bezier(.16,1,.3,1)` | `transition-[transform,box-shadow] duration-200` | same duration/easing family |

### Light mode

| Attribute | Before (`ancient-card`) | After (`Card default`) | Delta |
|---|---|---|---|
| Background | `--card-parchment` = `linear-gradient(170deg, rgba(255,240,195,.35)…), #C9A070` | `light:stat-card-surface` = `--surface-stat` = `linear-gradient(135deg, #D4A55A 0%, #C9943C 50%, #BF8A30 100%)` | parchment → saturated gold gradient (same amber/gold family) |
| Border | 1.8px `--border-gold` `#A87828` | `light:border-card-premium-border` = `--border-gold` `#A87828` (1px) | same colour; width 1.8px→1px |
| Radius | 18px (hardcoded) | `rounded-2xl` = 16px | −2px (same family) |
| Shadow | `--card-3d-shadow` (inset gold + `5px 6px 0px rgba(105,62,15,.70)` + ambient) | `light:shadow-premium-card` = `--stat-card-3d-shadow` + cream inset | near-identical carved 3D family |
| Hover | `translateY(-2px) translateX(-1px)` | `-translate-y-0.5` (= −2px) + `hover:shadow-card-hover-shadow` (= `--elevation-raised` = `--shadow-contact`) | equivalent lift |
| Texture | grain `::before` (repeating-linear-gradient) + `> *` z-index 1 | none (gradient background only) | grain sheen removed |
| Motion | 18px/0.18s ease transitions | `transition-[transform,box-shadow] duration-200` | same family |

---

## 2. Verdict

| Theme | Verdict |
|---|---|
| Dark | ✅ **near-identical** — same `#1F2937` background, same grey border family, minor radius/shadow depth within the certified family |
| Light | ✅ **same carved amber/gold family** — the legacy parchment is a hand-rolled duplicate of the certified premium material; now renders via Foundation tokens (`--surface-stat`/`--border-gold`/`--stat-card-3d-shadow`). Observable deltas: slightly more saturated gold base, 1.8px→1px border, grain sheen removed — all Foundation-approved golden-reference attributes |

The panel reads as the same application surface; it is now **100% owned by the Surface Family**
(`Card`), with no page-owned color/shadow/border/radius/hover/elevation/animation.

---

## 3. 6-scenario matrix

| Concern | Light · Desktop | Light · Tablet | Light · XS | Dark · Desktop | Dark · Tablet | Dark · XS |
|---|---|---|---|---|---|---|
| Panel background | ✅ gold carved | ✅ | ✅ | ✅ `#1F2937` | ✅ | ✅ |
| Border | ✅ gold | ✅ | ✅ | ✅ | ✅ | ✅ |
| Radius | ✅ 16px | ✅ | ✅ | ✅ 16px | ✅ | ✅ |
| Shadow / elevation | ✅ carved | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hover lift | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Toolbar / filters / buttons | ✅ unchanged | ✅ | ✅ | ✅ | ✅ | ✅ |
| DataGrid / mobile cards / empty / loading / error / pagination | ✅ unchanged | ✅ | ✅ | ✅ | ✅ | ✅ |
| Responsive (tablet/XS overflow) | — | ✅ | ✅ | — | ✅ | ✅ |

All deltas are confined to the panel surface; content, toolbar, DataGrid, mobile cards, states,
and pagination are untouched.
