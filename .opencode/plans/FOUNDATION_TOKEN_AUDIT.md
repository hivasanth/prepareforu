# Foundation Token Audit

- **Phase:** 5.1 — Foundation Simplification & Design System Cleanup Audit (Step 4)
- **Scope:** `src/styles/themes.css` (1272 lines), `src/index.css` (1201 lines), token usage across all 387 `.ts`/`.tsx` files
- **Type:** Documentation only. Zero source, token, Foundation, or page changes.
- **Status:** Draft (plan-mode) — awaiting approval to promote to `docs/design-system/FOUNDATION_TOKEN_AUDIT.md`
- **Date:** 2026-08-04
- **Disposition legend:** KEEP · MERGE · REMOVE · DEPRECATE · CONFLICT (fix required, freeze-gated)

---

## 0. Methodology & Cascade Caveat (applies to every finding below)

- Every token was grepped across `src/**/*.{ts,tsx}` for `var(--token)` **and** for its generated Tailwind
  utility class name. Consumer counts are exact totals over 387 files; CSS-internal consumers traced over both CSS files.
- **Critical cascade fact:** `themes.css` is imported **unlayered** (`index.css:2`), so its declarations win over
  `@theme` output (Tailwind's layered theme). Any `@theme` value re-declaring a name in `themes.css` is **inert**;
  any `index.css` `:root` token (also unlayered, later) silently overrides `themes.css`. This makes several `@theme`
  registrations "dead config" and creates the CONFLICT items in §7.
- **Freeze status:** `themes.css` Layer 1→2→3 is governed by the Foundation Freeze Register. Every MERGE/REMOVE/
  DEPRECATE/CONFLICT-fix below requires a freeze-register entry + DESIGN_DECISION_LOG before change. KEEP needs no action.

---

## 1. Primitive color scales — Layer 1

### 1.1 Unused full scales — REMOVE
| Tokens | File:Line | Owner | Consumers | Reason | Risk | Recommendation |
|---|---|---|---|---|---|---|
| `--gray-*` (12) | themes.css:28-38 | Layer 1 | **0** var() refs; semantic tokens hardcode identical hexes | Value-duplicate of Tailwind default gray; unreferenced | Low | REMOVE |
| `--slate-*` (12) | themes.css:41-51 | Layer 1 | **0** var() refs; app uses Tailwind `slate-*` (8) | Unreferenced | Low | REMOVE |
| `--blue-*` (12) | themes.css:54-64 | Layer 1 | **0** var() refs | Value-duplicate | Low | REMOVE |
| `--green-*` (12) | themes.css:67-77 | Layer 1 | **0** var() refs | Value-duplicate | Low | REMOVE |
| `--red-*` (12) | themes.css:80-90 | Layer 1 | **0** var() refs | Value-duplicate | Low | REMOVE |
| `--amber-*` (12) | themes.css:93-103 | Layer 1 | **0** var() refs; app uses Tailwind `amber-*` (18/23) | Unreferenced | Low | REMOVE |
| `--purple-*` (12) | themes.css:106-116 | Layer 1 | **0** var() refs; app uses Tailwind `purple-500` (7) | Unreferenced | Low | REMOVE |
| `--emerald-*` (12) | themes.css:119-129 | Layer 1 | **0** var() refs | Value-duplicate | Low | REMOVE |
| `--teal-*` (12) | themes.css:132-142 | Layer 1 | **0** var() refs | Unreferenced | Low | REMOVE |
| `--cyan-*` (12) | themes.css:145-155 | Layer 1 | **0** var() refs | Unreferenced | Low | REMOVE |
| `--rose-*` (12) | themes.css:158-168 | Layer 1 | **0** var() refs; app uses Tailwind `rose-*` (9) | Unreferenced | Low | REMOVE |
| `--pink-600` | themes.css:171 | Layer 1 | **0** var() refs | "Minimal scale" never referenced | Low | REMOVE |
| `--orange-*` (12) | themes.css:174-184 | Layer 1 | **0** var() refs | Unreferenced | Low | REMOVE |
| `--indigo-*` (12) | themes.css:187-197 | Layer 1 | **0** var() refs | Unreferenced | Low | REMOVE |

> **Subtotal:** ~141 primitive tokens with zero consumers → REMOVE (deletion only; no render impact).

### 1.2 Partially-live scales — KEEP (used stops) + REMOVE (rest)
| Tokens | File:Line | Owner | Consumers | Reason | Risk | Recommendation |
|---|---|---|---|---|---|---|
| `--forest-900` | themes.css:205-215 | Layer 1 | themes.css:1051, `WelcomeBanner.tsx:74` | Live | Medium | KEEP `--forest-900`/`--forest-500`; REMOVE other 10 stops |
| `--gold-100/200/300/400` | themes.css:218-222 | Layer 1 | `--gold-300` → themes.css:1099,1199,1227,1245 + `border-gold-300` (AntigravityCard:26) + 12 tsx var() refs | Live premium accent | Medium | KEEP family |
| `--premium-green` | themes.css:236-238 | Layer 1 | `PremiumLoader.tsx:16` | One of three used | Low | KEEP `--premium-green`; REMOVE `--premium-cream`/`--premium-gold` (0 refs) |
| `--chart-*` (12) | themes.css:245-256 | Layer 1 | **0** var() refs (charts use hex / paletteColors.ts) | Dead chart palette | Low | REMOVE; re-tokenize hardcoded chart hexes in 5.x |
| `--pie-*` (3) | themes.css:261-263 | Layer 1 | **0** var() refs; `--pie-gold` ≡ `--gold-200` | Dead; duplicates gold-200 | Low | REMOVE |

---

## 2. Brand aliases `--secondary/--success/--danger/--warning/--info` — DEPRECATE/MERGE → `--color-*`

| Tokens | File:Line | Owner | Consumers | Reason | Risk | Recommendation |
|---|---|---|---|---|---|---|
| `--secondary` #10B981 | index.css:319 | `:root` | 17 tsx var() refs: ReviewLayout:64-66, TopicReader:101, AntigravityData:260, ExamPaperCard:36, SelectionView:128,182, ResultView:60,66, SubAdminDashboard:65-67, StudentDetailModal:57-59, StatisticsSection:30 | **Light-mode-broken:** frozen dark-theme literals; `.light` overrides `--color-*` but not these | **Medium** — 17 consumers render wrong color in light mode today | DEPRECATE aliases; migrate 17 consumers → `--color-*` (bug fix; freeze-gated) |
| `--success` #22C55E | index.css:320 | `:root` | same set | Same | Medium | DEPRECATE → `--color-success` |
| `--danger` #F87171 | index.css:321 | `:root` | same set + TopicReader:101 `bg-[var(--danger)]` | Same | Medium | DEPRECATE → `--color-danger` |
| `--warning` #FBBF24 | index.css:322 | `:root` | same set | Same | Medium | DEPRECATE → `--color-warning` |
| `--info` #3B82F6 | index.css:323 | `:root` | same set | Same | Medium | DEPRECATE → `--color-info` |
| Utility classes `text-primary(398)/bg-primary(152)/border-primary(85)/text-secondary(228)/bg-secondary(14)/text-info(1)/bg-info(1)` | @theme:41-47 | @theme | heavy | Resolve via `var(--color-*)` (unlayered override) | Low | **KEEP** |
| `--primary`/`-hover`/`-subtle`/`-rgb` | index.css:315-318 | `:root` | 13 tsx var() refs | Delegates to `--color-accent*` → theme-aware | Low | **KEEP** |

---

## 3. Elevation ladder — `--elevation-*`

| Token | File:Line | Owner | Consumers | Reason | Risk | Recommendation |
|---|---|---|---|---|---|---|
| `--elevation-1` | 461, 747 | Layer 2 | themes.css:631,932; index.css:975-1084; utility ×3 | Live | Low | **KEEP** |
| `--elevation-2` | 462, 748 | Layer 2 | themes.css:960,1039,1078,1097,1184,1226,1234,1238; index.css:865,1014; utility ×10 | Live | Low | **KEEP** |
| `--elevation-3` | 463, 749 | Layer 2 | themes.css:1185,1235,1239; index.css:426,430,988,1037,1062,1179; utility ×11 | Live | Low | **KEEP** |
| `--elevation-4` | 464, 750 | Layer 2 | index.css:961,968; PremiumSelect:214, Menu:276; utility ×2 | Live | Low | **KEEP** |
| `--elevation-5/6/7` | 465-467, 751-753 | Layer 2 | **0** consumers; self-mapped @theme:103-105 → unused utilities | Dead top of ladder | Low | **REMOVE** (dark+light + @theme rows) |
| `--elevation-surface` | 597, 836 | Layer 2 | index.css:844 | Live | Low | **KEEP** |
| `--elevation-raised` | 598, 837 | Layer 2 | index.css:856; `--card-hover-shadow` | Live | Low | **KEEP** |
| `--elevation-popover` | 601, 840 | Layer 2 | themes.css:972 | Live | Low | **KEEP** |
| `--elevation-canvas` | 596, 835 | Layer 2 | **0** | Dead | Low | **REMOVE** |
| `--elevation-interactive` | 599, 838 | Layer 2 | **0** | Dead | Low | **REMOVE** |
| `--elevation-floating` | 600, 839 | Layer 2 | **0** | Dead | Low | **REMOVE** |
| `--elevation-modal` | 602, 841 | Layer 2 | **0** | Dead | Low | **REMOVE** |
| `--elevation-overlay` | 603, 842 | Layer 2 | **0** | **Value is a COLOR** (`var(--bg-overlay)`) — misnamed | Low | **DEPRECATE** |
| `--elevation-carved` | 813 (light) | Layer 2 | themes.css:1063,1204; index.css:214-215 | Live carved | Medium | **KEEP** |

> Dark (461-467) and light (747-753) ladders are parallel, **not** duplicates (different rgba profiles) — do not merge across themes.

---

## 4. Shadow scale + semantic shadows — `--shadow-*`

| Token | File:Line | Owner | Consumers | Reason | Risk | Recommendation |
|---|---|---|---|---|---|---|
| `--shadow-xs` | 453, 738 | Layer 2 | utility 0, but via `--shadow-pressed`(609) & `--btn-primary-active-shadow`(1127, dead) | Indirect only | Low | **KEEP** token; re-evaluate with `--btn-*` removal |
| `--shadow-sm` | 454, 739 | Layer 2 | utility ×30; index.css:890,908,920,929,939,946 | Live | Low | **KEEP** |
| `--shadow-md` | 455, 740 | Layer 2 | utility ×9; index.css:629 | Live | Low | **KEEP** |
| `--shadow-lg` | 456, 741 | Layer 2 | utility ×28; index.css:628 | Live | Low | **KEEP** |
| `--shadow-xl` | 457, 742 | Layer 2 | utility ×13 | Live | Low | **KEEP** |
| `--shadow-2xl` | 458, 743 | Layer 2 | utility ×17; index.css:630,639 | Live | Low | **KEEP** |
| `@theme --shadow-xs..2xl` | index.css:91-96 | @theme | **dead config** self-refs | Inert | Low | **REMOVE** (@theme rows only) |
| `--shadow-ambient` | 606, 846 | Layer 2 | only → `--elevation-surface` light | Weak hop | Low | KEEP (1 hop) or MERGE |
| `--shadow-contact` | 607, 847 | Layer 2 | only → `--elevation-raised` light | Weak hop | Low | KEEP (1 hop) or MERGE |
| `--shadow-hover` | 608, 848 | Layer 2 | → dead `--elevation-interactive` | Dead chain | Low | **REMOVE** |
| `--shadow-pressed` | 609, 849 | Layer 2 | → dead `--input-shadow`(1163) | Dead chain | Low | **REMOVE** |
| `--shadow-focus` | 610 **and** 850 | Layer 2 | only → dead `--nav-focus`(632) | **Registered twice**; chain dead | Low | **DEPRECATE** |
| `--shadow-modal` | 611, 851 | Layer 2 | only → dead `--elevation-modal` | Dead chain | Low | **REMOVE** |
| `--shadow-premium-card` | index.css:212 | @theme | ×6 | Live | Low | **KEEP** |
| `--shadow-premium-elevated` | index.css:213 | @theme | ×1 | Live | Low | **KEEP** |
| `--shadow-premium-carved` | index.css:214 | @theme | ×2 | **EXACT DUPLICATE of `--shadow-premium-icon`** | Low | **MERGE** (FG-2) |
| `--shadow-premium-icon` | index.css:215 | @theme | ×1 | Exact duplicate of carved | Low | **MERGE** |
| `--shadow-card-shadow` | index.css:111 | @theme | ×4 | Live | Low | **KEEP** |
| `--shadow-card-hover-shadow` | index.css:112 | @theme | ×3 | Live | Low | **KEEP** |
| `--shadow-card-premium` | index.css:118 | @theme | ×4 | Live | Low | **KEEP** |
| `--shadow-card-auth-light` | index.css:124 | @theme | ×1 | Live | Low | **KEEP** |
| `--shadow-button-primary` | index.css:132 | @theme | **0** utility hits (consumer uses arbitrary `shadow-[var(--material-button-primary-shadow)]`) | Utility never used | Low | **DEPRECATE** utility |
| `--shadow-button-secondary`/`-hover` | index.css:142-143 | @theme | ×4 / ×2 | Live | Low | **KEEP** |
| `--shadow-filter`/`-hover` | index.css:166-167 | @theme | ×2 / ×1 | Live | Low | **KEEP** |
| `--shadow-tab-track`/`-pill-light` | index.css:194-195 | @theme | ×1 each | Live | Low | **KEEP** |
| `--shadow-stat-card-shadow` | index.css:202 | @theme | ×1 | Live | Low | **KEEP** |

---

## 5. Radius — `--radius-*`

| Token | File:Line | Owner | Consumers | Reason | Risk | Recommendation |
|---|---|---|---|---|---|---|
| `--radius-none/xs/sm/md/lg/full` | 271-276, 280 | Layer 1 | semantic refs (tooltip/control/surface/pill) | Live | Low | **KEEP** |
| `--radius-4xl` (32px) | 279 | Layer 1 | `--radius-empty-state` separate | Live intent | Low | **KEEP** |
| `--radius-button-xs/md/auth`, `--radius-badge-md`, `--radius-alert`, `--radius-icon-sm`, `--radius-empty-state`, `--radius-filter` | 283-290 + @theme:81-88 | Layer 1 + @theme | utilities `rounded-button-*` etc. = **0 hits**; only `rounded-stat-card-radius`(1) & `rounded-stat-icon-radius`(1) used | 8 dead utility registrations; all dual-registered | Low | **REMOVE** dead registrations (keep 2 stat radii) |
| **CONFLICT `--radius-xl`** | themes.css:276 (**20px**) vs @theme:78 (**12px**) | Layer 1 vs @theme | `--radius-card-inner`; `rounded-xl` | themes.css wins → 20px, not 12px | Medium | **CONFLICT-FIX:** delete @theme:78 (FG-5) |
| **CONFLICT `--radius-2xl`** | themes.css:277 (**24px**) vs @theme:79 (**16px**) | Layer 1 vs @theme | `--radius-container`; `rounded-2xl` | themes.css wins → 24px | Medium | **CONFLICT-FIX:** delete @theme:79 (FG-5) |
| `--radius-3xl` (20px) | themes.css:278 + @theme:80 | both | `--radius-card`; `rounded-3xl` | Values agree; dual registration | Low | **KEEP** (single owner) |

---

## 6. Typography — `--text-*`, `--font-*`

| Token | File:Line | Owner | Consumers | Reason | Risk | Recommendation |
|---|---|---|---|---|---|---|
| `--text-display/h1/h2/h3/body/caption/label/stat-value/badge/metadata/small/heading` | themes.css:527-555 | Layer 2 | **via `fontSize:'var(--text-*)'` only** (AdminText:7-17, AntigravityTypography:12-115); global h1-h6 index.css:554-559 | Canonical scale consumed via inline var(), not classes | Low | **KEEP** as CSS-var scale |
| `@theme` text utilities (`text-h1/…/heading`) | index.css:222-235 | @theme | **0 class consumers** except `text-stat-value` ×4 | 11 of 12 utilities unused | Low | **REMOVE** from @theme (keep `--text-stat-value`) |
| `--text-h4/h5/h6` + `--lh-*`/`--fw-*` | index.css:294-296 | :root | global h4-h6 rules | Element rules depend on them | Low | **KEEP** |
| **Triple `--text-h1/h2/h3`** | themes.css:529-533 + @theme:222-224 + :root:291-293 | all three | shared | Same value declared 3× | Low | **MERGE** → single owner (FG-11) |
| `--text-stat-value` | themes.css:541 + index.css:500,514,529 | Layer 2 | class ×4 + AdminText | Live | Low | **KEEP** (see §7 C4) |
| `--font-sans` | themes.css:325 | Layer 1 | index.css:341,366,377,385,461-462 | Root + helpers | Low | **KEEP** |
| `--font-mono` | themes.css:326 | Layer 1 | **0** var() refs; `font-mono` class ×28 → Tailwind default | Dead primitive | Low | **REMOVE** |
| `font-cinzel`/`font-garamond` utilities | @theme | @theme | cinzel ×17, garamond ×4 | Live | Low | **KEEP** |
| `font-ancient` | @theme | @theme | **0 hits** | Dead | Low | **REMOVE** |

---

## 7. Cross-file CONFLICTS (must-fix; freeze-gated; render-preserving)

| # | Conflict | File:Line | Owner(s) | Consumers | Reason | Risk | Recommendation |
|---|---|---|---|---|---|---|---|
| C1 | `--input-border` | themes.css:912 `var(--border-subtle)` vs **index.css:312 `var(--border-input)`** | Layer 3 vs `:root` | `border-input-border` utility ×4 (3 files) | index.css later + unlayered → **wins**, defeating certified **`border-subtle` render** (D-121 comment themes.css:905-909) | **High** (silent deviation from certification) | **CONFLICT-FIX:** remove index.css:312 (FG-4); verify vs smoke suite + certified screenshots |
| C2 | `--radius-xl` | themes.css:276 (20px) vs @theme:78 (12px) | Layer 1 vs @theme | `rounded-xl` | Silent override → 20px | Medium | Remove @theme:78 |
| C3 | `--radius-2xl` | themes.css:277 (24px) vs @theme:79 (16px) | Layer 1 vs @theme | `rounded-2xl` | Silent override → 24px | Medium | Remove @theme:79 |
| C4 | `text-stat-value` collision | index.css:231 (size) vs index.css:240 (`--color-stat-value`) | @theme | used as size (LoginPage:231-239) | Two utilities share one class name | Medium | Rename color registration (FG-6) |
| C5 | `--shadow-focus` double registration | themes.css:610 + :850 | Layer 2 | only dead `--nav-focus` | Duplicate | Low | DEPRECATE both |

---

## 8. Component namespaces — buttons, input, management, surface

### 8.1 Button namespaces (three parallel systems)
| Namespace | Tokens | File:Line | Consumers | Reason | Risk | Recommendation |
|---|---|---|---|---|---|---|
| `--btn-*` (Foundation) | 30 | themes.css:1121-1158 | **0** consumers anywhere | Entire namespace dead; superseded by Control `--button-*` | Low | **REMOVE** (FG-1) |
| `--button-*` (Control) | secondary+ghost | themes.css:926-937 (+light 1230-1239) | utilities ×4/×2/×4/×6/×6/×2/×3 (AntigravityButton, Menu) | Live | Low | **KEEP** |
| `--material-button-*` | primary | themes.css:1076-1079 | AntigravityButton:42-46; @theme:129-132 | Live primary | Low | **KEEP** |
| Overlap | `--btn-primary-*` vs `--button-surface-*` vs `--material-button-primary-*` | — | — | 3 namespaces for 1 component | Medium | **MERGE:** keep `--button-*` + material; drop `--btn-*` |

### 8.2 Input namespaces
| Token | File:Line | Owner | Consumers | Reason | Risk | Recommendation |
|---|---|---|---|---|---|---|
| `--input-bg/text/radius` | 910-913 | Layer 3 | `bg-input-bg`(4), `text-input-text`(5) | Live | Low | **KEEP** |
| `--input-border` | 912 vs index.css:312 | Layer 3 + :root | ×4 | See **C1** | High | CONFLICT-FIX |
| `--input-focus-border` | 914 | Layer 3 | `focus:border-input-focus-border` | Live | Low | **KEEP** |
| `--input-focus-shadow` | 915 | Layer 3 | **0** (index.css hardcodes `0 0 0 3px var(--focus-ring-color)`) | Dead | Low | **REMOVE** |
| `--input-shadow` | 1163 | Layer 3 | **0** | Dead chain | Low | **REMOVE** |
| `--input-padding-x`/`-placeholder`/`-radius` | 913, 1161-1162 | Layer 3 | **0** | Dead | Low | **REMOVE** |
| `--input-disabled-*` | 1164-1166 | Layer 3 | border → index.css:914 (1 use); bg/text 0 | Border live | Low | KEEP border; REMOVE bg/text |
| `--material-input-compact-*` | 1084-1086 | Layer 3 | AntigravityForm:32-35 | Live | Low | **KEEP** |
| `--material-input-violet-*` | 1087-1088 | Layer 3 | **0** utility hits | Dead violet variant | Low | **REMOVE** |
| `--material-input-checkbox-size/radius` | 1089-1090 | Layer 3 | **0**; checkbox uses `h-5 w-5` | Dead | Low | **REMOVE** |
| Checkbox/radio family | 939-951 | Layer 3 | checkbox/radio utilities (2/4/1/1/1/3/1 + hover/focus) | Live in AntigravityForm | Low | **KEEP** |
| Self-ref @theme `--material-input-*` | index.css:185-191 | @theme | no utilities generated | Dead config no-ops | Low | **REMOVE** |

### 8.3 Management namespace (heavily live — KEEP)
| Tokens | File:Line | Consumers | Reason | Risk | Recommendation |
|---|---|---|---|---|---|
| `--management-surface/muted/hover/active` | 1176-1179 (+1255-1258) | arbitrary `bg-[var(--management-*)]` — **30 matches / 12 files**: BulkActionBar:20, useToast:46, TopicSectionRenderer:48,106,160, AntigravityForm:38,43,93,96, AdminModal:78-81, AntigravityCard:33-35, AntigravityButton:101-112, CollectionFilter:56-58, AntigravityLayout:70, Menu:275, SharedComponents:19-20,154 | As-designed (no @theme mapping) | Low | **KEEP** |
| `--management-border/strong/hover/active` | 1180-1183 (+1259-1262) | same set | Live | Low | **KEEP** |
| `--management-shadow`/`-hover` | 1184-1185 (+1263-1264) | `shadow-[var(--management-shadow)]` in 8 files | Live | Low | **KEEP** |
| `--management-accent` | 1186 (+1265) | AntigravityButton:106, CollectionFilter:58, AntigravityForm:38,96 | Live | Low | **KEEP** |

### 8.4 Focus/ring
| Token | File:Line | Consumers | Reason | Risk | Recommendation |
|---|---|---|---|---|---|
| `--focus-ring-color/width/offset` | 483-485 (+769-771) | index.css:657-658, 906, 937, 944 | Live | Low | **KEEP** |
| `--input-focus-shadow` | 915 | 0 | Dead (8.2) | Low | REMOVE |

### 8.5 Component surfaces
| Token | File:Line | Consumers | Reason | Risk | Recommendation |
|---|---|---|---|---|---|
| `--card-bg` | 903 | DiagramRenderer:204 + `bg-card-bg` ×73 | Live | Low | **KEEP** |
| `--card-border`/`-shadow`/`-hover-shadow` | 1038-1040 | shadow ×7; border via AntigravityCard:21-40 | Live | Low | **KEEP** |
| `--stat-card-*`/`--stat-value-text`/`--stat-label-text`/`--stat-icon-*` | 1109-1118 | utilities ×15 | Live | Low | **KEEP** |
| `--surface-stat`/`--surface-tab-pill` | 797-798 (light) | → `--stat-card-bg`(1244), `--material-tab-pill-surface`(1098) | Live | Low | **KEEP** |
| `--card-3d-shadow`/`--stat-card-3d-shadow`/`--elevation-carved` | 799/806/813 | → premium shadows, `--material-card-premium-shadow`(1063), `--header-shadow`(1204) | Live; three near-identical carved recipes | Low | **KEEP**; candidate MERGE in 5.x (freeze-gated) |
| `--surface-canvas/nav/secondary/interactive/inset/raised` | 584-593, 824-832 | **0** | Dead | Low | **REMOVE** |
| `--surface-floating` | 589, 828 | ChartVisualizer:73,98,111; DailyAttemptsChart:92; PremiumSelect:213; Menu:276; DiagramRenderer:95-193; SubjectPieChart:29; index.css:959,965 | Heavily live | Low | **KEEP** |
| `--surface-primary` | 586, 825 | index.css:840 (`.ancient-card`) | Live | Low | **KEEP** |
| `--surface-hover` | 591, 830 | themes.css:974 | 1 hop | Low | **KEEP** |
| `--surface-overlay` | 590, 829 | only → dead `--elevation-overlay` | Dead chain | Low | **DEPRECATE** |
| `--surface-nav` | 585 | only → dead `--nav-surface` | Dead chain | Low | **REMOVE** |

---

## 9. Transition & Animation namespaces

| Namespace | Tokens | Disposition | Reason |
|---|---|---|---|
| Transition | **none** | N/A | **No `--transition-*`/`--duration-*`/`--ease-*` exist.** Motion is raw literals: `transition: background-color 0.3s ease`, `cubic-bezier(0.16,1,0.3,1)` (`.ancient-3d-lift`, `.premium-card`, `.toast-slide-in`) |
| Animation | **none** | N/A | **No `--animate-*`/`--keyframes-*`/`--motion-*` exist.** Raw `@keyframes`: `fadeIn`(570), `sheen`(1186), `slideIn`(1193) → `.animate-in`(645), `.toast-slide-in`(1198) |

> **Finding:** these two audit categories are **empty** — there is no token governance for motion. Gap (not a deletion target); net-new motion tokens are out of Phase 5.1 scope.

---

## 10. Freeze-Gated Items (complete list)

| ID | Item | Disposition | Consumers affected | Render impact |
|---|---|---|---|---|
| FG-1 | Remove `--btn-*` (30 tokens) | REMOVE | 0 | none |
| FG-2 | Merge `--shadow-premium-carved` ≡ `--shadow-premium-icon` | MERGE | 3 sites | none (identical value) |
| FG-3 | DEPRECATE brand literal aliases + migrate 17 consumers | DEPRECATE/MERGE | 17 sites | **yes** — fixes light-mode bug |
| FG-4 | Fix `--input-border` conflict (remove index.css:312) | CONFLICT | 4 utility sites | **restores certified border-subtle render** (D-121) |
| FG-5 | Fix `--radius-xl`/`--radius-2xl` (remove @theme:78-79) | CONFLICT | `rounded-xl`/`rounded-2xl` | none (themes.css already wins) |
| FG-6 | Rename `text-stat-value` color registration | CONFLICT | size usage (LoginPage:231-239) | none |
| FG-7 | Remove ~141 primitives + `--chart-*`/`--pie-*` | REMOVE | 0 | none |
| FG-8 | Remove dead elevation/shadow chains | REMOVE | 0 | none |
| FG-9 | Remove dead input/violet/checkbox-size tokens | REMOVE | 0 | none |
| FG-10 | Remove dead @theme registrations (text 11/12, radii, material self-refs, shadow self-refs) | REMOVE | 0 (keep `text-stat-value`) | none |
| FG-11 | Merge triple `--text-h1/h2/h3`; dedupe radii duals | MERGE | 0 | none |
| FG-12 | Remove dead `--surface-*` + `--surface-overlay`/`--surface-nav` | REMOVE/DEPRECATE | 0 | none |

> All FG items are deletion/merge of dead or identically-valued tokens except **FG-3** (light-mode bug fix) and
> **FG-4** (restores certified render). FG-3/FG-4 change rendered output *toward* the certified/light-correct state
> and require the strongest verification (smoke suite + certified screenshot review).

---

## 11. Summary Counts

| Disposition | Count | Representative items |
|---|---|---|
| **KEEP** | ~90 tokens | elevation 1-4+carved, shadow ladder + component shadows, management-12, card/stat/surface-floating, gold/forest-900/premium-green, checkbox/radio/filter, Control `--button-*` + material, focus-ring |
| **MERGE** | ~15 | premium-carved≡icon; `--btn-*`→`--button-*`; triple text-h1/h2/h3; brand aliases→`--color-*`; pie-gold→gold-200; carved 3D recipes |
| **REMOVE** | **~220+ tokens** | 141 primitives + chart/pie (15) + btn-* (30) + elevation/shadow dead chains (~12) + input dead (~10) + dead @theme registrations (~30) + surface dead (~8) + nav/z/glow/gradient/icon dead families |
| **DEPRECATE** | ~8 | `--elevation-overlay`, `--shadow-focus`, `--surface-overlay`, `--shadow-button-primary` utility, brand literal aliases, `--nav-*` chain |
| **CONFLICT (fix)** | 5 | C1 `--input-border`, C2 `--radius-xl`, C3 `--radius-2xl`, C4 `text-stat-value`, C5 `--shadow-focus` double-reg |

**Headline:** ~220+ tokens (≈25–30% of the token surface) are removable with zero render impact; 3 conflicts silently
affect output today (2 inert-but-misleading; 1 — `--input-border` — actively defeats a certified render).