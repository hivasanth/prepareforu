# Phase 5.3E - Render-Affecting Token Corrections Certification

- **Phase:** 5.3E - first render-affecting Foundation correction phase
- **Status:** CERTIFIED
- **Date:** 2026-08-04
- **Certifier:** Phase governance
- **Acceptance:** USER CERTIFIED 2026-08-04 - accepted the implementation report + certification + visual verification. T1-T4 + Group B verification approved; visual verification accepted; cleanup dashboard accepted as the new certified Foundation baseline; Foundation cleanup program declared COMPLETE. Phase 6.0 (Repository Foundation Certification Audit) is the recommended next phase and requires separate approval.
- **Scope:** T1 `--input-border` alignment, T2 Radius Option A, T3 Group A color alias repoint, T4 `text-stat-value` dead registration removal (render-neutral). Group B verify-only.

---

## 1. Correction Evidence

### 1.1 T1 - `--input-border` → `--border-subtle`

| Proof element | Evidence |
|---|---|
| Definition change | `index.css:274` `var(--border-input)` → `var(--border-subtle)` |
| Canonical owner | themes.css:645 `--input-border: var(--border-subtle)` (D-121 golden `.ancient-input`) |
| Resolved values | dark `#4B5563` → `#374151`; light `#CBD5E1` → `#E2E8F0` |
| Affected consumers | AntigravityForm.tsx:7, PremiumSelect.tsx:176 (via `border-input-border`) |
| Compiled CSS | `--input-border:var(--border-subtle)` present; `--border-subtle:#374151` (dark) + `#E2E8F0` (light) present |

### 1.2 T2 - Radius Option A

| Proof element | Evidence |
|---|---|
| `@theme` (index.css:84-85) | aligned to `20px`/`24px` (was 12px/16px) |
| themes.css `:root` (:114-115) | unchanged 20px/24px |
| Runtime winner | **20px / 24px - unchanged** |
| Rendered radius | **byte-identical** (no `rounded-*` consumer shifts) |

### 1.3 T3 - Group A aliases

| Proof element | Evidence |
|---|---|
| Alias block (index.css:282-288) | all five repointed to `var(--color-*)` |
| `@theme` co-edit (:43-49) | each `--color-*` → canonical self-ref (loop eliminated) |
| Dark values | identical to prior literals (`#F87171`/`#22C55E`/`#FBBF24`/`#3B82F6`/`#10B981`) - **byte-identical** |
| Light values | corrected to canonicals (`#DC2626`/`#16A34A`/`#D97706`/`#166534`/`#C8960C`) |
| Render-affecting | 6 files (ReviewLayout, StatisticsSection, StudentDetailModal, ResultView, SubAdminDashboard, TopicReader) - light only |
| Render-neutral | 3 files (ExamPaperCard, SelectionView, AntigravityData) - utility branch unchanged |

### 1.4 T4 - `text-stat-value`

| Proof element | Evidence |
|---|---|
| Removed | dead `@theme` registration + 3 dead responsive overrides (index.css) |
| Compiled CSS | `.text-stat-value{color:var(--color-stat-value)}` still emitted - color-only |
| LoginPage stats | still sized by `Display` inline `fontSize: var(--text-display)` |
| Render change | **none** (render-neutral confirmed) |

### 1.5 Group B - carved recipes

| Proof element | Evidence |
|---|---|
| Definition sites | single each: themes.css:542/549/556 |
| Duplicate | none exists - false positive |
| Action | verify-only, no code |

---

## 2. Governance Record

1. **Runtime behavior was chosen as the canonical source.** The unlayered `themes.css` cascade truth is authoritative over the layered `@theme` registrations.
2. **Radius Option A preserves certified rendering** - runtime radius remains 20px/24px; the conflicting `@theme` 12px/16px duplicate registrations were removed.
3. **Radius Option B is intentionally rejected as a Foundation redesign** and would require its own future evolution phase (with screenshot baseline per page family).

---

## 3. Files Modified (complete inventory)

| File | Action |
|------|--------|
| `src/index.css` | T1: `--input-border` → `var(--border-subtle)` (line 274); T2: `@theme` radius → 20px/24px (84-85); T3: `@theme` state namespace canonical self-refs (43-49) + aliases → `var(--color-*)` (282-288); T4: removed dead `--text-stat-value` registration + 3 responsive overrides |

No other file changed. No freeze-protected token-value, no KEEP token, no test-pinned token, no component, no page modified.

---

## 4. Verification Sign-Off

- [x] `npx tsc -b` PASS
- [x] `npm run build` PASS (only pre-existing warnings)
- [x] `npm run lint` = exact pre-existing baseline (397 problems / 344 errors + 53 warnings), 0 introduced
- [x] `npx vitest run --config vitest.audit.config.ts` = exact pre-existing baseline (33 failed / 301 passed; ds007 smoke 18/18), 0 introduced
- [x] Compiled CSS runtime winners verified (T1-T4)
- [x] Dark mode byte-identical (T2/T3/T4); only approved T1 gray shade on input borders
- [x] Only documented light-theme color corrections occur (T3 six consumers)
- [x] 0 dangling `var()` refs introduced

**Phase 5.3E is CERTIFIED as correcting verified Foundation inconsistencies while preserving the certified runtime appearance.**

**Phase 5.3E is CLOSED. The Foundation cleanup and correction program (Phase 5.2, 5.2A, 5.3A-5.3E) is COMPLETE.**

**Next gate:** Phase 6.0 - Repository Foundation Certification Audit. Objectives: (1) re-audit the entire Foundation after all cleanup phases, (2) produce updated health metrics, (3) compare against the original Phase 5.1 findings, (4) verify no dead code or token regressions remain, (5) generate the new certified architectural baseline. **Requires a separate approval - no further Foundation work begins until then.** Radius Option B remains rejected as a Foundation redesign. Pre-existing drift DW-1..DW-4 unchanged.
