# FOUNDATION_VISUAL_CERTIFICATION — Phase 6.X

- **Phase:** 6.X (Foundation Visual Refinement; Tasks 1–7, 9 + 5 screenshot refinements; Task 8 audit)
- **Status:** **CERTIFICATION PACKAGE — awaiting user approval 2026-08-07** (IMPLEMENTED, not yet
  certified)
- **Key property:** this phase **refines** the already-certified Foundation surface (DS-016…DS-019)
  on top of the certified languages — it adds no new color family, no new token namespace, no
  page-specific override, and performs **no page migration**. Certification approves the refinement
  set and freezes it under **DS-020**; it does NOT authorise any repository migration.

---

## 1. Scope certified

| Task | Refinement | D-entry |
|---|---|---|
| T1/T7 | Banner typography: full-alpha `text-on-dark` hero (uppercased name); no `text-warning` primary chain; opacity-as-emphasis banned | D-175 |
| T2 | Stat label light contrast `text-hint`→`text-text-secondary` | D-176 |
| T3 | Activity/metadata audit (already semantic — report only) | — |
| T5 | ONE card hover language (`CARD_HOVER`) across all variants + TopicCard/SubjectCardItem/LeaderboardView | D-177 |
| T6 | Premium skeleton surface/elevation matches final cards | — |
| T7 | No opacity-as-emphasis | D-175 |
| T8 | Auditing deliverable | — |
| T9 | Dead `.ancient-*` recipes removed | D-178 |
| SS | Screenshot refinements (stat ladder, nav-active contrast, hero overlay, spacing) | — |

---

## 2. What certification approves

Certification approves the **Foundation refinement set** as implemented and frozen **DS-020**
(`FOUNDATION_FREEZE_REGISTER.md`), including:

- banner typography contract (hero text full-alpha on-dark; `text-warning` reserved for status);
- **ONE card hover language** (color-only refinement of the existing `CARD_HOVER`; no lift/scale);
- premium skeleton elevation parity;
- `.light` surface brightness re-assignment of the existing `--bg-*`/`--skeleton-*` names;
- removal of the dead `.ancient-*` recipes;
- the five screenshot refinements (StatCard numeric ladder, nav-active contrast, hero overlay,
  Recent Activity spacing).

It does **not** approve: any color-name addition, any page-specific overrides, or any repository
page migration.

---

## 3. Gates required for certification (Task 10) — all PASS at baseline

| Gate | Result | Evidence |
|---|---|---|
| TypeScript | PASS | `npx tsc -b` exit 0 |
| Production build | PASS | `npm run build` exit 0 (chunk-size warnings only) |
| ESLint (changed files) | PASS | exit 0 on `WelcomeBanner`/`AntigravityCard`/`Skeleton`/`themes.css`/`index.css`/`TopicCard`/`SubjectCardItem`/`LeaderboardView`/`DashboardRecentActivity` |
| Tests | PASS | `npm test` 165/165; 7 worker ESM errors identical baseline |
| Banned-pattern sweep | PASS | zero `text-warning` banner primary chain; zero `hover:shadow-card-premium`; zero `.ancient-*` consumers; zero opacity-as-emphasis on primary text |
| No-new-color sweep | PASS | `.light` diff = reassignments + 2 additive light-nav tokens; no new semantic name |

---

## 4. Approving

| Accept (recommended) | Request changes | Hold for manual visual review |
|---|---|---|
| The refinement set is correct, freeze-compatible, gate-green | list specific refinements | run the M1–M8 manual checks in `FOUNDATION_VISUAL_VERIFICATION.md` first |

**Manual visual checks M1–M8** are recommended before certification (banner, stat labels, uniform
card hover, skeleton match, light surfaces, active nav, tabular metrics, reduced-motion).

---

## 5. Post-certification posture

On user acceptance:

- **Phase 6.X CLOSES.** The refinement set is frozen under **DS-020**.
- **No repository migration begins** on this certification — 5.4G/6.X page migration continues to
  require a **separate dedicated approval per page** (per `FOUNDATION_MIGRATION_READINESS.md` and the
  Phase 5.5 certification gate).
- `FOUNDATION_GOVERNANCE.md` is at **v1.27.0**; `DESIGN_DECISION_LOG.md` **D-175…D-178**;
  `PHASE_3_1_EXECUTION_LOG.md` records the Phase 6.X entry.

---

## 6. Decision record

- **Governance:** `FOUNDATION_GOVERNANCE.md` v1.27.0 (Foundation-only evolution; §4 amended).
- **Decisions:** `DESIGN_DECISION_LOG.md` D-175 (banner typography), D-176 (stat label), D-177
  (ONE card hover), D-178 (dead recipes) + corresponding rejected-alternatives rows.
- **Freeze:** `FOUNDATION_FREEZE_REGISTER.md` DS-020 (Visual Refinement) + Phase 6.X entry.
- **Deliverables:** `FOUNDATION_VISUAL_REFINEMENT_REPORT.md` (audit, `docs/audit/`),
  `FOUNDATION_VISUAL_VERIFICATION.md`, `FOUNDATION_CONSUMER_IMPACT_REPORT.md`, this certification.
- **Execution:** `PHASE_3_1_EXECUTION_LOG.md` Phase 6.X entry.

**Recommendation: APPROVE Phase 6.X (DS-020) and STOP.** No further work proceeds without a separate
approval.