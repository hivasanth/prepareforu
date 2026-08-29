# FOUNDATION MIGRATION READINESS

- **Phase:** 5.5 (Foundation Visual Consistency Certification Audit — READ-ONLY)
- **Purpose:** migration risk assessment + recommended order for Phase 5.6 (repository migration
  of certified Foundation languages). Planning-only; no implementation begins here.

---

## 1. Migration risk summary

| Risk | Level | Description | Mitigation |
|---|---|---|---|
| Consumer/page-level stragglers (F-1, F-2, F-5, F-9) | **Critical** | 4 `transition-all`, 1 inline spinner, AuthContext FullLoader hex markup, page loader compositions remain outside Foundation | migrate with their owning page/feature; verify each during its migration slice |
| Legacy `color` prop on StatCard/MetricBlock (F-3) | **High** | raw hex path still reaches Foundation components; consumers pass hex directly | retire prop + tokenize consumer data (5.6) |
| Navigation route icon hex (F-4) | **High** | config data arrays hardcode icon colors | tokenize config at migration |
| Data-viz hex palettes (F-6) | **High** | SubjectPieChart/DiagramRenderer/QuestionVisualizer/ChartVisualizer/MapVisualizer + useUserPerformance | optional tokenize pass; data-viz is content-level |
| 21 thin wrappers (AdminText, Badge wrappers, Loader family) | **Medium** | wrapper clutter; AdminText retired at migration | retire/alias in 5.6, not in 5.5 |
| Verified baseline drift during migration | **Medium** | tsc/build/eslint/vitest must stay at known-good state per slice | re-run the 4 baselines after each migrated slice |
| C-1…C-5 contrast gates still OPEN | **Medium** | pre-existing separate scope; not part of 5.4A–5.4F | independent future approval (never batched) |
| `vitest.config.ts` cannot start (ERR_REQUIRE_ESM) | **Low** | pre-existing; `vitest.audit.config.ts` is the working config | keep using audit config for all verification |
| `rg` unavailable on this shell | **Low** | use Select-String/PowerShell for scans | follow repo convention for future scans |
| Repository move risk | **Low** | source tree move has no Foundation-internal risk | move via atomic slices with baseline re-verification |
| Mermaid/OpenAI heavy pages | **Very Low** | `npm run build` covers them; no per-page test needed | rely on full build baseline |

## 2. Recommended migration order (with reasons)

| Order | Slice | Reason |
|---|---|---|
| 1 | **Users** | smallest, cleanest slice; establishes the migrate-verify-repeat loop with minimal blast radius |
| 2 | **Questions** | exercises the most Foundation surfaces (tables, rows, loading, management variants) early |
| 3 | **Students** | similar surface usage to Users; validates reuse before heavier slices |
| 4 | **Exams** | heavy composition (ExamPageLoading, detail modals, timers); validates modal + loading consistency |
| 5 | **Sub Admins** | small surface; clears F-1 (SubAdminCreate), F-2 (SubAdminDashboard) inline stragglers |
| 6 | **Leaderboard** | certified gold accent surfaces (LeaderboardTopCard F-8); validates accent policy after core slices |
| 7 | **Remaining Pages** | all other pages + remaining config/data-viz cleanup (F-4, F-6) and optional loader consolidation (F-9) |

Each slice: migrate → re-run the 4 baselines (tsc/build/eslint/audit-vitest) → certify → next slice.

## 3. Explicit scope boundaries

- **Planning-only.** Nothing in this file authorizes implementation.
- **5.6 requires a completely separate approval** — independent of the 5.5 certification and
  independent of the 5.4E/5.4F certifications still awaiting user sign-off.
- **No changes were made** to source, tokens, CSS, components, pages, layouts, business logic,
  APIs, routing, services, state, themes, tests, governance, or design decisions during 5.5.

## 4. Migration entry checklist (to be satisfied when 5.6 opens)

1. User certifies 5.4E and 5.4F (outstanding from previous phases).
2. User certifies Phase 5.5 deliverables.
3. User provides a separate, explicit approval to open Phase 5.6.
4. Migration order approved (this report's §2 or a user-modified version).
5. Baseline commands agreed: `npx tsc -b --force`, `npm run build`, `npx eslint .`,
   `npx vitest run --config vitest.audit.config.ts`.
