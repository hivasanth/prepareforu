# Phase 5.3E - Render-Affecting Token Corrections: Visual Delta Report

- **Phase:** 5.3E (planning only)
- **Status:** PLANNING (no implementation, no token changes, no source changes)
- **Date:** 2026-08-04
- **Governance:** D-158 (planning only)
- **Purpose:** for every correction, quantify the pixel-level visual change per surface and per theme, classify the blast radius, and define what must be verified. Screenshots are NOT stored in the repository; all deltas below are derived from the certified token values (themes.css) and the compiled `dist` CSS.

---

## 0. Delta summary

| Correction | Dark mode | Light mode | Layout/size/structure | Blast radius | Classification |
|---|---|---|---|---|---|
| Group A aliases (repoint) | **byte-identical** | state colors shift to certified canonicals | none | 6 files (12 refs) | **Medium** |
| Radius **Option A** (themes.css wins) | byte-identical | byte-identical | none | 0 | **None (render-neutral)** |
| Radius **Option B** (`@theme` wins) | 20/24px → 12/16px | 20/24px → 12/16px | corner radius only (material language change) | 87 files | **Critical** |
| `--input-border` | `#4B5563` → `#374151` | `#CBD5E1` → `#E2E8F0` | none | 4 consumers | **Low** |
| Group B carved | none | none | none | 0 | **None (false positive)** |
| `text-stat-value` | none | none | none | 0 | **None (dead registration)** |

---

## 1. Group A - Legacy color aliases

### 1.1 Before (current, light mode - theme-blind)

| Alias | Rendered today (both themes) | Correct canonical (light) | Delta |
|---|---|---|---|
| `--danger` | `#F87171` light red | `#DC2626` deep red | +saturation, darker |
| `--success` | `#22C55E` bright green | `#16A34A` forest green | darker |
| `--warning` | `#FBBF24` yellow | `#D97706` amber | darker |
| `--info` | `#3B82F6` blue | `#166534` **dark green** | hue shift (blue → green) |
| `--secondary` | `#10B981` green | `#C8960C` gold | hue shift (green → gold) |

### 1.2 After (light mode)

Icons, badges, marks, and metric surfaces resolve the certified canonicals - **matching what `text-danger`/`bg-success` utilities already render in light mode today.** This closes the internal inconsistency where the same semantic state renders two different colors depending on whether it goes through a utility or an inline `var(--alias)`.

### 1.3 Affected surfaces (light mode)

| Surface | Components | Perceived change |
|---|---|---|
| StatCard icon color | ReviewLayout, StatisticsSection, StudentDetailModal, ResultView, SubAdminDashboard | small icon color shift; **info** icon goes blue→dark green (most visible) |
| TopicReader "Watch Video" button bg | TopicReader.tsx:101 | light-red `#F87171` → deep-red `#DC2626` background |
| Negative-marking MetricBlock | ExamPaperCard, SelectionView | **no change** (already theme-aware via utility branch) |

### 1.4 Notes / verification asks

- `--info` light value `#166534` is **dark green** (identical to `--color-accent` light). Verify against golden reference whether the info state in light mode should be blue - if it is a theme defect, correct `themes.css:484` as a separate follow-up, do NOT mask it inside 5.3E.
- `--secondary` light gold `#C8960C` is the certified light accent-family color; green StatCards (e.g. StatisticsSection ACCURACY) will render gold in light mode. Confirm this is intended (secondary = brand gold) vs the dark-mode green.
- Dark mode must be **byte-identical** - the repoint resolves the same dark values.
- Manual pass recommended: exam review (light), student detail modal (light), sub-admin dashboard (light), result page (light).

---

## 2. Radius conflicts

### 2.1 Option A (recommended - render-neutral)

- **Before:** `rounded-xl` = 20px, `rounded-2xl` = 24px (unlayered themes.css wins).
- **After:** identical - `@theme` values aligned to 20px/24px so both sites agree.
- **Delta: none.** This is the zero-risk resolution; it makes the source truth match the already-certified rendered truth.

### 2.2 Option B (Critical - only if D-111 `@theme` is declared authoritative)

- **Before:** cards/buttons/modals/inputs 20px (`rounded-xl`) and 24px (`rounded-2xl`) corners.
- **After:** 12px (`rounded-xl`) and 16px (`rounded-2xl`) - an 8px reduction on every corner; a tighter, more compact material language.
- **Delta:** repository-wide across 87 files; every page family visually changes. Requires a screenshot baseline per page family before implementation and a full regression after.

### 2.3 Governance conflict

The cert documentation (`ADMIN_USERS_U1_VISUAL_COMPARISON`) references `rounded-2xl = 16px` as a design target (supports Option B as *intent*), but the current **runtime is 20/24px** and the token audit FG-5 names themes.css (20/24) as canonical. Two authoritative records disagree; 5.3E must pick one deliberately. **Recommendation: Option A now (zero risk, matches runtime), Option B only as a separately-baselined future phase if the tighter radius is truly intended.**

---

## 3. `--input-border`

- **Before:** input-family borders `#4B5563` (dark) / `#CBD5E1` (light) - lighter than the certified `.ancient-input` render (`--border-subtle`).
- **After:** `#374151` (dark) / `#E2E8F0` (light) - matches the golden Input render (D-121).
- **Perceived delta:** subtle - roughly one shade darker in dark mode, one shade lighter in light mode; both remain in the same gray family. Affects AntigravityForm fields, PremiumSelect triggers, `.light select`, `.light .ancient-otp`.
- **Verification:** computed border-color on the four consumers; confirm no visible contrast regression on inputs.

---

## 4. Group B - Carved shadow recipes

**No visual delta.** Each recipe has exactly one definition site; the inventory's "merge" classification was a false positive. No action, no verification beyond confirming no second definition appears in future batches.

---

## 5. `text-stat-value`

**No visual delta.** The class renders color-only today; LoginPage stat values already size via the `Display` component's inline `fontSize: var(--text-display)` (=1.75rem). Removing the dead `@theme` font-size registration and dead responsive overrides changes nothing rendered. Any attempt to make `text-stat-value` actually apply font-size WOULD change LoginPage rendering and is explicitly out of scope (requires a namespace rename).

---

## 6. Golden reference checkpoints (post-implementation checklist)

| Checkpoint | Surface | Assertion |
|---|---|---|
| G-1 | StatCard icons, light | = `#DC2626` / `#16A34A` / `#D97706` / `#166534` / `#C8960C` per variant |
| G-2 | StatCard icons, dark | byte-identical to pre-change |
| G-3 | TopicReader watch button, light | `#DC2626` |
| G-4 | Inputs/select/otp borders | `#374151` dark / `#E2E8F0` light |
| G-5 | Radius (Option A) | 20px/24px everywhere, unchanged |
| G-6 | LoginPage stats | 1.75rem, color `--text-primary`, unchanged |
| G-7 | Negative-marking MetricBlocks | unchanged (utility branch) |

Screenshots: none in repo; the checklist above is the manual/computed-style verification plan.
