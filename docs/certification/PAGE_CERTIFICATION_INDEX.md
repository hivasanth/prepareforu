# PAGE CERTIFICATION INDEX — Phase 3.5 (Page-by-Page Certification & Foundation Adoption)

**Authority:** Registry of page-level certification milestones. Each Phase 3.5 page is certified
page-by-page; **no page begins before the previous page is certified**, and no P2 (render-affecting)
item is implemented without explicit per-item approval.

**Legend:** ✅ Certified · ⏳ In progress · ⬜ Not started · ⏸ P2 pending approval

---

## Phase 3.5 pages

| # | Page | Route | Audit | Plan | Report | Certification | P0 | P1 | P2 | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Admin Users | `/admin/users` | [AUDIT](certification/ADMIN_USERS_PAGE_AUDIT.md) | [PLAN](certification/ADMIN_USERS_IMPLEMENTATION_PLAN.md) | [REPORT](certification/ADMIN_USERS_IMPLEMENTATION_REPORT.md) | [CERT](certification/ADMIN_USERS_P0_P1_CERTIFICATION.md) | ✅ Certified | ✅ Certified | ✅ Certified | U-1 ✅ Certified (Surface); U-20 ✅ Certified (Overlay, no change); U-5 ✅ Certified (Avatar, DS-014); U-4 ✅ Certified (Identity, `UserIdentity` page-scoped); U-3 ✅ Certified (AdminText, Layer 2 Module Typography, `sans` variant); U-2 Phase A ✅ Certified (canonical tokens T-3/4/5 + T-1/T-2 retirements, render-neutral, D-132; Phase B T-6/T-7 gated); U-6 pending; **3.6B ✅** Management Page Standard **2nd implementation certified** (D-134) — legacy `AdminCard`/`DataGrid`/`UserMobileCard` removed, composed onto the Standard skeleton (Collection family) | Foundation: DataGrid aria props, TableSkeleton, Avatar (DS-014), AdminText (Layer 2, `sans`), canonical typography tokens (metadata/small/heading); identity family 100% Foundation-owned; typography 100% Foundation-owned (0 page-owned typography, 0 raw sizes); Raw UI 0; adoption 68%→82% (U-1→U-3), U-2 Phase A token system single-language; **3.6B:** Standard skeleton (PageContainer → Stack → SelectionContainer → CollectionToolbar → CollectionHeader → CollectionCard list → Pagination → ConfirmModal → ToastContainer), 0 raw UI, 0 page-owned visuals, selection state page-owned |
| 2 | Admin Sub-Admins | `/admin/sub-admins` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Next page after Admin Users P2 gate |
| 3 | Admin Leaderboard | `/admin/leaderboard` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 4 | Admin Overview | `/admin/overview` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 5 | Admin Questions | `/admin/questions` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 6 | Admin Topics | `/admin/topics` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 7 | Admin Upload | `/admin/upload` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 8 | Admin Settings | `/admin/settings` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 9 | Sub-Admin Students | `/sub-admin/students` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 10 | Sub-Admin Exams | `/sub-admin/exams` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 11 | Sub-Admin Create / Settings | `/sub-admin/create` etc. | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |

---

## P2 pending items — Admin Users (Page 1)

Each render-affecting item opens its **own** approval gate (never bundled). U-1 delivered;
remaining items are not yet approved.

| Item | Finding | Gate dependency | Status |
|---|---|---|---|
| U-1 | `ancient-card` panel surface | Surface-family resolution (D-127) | ✅ **CERTIFIED** — `ADMIN_USERS_U1_CERTIFICATION.md` |
| U-2 | raw type utilities | T-3 composite (D-126) | ✅ **CERTIFIED (Phase A)** — `ADMIN_USERS_U2_CERTIFICATION.md` (D-132; canonical tokens T-3/4/5 + T-1/T-2 retirements, render-neutral; Phase B T-6/T-7 gated) |
| U-3 | `AdminText` parallel primitive | T-3 / D-2 | ✅ **CERTIFIED** — `ADMIN_USERS_U3_CERTIFICATION.md` (D-131, Layer 2 Module Typography + render-neutral `sans` variant; adoption 82%) |
| U-4 | duplicate name rendering | visual-unification decision (desktop look wins) | ✅ **CERTIFIED** — `ADMIN_USERS_U4_CERTIFICATION.md` (D-130, `UserIdentity` page-scoped) |
| U-5 | new certified `Avatar` primitive | Foundation item approval | ✅ **CERTIFIED** — `ADMIN_USERS_U5_AVATAR_CERTIFICATION.md` (DS-014) |
| U-20 | `ConfirmModal` → Overlay family | O-1 (D-126) | ✅ **CERTIFIED — no change** (reuse `AdminModal`, D-128) — `ADMIN_USERS_U20_CERTIFICATION.md` |

---

## Phase 3.6 — Management Page Standard (architecture contract)

Every management page is built from the Standard (D-133) and certified against the Certification
Standard — **never copied from another page**. First two implementations certified; remaining pages
are ⬜ pending.

| Page | Status | Evidence |
|---|---|---|
| Admin Questions | ✅ **CERTIFIED — first implementation** (re-designated in 3.6A, unchanged) | `docs/design-system/MANAGEMENT_PAGE_STANDARD.md`, `MANAGEMENT_PAGE_CERTIFICATION_STANDARD.md` |
| Admin Users | ✅ **CERTIFIED — second implementation** (3.6B, D-134) | [IMPLEMENTATION REPORT](certification/ADMIN_USERS_MANAGEMENT_STANDARD_IMPLEMENTATION_REPORT.md) · [VISUAL COMPARISON](certification/ADMIN_USERS_MANAGEMENT_STANDARD_VISUAL_COMPARISON.md) · [CERTIFICATION](certification/ADMIN_USERS_MANAGEMENT_STANDARD_CERTIFICATION.md) |
| Admin Students | ⬜ pending | — |
| Admin Exams | ⬜ pending | — |
| Admin Sub Admins | ⬜ pending | — |
| Admin History / Leaderboards / Attempt History / Question Banks | ⬜ pending | — |

---

## Phase 3.6C — Admin Users refinement (post-Standard, UX + security)

Audited then refined the certified Users page. All four sub-phases approved by spec and **certified**
(2026-08-03). Each sub-phase is 3 docs (report · comparison · certification).

| Sub-phase | Change | Docs (report / comparison / certification) | Governance |
|---|---|---|---|
| 3.6C.1 Selection simplification | Removed meaningless selection (row checkbox, select-all, `selectedIds`); `CollectionHeader` select-all optional (range-only form) — supersedes 3.6B D-8 | [REPORT](certification/ADMIN_USERS_SELECTION_SIMPLIFICATION_IMPLEMENTATION_REPORT.md) · [COMP](certification/ADMIN_USERS_SELECTION_SIMPLIFICATION_VISUAL_COMPARISON.md) · [CERT](certification/ADMIN_USERS_SELECTION_SIMPLIFICATION_CERTIFICATION.md) | D-135 |
| 3.6C.2 Structured metadata | Inline token metadata → labelled equal-width columns **EXAM / ATTEMPTS / JOINED** (resolves M-1…M-6) | [REPORT](certification/ADMIN_USERS_METADATA_COLUMNS_IMPLEMENTATION_REPORT.md) · [COMP](certification/ADMIN_USERS_METADATA_COLUMNS_VISUAL_COMPARISON.md) · [CERT](certification/ADMIN_USERS_METADATA_COLUMNS_CERTIFICATION.md) | D-136 |
| 3.6C.3 Action hardening | Confirm safety (C-1/C-2/C-3), per-row in-flight (A-1/A-2), double-submit + modal lock (H-2); UI/UX/hook only | [REPORT](certification/ADMIN_USERS_ACTION_HARDENING_IMPLEMENTATION_REPORT.md) · [COMP](certification/ADMIN_USERS_ACTION_HARDENING_VISUAL_COMPARISON.md) · [CERT](certification/ADMIN_USERS_ACTION_HARDENING_CERTIFICATION.md) | D-137 |
| 3.6C.4 Status security | Service guard (S-1/S-2), repo affected-row (R-1), RLS+trigger hardening (SEC-1/2/3) + regression tests | [REPORT](certification/ADMIN_USERS_STATUS_SECURITY_IMPLEMENTATION_REPORT.md) · [COMP](certification/ADMIN_USERS_STATUS_SECURITY_VISUAL_COMPARISON.md) · [CERT](certification/ADMIN_USERS_STATUS_SECURITY_CERTIFICATION.md) | D-138 |

---

## Phase 3.6D — Admin Users Column Alignment (fixed data columns)

Refined the certified Users list into a fixed-column management table inside each `CollectionCard`
(2026-08-03). Per-row headings (`EXAM`/`ATTEMPTS`/`JOINED` — the 3.6C.2 `Label`s) were removed; every
row now shares six fixed-width data columns: `Identity (2fr) · Exam 160px · Attempts 100px · Joined
140px · Status 130px · Actions auto`. CollectionCard composition only — no Foundation, logic, services,
hooks, or DB changes.

| Phase | Change | Docs (report / comparison / certification) | Governance |
|---|---|---|---|
| 3.6D | Headings removed from rows; fixed columns Identity/Exam/Attempts/Joined/Status/Actions; single-line table at xl, controlled wrap below; **supersedes the 3.6C.2 per-row labels** | [REPORT](certification/ADMIN_USERS_COLUMN_ALIGNMENT_IMPLEMENTATION_REPORT.md) · [COMP](certification/ADMIN_USERS_COLUMN_ALIGNMENT_VISUAL_COMPARISON.md) · [CERT](certification/ADMIN_USERS_COLUMN_ALIGNMENT_CERTIFICATION.md) | D-139 |

---

## History

| Date | Milestone | Doc |
|---|---|---|
| 2026-08-02 | Phase 3.5 Page 1 (Admin Users) P0 certified — render-neutral | `ADMIN_USERS_P0_P1_CERTIFICATION.md` |
| 2026-08-02 | Phase 3.5 Page 1 (Admin Users) P1 certified — behavioural | `ADMIN_USERS_P0_P1_CERTIFICATION.md` |
| 2026-08-02 | Page frozen pending P2 visual enhancements | `ADMIN_USERS_P0_P1_CERTIFICATION.md` §6 |
| 2026-08-02 | Phase 3.5 Page 1 U-1 (Surface Family) certified — adoption 76% | `ADMIN_USERS_U1_CERTIFICATION.md` |
| 2026-08-02 | Phase 3.5 Page 1 U-20 (Overlay Family) certified — no change, reuse confirmed | `ADMIN_USERS_U20_CERTIFICATION.md` |
| 2026-08-02 | Phase 3.5 Page 1 U-5 (Avatar Foundation) certified — new `Avatar` primitive (DS-014), adoption 77% | `ADMIN_USERS_U5_AVATAR_CERTIFICATION.md` |
| 2026-08-03 | Phase 3.5 Page 1 U-4 (Identity Rendering) certified — `UserIdentity` page-scoped composition over DS-014; duplicate identity rendering removed; Raw UI 1→0 | `ADMIN_USERS_U4_CERTIFICATION.md` |
| 2026-08-03 | Phase 3.5 Page 1 U-3 (AdminText) certified — AdminText = Admin module typography entry point (Layer 2, render-neutral `sans` variant); 0 page-owned typography; adoption 82% | `ADMIN_USERS_U3_CERTIFICATION.md` |
| 2026-08-03 | Phase 3.5 Page 1 U-2 (Typography Scale) Phase A certified — canonical tokens T-3/4/5 (metadata/small/heading), phantom Layer-1 sizes + dead legacy utilities retired (T-1/T-2), page 0 raw sizes; Phase B (T-6/T-7) gated | `ADMIN_USERS_U2_CERTIFICATION.md` |
| 2026-08-03 | Phase 3.6A Management Page Standard certified — repository-wide architecture contract (skeleton, CollectionCard, surface hierarchy, 24/12/8, visual-ownership); Admin Questions re-designated first implementation; D-133 | `docs/design-system/MANAGEMENT_PAGE_STANDARD.md` |
| 2026-08-03 | Phase 3.6B Admin Users certified — second Standard implementation; legacy `AdminCard`/`DataGrid`/`UserMobileCard` removed, composed onto Standard skeleton; 0 raw UI, 0 page-owned visuals; D-134 | `ADMIN_USERS_MANAGEMENT_STANDARD_CERTIFICATION.md` |
| 2026-08-03 | Phase 3.6C.1 Selection simplification certified — selection removed (no bulk op existed), `CollectionHeader` select-all optional/range-only; supersedes D-8; D-135 | `ADMIN_USERS_SELECTION_SIMPLIFICATION_CERTIFICATION.md` |
| 2026-08-03 | Phase 3.6C.2 Structured metadata certified — labelled 3-column EXAM/ATTEMPTS/JOINED, resolves M-1…M-6; D-136 | `ADMIN_USERS_METADATA_COLUMNS_CERTIFICATION.md` |
| 2026-08-03 | Phase 3.6C.3 Action hardening certified — confirm safety (name/email/status/action + consequence + focus-cancel), per-row loading, double-submit lock, modal in-flight lock; UI/UX/hook only; D-137 | `ADMIN_USERS_ACTION_HARDENING_CERTIFICATION.md` |
| 2026-08-03 | Phase 3.6C.4 Status security certified — service guard (self/admin/sub-admin rejected), repo affected-row, RLS `is_active` self-guard + trigger, last-admin lockout trigger, regression tests; D-138 | `ADMIN_USERS_STATUS_SECURITY_CERTIFICATION.md` |
| 2026-08-03 | Phase 3.6D Column alignment certified — per-row headings removed; six fixed-width data columns (Identity 2fr · Exam 160 · Attempts 100 · Joined 140 · Status 130 · Actions); supersedes 3.6C.2 per-row labels; D-139 | `ADMIN_USERS_COLUMN_ALIGNMENT_CERTIFICATION.md` |
| 2026-08-03 | Phase 3.7 Visual Audit (discovery) certified — neutral Management Surface Family direction approved; D-140 | `ADMIN_USERS_SURFACE_AUDIT.md` |
| 2026-08-03 | Phase 3.8 Foundation Architecture approved — Foundation Before Migration; one management language; gold = accent only; D-141/D-142 | `MANAGEMENT_SURFACE_FOUNDATION_ARCHITECTURE.md` |
| 2026-08-03 | Phase 3.9 Foundation Management Surface certified — additive `--management-*` family, `Card`/`CollectionCard` `management` variants + consumer hooks; zero page migration; D-144/D-145 | `FOUNDATION_MANAGEMENT_SURFACE_CERTIFICATION.md` |
| 2026-08-03 | **Phase 4.0 Admin Users Management Surface certified — validation implementation of the certified Management Surface Family** (D-146): Toolbar/Search/Filter → management, Collection rows + skeleton → management, EmptyState/Toast → management; zero Foundation changes, zero business-logic changes; remaining premium = shared composites G1–G3 documented | `ADMIN_USERS_MANAGEMENT_SURFACE_CERTIFICATION.md` |
| 2026-08-03 | **Phase 4.0 Admin Users certification APPROVED — First Certified Management Surface Consumer + repository reference implementation** (D-147); 7 surfaces certified; G1–G3 deferred to dedicated shared-component phases; migration order unchanged; Phase 4.1 (Admin Questions planning/audit, read-only) gated on a separate approval | — (see D-147 + Phase 4.0 section) |
| 2026-08-03 | **Phase 4.1 Admin Questions Management Surface Planning & Audit COMPLETE** (D-148) — read-only; 24 ready swap points (M1–M13) across 10 certified APIs; shared gates G1/G2/G4 (BulkActionBar new); page gaps G5–G10 incl. **G7 `TextArea` (no management variant — Foundation gate)**; business logic 0-line-diff; responsive/a11y parity verified; zero source changes; migration gated on separate approval | `ADMIN_QUESTIONS_MANAGEMENT_SURFACE_{AUDIT,FOUNDATION_COMPARISON,IMPLEMENTATION_PLAN}.md` |
| 2026-08-03 | **Phase 4.1 planning & audit APPROVED + dedicated TextArea Foundation evolution phase OPEN** (D-149) — G7 closed by a TextArea-only Foundation phase (audit → design additive `variant="management"` → backward-compat → certify → STOP); G1/G2/G4/G5/G8/G9/G10 deferred exactly as documented; Admin Questions migration still gated; order: Foundation (TextArea) → Admin Questions → Students → Exams → Sub Admins → Leaderboard | — (see D-149 + Phase 4.1A section) |
| 2026-08-04 | **Phase 4.2 Parchment / Ancient Surface Family Retirement IMPLEMENTED** (D-150) — repository surface-language retirement; 12 hexes + parchment-adjacent warm values retired; management surfaces → certified neutral Management Surface family; **premium gold accent family preserved** (Option 1, user-confirmed); `.ancient-*` class names preserved (ds007 smoke lock 18/18 PASS); zero new palette/Foundation API; pre-existing test drift (ds003/ds005/ds014) accepted + deferred (DW-1…DW-4); certification pending | `PHASE_4_2_PARCHMENT_RETIREMENT_IMPLEMENTATION_REPORT.md` · `PHASE_4_2_PARCHMENT_RETIREMENT_CERTIFICATION.md` |

---

## Phase 4.0 — Admin Users Management Surface Migration (validation implementation)

Consumer migration onto the certified Management Surface Family (D-146). **Foundation untouched; no new APIs.**

| Page | Status | Evidence |
|---|---|---|
| Admin Users | ✅ **CERTIFIED & APPROVED — First Certified Management Surface Consumer** (2026-08-03, D-147) | [REPORT](certification/ADMIN_USERS_MANAGEMENT_SURFACE_IMPLEMENTATION_REPORT.md) · [COMP](certification/ADMIN_USERS_MANAGEMENT_SURFACE_VISUAL_COMPARISON.md) · [CERT](certification/ADMIN_USERS_MANAGEMENT_SURFACE_CERTIFICATION.md) |

**Remaining premium surfaces on Admin Users (shared composites, out of file-scope, documented G1–G3):** selection layer (`AdminSelectionTabs` → `SelectionContainer`, used by 7+ admin pages); confirmation dialog (`ConfirmModal` → `AdminModal`); EmptyState internal action button. Each requires its own shared-component gate — not a Users-page or Foundation change.

## Phase 4.1 — Admin Questions Management Surface Planning & Audit (read-only, D-148)

Planning and audit only — **no implementation**. Scope strictly `AdminQuestions.tsx` + `questions/**`.

| Page | Status | Evidence |
|---|---|---|
| Admin Questions | ⬜ **Phase 4.1 planning & audit COMPLETE (read-only)** — migration not started; gated on a separate, dedicated approval (D-148) | [AUDIT](certification/ADMIN_QUESTIONS_MANAGEMENT_SURFACE_AUDIT.md) · [COMP](certification/ADMIN_QUESTIONS_MANAGEMENT_SURFACE_FOUNDATION_COMPARISON.md) · [PLAN](certification/ADMIN_QUESTIONS_MANAGEMENT_SURFACE_IMPLEMENTATION_PLAN.md) |

**Pre-migration decisions required (D-148):** G7 `TextArea` — open a dedicated Foundation evolution gate for `TextArea variant="management"` (or migrate with `TextArea` retained premium); G5 serial badge; G4 `BulkActionBar` shared gate; G8/G9/G10 small decisions.

**Remaining premium surfaces on Admin Users (shared composites, out of file-scope, documented G1–G3):** selection layer (`AdminSelectionTabs` → `SelectionContainer`, used by 7+ admin pages); confirmation dialog (`ConfirmModal` → `AdminModal`); EmptyState internal action button. Each requires its own shared-component gate — not a Users-page or Foundation change.

## Phase 4.1A — TextArea Foundation Evolution (dedicated, TextArea-only, D-149) ⏳ OPEN

Foundation evolution — **not** consumer migration. Resolves the Phase 4.1 **G7** gap (`TextArea` had no `management` variant) before any Admin Questions migration. G1/G2/G4/G5/G8/G9/G10 stay deferred exactly as documented (not part of this phase).

| Component | Status | Evidence |
|---|---|---|
| `TextArea` (`src/components/common/AntigravityForm.tsx`) | ✅ **Phase 4.1A IMPLEMENTED** (2026-08-03) — additive `variant="management"` mirrors certified `Input` recipe; zero consumer migration; `tsc`/build/lint-green; certification pending approval (D-150) | [REPORT](certification/TEXTAREA_MANAGEMENT_SURFACE_IMPLEMENTATION_REPORT.md) · [CERT](certification/TEXTAREA_MANAGEMENT_SURFACE_CERTIFICATION.md) |

**Admin Questions migration remains gated** — it opens only on a separate dedicated approval after the TextArea phase is certified. Order (no skipping): Foundation (**TextArea**) → Admin Questions Migration → Students → Exams → Sub Admins → Leaderboard.

## Phase 4.2 — Parchment / Ancient Surface Family Retirement (D-150) ✅ IMPLEMENTED

Repository surface-language retirement — **reuse-only** (certified neutral Management Surface family). **Option 1: parchment family only; premium gold accent family preserved** (user-confirmed). No new palette, no redesign, no page-owned colors.

| Scope | Status | Evidence |
|---|---|---|
| Parchment/ancient surface family (12 hexes + parchment-adjacent warm values + brown scale + pie parchment) | ✅ **RETIRED** (2026-08-04) — removed from `themes.css`/`index.css`; parchment surfaces in `TopicReader`, `TopicSectionRenderer`, `BulkActionBar`, `AdminSubAdminsView`, `SubjectPieChart` → neutral Management recipe | [REPORT](certification/PHASE_4_2_PARCHMENT_RETIREMENT_IMPLEMENTATION_REPORT.md) · [CERT](certification/PHASE_4_2_PARCHMENT_RETIREMENT_CERTIFICATION.md) |
| Premium gold accent family | ✅ **PRESERVED** — `--gold-*`, `--color-secondary`, StatCard/premium gold material, nav/header gold, `CarouselDots`/`SplashPage`/`AntigravityCard` gold accents unchanged | D-150 |
| `.ancient-*` class names | ✅ **PRESERVED** — smoke locks (ds007 18/18 PASS under audit config) still resolve | D-150 |

**Pre-existing test drift accepted + deferred (not Phase 4.2 blockers):** ds003 (21, `AntigravityForm`), ds005 (10, `Badge`), ds014 (2, `Avatar`/`AdminIconWrap`); deferred-work register DW-1…DW-4 in the implementation report §6. **Admin Questions migration remains gated** behind its own dedicated approval.
