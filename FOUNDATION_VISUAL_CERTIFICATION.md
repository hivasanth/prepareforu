# Phase 5.4 — Foundation Visual Certification

**Status:** ⏳ AWAITING APPROVAL (certification criteria defined — baseline recorded below)
**Date:** 2026-08-06
**Parent audit:** `VISUAL_LANGUAGE_AUDIT.md`
**Sibling specs:** `SURFACE_LANGUAGE_SPECIFICATION.md`, `BUTTON_LANGUAGE_SPECIFICATION.md`,
`TYPOGRAPHY_LANGUAGE_SPECIFICATION.md`, `HOVER_LANGUAGE_SPECIFICATION.md`,
`PILL_LANGUAGE_SPECIFICATION.md`, `SKELETON_LANGUAGE_SPECIFICATION.md`,
`MOTION_LANGUAGE_SPECIFICATION.md`, `FOUNDATION_VISUAL_MIGRATION_PLAN.md`

---

## 1. Purpose

Define how Phase 5.4's "one visual language" is *proven* — the exact command set, pass criteria,
and certification gates. This document records the pre-implementation baseline so any later run is
compared against a known-good snapshot.

---

## 2. Certification checklist (12 criteria)

| # | Criterion | Command / check | Pass = |
|---|---|---|---|
| 1 | TypeScript | `npx tsc -b` | exit 0, no errors |
| 2 | Build | `npm run build` | exit 0 (chunk-size warnings pre-existing, non-blocking) |
| 3 | Lint | `npx eslint .` | **no NEW** problems vs baseline (397 existing problems are pre-existing, non-visual) |
| 4 | Responsive | manual: 375 / 768 / 1280 / 1536 | no overflow, no layout breaks on migration pages |
| 5 | Accessibility | contrast per TYPOGRAPHY spec + `role="status"` on skeletons + focus-visible rings | all AA pairings pass; a11y roles present |
| 6 | Dark mode | `npx vitest run -c vitest.audit.config.ts` dark subset + manual | **pixel-identical to pre-migration** (management relight touches light ONLY) |
| 7 | Light mode | manual + automated sweep | relight applied; **not** white/parchment/amber/yellow/cream/brown |
| 8 | Hover | HOVER spec recipes | no `transition-all`, no free durations, all recipes certified |
| 9 | Focus | `focus-visible:` rings | consistent across interactive elements |
| 10 | Disabled | `disabled:opacity-* cursor-not-allowed pointer-events-none` | consistent |
| 11 | Loading | SKELETON spec family + `animate-pulse` | management surfaces use management skeletons (no dark-mode divergence) |
| 12 | Motion | MOTION spec scale | durations only from scale; no unjustified `transition-all` |
| 13 | Pixel-consistency | screenshot diff of migration pages pre/post | only intended token-level changes |
| 14 | Governance | Freeze Register + Execution Log + this Certification | every change has a Design Decision; no undocumented tokens |

---

## 3. Verification baseline (pre-implementation, 2026-08-06)

Recorded before ANY Phase 5.4 change:

### 3.1 Static checks
| Command | Result | Notes |
|---|---|---|
| `npx tsc -b` | ✅ exit 0 | clean |
| `npm run build` | ✅ exit 0 | only pre-existing chunk-size warnings |
| `npx eslint .` | ⚠️ 397 problems (344 errors / 53 warnings) | all in `src/utils/queryCache.ts`, `retryUtils.ts`, `safeSupabase.ts`, `src/validations/*`, supabase, tests — non-visual; baseline for "no new" |
| Raw hex in `src` | 3 matches | `src/components/PremiumLoader.tsx` lines 8/12/13 (S-7) |
| `transition-all` | several | H-sweep targets (M-2) |

### 3.2 Runtime audit (`npx vitest run -c vitest.audit.config.ts`)
| Metric | Result |
|---|---|
| Files | 3 failed / 9 passed (12) |
| Tests | 33 failed / 301 passed (334) |
| Root cause | **class-name drift between stale tests and certified renders** (Phase 3.1/4.2 components moved to token-mapped recipes the tests still assert old classes) |

### 3.3 Runtime-audit triage decision (recorded, NOT a Phase 5.4 change)
| Test | Asserts (stale) | Component renders (certified) | Disposition |
|---|---|---|---|
| ds003 | `bg-hover-bg border-border-subtle … text-text-primary`, `focus:border-primary` | token-mapped `bg-input-bg border-input-border rounded-xl text-input-text`, `focus:border-input-focus-border` (FIELD_SURFACE/FIELD_FOCUS) | test update (D-121) |
| ds005 | `bg-*/10 text-*` (no border) | `bg-*/15 text-* border-*/30` | test update (PILL spec — Badge render is source of truth) |
| ds014 | `square → rounded-lg` avatar, light medallion | `rounded-xl` avatar, current light/dark medallion | test update |

**Decision:** the certified renders are the source of truth. Updating these three tests is part of
the migration (test-triage work item), so certification Criterion 6 (dark pixel-identical) and the
post-migration runtime suite run against corrected expectations.

---

## 4. Approval gates

1. **Gate A — Spec approval (current state).** All 10 deliverable docs approved by the user
   (Audit, 7 Language specs, Migration Plan, Certification). No code changes until Gate A passes.
2. **Gate B — Implementation kickoff.** Only after explicit approval: issues S-*/E-*/B-*/T-*/H-*/
   P-*/SK-*/M-* are implemented in dependency order (tokens → components → consumers → docs).
3. **Gate C — Certification run.** Re-run §2 checklist after implementation; all 14 criteria pass;
   post-migration runtime suite is green; dark mode pixel-identical vs baseline screenshots.
4. **Gate D — Freeze & archive.** Execution Log entry, Freeze Register updates, docs archived to
   `docs/`, certification signed.

**STOP CONDITION (Phase 5.4 architecture-first):** Phase 5.4 stops at **Gate A**. All 10 docs are
written; **no implementation work is performed** until the user approves the specs.

---

## 5. Change log
| Date | Change |
|---|---|
| 2026-08-06 | Baseline recorded; 12-criteria (14-row) checklist defined; triage decision recorded |
