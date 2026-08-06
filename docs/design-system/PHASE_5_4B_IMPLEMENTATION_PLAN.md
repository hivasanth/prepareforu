# Phase 5.4B - Button Language: Foundation Evolution Implementation Plan

- **Phase:** 5.4B (planning only)
- **Status:** PLANNING - **this plan is NOT approved for execution.** Implementation requires a separate dedicated approval (governance gate after D-163/D-164).
- **Date:** 2026-08-06
- **Parent specs (APPROVED 2026-08-06):** `BUTTON_LANGUAGE_SPECIFICATION.md`, `VISUAL_LANGUAGE_AUDIT.md`, `FOUNDATION_VISUAL_CERTIFICATION.md` (repo root — the approved Phase 5.4 blueprint). Phase 5.4A certified 2026-08-06 (D-161/D-162/D-163).
- **Authorization:** User authorized **planning only** for Phase 5.4B (2026-08-06) with explicit scope: semantic button roles, color system, elevation usage, hover behavior, focus, disabled, loading, button consistency. "Do not begin Phase 5.4B until a separate approval is granted."
- **Deliverable:** **Foundation evolution only. No page migrations.**
- **Build/verify command:** `npm run build` (= `tsc -b && vite build`); source verification via grep/Select-String; runtime verification via compiled `dist/assets/index-*.css` + computed-style checks.
- **Non-negotiables:** the frozen `AntigravityButton.tsx` recipe set (base/sizes/variants/motion/disabled/management) is the certified reference — 5.4B **enforces** the existing language, it does NOT redesign it. No typography, no hover language outside buttons, no pills, no motion, no skeletons, no page migrations. Dark mode stays **byte-identical**. Every edit is a single, revertable token/recipe-line change; zero consumer/component JSX changes outside the Foundation button source.

---

## 1. Scope (approved by the user, 2026-08-06)

All inside the Foundation (`AntigravityButton.tsx`, `themes.css` button/control tokens, `index.css` focus registration, governance/spec docs).

| Area | Approved deliverable | Files |
|---|---|---|
| **Semantic button roles** | Role→variant map (intent → material) published as the canonical contract; pages pick a role, the Foundation picks the material (B-6). | `BUTTON_LANGUAGE_SPECIFICATION.md` §5, governance docs |
| **Color system** | Status colors (success/danger/primary/soft) resolve only through tokens (`--color-success`/`--danger`/`--color-accent`/`--button-*`); zero palette classes; verified sweep. | verification + governance |
| **Elevation usage** | Buttons mapped onto the certified E0–E3 ladder (5.4A): ghost = E0, default = E1 (`--elevation-2`), hover = E2 (`--elevation-3`); no button shadow outside the ladder. | verification + governance |
| **Hover behavior** | Canonical button hover (framer scale + CSS brightness/shadow/lift per recipe); no `transition-all`, no free durations. Hover OUTSIDE buttons is 5.4E — out of scope. | verification only |
| **Focus** | Consistent keyboard focus: global `:focus-visible` outline (index.css:608-610) + `IconButton` opt-in `focusRing`; no gaps. | verification + governance |
| **Disabled** | `getDisabledCls` (`opacity-30/50 cursor-not-allowed pointer-events-none`) consistent on `Button`/`IconButton`. | verification only |
| **Loading** | `Spinner size="sm" border-current border-t-transparent` inside both components; no layout jump. | verification only |
| **Button consistency (B-5)** | Global sweep: no `Button`/`IconButton` `className` material overrides (color/surface/shadow) in consumers. Findings are DOCUMENTED for 5.4G; no consumer edits in 5.4B. | verification + governance |

---

## 2. Out of scope (deferred)

| Deferred | Item | Phase |
|---|---|---|
| Page-level button migrations / raw `<button>` residue (`AIToolCards` CTAs, `QuestionForm` micro-buttons) | B-1 / B-4 sweep, any consumer `className` fixes found by B-5 | 5.4G (Repository Migration) |
| Hover language outside buttons | H-* issues | 5.4E (Hover & Motion) |
| Button typography (size scale font/weight/spacing are frozen recipe constants) | T-* issues | 5.4C (Typography) |
| Button motion timing beyond the frozen recipe | M-* issues | 5.4E |
| Pills / badges / skeletons | P-*, SK-* | 5.4D / 5.4F |
| `IconButton variant="theme"` string split | B-2 (certified D-123) | FROZEN — no change |
| `PrimaryButton` min-width scale | B-3 (certified) | FROZEN — no change |
| Badge size overrides (`!h-* !px-* !text-[…]`) | B-4 | permitted; documented in Pill spec (5.4D) |

Only `BUTTON_LANGUAGE_SPECIFICATION.md` scope ships in 5.4B. No consumer/component file (other than the Foundation button source if a correction is required) is touched.

---

## 3. Ground truth of the current Button language (recorded 2026-08-06)

Verified in `src/components/common/AntigravityButton.tsx`, `src/styles/themes.css`, `src/index.css` — the plan is grounded, not assumed:

- **Frozen source:** `AntigravityButton.tsx` (235 lines) exports `Button`, `PrimaryButton`, `IconButton`. Base recipe `uppercase flex items-center justify-center transition-[color,box-shadow,border-color,opacity,filter] duration-200` (line 20). Sizes xs/sm/md/lg/xl (29-35) all `font-bold tracking-wider` with per-size `rounded-[…]` and `gap`. Motion `whileHover {scale:1.01}` / `whileTap {0.98}` (0.95 IconButton), `transition {0.2}`.
- **Variants (frozen):** `lightVariants`/`darkVariants`/`managementVariants` (38-95) implement primary/secondary/success/danger/soft/ghost; management opt-in overrides only primary/secondary (theme-independent neutral, `--management-accent`). Resolution rule line 74 / 111-112.
- **Color system (token-only):** primary = material tokens (`--material-button-*` light) / `bg-primary` dark / `bg-[var(--management-accent)]` management; success = `bg-success`, danger = `bg-danger`, soft = `bg-primary/10 … text-primary`. No `green-500`/`red-500`/`amber-*` palette classes anywhere in the recipe set (Phase 3.1 P1 already completed).
- **Elevation usage (mapped to the 5.4A ladder):**
  - primary light `--material-button-primary-shadow` = `--elevation-2` (themes.css:804) = **E1**; dark `shadow-elevation-2` = **E1**; hover `shadow-elevation-3` / `--elevation-3` = **E2**.
  - secondary light `--button-shadow-secondary` = `--elevation-2` (themes.css:920) = **E1**, hover `--elevation-3` (921) = **E2**; secondary dark `none` (665) = **E0**, hover `--elevation-1` (666).
  - success/danger `shadow-elevation-2` (**E1**) + colored glow, hover `shadow-elevation-3` (**E2**).
  - ghost `shadow-none` = **E0**.
  - management `--management-shadow` = `--elevation-2` (**E1**), hover `--management-shadow-hover` = `--elevation-3` (**E2**).
  - IconButton `theme` hover `shadow-elevation-2` (**E1**).
  - **Conclusion: every button shadow already resolves to a certified ladder level — no value change expected.**
- **Hover behavior:** framer scale is the shared interaction base; CSS hover = brightness (primary `hover:brightness-110`/105/100, soft), shadow lift (secondary/management `hover:shadow-button-secondary-hover`/`--management-shadow-hover`, theme `hover:shadow-elevation-2`), lift (secondary/management `hover:-translate-y-0.5`, primary light `active:translate-y-0.5`). No `transition-all`, no free durations.
- **Focus:** global `:focus-visible { outline: var(--focus-ring-width) solid var(--focus-ring-color); outline-offset: … }` (index.css:608-610; tokens themes.css:281-283 dark / 519-521 light). `IconButton` adds opt-in `focusRing` (`focus-visible:ring-2 …`, line 211). **Button already inherits the global focus outline — no gap.**
- **Disabled:** `getDisabledCls` → `opacity-30/50 cursor-not-allowed pointer-events-none` (23-26); `IconButton` accepts `disabledOpacity?: 30|50`.
- **Loading:** both components render `Spinner size="sm" className="border-current border-t-transparent"` in place of children (124/141/229).
- **Control role tokens:** `--button-*` namespace (themes.css:661-671 secondary/ghost; 917-921 light secondary) — all `var()`-derived, no literals except none.
- **Raw `<button>` residue (documented retained):** `AIToolCards.tsx` card CTAs, `QuestionForm.tsx` "Correct?" micro-button + Telugu accordion toggle — token-colored, structurally necessary (Phase 3.1 §8.2), preserved.

**Consequence:** 5.4B is overwhelmingly *canonicalization + governance + verification* (role map, color/elevation/focus/disabled/loading/hover verification) with **expected zero value changes**. Any correction discovered by the B-5 sweep that requires a Foundation recipe change is escalated as a separate decision — 5.4B does not silently restyle. This mirrors 5.4A's WS-1/WS-3 (mostly canonicalization).

---

## 4. Ordered task list

Order is risk-ascending. Each task is verification-first; code edits are expected to be none or minimal.

### Task 1 - Semantic button roles (B-6) — `BUTTON_LANGUAGE_SPECIFICATION.md` §5 + governance

1. Publish the role→variant map as the canonical contract (already drafted in spec §5):
   Primary/Save/Create/Update/Submit/Next → `primary`; Secondary/Cancel/Back/Previous/Close → `secondary`/`ghost`; Edit → `secondary`/`soft`; Delete/Remove → `danger`/`danger-soft`; Warning/Confirm-destructive → `danger` + glow; Success/Approve → `success`; Info → `primary`; Navigation/menu → `ghost`/`IconButton ghost`; Toolbar/Filter → `secondary`/`soft`; Reset → `soft`/`ghost`; Management action → management `primary`/`secondary`.
2. Add the governance rule: **"No page chooses its own button colors/material. A page picks a semantic role; the Foundation selects the variant. `Button`/`IconButton` `variant` is the single material selector."**
3. **Verify:** build; governance + spec updated; no code change.

### Task 2 - Color system verification — verification + governance

1. Sweep `AntigravityButton.tsx` + `themes.css` button tokens for palette leakage (`green-500`, `red-500`, `amber-*`, raw hex in recipes). Expected: zero (P1 completed).
2. Confirm status colors resolve via tokens: `bg-success`/`bg-danger`/`bg-primary`/`bg-primary/10`/`--material-button-*`/`--management-accent` → `--color-*`/`--color-accent`.
3. Record the button color contract in governance (semantic color distinguishes button purpose — the ONLY differentiator per the success criteria).
4. **Verify:** build; grep shows zero palette classes in the button source + button token namespace.

### Task 3 - Elevation usage (E0–E3 alignment) — verification + governance

1. Verify the §3 elevation table holds: every button shadow maps to E0 (`shadow-none`), E1 (`--elevation-2` family), or E2 (`--elevation-3` family). Expected: no change — the 5.4A ladder already covers it.
2. Add governance rule: **"Button elevation uses ONLY the certified ladder (E0 ghost / E1 default / E2 hover). No new button shadow tokens or values; no arbitrary `shadow-[…]` on buttons."**
3. **Verify:** build; compiled CSS shows button shadows resolve to `--elevation-2`/`--elevation-3`; `git diff` empty on `themes.css` elevation tokens.

### Task 4 - Hover behavior (buttons only) — verification only

1. Verify every button hover is the canonical recipe (framer scale base + CSS brightness/shadow/lift as documented in §3); no `transition-all`, no durations outside the frozen recipe.
2. Hover OUTSIDE buttons is explicitly deferred to 5.4E (H-*). No button-hover changes expected.
3. **Verify:** grep `transition-all` in button source = 0; hover recipes match the spec.

### Task 5 - Focus verification — verification + governance

1. Verify global `:focus-visible` outline (index.css:608-610) applies to `Button`; verify `IconButton` `focusRing` opt-in is available and used across admin (Phase 3.1 added it).
2. Record the focus contract: **keyboard focus = global `:focus-visible` outline; `IconButton` may opt into `focusRing` (ring-2 ring-primary ring-offset-2).** No gap expected.
3. **Verify:** build; `:focus-visible` registration present in compiled CSS; `focusRing` sweep documented.

### Task 6 - Disabled & loading verification — verification only

1. Verify `getDisabledCls` on both components (`opacity-30/50 cursor-not-allowed pointer-events-none`); `IconButton disabledOpacity` additive.
2. Verify loading renders `Spinner size="sm" border-current border-t-transparent` with no layout jump.
3. **Verify:** build; grep confirms both components use the shared helper + Spinner; no divergence.

### Task 7 - Button consistency sweep (B-5) — verification only (findings for 5.4G)

1. Global sweep: every `Button`/`IconButton`/`PrimaryButton` consumer `className` contains ONLY layout/spacing/margin or sanctioned size overrides — no color/surface/shadow material overrides.
2. Sanctioned overrides confirmed per spec §4.2: `LeaderboardMobileCard` badge `!h-6 !px-2 !text-[9px]`, `TopicListItem` badge `!text-[9px]` (size-only `!` overrides).
3. Any material-override finding is DOCUMENTED with file:line and deferred to 5.4G (no consumer edits in 5.4B).
4. **Verify:** sweep report produced; findings list (expected: 0, but documented if any).

### Task 8 - Governance + certification prep

1. Update `FOUNDATION_GOVERNANCE.md` with the button language contract (role→variant rule, E0/E1/E2 button elevation rule, token-only color rule, focus/disabled/loading contracts) — per `FOUNDATION_VISUAL_CERTIFICATION.md` criteria 8-11 (hover/focus/disabled/loading consistency).
2. Update `BUTTON_LANGUAGE_SPECIFICATION.md` §5 + §7 status (role map published; B-5/B-6 resolved).
3. Update `FOUNDATION_FREEZE_REGISTER.md` **after implementation** (button role map, elevation contract, governance version).
4. Produce `PHASE_5_4B_IMPLEMENTATION_REPORT.md` + `PHASE_5_4B_CERTIFICATION.md` + `PHASE_5_4B_VISUAL_VERIFICATION.md` + execution-log entries at the implementation gate.

---

## 5. Verification matrix (5.4B subset of the 14-criteria certification)

| Task | Build gate | Compiled-CSS grep | Computed-style / manual |
|---|---|---|---|
| T1 | `tsc -b && vite build` | n/a | role map matches frozen variants 1:1 |
| T2 | build | button shadows resolve to `--elevation-2`/`--elevation-3`; zero palette classes | status colors = tokens in both themes |
| T3 | build | button tokens → `--elevation-*` only; no new shadow values | E0/E1/E2 mapping verified per §3 |
| T4 | build | `transition-all` = 0 in button source | hover recipes match spec (brightness/shadow/lift/scale) |
| T5 | build | `:focus-visible` outline registration present | Tab-focus on Button shows outline; IconButton `focusRing` rings |
| T6 | build | shared helper + Spinner in both components | disabled = opacity+cursor+pointer-events; loading = spinner, no jump |
| T7 | build | n/a | B-5 sweep report: 0 material overrides (or documented findings) |
| T8 | build | n/a | governance/spec updated |

**Foundation-only gate:** `git diff` must touch ONLY `AntigravityButton.tsx` (if any correction), `themes.css`/`index.css` (if any token correction — expected none), and spec/governance docs. Any consumer/page diff fails the phase.

---

## 6. Rollback

- Expected: **zero code changes** (pure canonicalization + governance + verification). If a Foundation correction is required, it is a single revertable line in the recipe/token.
- Any required correction is first escalated as its own Design Decision; it is NOT bundled silently into 5.4B.
- On any certification failure, revert the failed change (if any), record in the Freeze Register, and re-attempt with an updated Design Decision.

---

## 7. Definition of Done

- [ ] D-163 certification recorded (5.4A) + D-164 governance recorded (this plan — planning only)
- [ ] Role→variant map published + governance rules added
- [ ] Elevation/color/focus/disabled/loading/hover verification complete (expected zero code change)
- [ ] B-5 consistency sweep documented (findings, if any, deferred to 5.4G)
- [ ] Dark mode byte-identical; no consumer/page file touched
- [ ] Freeze Register updated; execution log + `PHASE_5_4B_CERTIFICATION.md` produced; **user certifies**

---

## 8. Working-tree caveat (precondition, not 5.4B work)

Branch `phase-3.5` still has a large uncommitted working tree (admin/common + user component relocations). Before 5.4B implementation, the working tree should be committed/stabilized so the 5.4B diff is isolated to Foundation files. This is a precondition for Task 3/7 diff verification, not a migration task.
