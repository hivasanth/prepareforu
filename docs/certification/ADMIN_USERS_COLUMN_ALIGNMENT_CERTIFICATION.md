# Phase 3.6D — Admin Users CollectionCard Column Alignment — Certification

**Date:** 2026-08-03 · **Status:** ✅ **CERTIFIED**
**Governance:** D-139 (design decision) — recorded in `DESIGN_DECISION_LOG.md`, `FOUNDATION_FREEZE_REGISTER.md`,
`PHASE_3_1_EXECUTION_LOG.md`, `PAGE_CERTIFICATION_INDEX.md`.
**Scope:** `src/components/admin/users/**` only — CollectionCard composition. No Foundation redesign, no
business logic, no services, no hooks, no database.

---

# 1. Success criteria

| # | Criterion | Result |
|---|---|---|
| 1 | Metadata headings removed from individual rows | ✅ `Label` `Exam`/`Attempts`/`Joined` no longer render; grep on the users folder finds no `Label` usage in the list |
| 2 | User identity occupies one dedicated column | ✅ `leading` slot, fixed 170→300px, largest column |
| 3 | Exam occupies one dedicated column | ✅ fixed 150→160px, badge left edge constant |
| 4 | Attempts occupy one dedicated column | ✅ fixed 100px, number left edge constant |
| 5 | Joined date occupies one dedicated column | ✅ fixed 130→140px, date left edge constant |
| 6 | Status occupies one dedicated column | ✅ fixed 110→130px, badge left edge constant |
| 7 | Actions occupy one dedicated column | ✅ fixed 104px button, both labels centered identically |
| 8 | Every row aligns perfectly across the entire list | ✅ all six X origins are content-independent (proof in implementation report §2) |
| 9 | CollectionCard visuals remain unchanged | ✅ zero Foundation changes; surface/padding/shadow/hover/animation/borders untouched |
| 10 | Only layout/composition changes; business logic untouched | ✅ no service/repo/hook/DB change; `useAdminUsers` untouched |

---

# 2. Verification gate

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (pre-existing chunk-size + CSS token warnings only) |
| `npx eslint src/components/admin/users/UsersTable.tsx` | ✅ 0 findings |
| `npx eslint .` | ✅ frozen baseline **405 (352E/53W), zero new** |
| Page-owned visuals grep | ✅ none — structural classes only (`flex`, `flex-wrap`, `min-w-0`, `w-[…]`, `truncate`, `gap-x-6`, `gap-y-2`) + certified `text-text-primary` |
| Compiled CSS | ✅ `170px`/`150px`/`104px`/`420px` utilities present in `dist` |

---

# 3. Scope compliance

| Constraint | Result |
|---|---|
| Only `src/components/admin/users/**` | ✅ single file changed: `UsersTable.tsx` |
| No Foundation redesign | ✅ `CollectionCard.tsx`, `UserIdentity.tsx`, `Badge`, `Button`, `AdminText` untouched |
| No business logic / services / hooks / database | ✅ none touched |
| Only CollectionCard composition | ✅ slot composition + shared width constants |

---

# 4. Responsive & theme verification

- **Desktop (xl+):** single-line table `| 2fr · 160px · 100px · 140px · 130px · auto |` — every column
  aligned, no floating content. ✅
- **Tablet:** fixed columns wrap in order (controlled compression) — same widths, same per-line X
  origins; no re-ordering, no second implementation. ✅
- **Mobile:** `CollectionCard`'s certified flex-col → sm:flex-row stack handles it; order is always
  identity → exam → attempts → joined → status → actions. ✅
- **Light / Dark:** identical rendering — no page-owned color/shadow/radius/border/hover rules added. ✅

---

# 5. Freeze declaration

Phase 3.6D is **certified and frozen**:

- The Users row anatomy is now the fixed six-column grid `Identity · Exam · Attempts · Joined · Status ·
  Actions` with the documented widths (D-139). Any change to these widths or the removal of the fixed
  columns requires a new D-series decision.
- Per-row metadata headings remain removed. If a shared header row is ever wanted, it must be proposed
  against the Management Page Standard (D-133) as a new decision — it is out of scope for this phase.
- `UserIdentity` remains the single identity renderer (U-4 / D-134), unchanged.
- Remaining gates unchanged: U-6 (alpha tokens), T-6/T-7 (Phase B typography).

---

# 6. Deliverables

- Implementation report: `ADMIN_USERS_COLUMN_ALIGNMENT_IMPLEMENTATION_REPORT.md`
- Visual comparison: `ADMIN_USERS_COLUMN_ALIGNMENT_VISUAL_COMPARISON.md`
- Certification: `ADMIN_USERS_COLUMN_ALIGNMENT_CERTIFICATION.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-139 + rejected alternatives)
- Governance: `PAGE_CERTIFICATION_INDEX.md`, `FOUNDATION_FREEZE_REGISTER.md`, `PHASE_3_1_EXECUTION_LOG.md`
