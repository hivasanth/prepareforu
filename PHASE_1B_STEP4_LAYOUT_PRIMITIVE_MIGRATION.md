# Phase 1b — Step 4: Layout Primitive Migration

Source: Phase 1b Step 3 spacing integration (`PHASE_1B_STEP3_SPACING_INTEGRATION.md`) and Step 2 spacing token spec (`PHASE_1B_STEP2_SPACING_TOKEN_SPEC.md`)
Status: COMPLETE. Layout primitives are now the first official consumers of the spacing token system.
Scope: The five named layout primitives only — PageContainer, Stack, Grid, SectionBlock, ContentContainer. No pages, no reusable UI components.

---

## 1. Migration Summary

### Files modified

| File | Change |
|---|---|
| `src/components/common/AntigravityLayout.tsx` | Stack and Grid now resolve all spacing through the token system; SectionBlock consumes `var(--space-3)`; added a single shared module-level `PX_TO_SPACE` lookup (px → token) used by both Stack and Grid. |
| `src/components/common/AntigravityUI.tsx` | `SectionBlock` added to the barrel export so it is available as a canonical layout primitive for Step 5 consumers. |

### Layout primitives updated

| Primitive | Before | After |
|---|---|---|
| **PageContainer** | `p-4 md:p-6`, `px-2 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-6 md:py-10` | **No change required** — these are standard utilities on token-mapped keys (4, 6, 2, 5, 8, 10) and already resolve through `--spacing-N` → `--space-N` via the Step 3 wiring. No hardcoded spacing literals present. |
| **Stack** | gap ladder `gap-[4px]…[48px]` + default `gap-[12px]` (arbitrary literals); numeric `gap` via inline `{ gap: `${gap}px` }` | gap ladder → `gap-[var(--space-N)]`; default → `gap-[var(--space-3)]`; numeric `gap` on the token scale → `{ gap: 'var(--space-N)' }`, off-scale → unchanged px fallback. |
| **Grid** | default `gap-4 md:gap-5 lg:gap-6` (already token-backed); numeric `gap` via inline `{ gap: `${gap}px` }` | default ladder unchanged; numeric `gap` on the token scale → `{ gap: 'var(--space-N)' }`, off-scale → unchanged px fallback. |
| **SectionBlock** | `space-y-[12px]` | `space-y-[var(--space-3)]` |
| **ContentContainer** | — | **Does not exist in the repository.** Nothing to migrate. See Step 5 note below. |

### Spacing tokens consumed

Direct token references now used by the primitives: `--space-1`, `--space-2`, `--space-3`, `--space-4`, `--space-6`, `--space-8`, `--space-12`. The shared `PX_TO_SPACE` lookup covers the full frozen scale (all 13 tokens: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 px) for numeric `gap` props.

### Hardcoded spacing values removed

- Stack: `gap-[4px]`, `gap-[8px]`, `gap-[16px]`, `gap-[24px]`, `gap-[32px]`, `gap-[48px]`, `gap-[12px]` (default)
- SectionBlock: `space-y-[12px]`
- Stack/Grid numeric `gap` inline px for every on-scale value in use (`0`, `4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48`)

### Reusable layout behavior consolidated

- Numeric px → token resolution lives in ONE module-level map (`PX_TO_SPACE`) shared by Stack and Grid — no duplicated lookup logic.
- The token scale is the single source for all primitive spacing; primitives no longer carry their own pixel scale.

### Identified additional layout primitives (audit result)

| Candidate | Decision |
|---|---|
| `SectionWrapper` (`AntigravityLayout.tsx`) | **Out of scope, documented.** Unused legacy vertical-spacing container using an off-scale `space-y-[14px]` (14px is not on the Step 2 token scale). Migrating it would require either a new token or a 12px/16px visual change — both forbidden by this phase. No consumers exist, so it is inert. |
| `PageHeader` / `SectionHeader` | **Out of scope.** Header composites (typography/icon/actions), not layout primitives; belong to Step 5 (reusable UI components). Their `gap-[8px]` / `space-y-[4px]` literals remain hardcoded pending Step 5. |
| `StatePanel` / `SelectionContainer` | **Out of scope.** Surface/panel components, not layout primitives. |
| `ExamLayout` / `ReviewLayout` | **Out of scope.** Exam-specific components (explicitly excluded by the phase scope). |
| `StaggerContainer` / `StaggerItem` | **Out of scope.** Animation wrappers (framer-motion), no spacing ladders. |

---

## 2. Architecture Validation

### Every layout primitive consumes spacing tokens — VERIFIED

- **PageContainer**: all spacing via mapped utilities (`p-4`, `md:p-6`, `px-2`, `sm:px-4`, `md:px-5`, `lg:px-6`, `xl:px-8`, `py-6`, `md:py-10`) → `var(--spacing-N)` → `var(--space-N)`. `max-w-[1280px]` is sizing (excluded system), not spacing.
- **Stack**: all gap ladder entries and the default are token references; numeric gaps resolve to tokens when on scale.
- **Grid**: default ladder already token-backed; numeric gaps resolve to tokens when on scale.
- **SectionBlock**: `space-y-[var(--space-3)]`.
- **ContentContainer**: N/A (does not exist).

### No hardcoded spacing values remain inside the in-scope primitives — VERIFIED

The only spacing literals left in `AntigravityLayout.tsx` are inside `PageHeader` (`gap-[8px]`, `space-y-[4px]`) and the legacy `SectionWrapper` (`space-y-[14px]`) — both explicitly out of scope for Step 4.

One documented exception: off-scale numeric `gap` values (in use only as `gap={10}` in `SubjectCardItem.tsx:43`) fall back to the raw px inline value because 10px is deliberately not a token (Step 2 exclusions). Migrating it would require creating a new token, which this phase forbids.

### No new spacing values were introduced — VERIFIED

Every value used maps 1:1 onto the frozen Step 2 scale. `PX_TO_SPACE` is a direct px → token translation of the existing scale (13 entries, no additions).

### No additional abstraction layers were created — VERIFIED

`PX_TO_SPACE` is plain module-level data (a lookup table), not a component, utility layer, or semantic/alias layer. It sits inside the existing primitives file.

### Layout logic has not been duplicated — VERIFIED

Stack and Grid share the single `PX_TO_SPACE` lookup. No primitive reimplements another's spacing behavior.

### Architecture unchanged

```
Pages
  ↓
Reusable Components
  ↓
Spacing Tokens
```

No primitive, semantic, or alias spacing layers introduced.

---

## 3. Visual Validation

### Computed-value equivalence — VERIFIED

Every changed rule resolves to the same pixel value before and after (token values from `themes.css:320-332`):

| Primitive | Before (rule) | After (rule) | Computed |
|---|---|---|---|
| Stack xs | `gap: 4px` | `gap: var(--space-1)` | 4px |
| Stack sm | `gap: 8px` | `gap: var(--space-2)` | 8px |
| Stack md / default Grid | `gap: 16px` | `gap: var(--space-4)` | 16px |
| Stack lg | `gap: 24px` | `gap: var(--space-6)` | 24px |
| Stack xl / section | `gap: 32px` | `gap: var(--space-8)` | 32px |
| Stack xxl | `gap: 48px` | `gap: var(--space-12)` | 48px |
| Stack (unknown key) | `gap: 12px` | `gap: var(--space-3)` | 12px |
| Stack numeric on-scale | `gap: Npx` | `gap: var(--space-N)` | Npx |
| Stack/Grid numeric off-scale (e.g. 10) | `gap: 10px` | `gap: 10px` (unchanged) | 10px |
| SectionBlock | `margin-block…: calc(12px …)` | `…: calc(var(--space-3) …)` | 12px |

Compiled CSS was regenerated with `@tailwindcss/cli@4.2.2` and inspected. All eight new arbitrary-value classes are emitted with correct token references, e.g.:
- `.gap-\[var\(--space-1\)\]{gap:var(--space-1)}`
- `.space-y-\[var\(--space-3\)\]` → `margin-block-start:calc(var(--space-3) * var(--tw-space-y-reverse))`, `margin-block-end:calc(var(--space-3) * calc(1 - var(--tw-space-y-reverse)))`

Numeric inline `gap` styles are applied at runtime via `style` and do not appear in the compiled CSS; their equivalence is by construction (same value, token-resolved source).

### Zero spacing regressions / layout regressions / redesign — VERIFIED

This is a literal 1:1 token substitution on existing values. No layout math, ordering, flex/grid configuration, or visual styling changed. No page, card, button, form, table, modal, or chart was touched.

### User / Admin / Sub Admin / Auth / Exam / Review parity — VERIFIED

None of those panels' rendering code changed. They render the same primitives with the same computed spacing. The two user-visible changes are that `SectionBlock` is now importable from the barrel and the compiled CSS class names for a few gaps differ while computed values match.

---

## 4. Responsive Validation

### PageContainer spacing ladder — IDENTICAL

`px-2 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-6 md:py-10` — untouched, already token-backed. Every breakpoint resolves identically.

### Stack spacing ladder — IDENTICAL

Gap ladder has no responsive variants; values now token-resolved, computed values identical at every breakpoint.

### Grid spacing ladder — IDENTICAL

Default `gap-4 md:gap-5 lg:gap-6` unchanged (16/20/24px, all token-mapped keys). Numeric gap overrides unaffected by breakpoints (inline style is uniform).

### SectionBlock spacing — IDENTICAL

`space-y` margin rules (including `--tw-space-y-reverse` handling) computed identically; no responsive variants.

### ContentContainer — N/A

No such primitive exists.

### Breakpoint verification — VERIFIED

No `sm:` / `md:` / `lg:` / `xl:` / `light:` rule, no media-query block, and no responsive override was added, removed, or edited by this phase. The only compiled-CSS change is value-source substitution within existing rules.

---

## 5. Repository Readiness

### Ready for Phase 1b — Step 5 — CONFIRMED

- The five layout primitives (or their absence) are documented and auditable.
- Every in-scope primitive either consumes tokens directly (`Stack`, `Grid`, `SectionBlock`) or is already token-backed with zero literals (`PageContainer`).
- `SectionBlock` is now exported from the barrel so reusable UI components can compose it.
- Future reusable UI components should inherit/compose these primitives instead of reimplementing layout behavior (canonical layout behavior rule).

### Step 5 decision notes

1. **ContentContainer does not exist.** Step 5 should decide whether to introduce it as a new layout primitive (a deliberate addition, not a migration) before reusable components depend on it — otherwise it stays a non-primitive.
2. **Off-scale 14px** (`SectionWrapper`) and **10px** (numeric Grid gap in `SubjectCardItem`) are legacy values not on the token scale. If Step 5 needs them, the design system must first approve token additions (DS-014 Token Approval Policy, `FOUNDATION_GOVERNANCE.md` §13) — do not inline-adopt them silently.
3. **PageHeader / SectionHeader** literals (`gap-[8px]`, `space-y-[4px]`) should be tokenized during Step 5's component migration.

### Success Criteria — all met

- [x] All layout primitives consume the spacing token system (Stack, Grid, SectionBlock direct; PageContainer via mapped utilities; ContentContainer N/A)
- [x] Hardcoded spacing removed from layout primitives where appropriate (off-scale legacy values documented, not silently kept)
- [x] Layout behavior standardized (shared `PX_TO_SPACE`, no duplicated logic)
- [x] Responsive behavior unchanged
- [x] Visual appearance unchanged (computed-value equality verified)
- [x] No duplicate layout implementations exist
- [x] No additional abstraction layers introduced
- [x] Repository fully prepared for reusable UI component migration

### Build status note

Same pre-existing blockers as Step 3 (unrelated to this phase): missing `ToastContainer` export in `AntigravityUI.tsx` (imported by `SubAdminCreate.tsx`), duplicate `selectedTopic` key in `useTopicExams.ts`, and pre-existing `tsc` errors in pages/services. `tsc --noEmit` reports **no errors** in the two files touched by this phase. CSS verification was performed directly through the Tailwind compiler.

## Final Approval & Governance Encoding

Phase 1b Step 4 is **approved**. The repository is ready to begin **Phase 1b Step 5** (reusable UI components become consumers of the layout primitives and spacing token system).

The 10 final recommendations (Layout Primitive Freeze, ContentContainer Decision, Legacy Boundaries, Off-Scale Governance, No Layout Logic Duplication, Layout/UI Separation, Step 5 Scope Control, Component Migration Order, Per-Group Certification, Repository Simplicity) are permanently encoded in `FOUNDATION_GOVERNANCE.md` **v1.16.0**:

| Recommendation | Governance location |
|---|---|
| 1. Freeze Layout Primitives | §11 Canonical Layout Primitives (PageContainer, Stack, Grid, SectionBlock) |
| 2. ContentContainer Decision | §11 ContentContainer Decision — **Option A adopted** (not created unless repository-wide need) |
| 3. Keep Legacy Components Outside Step 5 | §11 Legacy Layout Components (SectionHeader, SectionWrapper, PageHeader) |
| 4. Preserve Off-Scale Governance | §13 Off-Scale Legacy Values (10px/14px → Token Approval Policy) |
| 5. Prevent Layout Logic Duplication | §11 Compose, Don't Recreate |
| 6. Separate Layout from UI | §11 Separation of Layout from UI |
| 7. Step 5 Scope Control | §14 Step 5 Execution Governance (inclusion/exclusion lists) |
| 8. Component Migration Order | §14 Step 5 Execution Governance (Surface → Form → Action → Navigation → Feedback → Data) |
| 9. Certification per Component Group | §14 Step 5 Execution Governance (per-group checkpoints) |
| 10. Preserve Repository Simplicity | §14 Step 5 Execution Governance + §13 Simplicity |

No runtime code was modified by the governance encoding.

### Governance Round 2 — Step 5 Execution Completion (v1.17.0)

A second governance round (Phase 1b — Final Recommendations Before Step 5) further
hardened Step 5 rules. The 10 additional recommendations are permanently encoded in
`FOUNDATION_GOVERNANCE.md` **v1.17.0**:

| Recommendation | Governance location |
|---|---|
| 1. Freeze Step 5 Scope | §14 Step 5 Execution Governance (scope frozen; new work deferred, never absorbed) |
| 2. Component Inventory First | §14 Step 5 Inventory & Canonical Components |
| 3. Define Canonical Components | §14 Step 5 Inventory & Canonical Components |
| 4. Preserve Public APIs | §14 Step 5 API Stability & Deprecation |
| 5. Composition Before Configuration | §11 Compose, Don't Recreate (Composition Before Configuration) |
| 6. Component-Level Documentation | §14 Step 5 Documentation & Metrics |
| 7. Deprecation Policy | §14 Step 5 API Stability & Deprecation |
| 8. Migration Metrics | §14 Step 5 Documentation & Metrics |
| 9. Final Step 5 Certification | §14 Step 5 Certification |
| 10. Maintain Design System Discipline | §14 Step 5 Discipline |

No runtime code was modified by the governance encoding.

### Governance Round 3 — Step 5 Execution Governance Finalization (v1.18.0)

A third governance round (Phase 1b — Step 5 Preparation: Final Execution
Recommendations) added the execution discipline for the component migration itself. The
10 additional recommendations are permanently encoded in `FOUNDATION_GOVERNANCE.md`
**v1.18.0**:

| Recommendation | Governance location |
|---|---|
| 1. Inventory Approval Gate | §14 Step 5 Inventory & Canonical Components |
| 2. Migrate One Component Group at a Time | §14 Step 5 Execution Governance (Audit → Migration → Validation → Certification → Approval per group) |
| 3. Canonical Component First | §14 Step 5 Inventory & Canonical Components |
| 4. Keep Migrations Small | §14 Step 5 Execution Governance (one component / closely related family) |
| 5. Preserve Behavioral Parity | §14 Step 5 Behavioral Parity (regressions = migration failures) |
| 6. Documentation Immediately After Migration | §14 Step 5 Documentation & Metrics |
| 7. Repository Health Checkpoints | §14 Step 5 Repository Health Checkpoints |
| 8. Controlled Exceptions | §14 Step 5 Controlled Exceptions (reason, temporary impl, future phase, owner, removal condition) |
| 9. Final Step 5 Approval | §14 Step 5 Certification (expanded 8-point checklist) |
| 10. Freeze the Foundation | §14 Step 5 Foundation Freeze (extend, don't redesign) |

No runtime code was modified by the governance encoding.

## Final Principle

> Layout primitives establish structure. Reusable UI components build upon that structure. Pages compose reusable components. Every layer should have a single responsibility, consume the Design System directly where appropriate, and avoid duplicating layout logic. Simplicity, consistency, and maintainability remain the primary architectural goals.
