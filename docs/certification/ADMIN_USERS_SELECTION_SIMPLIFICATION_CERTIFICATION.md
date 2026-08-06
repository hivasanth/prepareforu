# Phase 3.6C.1 — Admin Users Selection Simplification — Certification

**Status:** ✅ **CERTIFIED** (2026-08-03)
**Governance:** D-135 · **Basis:** `ADMIN_USERS_SELECTION_AUDIT.md` + 3.6C.1 phase spec
**Scope:** remove meaningless selection from `/admin/users`; make `CollectionHeader` select-all optional.

---

# 1. Requirement traceability

| Spec item | Delivered |
|---|---|
| Remove row `SelectionCheckbox` | ✅ `UsersTable.tsx` — leading group is now just `UserIdentity` |
| Remove Select All | ✅ `CollectionHeader` invoked with range props only |
| Remove `selectedIds`/`setSelectedIds` | ✅ `useAdminUsers.ts` — state + reset effect + return removed |
| Remove `toggleSelectAll`/`allOnPageSelected` | ✅ deleted from `UsersTable.tsx` |
| Remove selection props passed to `CollectionCard` | ✅ `selected={...}` removed; `SelectionCheckbox` import removed |
| `CollectionHeader` selection **optional** | ✅ `checked?: boolean`, `onToggleSelectAll?: () => void` |
| Range-only when omitted — **no empty space / placeholder / hidden checkbox** | ✅ conditional render; `justify-between` keeps the range right-aligned |
| Questions unaffected | ✅ still passes `checked` + `onToggleSelectAll` (verified) |
| Users page holds no selection state | ✅ grep: zero selection identifiers in the users area |

---

# 2. Verification gate

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (pre-existing chunk-size + CSS token warnings only) |
| eslint — frozen baseline **405 (352E/53W)**, zero new | ✅ full-repo count 405; no new findings on changed files |
| Grep — zero selection leftovers in Users | ✅ `src/components/admin/users`, `src/pages/admin/AdminUsers.tsx` clean |

---

# 3. Governance impact

- **D-135** (this phase) supersedes the 3.6B `CollectionHeader` select-all delta **D-8** — the header is
  now a certified optional-select-all primitive (range-only when omitted).
- `FOUNDATION_FREEZE_REGISTER.md` updated (additive refinement, see register entry).

---

# 4. Certification statement

The Users page's meaningless selection affordance is fully removed, and the shared `CollectionHeader`
now supports both select-all (Questions) and range-only (Users) forms with zero impact on Questions.
The change is composition/additive only, passes the full gate at the frozen lint baseline, and is
certified per the 3.6C.1 spec.

**Certified:** ✅ 2026-08-03 · **Governance:** D-135
