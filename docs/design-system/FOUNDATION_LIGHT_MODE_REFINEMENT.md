# FOUNDATION_LIGHT_MODE_REFINEMENT

- **Phase:** 3.7/V — Task 19: Light Mode Refinement
- **Status:** SPECIFICATION (evidence-based, read-only). Awaiting approval; small token-value tuning
  only — **no new color names, no new theme**, keep hierarchy/shadows/premium.
- **Governing rule:** increase perceived brightness WITHOUT changing the theme, WITHOUT making it
  flat, WITHOUT reducing separation/hierarchy.

---

## 1. Current state (evidence) — `.light` block (`themes.css:433-497`)

Code first (DS-020 already brightened):
- `--bg-app: #FAFBFC`, `--bg-surface: #FFFFFF`, `--bg-elevated: #F4F6F8`, `--bg-hover: #F4F6F8`,
  `--bg-active: #E7ECF1`, `--bg-disabled: rgba(15,23,42,0.04)`, `--bg-input: #FFFFFF`.
- Borders: `--border-default: #E2E8F0`, `--border-input: #CBD5E1`, `--border-hover: #94A3B8`,
  `--border-disabled: rgba(148,163,184,0.5)`, `--border-subtle: #E2E8F0`;
  `--card-border: var(--border-subtle)`.
- Text labels: `--text-primary #111827`, `--text-secondary #4B5563`, `--text-muted #6B7280`,
  `--text-hint #9CA3AF`, `--text-disabled #9CA3AF`.
- Shadows: `rgba(15,23,42,…)` 0.04–0.12 (subtle).
- Management light: `--management-border #E2E8F0`, `--management-border-strong #CBD5E1`,
  mgmt surface `#FCFCFD/#F6F8FA/#EDF1F5`.

---

## 2. Findings vs "feels heavy"

| Symptom (from T19) | Root token | Assessment |
|---|---|---|
| Containers feel darker | `--bg-elevated #F4F6F8`, `--bg-active #E7ECF1` | Already lightened (DS-020). Boundary between elevated/active can be softened by 1 step |
| Cards feel darker | `--card-bg`/`--bg-card-bg` (white) + `--card-border var(--border-subtle) #E2E8F0` | Cards are essentially white; the border `#E2E8F0` reads fine. |
| Labels insufficient contrast | `--text-hint #9CA3AF` (≈2.7:1 on `#FAFBFC`) | **The weak link.** `text-hint` is used for the quietest labels; move intended-label usage to `text-secondary #4B5563`. |
| Borders too strong | `--border-input #CBD5E1`, `--border-hover #94A3B8` | `border-hover #94A3B8` is the strongest neutral; only on hover/focus (fine). `border-input #CBD5E1` on every input is the "strong border" feel — can relax to `#E2E8F0`. |

**Residual "heavy" contributors** are the **saturated premium/gold/amber light surfaces and the dark
chrome**, not the neutral grays:
- `--surface-stat` gold gradient, `--surface-tab-pill` gold (legit premium chrome).
- Light-mode sidebar/header intentionally dark-forest + gold (`index.css` overrides, nav gold
  `#C8960C`) — deliberate, not to be brightened.
- Amber label tints (`text-amber-400` on metadata) are the most "gold-heavy" feel (see T18).

---

## 3. Foundation refinement proposal (small, token-driven, DS-020-consistent)

All in `.light`; **no new color names, no parallel theme**; each is a value relaxation only:1. **Brighten elevated/active boundary by one step:**
   - `--bg-elevated: #F4F6F8 → #F6F8FA`
   - `--bg-active: #E7ECF1 → #EEF2F6`
   (White `--bg-app`/`--bg-surface`/cards unchanged → keep the separation, just widen the middle band.)
2. **Relax input/hover border intensity:**
   - `--border-input: #CBD5E1 → #DAE2EA`
   - `--border-default: #E2E8F0 → #E5EAEF` (kept)
   - Keep `--border-hover` as-is (only on hover) or soften to `#A8B8C4`.
3. **Lift label contrast:**
   - Move quiet metadata from `text-hint` to `text-secondary` in the label stack (component-level,
     T15/statistics, not a token color change). Keep `--text-hint #9CA3AF` for true disabled.
4. **Shadow softness:** keep `rgba(15,23,42)` family; optionally reduce the top/elevation stop to
   preserve airiness without flatness.

**Guarantees:** theme identity preserved (same palette family); hierarchy preserved (elevated node
still distinct from applied value; borders still distinct); **not** flattened (shadows/elevation
kept); premium surfaces untouched.

---

## 3.1 Concrete token snapshot

| Token | was | proposed |
|---|---|---|
| `--bg-elevated` | `#F4F6F8` | `#F6F8FA` |
| `--bg-active` | `#E7ECF1` | `#EEF2F6` |
| `--border-input` | `#CBD5E1` | `#DAE2E8`? keep near-default |
| `--text-hint` call sites | used on quiet labels | migrate to `text-secondary` |

*Final numeric values to be confirmed at implementation by contrast test; direction is the contract.*

---

## 4. Status

- **PROPOSED (values)** — DS-020 (light brightness) is already shipped; T19 refines one more step +
  label-ladder migration. Implementation is token-value-only + StatText-label migration, no page
  overrides. Evidence: `FOUNDATION_VISUAL_LANGUAGE_AUDIT.md §3.7`.