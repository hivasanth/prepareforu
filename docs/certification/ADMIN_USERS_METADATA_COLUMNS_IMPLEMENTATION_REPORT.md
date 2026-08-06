# Phase 3.6C.2 — Admin Users Structured Metadata — Implementation Report

**Date:** 2026-08-03 · **Status:** ✅ Implemented (certified in `ADMIN_USERS_METADATA_COLUMNS_CERTIFICATION.md`)
**Approved by:** 3.6C.2 phase spec · **Governance:** D-136
**Decision basis:** `docs/certification/ADMIN_USERS_METADATA_LAYOUT_AUDIT.md` (findings M-1…M-6).

---

# 1. What changed

`src/components/admin/users/UsersTable.tsx` — the `metadata` slot of each `CollectionCard` changed from
an **inline flowing token row** to a **structured 3-column labelled composition**:

**Before** (inline wrap):
```
<> <Badge>APPSC</Badge> <AdminText>0 Attempts</AdminText> <AdminText>Joined …</AdminText> </>
```

**After** (structured columns, certified primitives only):
```
<div className="flex gap-6">
  <div className="flex flex-col gap-2 flex-1 min-w-0">  <Label>Exam</Label>     <Badge variant="default" className="capitalize">APPSC</Badge>          </div>
  <div className="flex flex-col gap-2 flex-1 min-w-0">  <Label>Attempts</Label> <AdminText sans metadata>0</AdminText>                             </div>
  <div className="flex flex-col gap-2 flex-1 min-w-0">  <Label>Joined</Label>   <AdminText sans metadata>07 Jul 2026</AdminText>                      </div>
</div>
```

## Implementation details

- **Container:** `flex gap-6` (24px — on the 24/12/8 ladder), matching the audit's approved structure.
- **Columns:** three equal `flex-1 min-w-0` columns → identical grid lines across every row at every
  breakpoint (no `flex-wrap`, no stacking).
- **Labels:** certified `Label` micro-label (`text-text-muted`, uppercase via `--tt-label`, letter-spacing
  `--ls-label`), imported from `AntigravityUI`.
- **Values:** certified `AdminText` `variant="sans"` `size="metadata"`; exam keeps the certified
  `Badge variant="default" capitalize`; Attempts and Joined values `truncate`.
- **Label→value rhythm:** `gap-2` (8px) internal per column.

`Label` is a certified primitive (widely used across the app for exactly this micro-uppercase label
role — e.g. `TopicPortalView.tsx:87`, `ResultsPage.tsx:85`), so no new Foundation component was needed.

---

# 2. Alignment rules applied (permanent, from the audit)

1. Metadata is always `Exam`, `Attempts`, `Joined`, in that order. ✅
2. Three equal-width columns aligned to the same grid line across rows. ✅ (`flex-1`)
3. Column spacing exactly 24px (`gap-6`); label→value exactly 8px (`gap-2`). ✅
4. Exam = certified `Badge`; Attempts/Joined = `AdminText sans`; labels = certified `Label`. ✅
5. Long values `truncate`; row never grows on width. ✅
6. Columns stay 3-across at all widths; stacking is **not** used. ✅

---

# 3. Files changed

| File | Kind | Change |
|---|---|---|
| `src/components/admin/users/UsersTable.tsx` | page composition | `metadata` slot → structured 3-column composition |
| `src/components/common/CollectionCard.tsx` | none | metadata slot already accepts arbitrary composition |

Zero Foundation changes. Zero page-owned visuals.

---

# 4. Verification

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ 0 |
| `npm run build` | ✅ (pre-existing chunk-size warning only) |
| eslint | ✅ frozen baseline **405**, zero new |
| Grep metadata container classes | ✅ only structural: `flex`, `flex-1`, `min-w-0`, `truncate`, `gap-6`, `gap-2` + certified `Badge`/`Label`/`AdminText` |
