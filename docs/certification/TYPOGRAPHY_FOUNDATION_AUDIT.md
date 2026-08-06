# Typography Foundation Audit (Phase 3.5 · U-2 — Repository-wide)

**Date:** 2026-08-03
**Gate:** U-2 (Typography Scale) — **Phase A IMPLEMENTED + CERTIFIED (D-132)**, audit complete. Phase B (T-6 micro 8px, T-7 repo-wide `@theme` wiring) remains **gated**.
**Scope:** Repository-wide typography — primitives, tokens, and every raw usage — using **Admin Users** as the reference consumer.
**Governance in force:** pixel-identical-only rule (certified precedent, U-1…U-5/U-3); D-131 two-layer model extended to the permanent three-tier hierarchy (§3). No page invents typography after this certification.
**Companion docs:** `TYPOGRAPHY_SCALE_SPECIFICATION.md` (Step 8 — permanent scale) · `ADMIN_USERS_U2_IMPLEMENTATION_PLAN.md` (Steps 6–7 register + page-1 gate).

---

## 1. Repository Typography Inventory (Step 1)

Certified primitives and their owners. "Consumers" = distinct files/elements consuming the primitive (test files excluded).

| Primitive | Owner | Layer | Consumers | Consumed inside Foundation? | Status |
|---|---|---|---|---|---|
| `H1` | `AntigravityTypography.tsx:8` | 1 Repository | 10 `<H1>` / 9 files (admin sr-only page titles ×5, auth ×2, misc ×2) | No | ✅ Certified (Layer 1) |
| `H2` | `AntigravityTypography.tsx:26` | 1 Repository | 22 `<H2>` / 21 files | No | ✅ Certified (Layer 1) |
| `H3` | `AntigravityTypography.tsx:41` | 1 Repository | 28 `<H3>` / 19 files | Yes — `AntigravityResults` (ScoreCard, ResultStatCard) | ✅ Certified (Layer 1) |
| `Body` | `AntigravityTypography.tsx:59` | 1 Repository | 54 files | Yes — `AntigravityResults`, `AntigravityDashboard`, `AttemptCardBase`, `SuccessModal` | ✅ Certified (Layer 1) |
| `Label` | `AntigravityTypography.tsx:79` | 1 Repository | 44 files | Yes — `AntigravityData` (MetricBlock), `AntigravityResults`, `AttemptCardBase` | ✅ Certified (Layer 1) |
| `Display` | `AntigravityTypography.tsx:95` | 1 Repository | 6 elements / 2 files (LoginPage hero+stats, SignupPage) | No | ✅ Certified — **underused** |
| `Caption` | `AntigravityTypography.tsx:109` | 1 Repository | 2 elements / 1 file (CollectionCard subtitle) | Yes — `CollectionCard` | ✅ Certified — **underused** |
| `BrandTitle` | `AntigravityTypography.tsx:139` | 1 Repository | 1 element (SplashPage gradient title) | No | ✅ Certified (DS-006) — brand-specific |
| `AdminText` | `AdminText.tsx:25` | 2 Module | 14 files (+ `as="h1..h4"` in 7) | Yes — `SectionHeader` (`AntigravityLayout.tsx:196`) | ✅ Certified (U-3, Layer 2) |
| `AdminPageTitle` | `AntigravityData.tsx:140` | 1 Repository | 1 (SidebarLayout) | — | ⚠️ Title-only wrapper — raw `<span>`, **not** a typography primitive (no size/weight contract) |
| `SectionHeader` | `AntigravityLayout.tsx:179` | 2 Module | sub-admin exam/performer sections | — | ✅ Uses `AdminText` — module typography |
| `PageHeader` | `AntigravityLayout.tsx:69` | 1 Repository | internal | — | ⚠️ Raw `<h1>` — not barrel-exported |
| `FormattedBodyText` | `FormattedBodyText.tsx:27` | — | topic/parsed preview renderers | — | Content renderer (raw `<p>/<ul>/<table>`) — **content, not UI typography** |
| `PerformanceSectionHeader` | `user/performance/PerformanceSectionHeader.tsx:9` | 2 Module | DailyAttemptsChart, PerformanceAnalyticsSection | — | Uses `H3` + `Body` — user-module composition |

**Raw heading elements (not primitives):** 33 raw `<h1>–<h6>` tags; 29 outside the primitive definition file (25 files). Hotspots: exam flow (`ExamHeader`, `QuestionCard`, `ReviewLayout`, `ReviewQuestionCard`, `LanguageSelectionScreen`, `StatusBoard`), sub-admin flow (`SuccessView`, `QuestionCard`, `CreateStepReview`, `ExamListSection`, `ExamDetailSection`, `ExamDetailModal`), admin tooling (`QuestionForm`, `AIToolCards`, `InstructionsTab`, `UploadProgressOverlay`, `AdminTopicPreviewRenderer`). Admin pages are the cleanest — every page carries an sr-only `<H1>` plus `AdminText as="h1..h4"` headings.

**Foundation components that own typography internally (no primitive):** `Badge`, `StatCard`, `Card`, `Alert`, `Button`, `Input/Select/TextArea`, `DataGrid`, `Tabs`, `ProgressBar`, `AdminModal`, `Avatar`, `EmptyState/ErrorState`, `Pagination`, `Spinner`, `Menu`, `Navigation`, `DataTable`. These render raw size/weight/tracking utilities inside their own markup (Foundation-internal raw, §2-C).

---

## 2. Raw Typography Audit (Step 2)

### 2-A. Aggregate (page + feature components, `src/**/*.tsx`, excluding `src/components/common`)

| Pattern | Count | Note |
|---|---|---|
| Arbitrary `text-[Npx]` | **312** | top values: `[10px]` 110 · `[11px]` 60 · `[9px]` 39 · `[12px]` 23 · `[14px]` 19 · `[13px]` 17 · `[8px]` 15 · `[15px]` 6 · `[18px]` 5 · `[16px]` 4 · singles `[7/20/22/24/28/32/40/48/64px]`, `[13.5px]` |
| Arbitrary `text-[clamp(...)]` | 9 | fluid sizes (WelcomeBanner, exam flow) |
| `text-xs` (12px) | 156 | labels, error text, badges, table cells |
| `text-sm` (14px) | 79 | body/table/metadata |
| `text-base` (16px) | 16 | |
| `text-lg` (18px) | 17 | |
| `text-xl` (20px) | 13 | |
| `text-2xl` (24px) | 17 | |
| `text-3xl`/`4xl`/`5xl` (30/36/48px) | 5/2/3 | |
| `font-black` / `font-bold` / `font-semibold` / `font-medium` | 149 / 294 / 64 / 48 | |
| `font-mono` | 27 | 19 in `LangInputPanel` (`<code>`), rest code/JSON |
| `font-cinzel` / `font-garamond` | 12 / 2 | user-side brand serif (performance/topics) |
| `tracking-widest` / `tracking-wide` / `tracking-wider` / `tracking-tight` / `tracking-tighter` | 136 / 30 / 17 / 48 / 11 | |
| `tracking-[…]` arbitrary | 7 | `[0.2em]`×4, `[0.15em]`, `[0.3em]`, `[0.35em]` |
| `leading-none` / `tight` / `snug` / `relaxed` | 21 / 15 / 6 / 31 | |
| `uppercase` | 232 | heavily co-occurs with `tracking-widest`/`tracking-wide` + `font-bold` (the Label/Badge pattern) |
| Inline `style={{ fontSize }}` | 45 | ~40 element styles (`sub-admin/exams/*`, `sub-admin/create/*`), ~5 chart configs (recharts) |

**Zero-count (verified — nothing to migrate):** legacy size tokens `text-overline/sub-1/sub-2/body-1/body-2/button/h4/h5/h6` = 0; `text-md/3xs/2xs/6xl–10xl` = 0; `font-thin/light/normal` = 0; `lowercase` = 0; dynamic (`text-${…}`) = 0. (The `text-button-text-*` matches in `AntigravityButton.tsx` are **color** utilities, not the legacy size token.)

### 2-B. Per-area register (File → Current → Foundation Equivalent → Action)

Exhaustive per-file counts live in the gate working data (each certified page gate re-runs its own slice). The consolidated register below is grouped by module; every entry is one of: **REUSE** (existing primitive absorbs verbatim) · **REFINE** (existing primitive gains a token/prop, pixel-identical) · **NEW-TOKEN** (adds a canonical token with identical value — gate decision) · **RETIRE** (dead) · **DEFER** (future page gate).

| Area / File | Current (raw) | Foundation Equivalent | Action |
|---|---|---|---|
| **Admin module (page 1 — Admin Users)** | | | |
| `admin/users/AdminUsersView.tsx:56-57` | `AdminText … text-sm font-bold` (14px); `<Label className="text-[8px]">Exams</Label>` (inert — `--text-label` 10px wins) | Layer 1 `Label`; Layer 2 `AdminText` `size` | NEW-TOKEN/REFINE — `text-sm`→Metadata/Small tier; drop inert `text-[8px]` (render-neutral) |
| `admin/users/UserIdentity.tsx:20,29` | `AdminText` garamond `text-base font-bold` (16px); sans `text-xs` (12px) | `AdminText` `size` | NEW-TOKEN — Title (16) / Metadata (12) tiers or verbatim className (decision §4-B) |
| `admin/users/UserMobileCard.tsx:21-27` | `AdminText sans text-xs` ×3 (12px) | `AdminText` `size` | NEW-TOKEN — Metadata tier |
| **Admin module (remaining pages — deferred to their page gates)** | | | |
| `pages/admin/AdminTopics.tsx:121,163,171,218` | `text-xs`, `text-[9px] font-semibold`, `text-[11px]` | `Label`/`Badge`/`Caption` | DEFER (Admin Topics U-gate) |
| `pages/admin/AdminSettings.tsx:67` | `text-[10px] font-bold uppercase tracking-widest` | `Label` | DEFER (Admin Settings U-gate) |
| `pages/admin/AdminLeaderboard.tsx:40` | `text-xs font-semibold uppercase tracking-widest` | `Label`/`Caption` | DEFER |
| `admin/leaderboard/Leaderboard*.tsx`, `admin/questions/*`, `admin/settings/AddExamModal.tsx`, `admin/topics/*`, `admin/sub-admins/*`, `admin/upload/*`, `admin/common/BulkActionBar.tsx` | dense raw (`text-[10px]`~`[11px]`, `font-black`, `tracking-widest`, `uppercase`, inline `fontSize`) | `Label`/`Badge`/`Caption`/`Body`/`AdminText` | DEFER (per-page gates) |
| **Sub-admin module** | | | |
| `sub-admin/exams/*`, `sub-admin/create/*` | heaviest inline `fontSize` cluster (≈40) + raw px | primitives | DEFER (Sub-Admin gates) |
| `sub-admin/dashboard/RecentAttemptItem.tsx`, `RecentExamItem.tsx`, `students/StudentsTable.tsx` | `text-[9px]`/`[10px]`/`[12px]`/`[13px]`, weights | `AdminText`/`Label` | DEFER |
| **User module** | | | |
| `user/topics/*`, `user/performance/*`, `user/leaderboard/*`, `user/prepare-write/*`, `user/topic-exams/*`, `WelcomeBanner`, `TestConfigView`, `ResultsPage` | largest raw volume repo-wide (clamp sizes, `font-cinzel` brand serif, `text-[9..16px]`, `tracking-widest`, `uppercase`) | `H1..H3`/`Body`/`Label`/`Caption`/`Display`/`BrandTitle` | DEFER (User gates) — note: user `font-cinzel` = brand Layer-1 serif, distinct from Admin `AdminText` |
| **Exam flow** | | | |
| `components/exam/*`, `pages/exam/*` | raw headings (`ExamHeader` `<h1>`, `QuestionCard` `<h2>`, `ReviewLayout` `<h1>`/`<h3>`), `text-[8..18px]`, clamp, `tracking-widest` | primitives (sr-only H1 + semantic tiers) | DEFER (Exam gates) |
| **Profile** | | | |
| `components/profile/*` | `text-[24px]`/`[32px]`/`[11px]`, weights, `tracking-widest` | `H1`/`H2`/`Body`/`Label` | DEFER |
| **Layouts / auth / misc** | | | |
| `layouts/SidebarLayout.tsx` | `text-[10px]`×4, weights, `tracking-widest` | `Label`/`Badge` | DEFER |
| `pages/auth/*`, `pages/SplashPage.tsx`, `pages/Unauthorized.tsx`, `AccountDisabledPage.tsx`, `components/ErrorBoundary.tsx` | raw + primitive-className overrides (`text-2xl font-black` on `H3`, etc.) | primitives with `size`/props | DEFER (auth gates) — many are `className` overrides **on certified primitives** (see §4) |
| `components/visualizers/*`, `components/ExamTimer.tsx`, `components/ExamTimer` helpers, `context/AuthContext.tsx`, `hooks/useToast.tsx` | chart `fontSize` configs, `text-[9px]`, misc | tokens / primitives | DEFER |

### 2-C. Foundation-internal raw (`src/components/common` — the primitives' own internals)

`AntigravityForm.tsx`, `AntigravityLayout.tsx`, `AntigravityCard.tsx`, `AntigravityButton.tsx`, `AntigravityData.tsx`, `AntigravityDashboard.tsx`, `AntigravityResults.tsx`, `Alert.tsx`, `AdminModal.tsx`, `SegmentedFilter.tsx`, `NotificationPanel.tsx`, `SharedComponents.tsx`, `DiagramRenderer.tsx`, `AttemptCardBase.tsx`, `CollectionCard.tsx` render raw sizes/weights/tracking inside Foundation components (**≈92 arbitrary px, `font-bold`×76, `tracking-widest`×22, `uppercase`×49**). These are *Foundation-internal* — they should consume their own tokens/primitives but are **not** page-owned typography and are not in the page-migration scope. A later Foundation-internal wave migrates them to the certified scale internally (render-neutral by verbatim transfer).

---

## 3. Typography Hierarchy (Step 3) — the permanent model

```
Layer 1 — REPOSITORY TYPOGRAPHY        (repo-wide, consumed directly by every module)
    H1  H2  H3  Body  Label  Display  Caption  BrandTitle
    token-driven (themes.css canonical scale + @theme utilities)
            │
Layer 2 — MODULE TYPOGRAPHY            (per-module primitives; may extend Layer 1, never replace)
    AdminText (Admin)      SectionHeader (Admin/SubAdmin)      PerformanceSectionHeader (User)
            │
Layer 3 — PAGE COMPOSITION             (layout + arrangement + spacing ONLY)
    pages/compositions consume Layer 1 + Layer 2 primitives
```

**Permanent rules (extends D-131):**
1. **Pages never own typography implementation.** Any text rendered by a page must be a Layer 1 or Layer 2 primitive (or a certified Foundation component). A page-owned `<span>`/`<p>`/`<h1>` with raw `text-*`/`font-*`/`tracking-*` is a defect.
2. **Layer 1 is the single repository language.** Modules extend it (Layer 2) only with render-neutral additions; they may never fork or duplicate it.
3. **Foundation components may own typography internally** but must consume the same token set/primitives (not page-owned patterns).
4. **Arbitrary sizes** are allowed only where a primitive exposes them (e.g. `BrandTitle size`), never as page-owned raw `text-[…]`.
5. **Content renderers** (`FormattedBodyText`) are exempt (they render user content, not UI chrome) but must inherit the theme text tokens.

---

## 4. Typography Token Audit (Step 4)

### 4-A. Token layers in the codebase

| Token system | Defined in | Status |
|---|---|---|
| **Canonical semantic scale** — `--text-display/h1/h2/h3/body/caption/label/stat-value/badge` + `--text-metadata/small/heading` (T-3/4/5, U-2 Phase A) + `--lh-*`, `--fw-*`, `--ls-*`, `--tt-*` | `themes.css:544-572` (authoritative), mirrored into `@theme` (`index.css` for utilities) | ✅ **THE language.** Consumed by primitives via inline `var(...)` (responsive). T-3/4/5 certified (D-132); **`--text-heading`** (renamed from approved `--text-title` — color-token collision, D-132) |
| **Raw size primitives** — `--text-3xs`…`--text-10xl` (10…48px) | ~~`themes.css:356-373`~~ | 🗑 **RETIRED (T-1, U-2 Phase A, D-132)** — were unwired + name-shifted, zero consumers |
| **Tailwind default sizes** — `text-xs`…`text-5xl` (12/14/16/18/20/24/30/36/48px) | Tailwind v4 defaults (app `@theme` does not override) | ⚠️ What the app renders for `text-xs`/`sm`/`base`/… — page-level raw uses migrate per-page to the certified tiers; remaining repo-wide uses are tracked in the consumer register |
| **Legacy semantic utilities** — `text-overline/sub-1/sub-2/body-1/body-2/button/h4/h5/h6` | ~~`index.css` `@theme`~~ | 🗑 **RETIRED (T-2, U-2 Phase A, D-132)** — zero consumers; `:root` `--text-h4/h5/h6` vars kept for the global element rules |
| **`--font-size-caption` / `--font-weight-caption`** | ~~`themes.css`~~ | 🗑 **RETIRED (T-1, U-2 Phase A, D-132)** — dead + inconsistent |
| **Font family / weight / lh / ls primitives** — `--font-sans/mono`, `--weight-thin…black`, `--lh-none…loose`, `--ls-tighter…ultra` | `themes.css:343-390` | ✅ Consumer-backed (`--weight-*` via themes, `--lh-*`/`--ls-*` via primitives; weights also drive `font-bold` etc. indirectly only for `--weight-bold`) |
| **Spacing tokens** — `--space-0…24` | `themes.css:320-332` → `--spacing-*` (`index.css:246-258`) | ✅ single-layer, fully wired (typography *spacing* governed here) |

### 4-B. ⚠️ Critical finding — the three overlapping size systems

The app renders **Tailwind default** values for `text-xs`/`sm`/`base`/`lg`/`xl`/`2xl`/… (12/14/16/18/20/24/30/36/48px) because the Layer-1 raw primitives (`--text-3xs…10xl`) are **not** registered in `@theme`. The Layer-1 names **shift** versus what renders:

| Utility (rendered px) | Tailwind default | Layer-1 `--text-*` primitive (phantom) | Canonical semantic token (px) |
|---|---|---|---|
| `text-xs` (12) | 12 ✓ | `--text-xs` 12 ✓ | — |
| `text-sm` (14) | 14 ✓ | `--text-sm` **13** ✗ | `--text-body` **13** |
| `text-base` (16) | 16 ✓ | `--text-base` **14** ✗ | `--text-h3` 14 / legacy `--text-h4` 16 |
| `text-lg` (18) | 18 ✓ | `--text-lg` **16** ✗ | `--text-h2` 18 |
| `text-xl` (20) | 20 ✓ | `--text-xl` **17** ✗ | — |
| `text-2xl` (24) | 24 ✓ | `--text-2xl` **18** ✗ | — |

**Implication:** the Layer-1 raw size primitives were misleading (they promise values the app never renders) and are now **RETIRED** (T-1, render-neutral — zero consumers) via U-2 Phase A (D-132). Wiring them in would have been render-AFFECTING (shifts every `text-sm`/`text-base`/…; T-7 rejected). The permanent scale (spec §2) is defined from **what actually renders**, with canonical semantic roles on top (T-3/4/5 certified).

### 4-C. Responsive scaling

| Token | XS <480 | SM 480 | MD 768 | LG 1024 | XL 1440 |
|---|---|---|---|---|---|
| `--text-display` | 28 | 32 | 36 | 40 | 48 |
| `--text-h1` | 22 | 22 | 26 | 30 | 30 |
| `--text-h2` | 18 | 18 | 20 | 20 | 20 |
| `--text-h3` | 14 | 14 | 15 | 15 | 15 |
| `--text-body` | 13 | 13 | 14 | 14 | 14 |
| `--text-caption` | 11 | 11 | 12 | 12 | 13 |
| `--text-label` | 10 | 10 | 10 | 10 | 10 |
| `--text-stat-value` | 28 | 28 | 32 | 36 | 36 |
| `--text-badge` | 9 | 9 | 10 | 10 | 10 |

Responsive by construction: primitives read `var(--text-*)` (media-query `:root` overrides in `index.css:486-538` win the cascade). Raw arbitrary px **do not** scale — a readability gap at large breakpoints. **Decision point:** the permanent scale (§spec) adopts these responsive tiers; raw sizes are mapped to tiers so pages inherit responsive growth.

### 4-D. Token decisions (for gate approval)

| # | Decision | Value impact | Class |
|---|---|---|---|
| T-1 | Retire Layer-1 raw size primitives `--text-3xs…10xl` + dead `--font-size-caption`/`--font-weight-caption` | none (zero consumers) | ✅ **RETIRED (U-2 Phase A, D-132)** |
| T-2 | Retire legacy utilities `text-overline/sub-1/sub-2/body-1/body-2/button/h4/h5/h6` | none (zero consumers) | ✅ **RETIRED (U-2 Phase A, D-132)** — `:root` `--text-h4/h5/h6` vars kept for global element rules |
| T-3 | Add canonical **Metadata** tier `--text-metadata: 0.75rem` (12px) — absorbs `text-xs` (156 uses) | 12px = 12px rendered | ✅ **ADDED (U-2 Phase A, D-132)** — render-neutral |
| T-4 | Add canonical **Small/Cell** tier `--text-small: 0.875rem` (14px) — absorbs `text-sm` (79 uses) | 14px = 14px rendered | ✅ **ADDED (U-2 Phase A, D-132)** — render-neutral |
| T-5 | Add canonical **Title** tier `--text-title: 1rem` (16px) — absorbs `text-base` (16 uses) | 16px = 16px rendered | ✅ **ADDED (U-2 Phase A, D-132)** — render-neutral; **token renamed to `--text-heading`** (color-token collision with pre-existing `--text-title`, see §4-D note) |
| T-6 | Micro tier `--text-micro: 0.5rem` (8px, 15 uses) | 8px = 8px, but **a11y concern** (§9) | ⏸ **GATED** — requires separate approval |
| T-7 | Wire Layer-1 raw primitives into `@theme` so `text-sm`=13px etc. | shifts every text-sm/base/lg… use | ❌ **REJECT** (render-affecting; spec §2 defines values instead) |
| T-8 | Map raw `text-2xl`(24)/`3xl`(30)/`4xl`(36)/`5xl`(48) to Display/H1 responsive tiers | 24/30/36/48 vs tiers 22-30/28-48 | render-AFFECTING → deferred per-page with sign-off |

**§4-D note (T-5 rename):** the approved token name `--text-title` collides with the pre-existing
**color token** `--text-title` (`themes.css`: light `#F9FAFB`, dark `#0A0503`, consumed by
`--color-text-title` + ~20 `text-text-title` usages). The 16px tier is certified as
**`--text-heading`** (`AdminText size="heading"`) — collision-free, render-neutral (D-132).

---

## 5. Primitive Audit (Step 5)

| Primitive | Verdict | Rationale |
|---|---|---|
| `H1` `H2` `H3` | ✅ REUSE | Single owner, token-driven, responsive, wide adoption |
| `Body` | ✅ REUSE | Most-used primitive; `secondary` flag covers text-secondary |
| `Label` | ✅ REUSE (+REFINE) | Already encodes 10px/700/uppercase/`--ls-label` — the exact pattern of the dominant raw usage (10px bold uppercase widest). Gaps: no `micro` size, no `error` only (present). Absorb `text-[10px]` patterns |
| `Display` | ✅ REUSE — **underused** | Only Login/Signup. Should absorb 40/48px hero sizes and stat heroes |
| `Caption` | ✅ REUSE — **underused** | Only CollectionCard. Should absorb 11px metadata/secondary patterns |
| `Badge` token | ✅ REUSE | `--text-badge` 9px/700/uppercase/`--ls-badge` 0.05em matches the 9px pattern (ls differs from `tracking-widest` by 0.8px — keep verbatim className to stay byte-identical) |
| `BrandTitle` | ✅ REUSE | Brand-only; already carries arbitrary `size` |
| `AdminText` | ✅ REUSE (Layer 2) | Absorbs Admin serif/sans + stat-value; **REFINE**: add `size` values for Metadata/Small/Title (T-3/4/5) so page sizes are props, not raw className |
| `AdminPageTitle` | ⚠️ RETIRE-as-typography | Title-only wrapper; either route through `H2`/`AdminText` or formalize as layout (not typography) |
| `PageHeader` | ⚠️ REFINE | Raw `<h1>` inside; convert to `H1` internally (render-neutral) |
| `SectionHeader` | ✅ REUSE (Layer 2) | Already consumes `AdminText` |
| Legacy `text-h4/h5/h6`, `overline`, `sub-*`, `body-1/2`, `button` | 🗑 RETIRE | zero consumers (T-2) |
| `--font-size-caption` | 🗑 RETIRE | dead + inconsistent (T-1) |

---

## 6. Foundation Opportunity Register (Step 6)

For every duplicated typography implementation: **reuse** if an existing primitive solves it; **refine** if the primitive needs a render-neutral extension; **new primitive only if absolutely necessary**.

| # | Pattern (current) | ~Count | Existing primitive? | Action |
|---|---|---|---|---|
| F-1 | `text-[10px] font-bold uppercase tracking-widest` (label/badge strip) | ≈90 | `Label` — 10px, `--fw-label` 700, `--tt-label` uppercase, `--ls-label` 0.1em (=`tracking-widest`) | ✅ REUSE — verbatim transfer onto `Label` (byte-identical) |
| F-2 | `text-[9px] … uppercase tracking-widest font-bold` | ≈39 | `Badge` token 9px/700/uppercase; `--ls-badge` 0.05em vs widest 0.1em | ✅ REUSE — keep verbatim `tracking-widest` className (byte-identical) or drop if `--ls-badge` accepted (visual delta → gate) |
| F-3 | `text-[11px] … text-text-muted/secondary` (metadata) | ≈60 | `Caption` — 11px/500/`text-secondary` | ✅ REUSE — verbatim className (uppercase/weight overrides ride along) |
| F-4 | `text-[13px]` reading text | ≈17 | `Body` — 13px | ✅ REUSE |
| F-5 | `text-xs` (12px) table/meta/helper | ≈156 | none (canonical gap) | 🔧 REFINE — `Metadata` tier (T-3) on `Body`/`AdminText`/`Label` |
| F-6 | `text-sm` (14px) table/body/cell | ≈79 | none (gap) | 🔧 REFINE — `Small/Cell` tier (T-4) |
| F-7 | `text-base` (16px) | ≈16 | none (gap) | 🔧 REFINE — `Title` tier (T-5) |
| F-8 | `text-[14px]` (19 uses, often stat/emphasis) | ≈19 | `--text-h3` 14px / stat tokens | ✅ REUSE — `H3` size or `stat-value` styling verbatim |
| F-9 | `font-cinzel`/`font-garamond` (user module) | 14 | Layer-1 brand serif (global classes) | ✅ REUSE — keep as Layer-1 brand; Admin already routes through `AdminText` |
| F-10 | `font-mono` on `<code>`/JSON | 27 | `--font-mono` | ✅ REUSE — document as code convention (no new primitive) |
| F-11 | Inline `style={{ fontSize }}` (sub-admin/create) | ≈40 | primitives/tokens | 🔧 REFINE — fold into tokens per page gate |
| F-12 | `text-2xl/3xl/4xl/5xl` hero/stat sizes | ≈27 | `Display`/`H1`/`stat-value` tiers | 🔧 REFINE — map to responsive tiers (render-affecting → per-page gate with sign-off) |
| F-13 | Raw `<h1>–<h6>` elements | 29 | `H1..H3` + sr-only pattern | ✅ REUSE — per-page gates (already the certified pattern) |

**No new primitive is needed.** Every pattern resolves onto an existing primitive with at most a render-neutral canonical token extension (T-3/4/5). This satisfies "create new primitives only if absolutely necessary."

---

## 9. Accessibility Audit (Step 9)

| Criterion | Finding | Verdict |
|---|---|---|
| Heading hierarchy | Admin pages ✅ (sr-only `<H1>` + `AdminText as="h1..h4"`); **⚠️ `as="h4"`** in `UploadContextPanel`/`RecentExamItem` may skip levels if no h2/h3 precedes; exam/sub-admin flows use raw headings (semantically OK but not primitive-routed) | ⚠️ Watch — page gates verify per-page order |
| Semantic elements | `AdminText as=` preserves semantics; raw `<p>/<span>` with role text OK | ✅ |
| Contrast | `text-text-muted`/`hint` used at 10-11px: small sizes reduce legibility; **`text-[8px]` (15 uses) is below comfortable minimum** — a11y review item (T-6) | ⚠️ |
| Responsive readability | Canonical tokens scale by breakpoint (4-C); raw arbitrary px and `text-sm`/`xs` do **not** scale at LG/XL — mapping to tiers (T-3/4/5) improves large-screen readability | ✅ improvement via U-2 |
| Zoom behaviour | All sizes are `rem`/`px` → browser zoom scales both; no fixed `em`-breaking layout detected | ✅ |
| Screen-reader compatibility | Primitive headings carry real element semantics; decorative icons `aria-hidden` (U-12); `Badge` text is real text | ✅ |

---

## 10. Visual Delta Analysis (Step 10)

**Render-neutral (proceed automatically after approval):**
- Verbatim className transfer onto Layer-1/Layer-2 primitives (the certified U-3 pattern — byte-identical by construction).
- RETIRE dead tokens/utilities: T-1, T-2 (zero consumers).
- NEW canonical tokens T-3/4/5 with values identical to current rendered px (12/14/16) — utilities resolved to the same pixels.
- Removing the inert `text-[8px]` on `AdminUsersView.tsx:57` (overridden by inline `--text-label`).

**Render-affecting (separate gate + sign-off):**
- Mapping any size to a **different** pixel value (e.g. 24/30/36/48 → responsive tiers; 8px → badge 9px; 13px → 12px Metadata).
- Dropping `tracking-widest` for `--ls-badge`/`--ls-label` defaults where they differ.
- Wiring Layer-1 raw primitives into `@theme` (T-7).
- Adding `uppercase`/weight into primitive defaults (would change existing raw usages that don't apply it).

**Rule:** the page gate may ship render-neutral work automatically; every render-affecting item ships only with an explicit per-item approval (pixel before/after documented, matching the U-1…U-5 precedent).

---

## 11. Foundation Impact (Step 11)

**Admin Users (this phase):**
- Current: adoption **18/22 (82%)**, 0 page-owned plain-element typography, 7 raw typography nodes → 0 (U-3), remaining raw sizes are **className on `AdminText`/`Label`** (12/14/16px) + inert `text-[8px]`.
- **U-2 Phase A (delivered, D-132):** page typography **100% token/primitive** — sizes are `size` props (Metadata/Small/Heading via T-3/4/5), inert `text-[8px]` removed, **0 arbitrary raw sizes** on the page. Adoption metric unchanged by tokens (primitives already consumed); **page typography completeness → 100%**.

**Repository-wide (future page gates):**
- Pages benefiting: all Admin (9 remaining), Sub-Admin, User, Exam, Auth, Profile, Layouts — every page migrates to the certified language without redefining typography.
- Components benefiting: Foundation-internal raw wave (2-C); `Display`/`Caption` adoption rises from underused.
- Primitives affected: `Label`/`Caption`/`Body`/`AdminText` gain size tiers (T-3/4/5) — additive, render-neutral; `AdminPageTitle`/`PageHeader` rationalized (§5); **no existing consumer re-certification** (additive only).
- Typography language: **permanent** — after this certification no page invents typography (§3 rules).

---

## 12. Verification method & status

- **Data:** `rg`/Node-verified raw-utility counts over `src/**/*.tsx` (test files excluded); primitives inventory over all consumers; token definitions read from `themes.css` / `index.css` / `@theme`.
- **Build checks (Phase A delivered):** `npx tsc -b` exit 0 · `npm run build` exit 0 · `npm run lint` 405 problems (352E/53W) — frozen baseline, zero new findings.
- **Status:** ✅ **Phase A implemented + certified (D-132)** — canonical tokens T-3/4/5 added, T-1/T-2 retired, Admin Users is the first consumer (0 raw page sizes). Phase B (T-6, T-7) remains gated → `ADMIN_USERS_U2_IMPLEMENTATION_PLAN.md` §3, `ADMIN_USERS_U2_CERTIFICATION.md`.
