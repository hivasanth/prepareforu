# Admin Users — U-3 AdminText Consolidation Audit (Phase 3.5 · Page 1 of 11)

**Status:** ✅ **AUDIT COMPLETE** (2026-08-03)
**Gate:** U-3 (`AdminText`) — approved per-item P2 gate. A **Foundation ownership audit** of
`AdminText` as the Admin module's typography entry point, **not** a typography redesign.
**Scope:** ONLY U-3. No U-2 (typography scale) / U-6 (alpha tokens) implementation.
**Permanent principle (governing):** **Reuse → Refine → Create** — reuse `AdminText`; refine only
when multiple consumers benefit; create a new primitive only if neither works.
**Page:** `/admin/users` (migration scope). Repository-wide audit for certification evidence.

---

## 1. Step 1 — Repository audit: every Admin text rendering

Inventory of text rendering across the Admin module and its shared typography surface, with the
Foundation owner of each:

| Consumer | Current component / element | Foundation owner | Status |
|---|---|---|---|
| `common/AdminText.tsx` | the primitive itself | AdminText (Layer 2 Module Typography) | certified this gate |
| `common/AntigravityTypography.tsx` | `H1 H2 H3 Body Label Caption Display BrandTitle` | Repository Typography (Layer 1) | certified (retained) |
| `common/AntigravityLayout.tsx:196` | SectionHeader title | AdminText (`cinzel`) | certified reuse |
| `admin/common/BulkActionBar.tsx:24` | "N Selected" | AdminText (`cinzel`) | certified reuse |
| `admin/users/UserIdentity.tsx:17-23` | user name | AdminText (`garamond`) | certified reuse (U-4) |
| `admin/upload/UploadContextPanel.tsx:59` | panel title | AdminText (`cinzel`) | certified reuse |
| `admin/upload/MethodSelectionView.tsx:16,36,65` | page/option titles | AdminText (`cinzel`) | certified reuse |
| `admin/topics/TopicsToolbar.tsx:16` | toolbar title | AdminText (`cinzel`) | certified reuse |
| `admin/settings/SubjectDistributionPanel.tsx:43` | running-total label | AdminText (`cinzel`) | certified reuse |
| `admin/sub-admins/AdminSubAdminsView.tsx:63` | sub-admin name | AdminText (`garamond`) | certified reuse |
| `sub-admin/students/StudentsTable.tsx:44` | student name | AdminText (`cinzel`) | certified reuse |
| `sub-admin/exams/ExamListSection.tsx:82` | exam title | AdminText (`cinzel`) | certified reuse |
| `sub-admin/dashboard/RecentExamItem.tsx:31` | exam title | AdminText (`cinzel`) | certified reuse |
| `sub-admin/dashboard/RecentAttemptItem.tsx:21` | attempt label | AdminText (`cinzel`) | certified reuse |
| `pages/admin/AdminUsers.tsx:14` | page title (sr-only) | `H1` (Layer 1) | retained (D-131) |
| `admin/users/AdminUsersView.tsx:57` | "Exams" caption | `Label` (Layer 1) | retained (D-131) |
| `admin/users/*` metadata (email / attempts / joined / exam rows) | raw `text-*` spans | AdminText (`sans` — **new this gate**) | migrated this gate |

**Finding:** every existing `AdminText` consumer uses only the serif variants (`cinzel`/`garamond`).
The sans metadata text every Admin page renders (attempts counts, joined dates, exam labels, email
lines) has no `AdminText` variant, so pages hand-roll it with raw Tailwind text utilities. That gap
is what this gate closes.

---

## 2. Step 2 — AdminText consumer audit

| File | Usage | Variant | Notes |
|---|---|---|---|
| `common/AntigravityLayout.tsx:196` | SectionHeader title | `cinzel` | Foundation layout composes the Layer 2 primitive (pre-existing coupling, unchanged) |
| `admin/common/BulkActionBar.tsx:24` | selection count | `cinzel` | `text-sm font-bold` |
| `admin/users/UserIdentity.tsx:17-23` | canonical user name | `garamond` | `text-base font-bold uppercase tracking-tight leading-tight` (U-4) |
| `admin/upload/UploadContextPanel.tsx:59` | panel heading | `cinzel` (`as="h4"`) | `text-lg font-bold uppercase tracking-tight` |
| `admin/upload/MethodSelectionView.tsx:16` | page heading | `cinzel` (`as="h1"`) | `text-3xl font-black mb-4 uppercase tracking-tighter` |
| `admin/upload/MethodSelectionView.tsx:36,65` | option headings | `cinzel` (`as="h3"`) | `text-xl font-bold mb-2 uppercase tracking-tight` |
| `admin/topics/TopicsToolbar.tsx:16` | toolbar title | `cinzel` (`as="h2"`) | `font-bold text-base uppercase tracking-wider` |
| `admin/settings/SubjectDistributionPanel.tsx:43` | running-total caption | `cinzel` | `text-primary font-semibold text-[12px]` |
| `admin/sub-admins/AdminSubAdminsView.tsx:63` | sub-admin name | `garamond` | same canonical pattern as UserIdentity |
| `sub-admin/students/StudentsTable.tsx:44` | student name | `cinzel` (`as="p"`) | `font-bold text-text-primary truncate text-[13px]` |
| `sub-admin/exams/ExamListSection.tsx:82` | exam title | `cinzel` (`as="h3"`) | `text-lg font-bold uppercase` |
| `sub-admin/dashboard/RecentExamItem.tsx:31` | exam title | `cinzel` (`as="h4"`) | `uppercase tracking-tight` |
| `sub-admin/dashboard/RecentAttemptItem.tsx:21` | attempt label | `cinzel` | `text-xs font-bold uppercase tracking-tight` |

**Answers the Step-2 questions:**
- Every Admin page uses `AdminText` for its cinematic serif text? **Yes** — 12 consumer files
  across Admin, SubAdmin, and shared common surfaces.
- Raw typography still present? **Yes** — sans metadata in every Admin page (see §3).
- Duplicated wrappers? **None** — no competing Admin-module typography wrapper; the only parallel is
  the certified Repository Typography family (Layer 1), intentionally retained.
- Competing primitives? **No module-level competitor.** `H1`–`Caption` (AntigravityTypography) are
  Layer 1 repo-wide semantic primitives, not a competing Admin typography layer.

---

## 3. Step 3 — Raw typography audit (classification)

### Page 1 (Admin Users) — consolidated in this gate

| Location | Raw construct | Classification | Action |
|---|---|---|---|
| `UserIdentity.tsx:24` | email `text-xs text-text-secondary` | **Legacy — page-owned** | ✅ migrate → `AdminText sans` |
| `AdminUsersView.tsx:55` | attempts `text-sm font-bold text-text-primary` | **Legacy — page-owned** | ✅ migrate → `AdminText sans` |
| `AdminUsersView.tsx:57` | `Label className="text-[8px]"` | **Legitimate** — certified `Label` retained; `text-[8px]` **inert** (inline `--text-label` 10px wins) | 🔒 kept; class deferred to U-2 |
| `AdminUsersView.tsx:64` | joined `text-xs font-medium text-text-muted` | **Legacy — page-owned** | ✅ migrate → `AdminText sans` |
| `UserMobileCard.tsx:19-21` | exam/attempts `text-xs`, `text-text-secondary`, `font-medium`, `capitalize` | **Legacy — page-owned** | ✅ migrate → `AdminText sans` |
| `UserMobileCard.tsx:24` | joined `text-xs text-text-muted` | **Legacy — page-owned** | ✅ migrate → `AdminText sans` |
| `pages/admin/AdminUsers.tsx:14` | `<H1 className="sr-only">Manage Users</H1>` | **Legitimate** — certified Layer 1 `H1` | 🔒 retained (D-131) |
| `AdminUsersView.tsx:45` | `Badge className="capitalize"` | **Legitimate** — class passed to certified `Badge`, not a page text node | 🔒 retained |

**Step-3 summary (Page 1):** Legitimate/retained: `H1`, `Label`, `Badge capitalize`. Legacy
(migrated): **7 instances**. Duplicate: **none**. Blocked-until-U-2: **0** on Page 1 (one inert
`text-[8px]` on the retained `Label`).

### Other Admin pages — deferred to their own page gates

| Location | Raw construct | Classification | Action |
|---|---|---|---|
| `pages/admin/AdminTopics.tsx:121,163,171,218` | `text-xs`, `text-[9px] font-semibold`, `text-[11px]` | **Blocked until U-2 / that page's U-3** | 🕓 deferred (documented only) |
| `pages/admin/AdminSettings.tsx:67` | `text-[10px] font-bold uppercase tracking-widest` | **Blocked until U-2 / that page's U-3** | 🕓 deferred (documented only) |
| `pages/admin/AdminLeaderboard.tsx:40` | `text-xs font-semibold uppercase tracking-widest` | **Blocked until U-2 / that page's U-3** | 🕓 deferred (documented only) |
| `admin/sub-admins/AdminSubAdminsView.tsx:66,85,201-232` | `text-xs`, `text-xs font-bold text-danger` | **Blocked until U-2 / that page's U-3** | 🕓 deferred (documented only) |
| `admin/sub-admins/SubAdminMobileCard.tsx` | name/email/metadata raw `<p>`/`<span>` | **Blocked until U-2 / that page's U-3** | 🕓 deferred (documented only) |
| `admin/leaderboard/Leaderboard*.tsx`, `admin/questions/AIToolCards.tsx`, `admin/settings/AddExamModal.tsx`, `admin/settings/ExamParamsForm.tsx`, `admin/topics/AdminTopicPreviewRenderer.tsx`, `admin/common/BulkActionBar.tsx:25,30,33` | `text-[9px]`/`text-[10px]`/`text-[11px]`/`text-xs`/`text-sm`/`font-*`/`tracking-*` | **Blocked until U-2 / that page's U-3** | 🕓 deferred (documented only) |

---

## 4. Step 4 — Ownership audit (two-layer model, D-131)

Per the approved U-3 decision, Foundation Typography is a two-layer ownership model:

### Layer 1 — Repository Typography (repo-wide, authoritative)
- **Owns:** `H1` `H2` `H3` `Body` `Caption` `Label` `Display` `BrandTitle` — global semantic
  primitives with token-driven rendering (`--text-*`, `--lh-*`, `--fw-*`, `--ls-*`, `--tt-*`).
- **Never replaced by module primitives.** Consumed directly by every module.

### Layer 2 — Module Typography (AdminText)
- **Owns:** Admin-specific display text, serif usage (`cinzel`/`garamond`), **sans usage** (new
  `sans` variant), and Admin module typography variants. It is the **Admin module's typography
  entry point** and may *extend* the Layer-1 system — never replace it.
- **API:** `as?: ElementType` · `variant?: 'cinzel' | 'garamond' | 'cinzel-value' | 'garamond-value' | 'sans'` · `size?: CanonicalSize` · `className` · `children`.

### Pages (Admin Users)
- **Own:** layout only — flex/grid arrangement, spacing, alignment, truncation, composition.
- **Never own typography implementation** — no raw `font-*`, arbitrary text sizes, `text-*`
  families, or tracking utilities on page-owned text nodes.

### Verification of the split (Page 1, after migration)
- Page-owned text nodes rendering raw typography: **0**.
- Typography on page text nodes: **100%** on `AdminText` (`sans`/`garamond`) or on certified
  Layer-1 components (`H1`, `Label`) / certified components (`Badge`, `DataGrid` headers, `Button`).

---

## 5. Step 5 — Foundation opportunity (Reuse → Refine → Create)

- **Create?** No — no new primitive is needed; the repository rule forbids replacing Layer 1, and a
  third text primitive would fragment ownership.
- **Reuse?** Partially — serif text already routes through `AdminText` as-is.
- **Refine?** **Yes — additive, render-neutral.** Multiple consumers benefit: every Admin page
  renders sans metadata and currently hand-rolls it. Refine `AdminText` with a `sans` variant that
  applies no font-family (today's sans render, unchanged), with sizing/weight/colour still supplied
  by `className` (or the existing `size` token map). This is the **single** change that makes
  "pages own layout only" true for the whole Admin module.

### Foundation Evolution Impact table

| Component | Change | Consumers Affected | Render Neutral? | Foundation Impact |
|---|---|---|---|---|
| `AdminText` (`components/common/AdminText.tsx`) | Adds `variant="sans"` (empty class-map entry — no font forcing; no scale/spacing/colour changes) | New: Page 1 migrated text; future: all Admin sans metadata | ✅ Yes — byte-identical, both themes, all breakpoints | Layer 2 Module Typography entry point; joins certified inventory (`17→18`) |
| `AntigravityUI` barrel | exports `AdminText` (Layer 2 entry point) | all consumers | ✅ Yes | certified entry point |
| Layer 1 Typography (`H1`…`Caption`) | **None** — retained | n/a | n/a | authoritative, unchanged |
| Page components (`UserIdentity`, `AdminUsersView`, `UserMobileCard`) | text nodes → `AdminText`; layout utilities remain page-owned | Page 1 only | ✅ Yes | zero page-owned typography |

---

## 6. Step 6 — Accessibility audit

| Check | Result | Evidence |
|---|---|---|
| Semantic heading hierarchy preserved | ✅ PASS | page title stays `H1` (sr-only, Layer 1); no heading element changed |
| No heading-level jumps introduced | ✅ PASS | metadata remains `span`-level text (same semantics as before) |
| Paragraph/label semantics unchanged | ✅ PASS | `Label` (Exams) retained as a real `<label>`; `AdminText` defaults to `span` for inline metadata |
| Screen-reader friendliness | ✅ PASS | no text hidden/merged; `sr-only` `H1` unchanged; `Mail` icon stays `aria-hidden` |
| Contrast inheritance | ✅ PASS | `text-text-primary/secondary/muted` colour tokens unchanged — contrast identical |
| Responsive scaling | ✅ PASS | sizes remain className-driven (`text-xs`/`text-sm`) exactly as before; `sans` adds no scale |
| Focus/keyboard | n/a | no interactive text nodes changed |

---

## 7. Step 7 — Consumer simplification metrics (before → after)

| Metric | Before | After |
|---|---|---|
| Page-owned raw typography text nodes (Page 1) | **7** | **0** |
| Page-owned typography wrappers | **7** | **0** |
| Duplicate typography wrappers | 0 | 0 |
| `AdminText` variants used by Page 1 | 1 (`garamond`) | 2 (`garamond`, `sans`) |
| Distinct Admin text nodes routed through `AdminText` | 1 | **8** |
| Layer 1 components on the page | `H1`, `Label` | `H1`, `Label` (unchanged) |
| Foundation Components Used | 17 / 22 | **18 / 22** |
