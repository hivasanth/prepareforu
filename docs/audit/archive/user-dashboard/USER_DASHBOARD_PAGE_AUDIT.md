# USER DASHBOARD PAGE AUDIT

> Phase 6.XA — Certifications audit of **one page**: User Panel → Dashboard (`/dashboard`).
> Scope: `src/pages/user/UserDashboard.tsx` and its feature tree. READ-ONLY. No source modified.
> Companion docs: `USER_DASHBOARD_VISUAL_AUDIT.md`, `USER_DASHBOARD_ACCESSIBILITY_AUDIT.md`,
> `USER_DASHBOARD_PERFORMANCE_AUDIT.md`, `USER_DASHBOARD_SECURITY_AUDIT.md`,
> `USER_DASHBOARD_EXECUTIVE_SUMMARY.md`.

## Page Map (composed tree)

```
UserDashboard.tsx (page, 55 lines)
├── PageContainer (Found. layout)
├── Stack gap="lg"
│   ├── WelcomeBanner            → Label / H2 / Body / H3 / Body, gradient overlay, hero bg
│   ├── DashboardStatsGrid       → 4× StatCard (Flame/GraduationCap/Target/Trophy) + StatSkeleton + ErrorContainer+RetryButton
│   ├── DashboardRecentActivity  → H2 + Button(soft, "Analytics →") + LoadingSkeleton×3 + ErrorContainer + EmptyState + Grid of RecentAttemptCard
│   └── div + PrimaryButton "Launch Practice Session"
├── useUserDashboard(userId, examSelection)
│   └── dashboardService (stats RPC + performanceService attempts), queryCache, requestId staleness guard
```

## 1. Page Architecture

| Area | Verdict | Evidence |
|---|---|---|
| Reading flow | GOOD | Banner → key stats → recent activity → single CTA. Logical top-down scan. |
| Visual hierarchy | GOOD | Scale: name (H2) > tagline > stat value (stat-value) > card titles. |
| First-time comprehension | GOOD | Self-describing; "Launch Practice Session" is the single dominant call to action. |
| Info architecture | GOOD | Stats label semantics map to metrics (streak/wisdom/precision/standing). |
| Page title / heading | **ISSUE** | No `<h1>`/`PageHeader`; `PageTitle` sets only `document.title`. Heading tree starts at an `H2`. |

## 2. Foundation Compliance

### VERIFIED CERTIFIED COMPONENTS (compliant)
- `PageContainer`, `Stack`, `Grid` (AntigravityLayout) — spacing constroad-height via `--space-*`.
- `StatCard`, `Card` (AntigravityCard) — including semantic `status` tokens.
- `Button` / `PrimaryButton` — Foundation button language.
- `LoadingSkeleton`, `StatSkeleton`, `EmptyState`, `ErrorContainer`, `RetryButton` — certified.
- All stat text resolves through `Typography` roles.

## 3–19. Category Findings (shared register)

### USR-ARCH-01 — Page heading hierarchy has no H1
- **Severity:** Medium | **Confidence:** High
- **Evidence:** `UserDashboard.tsx:26` renders `WelcomeBanner` first; `App.tsx:70-73` `PageTitle` only calls `useDocumentTitle`. No `<h1>` exists anywhere in the tree.
- **Affected:** `src/pages/user/UserDashboard.tsx`, `src/components/user/WelcomeBanner.tsx`
- **Components:** Page container, banner.
- **Impact:** Screen-reader users and an outline of the page land on an `H2`; the document heading is not descriptive.
- **Recommendation:** FIX — introduce a visually-hidden or `PageHeader`-style `H1` (e.g. "Dashboard") before the banner.
- **Priority:** P2 · **Estimated effort:** 15 min · **Screenshot:** n/a (static).

### USR-ARCH-02 · Banner greeting use of H2/H3 rather than page/H1 semantics
- **Severity:** Low | **Confidence:** High
- **Finding:** `WelcomeBanner.tsx:81` uses `H2` (a section-title token) for the user's name and `H3:91` for the tagline. For a greeting this scales the semantic tier.
- **Affected:** `src/components/user/WelcomeBanner.tsx`
- **Impact:** Slightly off semantic/visual hierarchy relative to a page title.
- **Recommendation:** DEFER — resolve together with USR-ARCH-01.
- **Priority:** P2 · **Effort:** 1h.

### USR-FND-01 · Direct Layer-1 primitive reference (`var(--forest-900)`)
- **Severity:** High | **Confidence:** High
- **Finding:** `WelcomeBanner.tsx:74` uses `from-[var(--forest-900)]/95 via-[var(--forest-900)]/70`. `themes.css` (Layer 2 guidance) states UI **must** reference Layer 2 Semantic, never Layer 1. `--forest-900` is a Layer-1 primitive.
- **Affected:** `src/components/user/WelcomeBanner.tsx`
- **Impact:** Document(DLIN layer rule from the Frozen token contract.
- **Recommendation:** FIX — reference a Semantic token (e.g. `--surface-*`/`--management-*` / accent) or a certified `Card` premium variant; do not consume `--forest-*`.
- **Priority:** P1 · **Effort:** 2h.

### USR-FND-02 · Custom banner surface bypasses the Card/surface ladder
- **Severity:** Medium | **Confidence:** High
- **Finding:** `WelcomeBanner.tsx:69` uses `ancient-card-dark` + inline gradients + `.ancient-bg` `url('/bg/hero-banner.jpg')`; no certified `Card`/`Surface` variant (premium/management), no certified elevation token path for the hero material.
- **Affected:** `WelcomeBanner.tsx`, `index.css` `.ancient-card-dark`
- **Components:** banner, hero media.
- **Impact:** The banner cannot be styled by the token ladder and may not inherit the certified `HoverLanguage`.
- **Recommendation:** MERGE/CONFLICT — convert to a certified Card `/` collection surface or a Foundation banner; apply certified `--elevation-*`.
- **Priority:** P1 · **Effort:** 3h.

### USR-TYPO-01 · Arbitrary font sizes in AttemptCardBase
- **Severity:** Medium | **Confidence:** High
- **Finding:** `AttemptCardBase.tsx:63,70,76` uses raw coercion `text-[14px]`, `text-[18px]`, `text-[13px]`, `text-[20px]`; large values are not the certified metric `--text-stat-value` (1.75rem/28px) tier.
- **Impact:** Value text is below the stat tier; inconsistent with the page's StatCard scale.
- **Recommendation:** FIX — use `Typography`/role (`role="metric"`/`--text-stat-value`) or a certified size token.
- **Priority:** P2 · **Effort:** 2h.

### USR-TYPO-02 · Welding clamp(…)/amplitude fonts in banner
- **Severity:** Medium | **Confidence:** Medium
- **Finding:** `WelcomeBanner.tsx:81,84,89,91,94` use `text-[clamp(26px,4.5vw,36px)]`, `text-[15px]`, `text-sm`, `tracking-[0.15em]`, and `text-warning/60`. `--text-h2/h3` tokens exist; these are bespoke.
- **Recommendation:** MERGE — re-map to the certified scale roles, keep decorative adjustment via token spacing only.
- **Priority:** P2 · **Effort:** 2h.

### USR-BTN-01 · Text arrow "→" instead of the icon language
- **Severity:** Low | **Confidence:** High
- **Finding:** `DashboardRecentActivity.tsx:25-26` renders `Analytics →` using a raw glyph; the icon language uses lucide. `AttemptCardBase` uses `ChevronRight`.
- **Recommendation:** FIX — swap `→` for a `lucide` `ArrowRight` inside `Button` with `gap`.
- **Priority:** P3 · **Effort:** 30 min.

### USR-ICON-01 · EmptyState uses an emoji icon (📊)
- **Severity:** Low | **Confidence:** High
- **Finding:** `DashboardRecentActivity.tsx:42` passes `icon="📊"` (an emoji) to `EmptyState`; the rest of the page uses lucide icons.
- **Impact:** Visual inconsistency in icon language; emoji color depends on OS preference.
- **Recommendation:** FIX — pass a `lucide` `BarChart3` (or `Activity`) icon.
- **Priority:** P3 · **Effort:** 30 min.

### USR-HV-01 · Hover deviation in AttemptCardBase
- **Severity:** Medium | **Confidence:** Medium
- **Finding:** `AttemptCardBase.tsx:32,45,46` applies `hover:shadow-card-premium` + `group-hover:text-primary`/`bg-primary text-white`. The Certified hover language (5.4A/5.4E) is subtle surface lighten + `--elevation-*` no lift/scale; color swap on `group-hover` is not the certified set.
- **Affected:** `AttemptCardBase.tsx` (shared) — review before page-specific.
- **Recommendation:** CONFLICT — unify AttemptCard hover with `CARD_HOVER` (`hover:bg-hover-bg/40 hover:shadow-card-hover-shadow`); keep color changes only on the certified state set.
- **Priority:** P2 · **Effort:** 2h.

### USR-LOAD-01 · skeleton count mismatches content max (3 vs 5)
- **Location:** `DashboardRecentActivity.tsx:32` renders 3 skeletons while `.slice(0,5)` can show up to 5 cards.
- **Recommendation:** DEFER — render `?` skeletons to match data length during loading.
- **Priority:** P3 · **Effort:** 30 min.

## 4. Containers / Cards / Forms / Tables / Pills quick-scan

| Category | Verdict | Notes |
|---|---|---|
| Containers | GOOD | Banner excepted (USR-FND-02); page container `max-w-1280` centered. |
| Cards | GOOD (1 nuance) | Stats + attempt cards certified; see USR-HV-01 hover nuance. |
| Forms / Inputs / Filters | N/A | Dashboard has no search/inputs. |
| Pills / Badges | GOOD | `Badge` (Pill) used for exam name. |
| Tables | N/A | No tables on this page. |

## Action Summary (this report)
Priorities: **P1** → USR-FND-01, USR-FND-02, USR-ARCH-01. **P2** → USR-HV-01, USR-TYPO-01, USR-TYPO-02, USR-ARCH-02. **P3** → USR-BTN-01, USR-ICON-01, USR-LOAD-01.

Full detail, evidence line refs, and security/perf/a11y split live in the companion reports.