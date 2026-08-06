# Phase 1a Step 4.5 — Typography Semantic Model

**Status**: Pre-implementation governance document
**Authority**: Design System architecture
**Scope**: Permanent semantic hierarchy — no source code changes

---

## Part 1 — Typography Hierarchy

### Display

**Purpose**: The largest typography level — reserved for hero/brand statements that must dominate the viewport. Communicates prestige, celebration, or identity.

**Primary usage**: Login/Signup hero headings, celebratory success banners, Performance Report titles.

**Secondary usage**: Stat values that need extreme emphasis (e.g. Rank #1 in LeaderboardTopCard), feature callouts on marketing-oriented pages.

**When NOT to use**:
- Page titles that appear inside the app chrome
- Card titles or modal headers
- Any heading that should remain visible on a single screen without scrolling

**Target pages**: LoginPage, SignupPage, ReviewLayout (Performance Report), SuccessView, UserWelcomeBanner, LeaderboardTopCard (#1 rank).

**Examples**: "Prepare for U" (LoginHero), "Performance Report" (ReviewLayout), "Mission Accomplished" (SuccessView), "#1" (LeaderboardTopCard rank).

**Replacement candidates** (patterns that should migrate to Display):
- LoginPage `<h1 className="text-[36px] xl:text-[48px]">` → Display token
- SignupPage `<h1 className="text-[36px] xl:text-[48px]">` → Display token
- ReviewLayout `<h1 className="text-[clamp(22px,3.5vw,42px)]">` → Display token
- SuccessView `<h1 className="text-4xl">` → Display token
- WelcomeBanner `<H2 className="text-[clamp(26px,4.5vw,36px)]">` → Display component
- LeaderboardTopCard rank `text-[48px] md:text-[64px]` → Display token (but rank is numeric, not text — see exception)

**Permanent exceptions**:
- LeaderboardTopCard rank — uses `font-black leading-none` at 48→64px with `text-stat-value-text`. The numeric rank is a StatValue concern, not a Display concern. Display is for text content.
- SplashPage gold gradient title — uses `font-cinzel` (brand font) with `tracking-[0.2em]` and gold gradient clip. This is a **brand artifact**, not a typography level. The Display token would strip the brand font and uppercase. This should remain as-is or become a dedicated `BrandHero` component.

---

### H1

**Purpose**: The primary page title for every authenticated app page. Communicates what page the user is on.

**Primary usage**: Page title at the top of every content page — Dashboard, Settings, Profile, Admin pages, FinishSignIn, AccountDisabled, Unauthorized.

**Secondary usage**: sr-only headings for pages where the layout communicates the page without visible text (admin pages).

**When NOT to use**:
- Hero headings that dominate the page (delegate to Display)
- Inside cards or modals (use H2)
- For non-heading content

**Target pages**: DashboardPage, SettingsPage, ProfilePage, AdminOverview, AdminQuestions, AdminSubAdmins, AdminSettings, AdminUsers, FinishSignInPage, AccountDisabledPage, Unauthorized, UpdatePasswordPage, ErrorBoundary.

**Replacement candidates** (raw `<h1>` → H1 component):
- FinishSignInPage (4x `text-2xl` h1) → H1 component. Note: These use lowercase + `tracking-tight` (H1 default). The `text-2xl` (24px) vs H1 (22→30px) means mobile gets smaller, desktop gets larger — design decision needed.
- AccountDisabledPage `text-3xl` (30px) h1 → H1 (22→30px). Mobile shrinks from 30→22px.
- Unauthorized `text-3xl` (30px) + `uppercase` h1 → H1 (22→30px, no uppercase). The `uppercase` + custom text needs design review — removing uppercase changes the severity tone.
- ErrorBoundary `text-2xl font-cinzel font-bold` h1 → H1. Loses `font-cinzel` brand font. Design decision needed.

**Permanent exceptions**:
- ExamHeader `<h1 style="font-size: clamp(13px,1.3vw,15px)">` — compact exam UI. Tiny heading is intentional for the exam-taking UX where screen real estate is precious.
- ReviewLayout `<h1 style="font-size: clamp(22px,3.5vw,42px)">` — this is a Display-level heading, not a page title.
- SuccessView `<h1 className="text-4xl">` — celebratory, Display-level.
- AntigravityLayout SectionHeader — already a component (not raw heading).

---

### H2

**Purpose**: Section titles within a page — names the major content blocks below the page title.

**Primary usage**: Card titles, modal headers, major sections within a page (e.g. "Quick Stats", "Recent Activity", "Configuration").

**Secondary usage**: Section subtitles, group labels for form sections.

**When NOT to use**:
- For page titles (use H1)
- For subsections within a subsection (use H3)
- For labels that should be uppercase + tracking-widest (use Label)

**Target pages**: All page sections, all modal headers, all card headers, all form section headers.

**Replacement candidates** (raw `<h2>` → H2 component):
- ActiveExamPage `<h2 className="text-2xl text-white">` — 24px white, completely custom. Inside exam UI, which is intentionally compact. Design decision needed.
- QuestionCard `<h2 className="text-[clamp(14px,1.8vw,17px)] font-semibold">` — compact exam card heading. Uses `font-semibold` instead of H2 default `font-bold`. Design decision needed.
- AdminModal `<h2 id="modal-title"...>` — uses `text-xl md:text-2xl` (20→24px), larger than H2 (18→20px). Also requires `id` prop support. Design decision + component prop addition needed.
- LanguageSelectionScreen `<h2>` — uses 13px, completely outside canon. Also requires `id` prop. Design decision needed.
- ResultsPage `<h2 className="text-3xl sm:text-[16px]...">` — completely custom sizing for exam results.
- ExamDetailSection `<h2 style>` — inline dynamic sizing.
- CreateStepReview `<h2 style>` — inline dynamic sizing.

**Permanent exceptions**:
- ExamDetailSection — dynamic inline sizing; component cannot express the responsive logic.
- CreateStepReview — same dynamic inline sizing pattern.
- AddExamModal — already migrated to H2 with overrides (`uppercase tracking-widest`).
- ExamPaperGrid — already migrated to H2 with overrides (`text-xl mb-2 tracking-normal`).

---

### H3

**Purpose**: Subsections within an H2 section — the third heading level for grouping related content.

**Primary usage**: Form section headers, filter group titles, admin panel section headers, card subtitles.

**Secondary usage**: Feature titles in tool cards.

**When NOT to use**:
- For page titles (use H1)
- For major section titles (use H2)
- For non-heading content (use Body, Label, or Caption)

**Target pages**: ProfileForm, StatisticsSection, ReviewLayout, LeaderboardTopCard, PreparationView, VerifyEmailPage, TopicSectionRenderer, StatusBoard, AIToolCards, PromptEditorModal, DailyAttemptsChart, UploadProgressOverlay, AdminTopicPreviewRenderer, QuestionForm, ExamListSection, ExamDetailModal, ResultView.

**Replacement candidates** (raw `<h3>` → H3 component):
- ReviewLayout (2x) — uses clamp (16→20px) and `text-xl` (20px), both larger than H3 (14→15px). Design decision needed — these may be Display-level.
- DailyAttemptsChart `text-lg md:text-xl` (18→20px) — larger than H3. Design decision needed.
- UploadProgressOverlay `text-lg` (18px) — larger than H3. Design decision needed.
- AdminTopicPreviewRenderer `text-base` (16px) — between Body and H3. Design decision needed.
- QuestionForm `text-lg text-amber-500` (18px) — larger + amber color. Design decision needed.
- ExamListSection `text-lg` (18px) — design decision needed.
- ExamDetailModal `text-lg` (18px) — design decision needed.
- ActiveExamPage `<h3 className="text-2xl">` (24px) — completely different scale. Design decision needed.
- QuestionCard `<h3 style>` — inline dynamic sizing.

**Permanent exceptions**:
- QuestionCard — inline dynamic sizing in admin create flow.
- StatusBoard — already migrated to H3 with explicit overrides (`text-sm font-bold uppercase`).
- AIToolCards — already migrated to H3 with overrides (`font-bold uppercase tracking-wide`).
- PromptEditorModal — already migrated to H3 with overrides (`font-bold uppercase tracking-wide`).
- TopicSectionRenderer — already uses H3.

---

### Body

**Purpose**: The primary reading text for all content. This is the "paragraph" level.

**Primary usage**: Paragraphs, descriptions, explanations, form helper text, stat values, card content.

**Secondary usage**: User names, email addresses, subtitles, metadata (though Caption is preferred for secondary data).

**When NOT to use**:
- For headings (use H1, H2, H3)
- For metadata that should be visually subordinate (use Caption)
- For form labels (use Label)
- For short uppercase labels (use Label)

**Target pages**: Every page in the application that has reading content.

**Replacement candidates**: None — Body is already a component and widely used (55+ canonical usages).

**Permanent exceptions**:
- Any usage where `className` overrides the size/weight/color. These are intentional visual modifications and should remain as overrides.
- StatCard label — uses `text-[9px] lg:text-[11px] font-bold uppercase tracking-widest`. This is a Label-like usage within StatCard's internal rendering. When StatCard becomes token-aligned, this should use the Label token.
- StatCard value — uses `text-sm sm:text-base lg:text-lg font-black`. When StatCard becomes token-aligned, this should use the StatValue token.

---

### Caption

**Purpose**: Secondary/subordinate text that should be visually smaller than Body. Communicates metadata, supplementary information, timestamps, and secondary stat labels.

**Primary usage**: Timestamps, secondary stat labels, chart metadata, helper text that is subordinate to Body text.

**Secondary usage**: Compact stat labels inside cards, table cell metadata, exam metadata (duration, date).

**When NOT to use**:
- For primary reading content (use Body)
- For labels that should be uppercase (use Label)
- For form labels (use Label)
- For headings (use H1-H3)

**Target pages**: All pages that display timestamps, secondary metadata, stat labels, chart labels.

**Replacement candidates** (patterns that should migrate to Caption):
- ~15+ `text-[11px]` or `text-[12px]` overrides on Body for metadata/secondary text
- StatCard label (internal) — currently `text-[9px] lg:text-[11px]`
- Leaderboard table headers — currently `text-[11px]`
- QuestionCard metadata spans — currently `text-[11px]`
- ExamLayout exam header — currently `text-[11px]`
- StatusBoard secondary info — currently `text-[10px]` or `text-[11px]`

**Permanent exceptions**:
- Badge component text — Badge has its own sizing. Caption is NOT a replacement for badge text.
- Label component text — Label is uppercase with tracking. Caption is NOT a replacement for labels.

---

### Label

**Purpose**: Short, uppercase UI labels for form fields, tab labels, section labels, stat labels. Communicates "this is what the following control/stat/content is called."

**Primary usage**: Form input labels, stat card labels, tab labels, section divider labels, pill labels.

**Secondary usage**: Error messages (with `error` prop → `text-danger`), badge descriptive text.

**When NOT to use**:
- For paragraph text (use Body or Caption)
- For headings (use H1-H3)
- For metadata that should NOT be uppercase (use Caption)

**Target pages**: Every page with forms, stat cards, tabs, or section labels.

**Examples**: "Username", "Password", "Accuracy", "Current Streak", "Questions", "Duration".

**Replacement candidates**: None — Label is already a component and widely used (58+ canonical usages).

**Permanent exceptions**:
- Any usage where `className` overrides the default uppercase/tracking/size — these are intentional.
- StatCard internal label — uses `font-bold uppercase tracking-widest leading-none m-0 text-[9px] lg:text-[11px]`. This is a Label pattern but with different sizing (9→11px vs Label's 10px). When StatCard is token-aligned, the sizing difference becomes a design decision.

---

### StatValue

**Purpose**: Large numeric/monetary values that communicate a key performance indicator or statistic. Must be highly legible at a glance.

**Primary usage**: Stat card values, score displays, key metrics in dashboard cards.

**Secondary usage**: Any large number that needs emphasis (rank numbers, percentages, counts).

**When NOT to use**:
- For text content (use Body or Caption)
- For headings (use H1-H3)
- For labels accompanying the stat (use Label)
- For display text (use Display)

**Target pages**: DashboardPage, PerformancePage, ProfilePage, ReviewLayout, ResultView, AdminOverview, SubAdminDashboard, ExamDetail, StudentDetailModal.

**Replacement candidates** (patterns that should migrate to StatValue):
- StatCard value — currently `text-sm sm:text-base lg:text-lg font-black leading-tight` (14→16→18px). StatValue token is 28→32→36px. This is a **significant increase** — design decision needed.
- AttemptCardBase accuracy/score spans — currently `text-[18px]` / `text-[20px]` `font-black`.
- LeaderboardTopCard rank — currently `text-[48px] md:text-[64px] font-black leading-none`.
- ResultView stat values — currently `text-4xl` (36px) `font-black`.
- TestConfigView question count — currently `text-[28px]` `font-black`.
- AntigravityDashboard dashboard value — currently `text-[16px]` `font-black`.
- AntigravityData danger value — currently `text-[20px]` `font-black`.
- SignupPage stat numbers — currently `text-[32px]` `font-black`.

**Permanent exceptions**:
- LeaderboardTopCard rank #1 — 48→64px is beyond StatValue (28→36px). This is Display-level.
- ResultsPage exam info h2 — currently `text-[10px] sm:text-[16px] md:text-[20px]` — this is a heading, not a stat value.

---

### Badge

**Purpose**: Compact, colored label for status, category, or count. Always uppercase with border and colored background.

**Primary usage**: Status indicators (Active, Inactive, Verified), category tags (NEET, JEE), rank badges, count badges.

**Secondary usage**: Pill labels inside forms, alert badges, premium badges.

**When NOT to use**:
- For form labels (use Label)
- For stat labels (use Label)
- For extended text content (use Body or Caption)
- For interactive elements (use Button)

**Target pages**: ProfileForm (validation badges), ExamDetail (status badges), AdminTopics (tag badges), QuestionCard (subject badges), Alert (alert badges), AIToolCards (tool badges).

**Replacement candidates**: None — Badge is already a component and correctly sized.

**Permanent exceptions**: None — Badge is well-defined and isolated.

---

## Part 2 — Semantic Ownership Matrix

| Typography | Owner | Primary Examples | Never Use For |
|------------|-------|------------------|---------------|
| **Display** | Hero / Branding | Login hero, Performance Report title, Success celebration, #1 rank | Page titles, card headers, form labels, body text |
| **H1** | Page titles | Dashboard, Settings, Profile, Admin page titles | Hero banners, card titles, subsections |
| **H2** | Section titles | Card headers, modal titles, exam names, form sections | Page titles, subsections, labels |
| **H3** | Subsection titles | Filter group headers, admin section headers, card subtitles | Page titles, section titles, labels |
| **Body** | Reading content | Paragraphs, descriptions, stat values, user names | Labels, headings, metadata (use Caption) |
| **Caption** | Metadata | Timestamps, secondary stat labels, chart metadata, dates | Paragraphs, headings, labels, badge text |
| **Label** | UI labels | Form labels, stat labels, tab labels, pill labels | Paragraphs, headings, metadata |
| **StatValue** | Metrics | Scores, percentages, counts, KPIs | Titles, headings, labels, paragraph text |
| **Badge** | Status pills | Status badges, category tags, count badges, rank badges | Headings, labels, body text, interactive elements |

Each typography level has exactly one semantic owner. No overlap.

---

## Part 3 — Migration Mapping

### Auth / Hero Pages

| Current pattern | Target level | Priority | Reason |
|----------------|--------------|----------|--------|
| LoginPage h1 (36→48px) | Display | High | Canonical large hero text |
| SignupPage h1 (36→48px) | Display | High | Same hero pattern as login |
| FinishSignInPage h1 (24px, 4x) | H1 | Medium | Page titles with custom size — design review needed |
| Unauthorized h1 (30px + uppercase) | H1 | Medium | Page title with different tone — design review needed |
| AccountDisabled h1 (30px) | H1 | Medium | Page title, mobile different — design review needed |
| ErrorBoundary h1 (font-cinzel) | H1 | Low | Custom font issue — design review needed |
| SuccessView h1 (36px) | Display | Medium | Celebratory banner |

### Exam Pages

| Current pattern | Target level | Priority | Reason |
|----------------|--------------|----------|--------|
| ExamHeader h1 (clamp 13-15px) | **Permanent exception** | None | Compact exam UI — intentional |
| ActiveExamPage loading h2 (24px white) | H2 | Medium | Custom exam UI — design review needed |
| QuestionCard h2 (clamp 14-17px) | H2 | Medium | Compact exam card — design review needed |
| ReviewLayout h1 (clamp 22-42px) | Display | Medium | Performance Report — hero-like |
| ReviewLayout h3 (clamp 16-20px) | Display or H2 | Low | Detailed Analysis — could be Display or H2 |
| ReviewLayout h3 (text-xl 20px) | H2 | Low | Also a section heading |
| ActiveExamPage h3 (24px) | H2 or H3 | Low | Completely oversized — design review needed |
| ResultsPage h2 (custom scale) | H2 | Low | Results-specific — design review needed |

### Admin Pages

| Current pattern | Target level | Priority | Reason |
|----------------|--------------|----------|--------|
| AdminModal h2 (20→24px + id) | H2 | Medium | Needs `id` prop support — component change needed |
| DailyAttemptsChart h3 (18→20px) | H3 or H2 | Low | Chart section heading — could be H2 |
| UploadProgressOverlay h3 (18px) | H3 | Low | Upload section heading |
| AdminTopicPreviewRenderer h3 (16px) | H3 | Low | Topic preview heading |
| QuestionForm h3 (18px + amber) | H3 | Low | Custom color — design review needed |
| ExamListSection h3 (18px) | H3 | Low | List section heading |
| ExamDetailModal h3 (18px) | H3 | Low | Detail modal heading |
| LanguageSelectionScreen h2 (13px + id) | H2 | Low | Needs `id` prop + size override — component change needed |

### Dynamic / Inline Styles

| Current pattern | Target level | Priority | Reason |
|----------------|--------------|----------|--------|
| ExamDetailSection h2 (dynamic style) | **Permanent exception** | None | Inline dynamic sizing |
| CreateStepReview h2 (dynamic style) | **Permanent exception** | None | Inline dynamic sizing |
| QuestionCard h3 (inline style) | **Permanent exception** | None | Inline dynamic sizing |

### Already Migrated (Canonical)

All 257 canonical usages from the Second Adoption Certification are Category A — no migration needed.

---

## Part 4 — Existing Repository Classification

### Category A — Already Canonical (257 usages)

Includes:
- All H1 component usages (FinishSignIn, UpdatePassword, admin sr-only)
- All H2 component usages (AddExamModal, ExamPaperGrid, TestConfigView, TopicListView)
- All H3 component usages (ProfileForm, StatisticsSection, ReviewLayout, etc.)
- All Body component usages (55+ across the codebase)
- All Label component usages (58+ across the codebase)
- All Badge component usages (5+ component usages)
- All StatCard component usages (9 component usages — but its internal rendering is NOT canonical yet)

### Category B — Safe Migration (can change tokens/components, zero visual change)

| Pattern | Action |
|---------|--------|
| H1 component hardcoded sizing | Replace with `text-h1` token — identical values |
| H2 component hardcoded sizing | Replace with `text-h2` token — identical values |
| H3 component hardcoded sizing | Replace with `text-h3` token — identical values |
| Body component hardcoded sizing | Replace with `text-body` token — identical values |
| Label component hardcoded sizing | Replace with `text-label` token — identical values |
| Badge component hardcoded sizing | Replace with `text-badge` token — identical values |
| Base element styles (h1, h2, h3 CSS rules) | Token values change — intentional bug fix |
| @theme static typography mappings | Make responsive — no visual change until component consumption |

### Category C — Requires Design Review (22 remaining raw headings)

| Pattern | Question |
|---------|----------|
| LoginPage h1 (36→48px) | Should this be Display (28→48px)? 36→28px on mobile is a noticeable shrink. |
| SignupPage h1 (36→48px) | Same question. |
| FinishSignInPage h1 (24px, 4x) | Should these be H1 (22→30px)? 24→22px on mobile, 24→30px on desktop. |
| AccountDisabledPage h1 (30px) | Should this be H1 (22→30px)? 30→22px on mobile is noticeable. |
| Unauthorized h1 (30px + uppercase) | Should this be H1 without uppercase? The `uppercase` conveys severity. |
| ErrorBoundary h1 (font-cinzel) | Should this lose font-cinzel? Is the brand font intended for error states? |
| ActiveExamPage loading h2 (24px white) | Should this be H2 (18→20px)? 24→18px is significant. The white color also changes. |
| QuestionCard h2 (clamp 14-17px) | Should this be H2 (18→20px)? Would increase size. |
| ReviewLayout h3 x2 (clamp, text-xl) | Should these be H3 (14→15px) or higher? |
| DailyAttemptsChart h3 (18→20px) | H3 candidate or H2? |
| UploadProgressOverlay h3 (18px) | H3 candidate (14→15px would shrink). |
| AdminTopicPreviewRenderer h3 (16px) | Borderline — between Body and H3. |
| QuestionForm h3 (18px + amber) | H3 candidate with color override (supported). |
| ExamListSection h3 (18px) | H3 candidate. |
| ExamDetailModal h3 (18px) | H3 candidate. |
| ActiveExamPage h3 (24px) | Completely off-scale. Intended as a major state heading. |
| AdminModal h2 (20→24px) | H2 candidate + needs `id` prop. |
| LanguageSelectionScreen h2 (13px) | H2 candidate + needs `id` prop. Extremely small — may be intentional compact UI. |
| ResultsPage h2 (10→20px) | Results-specific custom scale. |

### Category D — Permanent Semantic Exception (8 patterns)

| Pattern | Reason |
|---------|--------|
| **ExamHeader h1 (clamp 13-15px)** | Exam-taking UX prioritizes screen space for questions. Compact heading is intentional and fundamental to the exam experience. Cannot change. |
| **ReviewLayout h1 (clamp 22-42px)** | Already Display-level in intent, but uses responsive clamp. The clamp approach is valid for responsive hero text; the token system's discrete breakpoints may not match. |
| **SuccessView h1 (text-4xl)** | Celebratory page — the 36px size is intentionally large. When Display token is created (28→48px), this could migrate if design approves. Currently an exception because no Display component exists. |
| **ExamDetailSection h2 (dynamic inline style)** | The dynamic sizing is driven by a responsive helper function (`getTypo`). Cannot express in token system without changing the dynamic sizing logic. |
| **CreateStepReview h2 (dynamic inline style)** | Same dynamic sizing pattern. |
| **QuestionCard h3 (inline style)** | Admin create flow — inline style for a specific layout. |
| **SplashPage title (font-cinzel, gold gradient)** | Brand artifact with custom font, gold gradient, and unique tracking. Not a token-level concern. Should remain as a custom component. |
| **AddExamModal / ExamPaperGrid / StatusBoard / AIToolCards / PromptEditorModal — already migrated** | These were migrated in Steps 1-3 with explicit overrides. Their visual is now canonical (component + overrides). |

---

## Part 5 — Component Strategy

| Level | Token | Typography Component | Justification |
|-------|-------|---------------------|---------------|
| **Display** | Yes | Yes (new) | Display needs a component for hero headings. Must NOT use font-cinzel, uppercase, or gold gradient — those are brand artifacts. Component should be simple: `font-black`, `tracking-tight`, uses `--text-display` token. |
| **H1** | Yes | Yes (exists) | H1 component exists and is well-defined. Token alignment only. |
| **H2** | Yes | Yes (exists) | H2 component exists. Token alignment + add `id` prop support. |
| **H3** | Yes | Yes (exists) | H3 component exists. Token alignment only. |
| **Body** | Yes | Yes (exists) | Body component exists. Token alignment only. |
| **Caption** | Yes | Yes (new) | Caption captures ~15+ `text-[11px]`/`text-[12px]` override pattern. Component would use `<span>` with `--text-caption` token. |
| **Label** | Yes | Yes (exists) | Label component exists. Token alignment only. |
| **StatValue** | Yes | No (token only) | StatValue is always used within a container (StatCard, AttemptCardBase, etc.). A standalone component would create an artificial API. Token-only is sufficient — containers consume `--text-stat-value`. |
| **Badge** | Yes | Yes (exists) | Badge component exists and is well-defined. Token alignment only. |

**Decisions**:
1. **Display**: Create new component. Simple, minimal — just the token.
2. **Caption**: Create new component. Smallest typography component, always lowercase, medium weight.
3. **StatValue**: Token only. No component needed — already rendered by StatCard, AttemptCardBase, etc. via token consumption.
4. **H2**: Add `id` prop to support `AdminModal` and `LanguageSelectionScreen` migration.

---

## Part 6 — BrandTitle Relationship

### Current State

BrandTitle (`AntigravityTypography.tsx:52-86`) is **dead code** — zero usages across `src/`. It was created as a speculative component for auth pages.

### Comparison: BrandTitle vs Proposed Display

| Aspect | BrandTitle | Proposed Display |
|--------|-----------|------------------|
| Font | `font-cinzel` (brand font) | Uses token — whatever the Design System defines |
| Uppercase | Always `uppercase` | No uppercase |
| Tracking | `tracking-[0.2em]` (ultra-wide) | `tracking-tight` |
| Gradient variant | Yes — gold gradient clip | No — plain text |
| Default size | 26→30→34px | 28→32→36→40→48px (Display) |
| Use case | Brand presence | Hero headings |
| Status | Dead code | Not yet created |

### Recommendation

**Deprecate BrandTitle**. It is dead code that over-engineers a non-existent problem. The component conflates three concerns that should remain separate:

1. **Size** — handled by the Display token
2. **Brand font** (`font-cinzel`) — should be applied via className override, not baked into a component
3. **Gold gradient** — a visual effect, not a typography level

If a future SplashPage or branded hero needs the Cinzel font + gold gradient, it should use:
```tsx
<Display className="font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-[#f5e0be] to-[#b88c3a] drop-shadow-md">
```

This keeps the Display component clean while allowing brand-specific overrides. BrandTitle should be removed from the codebase as part of cleanup.

---

## Part 7 — Token Dependency Audit

### Existing Typography Tokens (index.css :root + @theme)

#### Active — Used by Components

| Token | Defined | Consumers | Tailwind Utility | Status |
|-------|---------|-----------|------------------|--------|
| `--text-h1` | @theme:166, :root:216, 5 breakpoints | Base `h1` rule | `text-h1` | **Replaceable** — value must change |
| `--text-h2` | @theme:167, :root:217, 5 breakpoints | Base `h2` rule | `text-h2` | **Replaceable** — value must change |
| `--text-h3` | @theme:168, :root:218, 5 breakpoints | Base `h3` rule | `text-h3` | **Replaceable** — value must change |
| `--text-h4` | @theme:169, :root:219, 5 breakpoints | Base `h4` rule | `text-h4` | **Deprecated** — no component, 0 raw usages found |
| `--text-h5` | @theme:170, :root:220, 5 breakpoints | Base `h5` rule | `text-h5` | **Deprecated** — no component, 0 raw usages found |
| `--text-h6` | @theme:171, :root:221, 5 breakpoints | Base `h6` rule | `text-h6` | **Deprecated** — no component, 0 raw usages found |
| `--text-body-1` | @theme:172, :root:226, 5 breakpoints | None (no `var()` references) | `text-body-1` | **Deprecated** — never consumed |
| `--text-body-2` | @theme:173, :root:227, 5 breakpoints | None (no `var()` references) | `text-body-2` | **Deprecated** — never consumed |
| `--text-caption` | @theme:174, :root:229, MD+ breakpoints | None (no `var()` references) | `text-caption` | **Active** — will be consumed by new Caption component |
| `--text-label` | @theme:175, :root:232, SM+/LG+ breakpoints | None (no `var()` references) | `text-label` | **Active** — will be consumed by Label component |
| `--text-button` | @theme:176, :root:231, SM+/LG+ breakpoints | None (no `var()` references) | `text-button` | **Deprecated** — buttons use token sizing internally |

#### Additional Tokens (no @theme mapping)

| Token | Defined | Consumers | Status |
|-------|---------|-----------|--------|
| `--text-sub-1` | :root:223, 5 breakpoints | None (no `var()` references) | **Deprecated** — no component, 0 usages |
| `--text-sub-2` | :root:224, 5 breakpoints | None (no `var()` references) | **Deprecated** — no component, 0 usages |
| `--text-overline` | :root:230, MD+/LG+/XL+ breakpoints | None (no `var()` references) | **Deprecated** — no component, 0 usages |

#### Tailwind Utilities Currently Used (via @theme mapping)

| Utility | Files using it | Status |
|---------|---------------|--------|
| `text-h1` through `text-h6` | **Zero** source files | Defined but unused — migration planned |
| `text-body-1`, `text-body-2` | **Zero** source files | Never used — can be removed |
| `text-caption` | **Zero** source files | Defined but unused — will be used by Caption component |
| `text-label` | **Zero** source files | Defined but unused — will be used by Label component |
| `text-button` | **Zero** source files | Never used — can be removed |
| `text-stat-value-text` | StatCard, PremiumIconContainer | **Active** — this is a COLOR token, not a size token |

### Deprecated Token Removal Sequence

After all migrations are complete, remove in this order:

| Step | Tokens Removed | Precondition |
|------|----------------|--------------|
| 1 | `--text-sub-1`, `--text-sub-2`, `--text-overline` | Verified 0 references in source code |
| 2 | `--text-h4`, `--text-h5`, `--text-h6` | Verified 0 references in source code |
| 3 | `--text-body-1`, `--text-body-2` | Replaced by `--text-body` in all consumers |
| 4 | `--text-button` | Verified 0 references |
| 5 | Old `--text-h1`/`--text-h2`/`--text-h3` values | Replaced by new canonical values |
| 6 | Old `--text-label` value (12px) | Replaced by new value (10px, matching component) |

---

## Part 8 — Future-Proofing

### Evaluation: Can the model support future additions without new typography levels?

| Future feature | Can existing levels support it? | Notes |
|----------------|-------------------------------|-------|
| **Charts** | Yes — Caption (axis labels), Body (tooltips), StatValue (data points) | Chart title → H2 or H3 |
| **Analytics** | Yes — StatValue (KPIs), Body (descriptions), Caption (metadata) | Dashboard title → H1 |
| **Notifications** | Yes — Body (message), Caption (timestamp), Badge (count/unread) | Notification header → H3 |
| **Admin dashboards** | Yes — H1 (page title), H2 (section), StatValue (metrics), Label (field labels) | Already using this model |
| **Marketing pages** | Yes — Display (hero), H1 (section title), Body (content) | Marketing copy is the canonical use case |
| **Reports** | Yes — H1 (report title), H2 (section), Body (content), StatValue (metrics) | ReviewLayout already uses this pattern |
| **Certificates** | Yes — Display (certificate title), Body (recipient name, details), Label (metadata) | Certificate template uses existing levels |
| **Leaderboards** | Yes — H1 (leaderboard title), H2 (table headers), Body (entries), StatValue (scores), Badge (rank) | Leaderboard components already use this pattern |

**Conclusion**: The 9-level model (Display, H1, H2, H3, Body, Caption, Label, StatValue, Badge) is **complete and sufficient** for all foreseeable additions. No additional typography levels are needed.

### Potential gaps addressed:

1. **Code/monospace text**: Uses `font-mono` token, not a typography level. Applied via className override on Body or inline `<code>` element. No component needed.

2. **Interactive text (buttons, links)**: These are component-level concerns (Button, Link), not typography levels. Button has its own sizing; links use Body or Heading style with `text-primary` and `underline`.

3. **Numeric display in non-stat contexts** (e.g. question numbers, page numbers): Use Body or Caption with `font-bold` or `font-black` override. No need for a dedicated token.

4. **Alert/message text**: Use Body with color token override. No need for a dedicated typography level.

---

## Part 9 — Final Governance Recommendation

### 1. Is the semantic hierarchy complete?

**Yes**. The 9-level hierarchy covers every typography need identified in the repository audit:

```
Display → H1 → H2 → H3 → Body → Caption → Label → StatValue → Badge
```

Each level has a distinct semantic role with no overlap.

### 2. Are any typography levels redundant?

**No**. Every level serves a distinct purpose:
- **Display** vs **H1**: Display is hero/brand (28-48px), H1 is page titles (22-30px). Different sizes, different use cases.
- **H3** vs **Body**: H3 is 14-15px semibold (heading), Body is 13-14px medium (paragraph). Different weights and roles.
- **Caption** vs **Body**: Caption is 11-12px (metadata), Body is 13-14px (reading). Different sizes, different roles.
- **Caption** vs **Label**: Caption is lowercase medium (metadata), Label is uppercase bold tracking-widest (UI labels). Completely different visual.
- **StatValue** vs **Display**: StatValue is 28-36px (metrics), Display is 28-48px (hero). Display grows at every breakpoint; StatValue tops out at LG. Different growth curves, different use cases.

### 3. Should Caption exist?

**Yes**. The repository has ~15+ patterns where `text-[11px]` or `text-[12px]` overrides Body for secondary metadata. A dedicated Caption level captures this common pattern in a standardized way. Without Caption, these remain as arbitrary overrides forever.

### 4. Should StatValue exist?

**Yes**. StatCard, AttemptCardBase, and dashboard components all render large numeric values that are distinct from both Body (too small) and Display (too large/emphatic). A dedicated token gives these values a standardized size. A **component is NOT needed** — StatValue should remain token-only.

### 5. Should Badge exist?

**Yes**. The Badge component is already well-defined with 6 variants, 2 sizes, and is used across 5+ files. It belongs in the typography semantic model because it has a dedicated font-size, weight, tracking, and transform that are distinct from Label (Badge is smaller: 9→10px vs Label's 10px, tracking-wider vs tracking-widest, uses `border` + colored background vs Label's plain text).

### 6. Should Display exist?

**Yes**. Currently, hero headings (LoginPage, SignupPage) use raw `<h1>` with `text-[36px] xl:text-[48px]` — a size that does not match H1 (22→30px) or any other level. A dedicated Display level captures this pattern cleanly. Additionally, Display supports future marketing pages, certificates, and celebratory banners.

### 7. Should BrandTitle remain?

**No — deprecate and remove**. BrandTitle is dead code (0 usages). It conflates three concerns (size, brand font, gold gradient) that should remain separate. The Display component (when created) should be font-agnostic, allowing callers to apply `font-cinzel` or any brand font via className. BrandTitle's existence is a legacy artifact from before the Design System was formalized.

### 8. Is the repository now ready for Typography Token Alignment (Step 4)?

**Yes, with the following prerequisites**:

| Prerequisite | Owner | Status |
|-------------|-------|--------|
| Typography Semantic Model approved | Design authority | **This document — pending approval** |
| Display component created (with Deprecated BrandTitle agreement) | Implementation | Pending approval |
| Caption component created | Implementation | Pending approval |
| `id` prop added to H2 component | Implementation | Pending approval |
| StatValue token only (no component) confirmed | Design authority | Agreed |
| 22 Category C patterns marked for design review (not blocking Step 4) | Design authority | Agreed — create tracking issue |
| 8 Category D permanent exceptions documented | Design authority | Agreed |

**The Typography Token Alignment (Step 4) can proceed once this Semantic Model is approved.** The 22 Category C patterns do not block Step 4 — they are tracked separately and will be addressed in Phase 1a Step 5 (Component Update) after design review.

---

## Summary of Governance Decisions

| Decision | Verdict |
|----------|---------|
| Semantic hierarchy complete? | **Yes** — 9 levels, no overlaps |
| Any redundant levels? | **No** |
| Caption should exist? | **Yes** — token + new component |
| StatValue should exist? | **Yes** — token only, no component |
| Badge should exist? | **Yes** — existing component, belongs in model |
| Display should exist? | **Yes** — token + new component |
| BrandTitle should remain? | **No** — deprecate and remove |
| Ready for Step 4? | **Yes** — after this document is approved |

---
*Generated: 2026-07-30*
*Authority: Technical audit*
