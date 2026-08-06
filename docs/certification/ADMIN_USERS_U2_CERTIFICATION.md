# Admin Users — U-2 Typography Scale Certification (Phase 3.5 · Page 1 of 11)

**Status:** ✅ **U-2 CERTIFIED (Phase A)** (2026-08-03)
**Gate:** U-2 (Typography Scale) — approved per-item P2 gate (Phase A = render-neutral only).
**Decision:** `docs/design-system/DESIGN_DECISION_LOG.md` (D-132).
**Scope:** `src/styles/themes.css` · `src/index.css` · `src/components/common/AdminText.tsx` ·
page-1 consumers (`AdminUsersView.tsx`, `UserIdentity.tsx`, `UserMobileCard.tsx`).

---

## 1. Gate outcome

The permanent Typography Scale (`TYPOGRAPHY_SCALE_SPECIFICATION.md` §2) is approved as the **single
typography language**. Admin Users is its **first consumer**:

- **Canonical tokens certified (T-3/4/5):** `--text-metadata` (12px), `--text-small` (14px),
  `--text-heading` (16px) — values identical to the current rendered Tailwind defaults
  (`text-xs`/`text-sm`/`text-base`), so render-neutral by construction.
- **Retired (T-1):** the phantom Layer-1 raw size primitives `--text-3xs…10xl` + the dead
  `--font-size-caption`/`--font-weight-caption` — zero consumers, unwired, name-shifted.
- **Retired (T-2):** the dead legacy utilities `text-overline/sub-1/sub-2/body-1/body-2/button` +
  the `@theme` registrations for `text-h4/h5/h6` — zero consumers. The `:root` `--text-h4/h5/h6`
  variables remain to back the global element rules (`index.css:551-556`).
- **Page migration:** Admin Users' 7 raw size `className` overrides migrated to `AdminText size`
  props; the inert `text-[8px]` on the retained `Label` removed; weight/tracking/transform/leading
  remain verbatim className. **0 arbitrary raw sizes** on the page.
- **Governance respected:** no new typography primitives were created (Layer-2 `AdminText` refine
  only); no competing typography system introduced; existing rendered sizes byte-identical.

---

## 2. Render-neutrality proof

| Node | Before (rendered) | After (rendered) | Proof |
|---|---|---|---|
| Attempts value (`AdminUsersView.tsx:56`) | `text-sm` → 14px, lh `calc(1.25/.875)`, `font-bold` | `size="small"` → `var(--text-small)` 14px + inline `var(--lh-small)` `calc(1.25/.875)`, `font-bold` | values/lh equal; weight verbatim |
| Exams caption (`AdminUsersView.tsx:57`) | `Label` + inert `text-[8px]` (inline `--text-label` 10px wins) | `Label` (inline `--text-label` 10px) | identical DOM value — inert class removed |
| Joined date (`AdminUsersView.tsx:65`) | `text-xs` → 12px, lh `calc(1/.75)`, `font-medium` | `size="metadata"` → 12px + inline lh `calc(1/.75)`, `font-medium` | values/lh equal; weight verbatim |
| Name (`UserIdentity.tsx:20`) | `text-base` → 16px, lh 1.5 overridden by `leading-tight` 1.25, `font-bold uppercase tracking-tight` | `size="heading"` → `var(--text-heading)` 16px, no inline lh (consumer `leading-tight` 1.25 applies), `font-bold uppercase tracking-tight` | same 16px / 1.25 / 700 / transform / tracking |
| Email (`UserIdentity.tsx:29`) | `text-xs` → 12px, lh `calc(1/.75)` | `size="metadata"` → 12px + inline lh `calc(1/.75)` | equal |
| Mobile exam/attempts/joined (`UserMobileCard.tsx:21-27`) | `text-xs` → 12px ×3, lh `calc(1/.75)` | `size="metadata"` ×3 → 12px + inline lh `calc(1/.75)` | equal |

Built-CSS verification: `--text-metadata: .75rem`, `--text-small: .875rem`, `--text-heading: 1rem`
and exact `--lh-*` values present; all retired definitions absent; `--text-title` = colors only
(light `#f9fafb` / dark `#0a0503`) — no font-size collision.

---

## 3. Deviation recorded

**T-5 token name (`--text-title` → `--text-heading`):** the approved name `--text-title` collides
with the pre-existing **color token** `--text-title` (`themes.css`: light `#F9FAFB`, dark
`#0A0503`; consumed by `--color-text-title` + ~20 `text-text-title` utilities). Reusing the name
would break both the color and the size rendering (cascade fight), violating render-neutrality. The
16px tier is therefore certified as **`--text-heading`** (collision-free, verified) with
`AdminText size="heading"`. Logged in D-132; the scale spec and plan were updated to match.

---

## 4. Verification

- `npx tsc -b` → **exit 0**
- `npm run build` → **exit 0** (pre-existing chunk notices only)
- `npm run lint` → **405 problems (352E/53W)** = frozen baseline, zero new findings
- Page-folder grep: **0** raw `text-xs/sm/base/[Npx]` utilities
- Visual comparison matrix (Light/Dark · Desktop/Tablet/XS): byte-identical by the render-neutral
  ledger above; inspection-based per repo precedent (no headless tooling; admin routes auth-guarded).

---

## 5. Accepted deltas

**None.** Phase A is render-neutral by design — every token value and line-height equals the current
rendered Tailwind value, and every migrated node carries its weight/tracking/transform/leading
`className` verbatim.

---

## 6. Freeze

- **Canonical tokens** `--text-metadata`/`--text-small`/`--text-heading` — frozen (Foundation
  decision D-132). New token changes = new D-series decision + pixel-identical rule.
- **Phantom Layer-1 sizes + dead legacy utilities** — permanently retired; do not reintroduce.
- **`AdminText` size map** (display/h1/h2/h3/body/caption/stat-value/badge/metadata/small/heading) —
  frozen (bug/a11y/perf/non-breaking-variant changes only). `size="heading"` applies no line-height
  (consumers keep `leading-*` verbatim); `--lh-heading` exists for future bare consumers.
- **Admin Users page** — typography 100% token/primitive; **0 arbitrary raw sizes**.

## 7. Remaining gates

- **T-6** (micro 8px tier / a11y) — separate approval.
- **T-7** (repo-wide `@theme` wiring of Layer-1 sizes) — deferred, render-affecting, rejected.
- **U-6** (alpha tokens) — open.

Repo-wide raw sizes (`text-xs`×156, `text-sm`×79, `text-base`×16, `text-[Npx]`×312…) migrate
per-page via the consumer register (`ADMIN_USERS_U2_IMPLEMENTATION_PLAN.md` §4).

---

## 8. Deliverables

- Plan: `docs/certification/ADMIN_USERS_U2_IMPLEMENTATION_PLAN.md`
- Audit: `docs/certification/TYPOGRAPHY_FOUNDATION_AUDIT.md`
- Scale specification: `docs/certification/TYPOGRAPHY_SCALE_SPECIFICATION.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-132)
- Page index: `docs/certification/PAGE_CERTIFICATION_INDEX.md`
- Register: `FOUNDATION_FREEZE_REGISTER.md` (Phase 3.5 U-2 Phase A section)
- Execution log: `PHASE_3_1_EXECUTION_LOG.md`
