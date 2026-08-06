# Phase 4.2 — Parchment / Ancient Surface Family Retirement — Certification

**Phase 4.2 (D-150) — repository surface-language retirement.**
**Status:** ✅ **CERTIFIED** (2026-08-04)
**Approved decision (user-confirmed):** **Option 1 — Parchment Family Only.** Retire the parchment/ancient surface family and the 12 hexes; **preserve the premium gold accent family**. All management surfaces become neutral via the certified Management Surface family.
**Scope:** `src/styles/themes.css`, `src/index.css`, and the parchment-consuming components named in the implementation report §3. **No new palette, no redesign, no page-owned colors.**
**Gate:** D-150 (implementation + decision) · D-141/D-142 (gold = accent only, one management language) · D-144/D-145 (certified neutral Management Surface family reused)

---

## Certification verdict

**Phase 4.2 (Parchment / Ancient Surface Family Retirement) = ✅ CERTIFIED.**

- The parchment/ancient surface family — the 12 hexes `#FFF8E7 #FDF5E2 #F4E5C4 #EFD9AF #E8D5B0 #E2CFA6 #DFC096 #D5B486 #C9A070 #C4A882 #A87828 #8B5A10` plus parchment-adjacent warm values — is fully retired from the repository surface language.
- All management surfaces now resolve through the **certified neutral Management Surface family** (D-144/D-145); no new palette was introduced.
- The **premium gold accent family is preserved intact** (`--gold-*`, `--color-secondary`, StatCard/premium gold material, nav/header gold) — gold is a distinct certified premium accent family (D-141: gold = accent only), not part of the parchment surface language.
- `.ancient-*` class names are preserved everywhere, satisfying the ds003/ds007/ds014 smoke locks.
- **Zero regressions introduced by Phase 4.2.** The 33 audit-suite failures (ds003/ds005/ds014) are pre-existing component/test class-drift, existed independently of this implementation, and were not modified by this work — documented and deferred (see §5).

---

## Certification gates

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | **Parchment family retired** — 12 hexes + parchment-adjacent warm values absent from token set | ✅ PASS | removed from `themes.css`/`index.css`; rg/Select-String scan clean (implementation report §3, §4) |
| 2 | **Reuse-only** — no new palette, no redesign, no page-owned colors | ✅ PASS | all replacements reference certified neutral Management Surface tokens / neutral semantic tokens; D-150 rejected alternative (c) |
| 3 | **Premium gold accent family preserved** | ✅ PASS | `--gold-*`, `#C8960C`, `#FFD700`, `#d4af37`, `#B8860B`, `--premium-green`, `font-cinzel/garamond/ancient`, `--color-secondary #C8960C`, warm nav/header gold, StatCard/premium gold material intact (implementation report §2, §3) |
| 4 | **No new Foundation API** | ✅ PASS | token remaps + `.ancient-*` definition neutralizations only; `@theme` additions are mapping utilities (`border-border-default`, `gold-300`) |
| 5 | **`.ancient-*` class names preserved** | ✅ PASS | ds003/ds007/ds014 smoke locks intact; ds007 **18/18 PASS** under `vitest.audit.config.ts` |
| 6 | **No unrelated component evolution** | ✅ PASS | only parchment consumers touched; `AntigravityForm`/`Badge`/`Avatar`/`AdminIconWrap` unchanged (drift deferred) |
| 7 | **TypeScript** | ✅ PASS | `npx tsc -b` exit 0 |
| 8 | **Build** | ✅ PASS | `npm run build` exit 0 (pre-existing warnings only) |
| 9 | **Phase 4.2 smoke suite (ds007)** | ✅ PASS | 18/18 PASS (audit config) |
| 10 | **No new regressions** | ✅ PASS | the 33 audit failures are pre-existing drift, documented §5 + deferred register DW-1…DW-4 §6 |
| 11 | **Lint** — zero new problems from this migration | ✅ PASS | only pre-existing `@typescript-eslint/no-explicit-any` etc. (unrelated) |
| 12 | **Dark mode unchanged** | ✅ PASS | dark `:root` untouched except removed retired primitives + remapped ancient aliases; `--gradient-header` kept in both themes |

---

## Scope of this certification

**Repository surface-language retirement only.** No page is re-certified by this document. Per D-142 migration order, page migrations continue exactly as gated: Foundation → Admin Users (✅) → **Admin Questions (gated)** → Students → Exams → Sub Admins → Leaderboard → future management pages → repository certification.

**Explicitly out of scope (accepted + deferred, NOT Phase 4.2 blockers):**

| Suite | Affected component | Failure count | Future phase |
|---|---|---|---|
| `ds003-runtime-audit.test.tsx` | `AntigravityForm` (`Input`/`TextArea`/`Select`) | 21 | Forms System (DS-003) audit + ds003 reconciliation |
| `ds005-runtime-audit.test.tsx` | `Badge` | 10 | Status family audit + ds005 reconciliation |
| `ds014-runtime-audit.test.tsx` | `Avatar`/`AdminIconWrap` | 2 | Identity family test reconciliation |

> These failures existed independently of the Phase 4.2 implementation and were not modified by this work. They were surfaced only because the default jsdom test config cannot start component-test workers in this environment; the audit config exposes the drift. Each is tracked in the deferred-work register (DW-1…DW-4, implementation report §6).

---

## Deliverables

- Implementation report: `docs/certification/PHASE_4_2_PARCHMENT_RETIREMENT_IMPLEMENTATION_REPORT.md`
- Certification: this document
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-150 + rejected alternatives)
- Governance: `FOUNDATION_FREEZE_REGISTER.md` (Phase 4.2 entry) · `PHASE_3_1_EXECUTION_LOG.md` (Phase 4.2 entries) · `docs/certification/PAGE_CERTIFICATION_INDEX.md` (Phase 4.2 row)

**Approval gate:** the next page phase (Admin Questions migration) may begin only when the user approves this certification; the deferred drift items (DW-1…DW-4) open their own dedicated phases.
