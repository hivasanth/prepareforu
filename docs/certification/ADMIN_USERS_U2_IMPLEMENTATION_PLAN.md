# Admin Users — U-2 Typography Scale Implementation Plan (Phase 3.5 · Page 1 of 11)

**Date:** 2026-08-03
**Gate:** U-2 (Typography Scale) — **Phase A APPROVED + IMPLEMENTED (D-132, `ADMIN_USERS_U2_CERTIFICATION.md`)**. Phase B (T-6 micro 8px, T-7 repo-wide `@theme` wiring) remains **gated**.
**Inputs:** `TYPOGRAPHY_FOUNDATION_AUDIT.md` (Steps 1–7, 9–11) · `TYPOGRAPHY_SCALE_SPECIFICATION.md` (Step 8) · `ADMIN_USERS_U3_ADMINTEXT_AUDIT.md` (page raw-typography inventory, §3).
**Page scope:** `src/pages/admin/AdminUsers.tsx` + `src/components/admin/users/*` (AdminUsersView, UsersToolbar, UserIdentity, UserMobileCard, useAdminUsers).
**Reference implementation principle:** the page **adopts** the certified Typography Foundation; the page is **not** redesigned.

---

## 1. Page 1 current state (post-U-3)

- **0 plain-element page-owned typography.** Every text node routes through a Layer 1/2 primitive or certified Foundation component (U-3 achievement).
- Remaining raw sizes are **className overrides on certified primitives**:
  | Location | Element | Current className | Size rendered |
  |---|---|---|---|
  | `AdminUsersView.tsx:56` | `AdminText sans` (attempts) | `text-sm font-bold text-text-primary` | 14px |
  | `AdminUsersView.tsx:57` | `Label` (Exams) | `text-[8px]` — **inert** (inline `--text-label` 10px wins) | 10px |
  | `AdminUsersView.tsx:65` | `AdminText sans` (joined) | `text-xs font-medium text-text-muted` | 12px |
  | `UserIdentity.tsx:20` | `AdminText garamond` (name) | `font-bold leading-tight uppercase tracking-tight text-base` | 16px |
  | `UserIdentity.tsx:29` | `AdminText sans` (email) | `text-xs text-text-secondary` | 12px |
  | `UserMobileCard.tsx:21-27` | `AdminText sans` (exam/attempts/joined) | `text-xs …` ×3 | 12px |

- Weight/tracking/transform remain verbatim className (byte-identical rule, U-3 precedent): `font-bold`, `font-medium`, `tracking-tight`, `uppercase`, `capitalize` (Badge), `leading-tight`.

---

## 2. Proposed changes (ALL render-neutral — audit §10)

### A. New canonical tokens (spec T-3/4/5, gate-approved — **delivered**, D-132)
Add to `themes.css` canonical scale + `AdminText` size map (additive, values identical to current rendered px):
- `--text-metadata: 0.75rem` (12px) — `size="metadata"`
- `--text-small: 0.875rem` (14px) — `size="small"`
- `--text-heading: 1rem` (16px) — `size="heading"` — **renamed from approved `--text-title`** (color-token collision, D-132)

### B. Page migration (verbatim transfer, no pixel change — **delivered**)
| Location | Before | After |
|---|---|---|
| `AdminUsersView.tsx:56` | `<AdminText … className="text-sm font-bold text-text-primary">` | `<AdminText … size="small" className="font-bold text-text-primary">` |
| `AdminUsersView.tsx:57` | `<Label className="text-[8px]">Exams</Label>` | `<Label>Exams</Label>` (inert `text-[8px]` removed — render-neutral, overridden anyway) |
| `AdminUsersView.tsx:65` | `<AdminText … className="text-xs font-medium text-text-muted">` | `<AdminText … size="metadata" className="font-medium text-text-muted">` |
| `UserIdentity.tsx:20` | `<AdminText … className="font-bold leading-tight uppercase tracking-tight text-base">` | `<AdminText … size="heading" className="font-bold leading-tight uppercase tracking-tight">` |
| `UserIdentity.tsx:29` | `<AdminText … className="text-xs text-text-secondary">` | `<AdminText … size="metadata" className="text-text-secondary">` |
| `UserMobileCard.tsx:21-27` | `<AdminText … className="text-xs …">` ×3 | `<AdminText … size="metadata" className="…">` ×3 |

### C. Foundation-internal (one additive edit — **delivered**)
- `AdminText.tsx`: extend `CanonicalSize` union + `canonicalSizeTokens` with `metadata`/`small`/`heading` (→ `var(--text-metadata/small/heading)`); `metadata`/`small` also apply `--lh-*` (exact rendered line-heights).
- `themes.css`: define the three tokens with `--lh-*`/`--fw-*`; `--lh-metadata: calc(1/0.75)`, `--lh-small: calc(1.25/0.875)`, `--lh-heading: 1.5` (mirror the absorbed utilities' rendered line-heights).

### D. Explicitly NOT done in this phase (deferred)
- Repo-wide migration (other Admin pages, Sub-Admin, User, Exam, Auth, Profile, Layouts) — **consumer register in §4**, each opens its own page gate.
- Foundation-internal raw wave (`src/components/common` §2-C) — separate Foundation-internal wave.
- Render-affecting items (24/30/36/48px → tiers; 8px → 9px; tracking folding) — require individual sign-off, not in this gate.
- T-7 (wiring Layer-1 primitives into `@theme`) — rejected.

---

## 3. Success criteria (U-2 ready / certified — **Phase A met, D-132**)

- [x] The permanent Typography Scale (§2 of the spec) is approved as the single typography language.
- [x] Every typography primitive has a single owner (audit §1, §5).
- [x] Duplicate typography implementations are identified and registered (audit §2, §6).
- [x] The permanent scale is defined with owner/token/primitive/intended usage (spec).
- [x] Admin Users is the first consumer of the certified system: every page text node is a Layer 1/2 primitive with a `size` tier or verbatim className; **0 arbitrary raw sizes** on the page (the inert `text-[8px]` removed); **no plain-element typography**.
- [x] Future pages can migrate without redefining typography (governance spec §5).
- [x] Render-neutral proof: `npx tsc -b` exit 0 · `npm run build` exit 0 · `npm run lint` frozen baseline (405 / 352E / 53W, zero new) · built-CSS diff (new tokens present, retired defs absent) · visual comparison matrix byte-identical.

## 4. Consumer migration register (Step 7 — repo-wide, future gates)

Listed so every eventual migration reuses the certified language; **no repo-wide implementation in this phase.**

| Module / area | Files (representative) | Migrates in | Reuses |
|---|---|---|---|
| Admin — Topics | `pages/admin/AdminTopics.tsx`, `admin/topics/*` | Admin Topics page gate | `Label`/`Badge`/`Caption`/`AdminText` |
| Admin — Settings | `pages/admin/AdminSettings.tsx`, `admin/settings/*` | Admin Settings page gate | `Label`/`AdminText` |
| Admin — Leaderboard | `pages/admin/AdminLeaderboard.tsx`, `admin/leaderboard/*` | Admin Leaderboard page gate | `Label`/`Caption`/`AdminText` |
| Admin — Questions/Upload | `admin/questions/*`, `admin/upload/*`, `admin/common/BulkActionBar.tsx` | their page gates | `Label`/`Badge`/`Body`/`AdminText` |
| Admin — Sub-Admins | `admin/sub-admins/*` | Admin Sub-Admins page gate | `AdminText`/`Label` |
| Sub-Admin module | `sub-admin/*` (incl. inline `fontSize` cluster) | Sub-Admin gates | primitives + tokens |
| User module | `user/*` (largest volume; `font-cinzel` brand) | User page gates | `H1..H3`/`Body`/`Label`/`Caption`/`Display`/`BrandTitle` |
| Exam flow | `components/exam/*`, `pages/exam/*` | Exam gates | primitives + sr-only heading pattern |
| Profile | `components/profile/*` | Profile gate | `H1`/`H2`/`Body`/`Label` |
| Auth / misc / layouts | `pages/auth/*`, `SplashPage`, `SidebarLayout`, `ErrorBoundary`, `Unauthorized`, etc. | their gates | primitives (many are className overrides on primitives already) |
| Foundation-internal | `src/components/common/*` raw internals | Foundation-internal wave | same tokens/primitives, internally |

---

## 5. Gate decision — **Phase A decided (D-132) and delivered**

1. ✅ Approve the **Typography Scale Specification** as permanent (spec §6 checklist).
2. ✅ Approve NEW tokens **T-3/4/5** (metadata/small/**heading** — render-neutral; T-5 renamed from `title` due to a pre-existing color-token collision) and RETIRE **T-1/T-2**.
3. ⏸ **T-6** (micro 8px): separate approval gate — Phase B.
4. ✅ Authorize the §2-B page migration (render-neutral) for Admin Users as the first consumer.

**Status: Phase A ✅ CERTIFIED** — `ADMIN_USERS_U2_CERTIFICATION.md`. Phase B (T-6 micro 8px, T-7 repo-wide `@theme` wiring) remains gated; repo-wide raw sizes migrate per-page via the §4 consumer register.
