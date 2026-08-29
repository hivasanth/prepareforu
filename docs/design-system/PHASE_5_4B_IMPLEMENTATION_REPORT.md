# Phase 5.4B — Button Language: Foundation Evolution Implementation Report

- **Phase:** 5.4B (Button Language) — Foundation evolution
- **Status:** IMPLEMENTED 2026-08-06 — **awaiting user certification**
- **Approval:** user granted the separate dedicated implementation approval (2026-08-06) after the
  working tree was stabilized (commit `453b5d7`) so the 5.4B diff is isolated to Foundation files.
- **Plan executed:** `docs/design-system/PHASE_5_4B_IMPLEMENTATION_PLAN.md` (Tasks 1–8)
- **Decision:** D-164 (opened, planning only) → **D-165 (IMPLEMENTED)** recorded in
  `docs/design-system/DESIGN_DECISION_LOG.md`

---

## 1. Executive summary

Phase 5.4B is the **button language** Foundation gate: it unifies every button onto ONE language by
**enforcing** the frozen `AntigravityButton.tsx` recipe set — it does NOT redesign it. The phase
delivered:

1. **Semantic button roles (B-6)** — the role→variant map is now the **canonical contract**
   published in `FOUNDATION_GOVERNANCE.md` v1.22.0 §2. Pages pick a role; the Foundation picks the
   variant. Zero code change.
2. **Color system** — verified: status colors resolve only through tokens
   (`--color-success`/`--danger`/`--color-accent`/`--button-*`); zero palette classes in the
   Foundation button source and the `--button-*` token namespace.
3. **Elevation usage** — verified: every Foundation button shadow resolves to the certified 5.4A
   ladder (`E0` ghost `shadow-none`; `E1` `--elevation-2` family; `E2` `--elevation-3` family; dark
   secondary hover on the sanctioned `--elevation-1` token). Zero value change required.
4. **Hover behavior (buttons only)** — verified: canonical framer-scale + CSS
   brightness/shadow/lift; zero `transition-all`; zero free durations in the button source.
5. **Focus** — verified: global `:focus-visible` outline (index.css:608-611) applies to `Button`;
   `IconButton` `focusRing` opt-in available. No gap.
6. **Disabled / loading** — verified: `getDisabledCls`
   (`opacity-30/50 cursor-not-allowed pointer-events-none`) + `Spinner size="sm"
   border-current border-t-transparent` on both components.
7. **Button consistency (B-5)** — global sweep of **161 Button/IconButton/PrimaryButton usages
   (71 files)** completed. **4 material overrides** found (sub-admin create flow ×3,
   `BulkActionBar` Cancel) + 3 non-material size/layout notes. **Documented and deferred to 5.4G** —
   no consumer file was edited in 5.4B.
8. **Governance** — Button Language Contract codified (roles, color, elevation, focus, disabled,
   loading) as PERMANENT in `FOUNDATION_GOVERNANCE.md` v1.22.0; spec updated; Freeze Register +
   execution log + decision log updated.

**Net code change: ZERO.** This phase is canonicalization + governance + verification. The only
touched production-adjacent files are the governance/spec documents; no component, no page, no
service, and no theme value was modified.

---

## 2. Scope executed (approved 2026-08-06)

| Area | Result |
|---|---|
| Semantic button roles | Role→variant map published as canonical contract (B-6 resolved) — governance §2 |
| Color system | Verified token-only (Foundation + `--button-*` namespace clean) |
| Elevation usage | Verified E0/E1/E2 ladder mapping; no value change |
| Hover behavior | Verified canonical recipes (buttons only); hover outside buttons = 5.4E |
| Focus | Verified global `:focus-visible` + `IconButton` `focusRing` |
| Disabled | Verified `getDisabledCls` shared across Button/IconButton |
| Loading | Verified `Spinner size="sm" border-current border-t-transparent` both components |
| Button consistency (B-5) | Sweep complete; 4 findings documented for 5.4G; no consumer edits |

Out of scope (NOT executed): typography, hover language outside buttons, motion, pills, skeletons,
page migrations, consumer redesigns — all remain in 5.4C–5.4G.

---

## 3. Ground-truth verification (Task 2–6)

Verified in the frozen source `src/components/common/AntigravityButton.tsx`, `themes.css`, `index.css`:

### 3.1 Color system (Task 2)
- Palette-class sweep of the button source: **0 matches** (`green-[0-9]`, `red-[0-9]`, `amber-[0-9]`,
  raw hex, `transition-all`). ✅
- Status colors resolve via tokens only: `bg-success`, `bg-danger`, `bg-primary/10`,
  `--material-button-*`, `--management-accent` (= `var(--color-accent)`). ✅

### 3.2 Elevation usage (Task 3)
Every Foundation button shadow maps to the certified ladder (themes.css references):

| Button | Token | Ladder |
|---|---|---|
| primary light | `--material-button-primary-shadow` = `var(--elevation-2)` (:804) | E1 |
| primary light hover | `hover:shadow-[var(--material-button-primary-shadow)]` | E1 |
| primary dark / hover | `shadow-elevation-2` → `hover:shadow-elevation-3` | E1 → E2 |
| secondary light | `--button-shadow-secondary` = `var(--elevation-2)` (:920) | E1 |
| secondary light hover | `--button-shadow-secondary-hover` = `var(--elevation-3)` (:921) | E2 |
| secondary dark | `--button-shadow-secondary` = `none` (:665) | E0 |
| secondary dark hover | `--button-shadow-secondary-hover` = `var(--elevation-1)` (:666) | sanctioned subtle (`--elevation-0/1/2/3` allowed set) |
| success / danger | `shadow-elevation-2` → `hover:shadow-elevation-3` | E1 → E2 |
| soft | (no shadow) | E0 |
| ghost | `shadow-none` | E0 |
| management | `--management-shadow` = `var(--elevation-2)` (:872) → hover `--elevation-3` (:873); light family literals (:952-953) are the management E1/E2 family material | E1 → E2 |
| IconButton theme hover | `hover:shadow-elevation-2` | E1 |

`shadow-elevation-0/1/2/3/4` utilities registered in `index.css` `@theme` (:97-101). **No button
shadow is outside the ladder; no value change was required.**

### 3.3 Hover behavior (Task 4)
- Zero `transition-all` in the button source. Base transition is the frozen
  `transition-[color,box-shadow,border-color,opacity,filter] duration-200`. ✅
- Hover recipes = canonical (brightness for primary/success/danger, shadow lift for
  secondary/management/theme, surface swap for soft/ghost, framer `whileHover {scale:1.01}`). ✅

### 3.4 Focus (Task 5)
- Global `:focus-visible { outline: var(--focus-ring-width,2px) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset,2px); }` (index.css:608-611) applies to `Button`
  automatically; ring tokens themes.css:280-283 (dark) / 518-521 (light). ✅
- `IconButton` `focusRing` opt-in (`focus-visible:ring-2 focus-visible:ring-primary
  focus-visible:ring-offset-2`, AntigravityButton.tsx:211) already used across admin (Phase 3.1). ✅

### 3.5 Disabled & loading (Task 6)
- `getDisabledCls` shared: `opacity-30/50 cursor-not-allowed pointer-events-none`
  (AntigravityButton.tsx:23-26); `IconButton` `disabledOpacity?: 30|50` additive. ✅
- Loading renders `Spinner size="sm" className="border-current border-t-transparent"` in both
  components (124/141/229) — no layout jump. ✅

---

## 4. Button consistency sweep (Task 7 — B-5)

Method: node scan of every `<Button`/`<IconButton`/`<PrimaryButton` open tag across `src/**/*.tsx`,
extracting each `className` and testing for material utilities (`bg-`, `text-`, `shadow-`, `border-`,
`rounded-`, `ring-`, `hover:*`, `focus-visible:`, `dark:`, `duration-`, `transition-`, `animate-`,
`!`).

- **161 usages scanned across 71 files.**
- **4 material overrides** (documented → 5.4G):

| # | Location | Finding |
|---|---|---|
| 1 | `src/components/sub-admin/create/CreateStepPrompt.tsx:76` | `shadow-lg transition-all ${copied ? 'bg-green-500 shadow-green-500/20' : 'shadow-primary/20'}` — palette `bg-green-500`, free `shadow-lg`, `transition-all` |
| 2 | `src/components/sub-admin/create/CreateStepPrompt.tsx:91` | `shadow-lg shadow-primary/20` — free shadow |
| 3 | `src/components/sub-admin/create/CreateStepPublish.tsx:63` | `shadow-xl shadow-primary/30 h-[58px]` — free `shadow-xl` |
| 4 | `src/components/admin/common/BulkActionBar.tsx:33` | `!bg-transparent !border-none !text-text-secondary hover:!text-text-primary` — ghost material forced via important overrides |

- **3 non-material notes** (size/layout/typography-size; permitted or noted, NOT material):
  `BulkActionBar.tsx:30` (`!h-9 sm:!h-10 px-4 sm:px-6 text-xs sm:text-sm`), `SubmitExamModal.tsx:58`
  (`py-4 text-lg`), `SubmitExamModal.tsx:66` (`py-4 text-base`).

All 7 rows recorded in `BUTTON_LANGUAGE_SPECIFICATION.md` §5 (B-5 sweep result). **No consumer file
was edited in 5.4B** — rows 1–4 are 5.4G repository-migration work (B-1/B-4 class).

---

## 5. Files changed

| File | Change |
|---|---|
| `FOUNDATION_GOVERNANCE.md` | v1.21.0 → **v1.22.0**; PERMANENT **Button Language Contract** added to §2 (semantic roles table, elevation ladder consumption, focus/disabled/loading) |
| `BUTTON_LANGUAGE_SPECIFICATION.md` | Status → IMPLEMENTED (awaiting certification); §5 published-as-contract note (B-6 resolved); §5 B-5 sweep result table; §7 issue resolutions |
| `docs/design-system/PHASE_5_4B_IMPLEMENTATION_REPORT.md` | this report |
| `docs/design-system/PHASE_5_4B_VISUAL_VERIFICATION.md` | verification evidence |
| `docs/design-system/PHASE_5_4B_CERTIFICATION.md` | certification gate |
| `docs/design-system/DESIGN_DECISION_LOG.md` | **D-165** (5.4B IMPLEMENTED) |
| `FOUNDATION_FREEZE_REGISTER.md` | 5.4B entry (IMPLEMENTED) |
| `PHASE_3_1_EXECUTION_LOG.md` | 5.4B implementation entry |

**No production files changed.** No component, page, service, schema, theme value, or test was
modified. `git diff` touches governance/spec/docs only.

---

## 6. Verification summary

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (only pre-existing chunk-size warning) |
| `npx eslint .` | ✅ 397 problems (344 errors / 53 warnings) — **exact baseline, 0 new** |
| Palette / `transition-all` in button source | ✅ 0 matches |
| Compiled CSS | ✅ `:focus-visible`, `shadow-elevation-0/1/2/3`, `--button-*`, `--material-button-primary-shadow`, `--management-shadow`, `--elevation-0/1/2/3` all present in `dist/assets/index-*.css` |
| Dark mode | ✅ byte-identical (no theme value touched; `--button-*`/elevation/management dark values untouched) |
| B-5 sweep | ✅ 161 usages, 4 findings documented → 5.4G |

Full evidence in `PHASE_5_4B_VISUAL_VERIFICATION.md`.

---

## 7. Rollback

- Zero production code changed → rollback is a no-op for code.
- Governance/spec edits are revertable single-file changes (version bump + additive section).
- No token or recipe value was changed, so no Freeze Register value rollback applies.

---

## 8. Definition of Done

- [x] D-165 governance recorded
- [x] Role→variant map published as canonical contract (governance v1.22.0 §2)
- [x] Color / elevation / focus / disabled / loading / hover verification complete — zero code change
- [x] B-5 consistency sweep documented (findings deferred to 5.4G)
- [x] Dark mode untouched; no consumer/page file touched
- [x] Freeze Register + execution log + decision log updated
- [ ] **USER CERTIFICATION** (pending — `PHASE_5_4B_CERTIFICATION.md`)

## Next gate

**Phase 5.4B is IMPLEMENTED (awaiting user certification).** On certification, 5.4B CLOSES and the
next gated phase (5.4C Typography) requires a separate approval.
