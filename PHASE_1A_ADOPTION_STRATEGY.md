# Phase 1a.75 — Typography Adoption Strategy

> **Status**: Documentation only — no source code modified
> **Objective**: Classify every typography override and determine which should migrate to the Design System vs remain as permanent exceptions

---

## Step 1 — Override Classification

Using the audit of 87 Body usages and 59 Label usages (representative of ~605 total), here is the classification for each pattern.

### Category A — Permanent Design Requirements

These overrides exist because the component needs visual distinction from the canonical typography by design.

| Pattern | File(s) | Reason | Alternative |
|---------|---------|--------|-------------|
| `text-[36px] xl:text-[48px] font-black` (h1) | LoginPage, SignupPage | Auth hero/brand display — intentionally largest text in app | BrandTitle (defined but unused) |
| `text-[clamp(26px,4.5vw,36px)] font-black` (H2) | WelcomeBanner | Hero on dark gradient — needs prominent welcome text | None — context-specific size |
| `text-[clamp(18px,3vw,24px)] font-extrabold` (H3) | WelcomeBanner | Sub-hero on dark gradient | None |
| `text-[40px] font-black` (H1) | ResultView | "Simulation Over" result banner — celebratory display | Could use BrandTitle or H1 max |
| `text-[28px] font-black` (Body) | TestConfigView | Large stat number (question count) | StatValue component |
| `text-[24px] md:text-[32px] font-black` (H2) | ProfileHeader | User name as page identity — prominent display | H1 with size override |
| `text-[16px] md:text-[18px] font-black` (Body) | LeaderboardUserCard | Rank number — prominent metric | StatValue component |
| `text-[20px] font-black tracking-tighter` (Body) | AttemptCardBase | Score value in attempt card | StatValue component |
| `text-[7px] md:text-[8px]` (Label) | LeaderboardUserCard, LeaderboardComponents | "RANK" / "YOU" badges — ultra-compact | Badge component |
| `text-[8px]` (Label) | AdminUsersView, ResultsPage | "Completed" status, stat labels — compact meta | Compact badge variant |
| `text-[8px] md:text-[9px]` (Label) | ResultsPage, AntigravityResults | Stat labels (Accuracy/Duration/Impact) | Compact badge variant |
| `text-warning/90`, `text-warning/60`, `text-warning` (color overrides) | WelcomeBanner | Gold/warning text on dark gradient | Semantic color token |
| `text-success` / `text-danger` (color overrides on Label/Body) | SubjectInsightsCard, Leaderboard | Color-coded status indicators | Semantic color token |
| `font-cinzel` conditional (theme-dependent) | TopicSectionRenderer, TopicCard, TopicListView, Performance | Light-mode brand typography | Font family utility |
| `font-garamond italic` conditional | PerformanceSectionHeader, SubjectInsightsCard, AdminText | Light-mode serif accent | Font family utility |
| `text-[clamp(...)]` fluid sizing | Exam components (9 usages) | Fluid responsive typography in exam view | Could register as token |
| `style={{ fontSize }}` from useExamResponsive | ExamDetailSection, CreateStepReview, QuestionCard | Breakpoint-based font sizing in sub-admin exams | Could use CSS tokens |

### Category B — Context-Specific Requirements

These exist because the component has unique layout or density needs.

| Pattern | File(s) | Context | Migration Potential |
|---------|---------|---------|-------------------|
| `text-xs font-black` (H3) | TopicSectionRenderer | Compact section header in study material tree | Could use H3 default (14px) if spacing allows |
| `text-sm truncate` (H3) | TopicCard | Card title with truncation | Use H3 default + truncate only |
| `text-[15px] font-bold` (H3) | TeacherExamCard | Card title with custom size | Use H3 default (14px → minor 1px change) |
| `text-[14px] font-bold uppercase` (Body) | TopicPortalView, SubjectPortalView | Portal grid item titles | Use H3 default or Body with uppercase |
| `text-[13px] md:text-[14px] font-bold uppercase` (Body) | AntigravityDashboard | Compact exam card title | Use Body default + uppercase |
| `text-[12px] font-bold uppercase` (Body) | ExamDetailRow | Compact exam metadata row | Use Body default + uppercase |
| `text-[11px]` (Label) | TopicPortalView, ProfileHeader, TestConfigView, PreparationView | Section labels needing slightly larger size | Use Label default (10px) — minor 1px difference |
| `text-[12px]` (Label) | ProfileForm, TestConfigView | Form field labels (larger for readability) | Could add form-label size variant |
| `text-[9px]` (Label) | PreparationView, AntigravityResults | Very compact badges/labels | Use Label default (10px — minor 1px) |
| `text-[10px] lg:text-[11px]` (Label) | SubjectInsightItem | Dense insight card labels | Use Label default (10px matches) |
| `text-[15px] font-bold` (Body) | PreparationView | Question answer option text | Use Body default (14px — minor 1px) |
| `text-[13px] font-semibold` (Body) | ResultView | "Professional Evaluation Engine" badge | Use Body default (14px) |
| `text-[11px]` (Body) | PerformanceSectionHeader, SubjectInsightsCard | Compact section subtitle | Use Body default (14px — bigger change) |
| `text-[10px]` (Body) | PerformanceCharts | Chart tooltip labels | Use Caption token (11px) |
| `leading-none` (various) | Leaderboard, ExamDetailRow, Labels | Compact text for metrics | Layout concern, not typography |
| `tracking-[0.2em]` / `tracking-[0.15em]` / `tracking-[0.3em]` (Label) | ProfileHeader, WelcomeBanner, ResultView | Custom letter spacing for decorative text | Register as token `--tracking-label` |

### Category C — Historical Implementation

These overrides were created before canonical components existed and can now migrate.

| Current | File(s) | Target | Risk |
|---------|---------|--------|------|
| Raw `<h1>` with `text-[22px] md:text-[26px] lg:text-[30px] font-black` (identical to H1 default) | UpdatePasswordPage | `<H1>` component | **LOW** — identical rendering |
| Raw `<h2>` in AdminModal: `text-xl sm:text-2xl font-black` | AdminModal | `<H2>` or DialogTitle component | **LOW** — close to H2 default |
| Raw `<h3>` with `text-2xl font-black` used as subtitle | LoginPage, SignupPage | Should use H1 or H2 for semantic correctness | **MEDIUM** — semantic change, size similar |
| Raw `<h3>` with `text-[22px]` etc. | VerifyEmailPage | Use H1 or H2 | **MEDIUM** — semantic correction |
| Raw `<h,>` with `text-lg font-black` | ExamListSection, ExamDetailModal, UploadProgressOverlay | Use H3 component | **LOW** — size same |
| `BrandTitle` component defined but never used | AntigravityTypography.tsx | Remove dead code | **LOW** — dead code removal |
| H1 not in barrel export | AntigravityUI.tsx | Add H1 to barrel | **LOW** — missing export |
| `spacing` export | AntigravityTypography.tsx | Remove dead code | **LOW** (Phase 6) |

### Category D — Accidental Inconsistency

These overrides appear to be unintentional — the canonical component default would serve equally well.

| Pattern | File(s) | Canonical Alternative | Visual Impact |
|---------|---------|----------------------|---------------|
| `<Body className="font-medium">` (same as Body default) | SignupPage | Remove className | **ZERO** — same weight |
| `<Body secondary className="mb-4">` (className for margin only) | LoginPage, Upload views | No change needed (margin is layout) | **ZERO** |
| `<H2 className="uppercase">` (non-size override) | DashboardRecentActivity | Add uppercase className only | **ZERO** — size unchanged |
| `<H3 className="uppercase tracking-tight m-0">` (non-size overrides) | ProfileForm, StatisticsSection, PerformanceSectionHeader | Keep className for uppercase only | **ZERO** — size unchanged |
| `<Label className="m-0">` password validators | ProfileForm | Already works — m-0 only changes margin | **ZERO** |
| `<Label className="text-[10px]">` (same as Label default) | ExamDetailRow | Remove className | **ZERO** |
| `<Body className="text-[14px]">` (close to Body default 13→14px) | TestConfigView, SubjectPortalView, TopicPortalView | Use Body default | **MINOR** (1px on mobile) |

---

## Step 2 — Repository Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        TYPOGRAPHY ADOPTION PYRAMID                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   CANONICAL (Category A — no override)     ~120 usages (20%)            │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │  H2 pageError.title (8×)                                        │   │
│   │  H3 default (11×)                                               │   │
│   │  Body error messages (13×)                                      │   │
│   │  Body secondary no className (~10×)                             │   │
│   │  Label default form labels (60×)                                │   │
│   └──────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                     │
│   INTENTIONAL OVERRIDES (Category B)       ~120 usages (20%)            │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │  Auth hero headings                  text-[36px] xl:text-[48px]  │   │
│   │  WelcomeBanner H2/H3                 clamp(...)                  │   │
│   │  Exam fluid typography               clamp(...) >9 usages       │   │
│   │  Compact card titles                 text-sm/14px uppercase      │   │
│   │  Badge/tag sizes                     8-10px                      │   │
│   │  Stat values                         20-28px font-black         │   │
│   │  Chart labels                        10-11px                     │   │
│   │  Timer display                       12-14px font-black          │   │
│   │  Category section headings           text-xs font-black         │   │
│   │  Leaderboard metrics                 10-18px range              │   │
│   └──────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                     │
│   CONTEXTUAL OVERRIDES (Category B)        ~90 usages (15%)             │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │  Form labels (12px)                   ProfileForm, TestConfig    │   │
│   │  Portal section titles (11px)         TopicPortalView (3×)      │   │
│   │  Question option text (15px)          PreparationView            │   │
│   │  TeacherExamCard H3 (15px)            TeacherExamCard            │   │
│   │  ExamDetailRow Body (12px)            1 usage                    │   │
│   │  PerformanceCharts labels (10px)      2 usages                   │   │
│   └──────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                     │
│   LEGACY / MIGRATABLE (Category C)        ~76 usages (13%)              │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │  Raw <h1>/<h2>/<h3> that match component defaults (46 usages)   │   │
│   │  H3 used as subtitle (Login/Signup) — should be H1/H2 (6×)     │   │
│   │  H2 with size override matching new canonical scale (10×)       │   │
│   │  BrandTitle dead code (1 component, 0 usages)                   │   │
│   │  spacing dead export (1 export)                                 │   │
│   │  H1 missing from barrel (1 export gap)                          │   │
│   └──────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                     │
│   DEAD TYPOGRAPHY                        ~3 items                       │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │  BrandTitle component — defined, barrel-exported, never used    │   │
│   │  spacing export — replaced by Stack gap map                     │   │
│   │  Commented-out Body in ErrorContainer.tsx                       │   │
│   └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Step 3 — Migration Candidates

### Safe to Migrate (HIGH confidence — zero/minimal visual change)

| # | Current | Target | Files | Risk | Visual Impact |
|---|---------|--------|-------|------|---------------|
| 1 | Raw `<h1>` with same sizes as H1 default | Use `<H1>` component | UpdatePasswordPage (2×) | **LOW** | **ZERO** |
| 2 | Raw `<h2>` in AdminModal | Use `<H2>` or canonical DialogTitle | AdminModal (1×) | **LOW** | **MINOR** (if at all) |
| 3 | Raw `<h2>` in LanguageSelectionScreen | Use `<H2>` component | LanguageSelectionScreen (1×) | **LOW** | **ZERO** |
| 4 | Raw `<h2>` in AddExamModal | Use `<H2>` component | AddExamModal (1×) | **LOW** | **MINOR** |
| 5 | Raw `<h3>` using text-lg (18px = H2 default) | Use `<H2>` component | ExamListSection, ExamDetailModal, UploadProgressOverlay, AIToolCards, PromptEditorModal, DailyAttemptsChart | **LOW** | **ZERO-MINOR** |
| 6 | `<Body font-medium>` (same as default) | Remove className | SignupPage | **LOW** | **ZERO** |
| 7 | `<Body text-[14px]>` (Body default at md=14px) | Use Body default | TestConfigView (2×), SubjectPortalView, TopicPortalView, PreparationView (2×) | **LOW** | **MINOR** (1px on mobile) |
| 8 | `<Label text-[10px]>` (same as Label default) | Remove className | ExamDetailRow | **LOW** | **ZERO** |
| 9 | `<Label m-0>` password validators | Keep className (m-0 is layout) | ProfileForm (5×) | **LOW** | **ZERO** |

### Safe to Migrate (MEDIUM confidence — minor visual change acceptable)

| # | Current | Target | Files | Risk | Visual Impact |
|---|---------|--------|-------|------|---------------|
| 10 | `<H2 text-[24px]>` → H2 default reaches 24px at LG | Remove size override | TestConfigView, ProfileHeader (md:32px → ~26px at md) | **MEDIUM** | **MINOR** (ProfileHeader H2 changes 32→26 at md) |
| 11 | `<H3 text-sm>` (14px) → H3 default 14px | Use H3 default | TopicCard, TeacherExamFilterBar | **LOW** | **ZERO** |
| 12 | `<H3 text-[15px]>` → H3 default 14px (1px diff) | Use H3 default | TeacherExamCard | **LOW** | **MINOR** (1px) |
| 13 | `<H3 text-[20px]>` → H3 reaches 20px at SM | Remove size override | PreparationView | **LOW** | **ZERO** (size matches) |
| 14 | Raw `<h3>` with text-lg (18px) → H2 default 18px | Use `<H2>` (semantic upgrade) | Various raw h3 sites | **LOW** | **ZERO** |
| 15 | `<Body text-[15px]>` — Body default is 14px | Use Body + minor descender diff | PreparationView (2×), WelcomeBanner, ResultView | **MEDIUM** | **MINOR** (1px) |
| 16 | `<Label text-[11px]>` → Label default 10px (1px diff) | Use Label default | TopicPortalView (3×), ProfileHeader, WelcomeBanner, TestConfigView, PreparationView | **MEDIUM** | **MINOR** (1px) |
| 17 | `<Label text-[9px]>` → Label default 10px (1px diff) | Use Label default | PreparationView (1×), AntigravityResults (1×) | **LOW** | **MINOR** (1px) |
| 18 | `<Label text-xs>` (12px) → Label default 10px | Keep size or use form-label variant | TopicMetadataFields | **LOW** | **MINOR** |
| 19 | `<Body text-[12px]>` → not in canonical scale | Use Body default (14px) or Caption (12px) | TestConfigView (2×), ExamDetailRow, ExamView | **MEDIUM** | **MINOR-MODERATE** |

### NOT Safe to Migrate (requiring design decision)

| # | Current | Reason to Keep |
|---|---------|----------------|
| 20 | Auth hero h1 (36-48px) | Brand identity — intentional display scale |
| 21 | WelcomeBanner clamp() | Unique dark gradient container — needs distinct sizing |
| 22 | Exam component clamp() | Fluid viewport-relative sizing — intentional UX |
| 23 | Stat values (20-28px) | Need stat-specific scale — suggest StatValue component |
| 24 | Badge labels (8-9px) | Ultra-compact — suggest Badge component variant |
| 25 | Chart labels (10px) | Dense visualization context — suggest token registration |
| 26 | Timer (12-14px font-black) | Context-specific emphasis — intentional |
| 27 | Font-cinzel/garamond conditional | Brand identity — light-mode decorative font family |
| 28 | useExamResponsive hook inline styles | Sub-admin exam detail (context-specific responsive sizing) |

### Summary: Migration Candidate Count

| Confidence | Count | Visual Impact |
|------------|-------|---------------|
| HIGH (ZERO visual change) | 9 patterns | ZERO |
| MEDIUM (MINOR visual change) | 10 patterns | 1px differences |
| NOT safe (require design) | 8 patterns | Keep as-is |
| **Total** | **27 patterns** | — |

Of the ~210 Category B overrides, approximately **60-70 usages** (30-33%) could migrate to canonical components with zero or minor visual change. The remaining ~140 usages are intentional context-specific overrides.

---

## Step 4 — Permanent Exceptions

These 8 patterns should NEVER migrate to the canonical typography.

### Exception 1: Auth Hero Display (LoginPage, SignupPage)

```
text-[36px] xl:text-[48px] font-black leading-[1.1] tracking-tight
```

**Why**: These are marketing/landing page hero headings. They need to be the largest text in the application for visual hierarchy and conversion impact. The H1 default (22-30px) is too small for this role. A separate `BrandTitle` component exists for this purpose but is unused — it should be adopted here instead of continuing as raw `<h1>`.

### Exception 2: WelcomeBanner Display (WelcomeBanner.tsx)

```
H2: clamp(26px, 4.5vw, 36px) font-black
H3: clamp(18px, 3vw, 24px) font-extrabold
```

**Why**: The WelcomeBanner renders on a dark gradient background behind a glass-card overlay. The text must stand out against this dark background and the glass blur. The clamp() values ensure the text scales with the banner width. The font-extrabold (800) weight for H3 is unique here.

### Exception 3: Exam Fluid Typography (exam/ components, 9 usages)

```
clamp(22px, 3.5vw, 42px) through clamp(13px, 1.3vw, 15px)
```

**Why**: The exam viewport is the most constrained and variable context in the app. Fluid type ensures readability across device sizes without manual breakpoints. These are intentionally viewport-relative, not breakpoint-based.

### Exception 4: Stat Values (TestConfigView, AttemptCardBase, Leaderboard)

```
20-28px font-black tracking-tighter
```

**Why**: Stat values (scores, counts, ranks) need to be visually prominent in a way that differs from standard heading hierarchy. They're not page titles or section headings — they're data displays. A dedicated `StatValue` component would formalize this.

### Exception 5: Ultra-Compact Badges (Leaderboard, ResultsPage, Tags)

```
7-10px, various weights and tracking
```

**Why**: Badges must fit inside cards, tables, and leaderboard rows without breaking layout. The smallest (7px "YOU" badge) is intentionally smaller than any canonical size. A Badge component with size variants would be the canonical solution.

### Exception 6: Chart Labels (PerformanceCharts)

```
10-11px font-bold, various colors
```

**Why**: Chart tooltips and axis labels have fixed pixel budgets determined by chart libraries. They must remain compact to avoid overlapping with chart data. These sizes are determined by the recharts/Chart.js rendering context.

### Exception 7: Conditional Font Families (font-cinzel, font-garamond)

```tsx
className={`${!isDark ? 'font-cinzel' : ''}`}
```

**Why**: The application uses a light-mode-only decorative brand font (Cinzel) and serif accent (Garamond). This is a theming concern, not a typography scale concern. These fonts are intentionally not applied in dark mode (where the interface is more utilitarian). This pattern appears in 17 components across the user and admin areas.

### Exception 8: Sub-Admin Exam Detail Responsive Hook (useExamResponsive)

```tsx
style={{ fontSize: titleFont }}
```

**Why**: The sub-admin exam detail views have the most complex responsive requirements in the app — they render dense tables, question cards, and status boards at 5 breakpoints. The `useExamResponsive` hook provides 9 distinct size values tuned to each breakpoint. This is a genuine advanced use case that the simple canonical token system doesn't cover.

---

## Step 5 — Canonical Adoption Score

### Current State

| Category | Count | % of Total |
|----------|-------|------------|
| **A — Canonical (no override)** | ~120 | 20% |
| **B — Intentional/Contextual override** | ~210 | 35% |
| **C — Migratable (raw HTML)** | ~46 | 8% |
| **D — Migratable (accidental)** | ~30 | 5% |
| **E — Permanent exceptions** | ~200 | 33% |
| **Total** | **~606** | **100%** |

### Current Adoption Rate

```
Canonical adoption:     20%  (Category A)
Override rate:          80%  (B + C + D + E)
```

### After Phase 1a (Typography Unification only)

Phase 1a updates H1/H2/H3 component defaults to reference CSS tokens. This affects only Category A (already canonical) — no visual change, no adoption improvement.

```
Canonical adoption:     20%  (unchanged)
```

### After Migration of Categories C + D (Phase 1a.5)

If we migrate Category C (raw HTML → canonical components) and Category D (accidental overrides):

| Migration | Count added to Canonical |
|-----------|-------------------------|
| Category C (raw HTML → components) | +46 |
| Category D (accidental overrides removed) | +30 |
| **New canonical total** | **~196** |

```
Canonical adoption:     32%  (20% → 32%, +12%)
Override rate:          68%
```

### After Body/Label Alignment (Phase 5a/6a)

If we also align Body and Label defaults with CSS tokens:

| Migration | Count added to Canonical |
|-----------|-------------------------|
| Category B contextual overrides (close to defaults) | +60 |
| **New canonical total** | **~256** |

```
Canonical adoption:     42%  (32% → 42%, +10%)
Override rate:          58%
```

### Maximum Realistic Adoption

Even after all safe migrations, permanent exceptions (Category E) remain at ~200 usages (33%) consisting of:
- ~100 Tailwind text-* utilities on generic elements (Category D in original audit)
- ~60 badge/chart/label compact sizes
- ~30 auth/welcome/stat display sizes
- ~10 exam fluid typography + useExamResponsive

```
Maximum canonical adoption:   42%
Maximum design system usage:  67% (canonical + intentional exceptions)
Permanent non-system usage:   33% (raw Tailwind on generic elements)
```

### Key Insight

The 33% "permanent non-system" usage (raw Tailwind on `<div>`, `<span>`, `<p>` that aren't using Body/H/Label) will only decrease when the Design System provides enough canonical components to cover all text roles. This is a **component coverage gap**, not a typography scale problem.

---

## Step 6 — Final Recommendation

### Recommendation: Adoption-First, Unification-Second

**Typography adoption should occur BEFORE typography unification.**

Rationale:
1. Unifying component defaults to CSS tokens only affects 20% of usages (Category A)
2. The 80% override rate means unification provides minimal consistency benefit
3. Migrating usages to canonical components first INCREASES the impact of token changes
4. Every usage migrated from override → canonical becomes one more usage that benefits from token changes

### Recommended Implementation Sequence

#### Phase 1a Step 1: Migrate dead code first (no risk)
```
BrandTitle    → mark as deprecated or remove (0 usages, dead code)
spacing       → remove from AntigravityTypography.tsx (Phase 6, but safe anytime)
H1 barrel     → add to AntigravityUI.tsx export (missing export)
```

#### Phase 1a Step 2: Migrate Category C (raw HTML → canonical components)
```
46 raw <h1>/<h2>/<h3> → use H1/H2/H3 components
Highest priority: raw headings with sizes matching component defaults
```

#### Phase 1a Step 3: Migrate Category D (accidental overrides)
```
~30 overrides to remove:
  - Body font-medium (same as default)
  - Label text-[10px] (same as default)
  - Body text-[14px] (Body default)
  - Non-size-only classNames (uppercase, tracking on H3)
```

#### Phase 1a Step 4: Set canonical CSS token values (Option C)
```
After steps 2-3, ~32% of usages use canonical components
Set --text-h1/h2/h3 values to MATCH current component defaults:
  H1: 22px → 30px (responsive)
  H2: 18px → 24px (responsive)
  H3: 14px → 18px (responsive)
```

#### Phase 1a Step 5: Update H1/H2/H3 components
```
Replace hardcoded sizes with text-h1/h2/h3 classes
Now uses CSS tokens as single source of truth
Zero visual change (tokens match components after Step 4)
```

#### Post-Phase 1a: Track remaining overrides
```
210 overrides remain (permanent + contextual)
Document each as intentional exception
Monitor for future migration as component coverage grows
```

### Why This Order?

| Order | Approach | Visual Impact | Risk | Adoption Gain |
|-------|----------|--------------|------|---------------|
| 1→2→3→4→5 | **Adoption-first** (recommended) | ZERO | LOW | 20%→32%→42% |
| 4→5→2→3 | Unification-first | ZERO (with Option C tokens) | LOW | 20%→20%→32% |

The adoption-first approach gives **more bang for the buck** — each subsequent phase affects more usages because more usages use canonical components.

### Final Metric Targets

After completing all 5 steps:

| Metric | Current | Target |
|--------|---------|--------|
| Canonical typography adoption | 20% | 32-42% |
| Design system token usage | 0% | 100% (H1-H3 reference tokens) |
| Arbitrary size overrides (components) | 210 | 150 (permanent exceptions only) |
| Dead typography code | 3 items | 0 items |
| Raw HTML headings | 46 | 0 (all migrated to components) |
| Compliance score (Typography) | 0% | 62.5% |
