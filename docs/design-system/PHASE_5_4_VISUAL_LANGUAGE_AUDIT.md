# Phase 5.4 — Visual Language Audit

**Status:** PLANNING / AUDIT ONLY — no Foundation evolution, no token changes, no component changes, no consumer migration.
**Role:** Lead Foundation Architect.
**Date:** 2026-08-04
**Scope:** 8 audit areas across the entire repository `src/` (components, layouts, pages) against the certified Foundation (`themes.css`, `index.css`, core components).
**Governance:** every evolution that results from this audit requires its own Design Decision (D-series), Freeze Register update, Execution Log, and Certification. Nothing in this document authorizes implementation.

---

## 1. Method

1. **Ground truth established** — read the certified Foundation in full: `src/styles/themes.css` (Layer 1 primitives, Layer 2 semantic, Layer 3 component tokens, dark `:root` + `.light` overrides), `src/index.css` (`@theme`, base styles, global `.light` rules, `@utility` recipes, `.ancient-*` light materials), and the core common components (`AntigravityButton`, `AntigravityCard`, `AntigravityForm`, `AntigravityData`, `AntigravityLayout`, `SharedComponents`, `PremiumIconContainer`, `AdminModal`, `Spinner`).
2. **Consumer sweep** — full-`src` greps for every hover/hardcoded-surface/button/skeleton/pill/typography signal, plus deep reads of the management consumer chain (Admin Users, Admin Questions, Dashboard, Toolbars, Selection panels, Collection primitives).
3. **Classification** — each finding assigned a Foundation owner (token/component) or flagged as a violation (hardcoded / legacy / bypass).
4. **Baselines** — preserved exactly: lint 397 problems (344+53), vitest audit 33 failed / 301 passed, cleanup dashboard Tokens 434 / SAFE REMOVE 122 / FREEZE PROTECTED 222 / LIVE 313 / MERGE Pending 0.

**Findings are evidence, not authorization.** Every spec and every migration step below is gated by the approval gate.

---

## 2. Current Foundation Language (what is certified and must not regress)

### 2.1 Token architecture (certified)
- **Layers:** Layer 1 primitives → Layer 2 semantic → Layer 3 component. Components consume Layer 2/3 only (Engineering Standard V3.1).
- **Theme model:** dark-first; the app branches on React `useTheme().isDark` where needed; `light:` utility variants for Tailwind-level overrides; no `dark:` variants exist. `.light` overrides live in `themes.css` + `index.css`.
- **Surface semantic ladder (light):** canvas `--bg-app #F8FAFC` → primary `--bg-surface #FFFFFF` → elevated/hover `#F1F5F9` → active `#E2E8F0` → overlay `rgba(15,23,42,0.45)`. Dark: app `#111827`, surface `#1F2937`, elevated/active/disabled `#374151`.
- **Typography ladder:** `--text-primary/secondary/muted/hint/disabled` with a resolved scale (see TYPOGRAPHY_CONTRAST_AUDIT.md §3).
- **Radii:** `--radius-xl 20px`, `--radius-2xl 24px` (5.3E T2 Option A canonical).
- **Status family:** `--color-{success,warning,danger,info}` + `--color-secondary` (brand). `--color-accent` = brand/primary.
- **Two surface families coexist (certified):**
  - **Premium family (D-141):** gold-accented — `--surface-stat` (gold gradient), `--card-3d-shadow`, `--stat-card-3d-shadow`, `--elevation-carved`, `--surface-tab-pill`, gold-300 borders. Light-only premium material; dark resolves neutral.
  - **Management Surface Family (D-144):** neutral — `--management-*` namespace. Light = neutral whites/slates, zero amber/gold. Dark = certified neutral tokens (pixel-identical).

### 2.2 Component surface owners (certified)
| Owner | Tokens | Variants | Notes |
|---|---|---|---|
| `Card` (AntigravityCard.tsx) | `bg-card-bg`, `--management-*`, premium recipes | elevated / default / subtle / premium / premium-neutral / premium-dark-neutral / auth-light / management | `MANAGEMENT_SURFACE`, `PREMIUM_SURFACE`, `GOLD_SURFACE` recipes exported |
| `StatCard` (AntigravityCard.tsx) | `--stat-card-*`, premium | status: accent/warning/success/info/danger/secondary | Light = premium medallion (D-141) |
| `AntigravityButton` | control role tokens + management | primary/secondary/success/danger/soft/ghost (+management prop) | See BUTTON spec |
| `Tabs` / `SegmentedFilter` | `--material-tab-*`, `--filter-*` | active pill = nav/tab-pill material | Light pill gold (`--surface-tab-pill`) |
| `LoadingSkeleton` | `GOLD_SURFACE` premium / `--management-*` | premium / management | See SKELETON spec |
| `AdminModal` | `bg-card-bg` / `--management-*` | premium / management | |
| `CollectionToolbar`/`SelectionContainer` | premium / management | variant-gated | |

---

## 3. Audit Findings by Area

### 3.1 Surface language & consistency (Audit scope 2 + 3)

**Management consumer scope (Admin Users, Admin Questions, Dashboard, Toolbars, Selection panels, Cards, Collection cards):**
- **44 token-backed surfaces vs 1 hardcoded surface vs 1 MIXED** across the audited consumer chain.
- **Admin Users = reference implementation.** 100% `--management-*` (UsersTable rows, UsersActions toolbar, search input, filter, menu, skeleton). Zero hardcoded.
- **Admin Questions = INCONSISTENT.** Same product area (management) renders the **premium/gold family**: QuestionsTable row cards (`CollectionCard variant="premium"`), QuestionsActions toolbar (premium), filter trigger (premium `--filter-*`), skeleton (gold). Zero `--management-*`. This is the single largest surface-language gap.
- **BulkActionBar = MIXED.** Manual `isDark` branch: light `bg-[var(--management-surface)]` vs dark `bg-card-bg` — the exact pattern the `--management-*` namespace was designed to remove.
- **AdminSelectionTabs = premium/navigation family** (`selection-surface` = `--sidebar-bg`, light = forest gradient), not management.
- **User Dashboard + AntigravityDashboard = premium/gold** (expected — user-facing premium family, not management-scoped).
- **Hardcoded whites found in the consumer chain:** `AntigravityData.tsx:100` + `SegmentedFilter.tsx:89` `light:hover:bg-white/5` (inactive tab hover) — the only hardcoded surface in the management chain.
- **Repo-wide legacy hardcoded surfaces (~15 files, outside management scope):** `bg-white` (AntigravityForm switch thumb :216, TopicReader :50/66/152, ExamLayout chip :30, Navigation indicator :220), `bg-slate-900` (Navigation :205, SidebarLayout :187), `bg-gray-400` (PreparationView dot :92), `bg-slate-400/20` (ExamSubComponents :24), PerformanceCharts chart tooltip (white/slate pair :27-28), AIToolCards decor `bg-white/5` :60, CarouselDots `bg-white/5`. These are legacy to be swept in a later wave — none are certified Foundation components.

**Verdict:** the Management Surface Family exists and is clean, but it is applied to **only one of the two management product areas**. Questions must move to the management family. The hardcoded tab-hover must be tokenized.

### 3.2 Hover system (Audit scope 1)

- **209 distinct hover touchpoints** across 57 files; 11 hover-shadow tokens in play.
- **9 hover dialects found** (full catalog in HOVER_LANGUAGE_SPECIFICATION.md §3):
  1. 2D color-only (~88) — bg/border/text change
  2. 3D-elevate (10) — `hover:-translate-y-0.5 hover:shadow-*` (Foundation cards + management/buttons)
  3. shadow-only (8)
  4. scale (8) — `whileHover scale 1.01` (all Buttons) + `hover:scale-105/102` cards
  5. brightness/glow (7) — buttons
  6. icon-motion (15) — `group-hover:scale/translate/rotate`
  7. reveal (11) — opacity 0/70/50 → 100
  8. brutalist-offset (5) — framer-motion `y/x + Npx hard boxShadow` (TopicReader, TopicSectionRenderer)
  9. row-hover opacity `/20 /30 /40 primary/[0.02]` — 5 different row recipes
- **Same element, different dialects:**
  - **Cards: 8 dialects.** Foundation `default/elevated/premium` elevate (`-translate-y-0.5` + shadow); `AttemptCardBase`/`TopicCard` stack a second shadow (`hover:shadow-card-premium`) on top of Card's; **`QuestionCard.tsx:39` actively cancels** the foundation elevate (`hover:translate-y-0` + `hover:shadow-elevation-3`); `LeaderboardView` scales; `AIToolCards` scales + presses; `MethodSelectionView`/`TopicSectionRenderer`/`LanguageSelectionScreen` border+tint only; `TopicSectionRenderer` brutalist.
  - **Buttons: 6 dialects** (brightness+shadow, elevate+bg, 2D-dimmer, brutalist, colored-border, universal scale).
  - **Table rows: 5 recipes.**
  - **Selection pills/tabs: 5 dialects.**
  - **Icon buttons: 4 dialects** + universal scale.
- **Two competing elevation geometries:** Tailwind `-translate-y-0.5`+shadow vs framer-motion hard-offset shadow. The brutalist recipe only applies in non-dark (`!isDark`).
- **Universal `whileHover scale:1.01`** on every Button/IconButton coexists with class-based hovers on the same buttons.

**Verdict:** the Foundation already owns a canonical card hover (elevate + shadow). The drift is consumers overriding it. The unified language (HOVER spec) must (a) keep exactly ONE card hover, (b) resolve the shadow-token conflict between `--shadow-card-premium` and `--shadow-card-hover-shadow`, (c) decide the QuestionCard flat-vs-elevated question, (d) unify row hover to one recipe, (e) gate the universal motion-scale so it does not double with class hovers.

### 3.3 Button language & depth (Audit scope 4 + 5)

- **Canonical spec (AntigravityButton.tsx):** 6 variants + management prop + sizes xs/sm/md/lg/xl (heights 32/36/48/48/56; radii 10/12/14/14/16px). `base` = uppercase, flex-center, `transition-[color,box-shadow,border-color,opacity,filter] duration-200`.
- **Repo reality:** **8+ distinct heights (32→58px)** and **10+ distinct radii** far beyond the 5×5 matrix.
- **Major violations (Button component bypassed or overridden):**
  - `BulkActionBar.tsx:30,33` — `!h-9 sm:!h-10`, kill-color overrides on secondary.
  - `SubmitExamModal.tsx:62,70` — `py-4 text-lg/text-base` on `h-[48px]`.
  - `TopicListItem.tsx:85-138` (×6) — `!w-8 !h-8` IconButtons.
  - `QuestionsTableComponents.tsx:16,27,38` — `!w-8 !h-8 !rounded-xl !bg-app-bg` icon buttons.
  - `CreateStepPrompt.tsx:78,94` — `h-14`; `CreateStepPublish.tsx:67,77` — `h-[58px]`/`h-10`; `ExamDetailSection.tsx:104,115` — inline `style={{height}}`.
- **Off-spec radius `rounded-[13px]`** — only `QuestionNavigator` (NavButton + MobileActionBar).
- **Off-palette color:** `QuestionActions.tsx:36` hardcoded purple ("Mark for Review").
- **~20 raw-button elements** bypass the Button component entirely (exam flow: QuestionNavigator, QuestionPalette, QuestionActions, ReviewLayout, LanguageSelectionScreen; sub-admin create flow; TopicReader; TopicInfoButton; BilingualToggle; SuccessView; micro-buttons).
- **Foundation gap:** sizes md and lg share `h-[48px]`/`rounded-[14px]`, so a 56/58px action CTA has no sanctioned size — forcing the sub-admin hacks.
- **Light-mode depth:** primary uses forest gradient + elevation-2; secondary elevation-2; hover steps elevation-3 + brightness; **active** states: primary/management `translate-y-0.5`, others none. Buttons are relatively flat vs the carved premium family — a deliberate neutral material exists but active/pressed feedback is inconsistent (some variants have it, some don't).

**Verdict:** one permanent button material must be defined (rest elevation, hover elevation+brightness, pressed inset) and every consumer must go through `Button`/`IconButton`. Raw buttons migrate to variants; override hacks become sanctioned sizes/variants.

### 3.4 Typography contrast (Audit scope 6)

- **Resolved token scale (both themes)** and computed contrast ratios are in TYPOGRAPHY_CONTRAST_AUDIT.md §3. Key failures:
  - **Light:** `--text-hint #9CA3AF` ≈ **2.7:1** on white, **2.4:1** on `#F1F5F9`, **2.2:1** on `#E2E8F0` — fails 4.5:1 for normal text everywhere.
  - **Dark:** `--text-hint #6B7280` ≈ **3.2:1** on `#1F2937`, **2.2:1** on `#374151` — fails.
  - `--text-muted` ≈ 6.1:1 dark (passes), 5.1:1 white (passes barely), **4.1:1 on `#374151` dark** and **4.2:1 on `#E2E8F0` light** (borderline-fail on raised surfaces).
- **Tiny arbitrary sizes:** `text-[10px]` ×140, `[11px]` ×76, `[9px]` ×50, `[8px]` ×16, `[7px]` ×4 — all bypass the `--text-label/--text-badge` micro-token scale (10px/9px). 7–9px bold uppercase fails legibility guidance.
- **Opacity as hierarchy:** 59 `opacity-NN` + 7 token-alpha-slash uses do the same job two ways, both untokenized.
- **Same role, different size/weight across files:** section labels 9→14px/500→900; card titles 13→24px; table headers font-semibold vs font-bold, `text-text-secondary` vs `var(--text-muted)`; metadata 9/10/12px.
- **Status colors as body text:** WelcomeBanner body in `text-warning` (#FBBF24 dark / #D97706 light ≈ 3:1 on white — fails), StatusBoard heading in `text-warning`, data columns in raw green/red/amber, `--color-secondary` gold #C8960C ≈ 3.5:1 on white as text (fails small text).
- **`text-[var(--text-muted)]` bypass (~17+ sites):** same value, escapes the token-class system.

**Verdict:** the semantic ladder exists but `--text-hint` is unusable as body/meta text in both themes, tiny arbitrary sizes and opacity-fades are ungoverned, and status colors leak into neutral content roles. One unified typography scale with contrast gates is required.

### 3.5 Selection pills / tabs / filters (Audit scope 7)

- **5 pill dialects** across Tabs / SegmentedFilter / BilingualToggle / QuestionOptions / ReviewLayout filters / TestConfigView count selectors / CollectionFilter / PremiumSelect / Exam Selection / AdminSelectionTabs:
  1. Active gold pill on neutral track (Foundation Tabs + SegmentedFilter) with `light:hover:bg-white/5` + label opacity reveal
  2. `lg:hover:text-text-primary` color-only (BilingualToggle, TopicReader)
  3. border+tint hover (`hover:border-primary/30/50`, QuestionOptions, ReviewLayout, TestConfigView, QuestionCard)
  4. `hover:bg-hover-bg` + border (QuestionForm, SuccessView)
  5. dots (CarouselDots) — different hover semantics per theme
- **Selected/unselected/focus** states vary: active pills use accent text (`text-primary`), some add bg tint, some border; the gold premium pill (D-141) only exists on the two Foundation tab components; the management filter trigger (CollectionFilter) uses `--filter-*` role tokens.
- **Hardcoded:** the `light:hover:bg-white/5` tab hover (2 sites).

**Verdict:** the Foundation owns two tab/pill implementations (Tabs, SegmentedFilter) that are near-duplicates with the same gold pill; the rest are consumer hand-rolls. One pill language must cover selection/filter/tab/option with a single state model.

### 3.6 Skeleton loading (Audit scope 8)

- **No true shimmer data-skeleton exists** anywhere. All loading placeholders use flat `animate-pulse`; the only sweep animation is the decorative Splash coin sheen.
- **4 skeleton dialects:**
  1. **gold-surface-pulse** (default `LoadingSkeleton`/`GridSkeleton`/`StatSkeleton`) — `GOLD_SURFACE`: flat `#1F2937` in dark, **saturated gold gradient in light** (highest-chroma loading surface in the app; same surface as live StatCards → can be mistaken for content).
  2. **management-pulse** (`variant="management"`, UsersTable + QuestionsTable only) — fully tokenized, neutral both themes. Cleanest dialect, least used.
  3. **flat-pulse-on-hover-bg** (ad-hoc: ExamDetailModal chart, StatCard value pulse) — `AntigravityCard.tsx:177` diverges internally (dark `bg-hover-bg` vs light `bg-stat-card-border/20`).
  4. **icon/ambient pulses** (LoadingScreen orbs, PremiumLoader, badges, dots) — non-data, mostly tokenized.
- **Hardcoded hexes:** `PremiumLoader.tsx` uses `#2c4c3b`, `#d4af37`, `#f4ebd8` — the only non-tokenized loading surface.

**Verdict:** one skeleton language = neutral, theme-aware, flat-pulse, tokenized. The default gold-light skeleton must be reconsidered (either stays premium but clearly placeholder, or the default becomes neutral). `PremiumLoader` hexes must be tokenized.

---

## 4. Cross-cutting Findings

| # | Finding | Severity | Owner | Consumers |
|---|---|---|---|---|
| V-1 | Admin Questions renders premium family in a management product area | Major | Foundation surface family + Questions consumers | QuestionsTable, QuestionsActions, QuestionsTableComponents, filter, skeleton |
| V-2 | BulkActionBar mixes management(light)/card(dark) via isDark branch | Major | BulkActionBar → management tokens | BulkActionBar |
| V-3 | Tab hover hardcoded `light:hover:bg-white/5` (2 sites) | Minor | AntigravityData Tabs + SegmentedFilter | AdminSelectionTabs, AdminFilterBar |
| V-4 | Card hover override conflicts (`QuestionCard.tsx:39`, `AttemptCardBase`/`TopicCard` double-shadow) | Major | Card + consumers | QuestionCard, AttemptCardBase, TopicCard, QuestionCard builder |
| V-5 | 9 hover dialects; row hover 5 recipes; 2 elevation geometries | Major | Foundation hover spec + all consumers | whole repo |
| V-6 | Button spec drift: 8 heights, 10 radii, ~20 raw buttons, `rounded-[13px]`, purple, height hacks | Major | AntigravityButton + consumers | BulkActionBar, SubmitExamModal, TopicListItem, QuestionsTableComponents, create flow, exam flow |
| V-7 | `--text-hint` fails contrast in both themes; 7–9px micro-text; opacity hierarchy; status colors as body text; `var(--text-muted)` bypass | Major | typography tokens + consumers | whole repo |
| V-8 | 5 pill dialects; near-duplicate Tabs/SegmentedFilter | Minor | Tabs/SegmentedFilter + consumers | AdminSelectionTabs, filters, Exam Selection |
| V-9 | Skeleton: light gold default vs neutral management; PremiumLoader hexes | Minor | LoadingSkeleton + PremiumLoader | page skeletons |
| V-10 | Legacy hardcoded whites/slates (~15 files, non-Foundation) | Minor | deferred wave | sidebar, exam, topics, performance, results |

---

## 5. Ranked Priority (drives the migration plan)

1. **P0 — Foundation language definition (no render change):** one Surface, Button, Hover, Pill, Skeleton, Typography specification — this phase's primary deliverable.
2. **P1 — Foundation evolutions:** management family for Questions; tab-hover token; card hover resolution; button size/variant gaps; skeleton neutral default; typography contrast fixes (new tokens for hint/metadata); tokenized PremiumLoader.
3. **P2 — Consumer migrations:** Questions surfaces → management; BulkActionBar; hover unification; button/raw-button migration; pill unification; skeleton consumer migration; typography cleanup.
4. **P3 — Deferred legacy sweep:** non-Foundation hardcoded whites/slates (sidebar, exam, topics, performance, results).

Every P1 evolution requires its own D-series decision + certification gate before P2 migration; page migration and Foundation evolution never share a phase (D-145 precedent).

---

## 6. Summary Dashboard

| Area | Token-backed | Hardcoded | Mixed | Dialects found | Foundation owner ready |
|---|---|---|---|---|---|
| Surfaces (management scope) | 44 | 1 | 1 | 2 families | Yes (management + premium) |
| Hover | — | — | — | 9 | Partial (card canonical exists) |
| Buttons | — | ~20 raw | ~12 override hacks | 6 | Yes (variant system) |
| Typography | 532 token uses | 4+ micro-sizes, 66 opacity | — | 1 scale + arbitrary bypass | Partial (hint token weak) |
| Pills | ~20 | 2 | — | 5 | Partial (2 tab impls) |
| Skeleton | ~30 | 4 hexes (PremiumLoader) | — | 4 | Yes (management variant) |

**Bottom line:** the Foundation is coherent and token-driven. The visual-language fragmentation is (a) one management product area still on the premium family, (b) hover/button/pill dialects that consumers hand-rolled over the canonical recipes, and (c) typography contrast failures at the hint/micro-text tier. All are fixable by additive Foundation evolution + consumer migration, gated per the governance rules. No findings here authorize any code change.
