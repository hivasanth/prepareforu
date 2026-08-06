# Phase 3.6D — Admin Users CollectionCard Column Alignment — Implementation Report

**Date:** 2026-08-03 · **Status:** ✅ Implemented (certified in `ADMIN_USERS_COLUMN_ALIGNMENT_CERTIFICATION.md`)
**Approved by:** Phase 3.6D spec · **Governance:** D-139
**Scope:** `src/components/admin/users/**` only — CollectionCard composition. No Foundation redesign,
no business logic, no services, no hooks, no database.

---

# 1. What changed

`src/components/admin/users/UsersTable.tsx` — the per-row metadata headings were removed and the card
slots were composed into **fixed-width data columns** so the whole list scans as a professional
management table while every row remains a certified `CollectionCard` (premium surface, padding,
shadow, hover, animation, borders — all still owned by `CollectionCard`).

**Before** (repeated headings inside every row, equal `flex-1` thirds that shift with trailing content):
```
| Identity (auto width)      | EXAM · APPSC | ATTEMPTS · 0 | JOINED · 07/03/2026 | Active | Deactivate |
| Identity (auto width)      | EXAM · ...   | ...          | ...                | Banned | Activate   |
```

**After** (one fixed grid per row; headings gone):
```
| Avatar + User (2fr ≈ 300px) | Exam 160px | Attempts 100px | Joined 140px | Status 130px | Actions auto |
```

## Implementation details

- **Headings removed:** the three certified `Label` micro-labels (`Exam` / `Attempts` / `Joined`) no longer
  render inside any row. The values remain, left-aligned in their columns.
- **Column width constants** (shared by every row so grid lines are identical):
  - `IDENTITY_COL = 'w-[170px] min-[420px]:w-[200px] sm:w-[240px] md:w-[280px] xl:w-[300px] min-w-0'`
    — the largest column, `minmax(300px, 2fr)` reading; text `truncate`s via `UserIdentity`.
  - `EXAM_COL = 'w-[150px] sm:w-[160px]'` — fixed; every badge starts at the same X.
  - `ATTEMPTS_COL = 'w-[100px]'` — fixed; every number starts at the same X.
  - `JOINED_COL = 'w-[130px] sm:w-[140px]'` — fixed; every date starts at the same X.
  - `STATUS_COL = 'w-[110px] sm:w-[130px]'` — fixed; every status badge left edge is identical.
  - `ACTION_COL = 'w-[104px]'` — fixed button width; both Activate/Deactivate render identically centered,
    so the status column left edge no longer depends on button label length.
- **Slot mapping (unchanged CollectionCard anatomy):**
  - `leading` → `UserIdentity` (avatar + name + email) inside a fixed-width identity column. `UserIdentity`
    itself is **unchanged** (certified U-4), still rendered once per row.
  - `metadata` → a `flex flex-wrap gap-x-6 gap-y-2` strip of the three fixed columns. `flex-wrap` is the
    **controlled compression**: below the single-line width the fixed columns wrap to new lines in order
    (no re-flow, no re-ordering, no second implementation).
  - `trailing` → status `Badge` (success/danger, `ShieldCheck`/`ShieldAlert`) inside `STATUS_COL`.
  - `actions` → Activate/Deactivate `Button size="xs"` at fixed `ACTION_COL` width, per-row `loading`
    unchanged.
- **Long values:** exam `Badge` text is wrapped in a `truncate` span with `max-w-full` so a long exam name
  ends with an ellipsis inside its fixed column instead of bleeding into the next column; joined date
  `truncate`s as before. Values left-align so X positions are constant.
- **Vertical rhythm:** 24px column gap (`gap-x-6`) on the certified 24/12/8 ladder; 8px wrap-line gap
  (`gap-y-2`); the card keeps `padding={16}` and the collection list keeps `gap-3`.

---

# 2. Alignment proof (per column, single-line desktop)

Every quantity below is **content-independent** (same for every row), so all grid lines are identical:

| Column | Left edge = | Constant? |
|---|---|---|
| Avatar | card padding | ✅ |
| Name / Email | padding + avatar(40) + gap(8) | ✅ |
| Identity block | padding | ✅ (fixed width) |
| Exam badge | padding + identity + 12 | ✅ |
| Attempts value | padding + identity + 12 + 160 + 24 | ✅ |
| Joined value | + 100 + 24 | ✅ |
| Status badge | card-right − padding − actions(104) − 8 − status(130) | ✅ (button fixed) |
| Action button | card-right − padding − 104 | ✅ (fixed) |

The only widths that once varied per row were the identity block (name length) and the trailing button
(Activate vs Deactivate) — both are now fixed, so the previously floating columns are locked.

---

# 3. Responsive behaviour (single composition, no second implementation)

| Breakpoint | Behaviour |
|---|---|
| `< 420px` | identity 170px; the fixed columns wrap vertically in order beside it; status+actions on the bottom row (`justify-between`) — order: identity → exam → attempts → joined → status → actions |
| `420px – 640px` | identity 200px; columns wrap as above |
| `sm 640 – 768px` | identity 240px; metadata strip wraps onto stacked lines in order (controlled compression) |
| `md 768 – 1024px` | identity 280px; columns wrap where needed, order preserved |
| `lg 1024 – 1280px` | identity 280px; near/at single line depending on container |
| `xl 1280px+` | **single line** — full `\| 2fr · 160 · 100 · 140 · 130 · auto \|` table |

The flex-col → sm:flex-row stacking already owned by `CollectionCard` does the mobile work; the column
widths are fixed so every row wraps identically at the same container width (cross-row alignment holds
even when wrapped).

Light and dark modes render identically because every class is structural or a certified token
(`text-text-primary`); no colors, shadows, radii, borders, or hover rules were added on the page.

---

# 4. Files changed

| File | Kind | Change |
|---|---|---|
| `src/components/admin/users/UsersTable.tsx` | page composition | headings removed; fixed-width column constants; slot composition updated |

**Zero** Foundation changes (`CollectionCard.tsx`, `UserIdentity.tsx`, `Badge`, `Button`, `AdminText`,
`Label` unused) — **zero** service/repo/hook/DB changes.

---

# 5. Verification

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ 0 |
| `npm run build` | ✅ (pre-existing chunk-size + CSS token warnings only) |
| `npx eslint src/components/admin/users/UsersTable.tsx` | ✅ 0 findings |
| `npx eslint .` | ✅ frozen baseline **405 (352E/53W), zero new** |
| Grep page-owned visuals | ✅ none — only structural classes (`flex`, `flex-wrap`, `min-w-0`, `w-[…]`, `truncate`, `gap-x-6`, `gap-y-2`) + certified `text-text-primary` |
| Compiled CSS | ✅ `170px` / `150px` / `104px` / `420px` utilities present in `dist` |
