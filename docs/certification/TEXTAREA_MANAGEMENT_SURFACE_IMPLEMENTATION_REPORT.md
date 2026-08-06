# TextArea `variant="management"` — Implementation Report

**Phase 4.1A (D-149) — dedicated Foundation evolution phase (TextArea-only).**
**Status:** ✅ Implementation COMPLETE (2026-08-03) — certification pending approval.
**Scope:** additive Foundation evolution. **Zero consumer migration in this phase.**
**Gate:** D-149 (approval + phase opening). Certification acceptance → D-150 (after user approval).

---

## 1. Audit (Step 1)

### 1.1 Component

| Fact | Value |
|---|---|
| Location | `src/components/common/AntigravityForm.tsx:77` (pre-change) |
| Variant API | `'default' \| 'compact'` |
| Default surface | `FIELD_SURFACE` = `bg-input-bg border border-input-border rounded-xl text-input-text` |
| Default focus | `FIELD_FOCUS` = `focus:border-input-focus-border` |
| Light material class | `.ancient-textarea` — **MATERIAL FAMILY C (gold)**: `border: 1px solid var(--border-gold)`, `border-radius: 24px`, gold focus glow (`0 0 0 3px rgba(168,120,40,0.22)`), warm cream surface — defined at `src/index.css:884-922` (shared rule block with `.ancient-input`/`.ancient-select`) |

### 1.2 Consumers (every `<TextArea>` in the repo)

| Consumer | Usage | Variant passed |
|---|---|---|
| `src/components/admin/questions/QuestionForm.tsx` | ×7 (question text, options, explanation, visual JSON) | none → `default` |
| `src/components/admin/questions/JsonTab.tsx` | ×1 (JSON editor) | none → `default` |
| `src/components/admin/questions/PromptEditorModal.tsx` | ×1 (prompt editor) | none → `default` |
| `src/components/admin/topics/LangInputPanel.tsx` | ×1 (topic content editor, out of scope page) | none → `default` |
| `src/ds003-runtime-audit.test.tsx` | DS-003 runtime audit (default/compact/error states) | none → `default` |

**Finding:** zero consumers pass a `variant`, so all render `default`. Adding `'management'` to the variant union is a **strict superset** — no existing consumer can change behaviour (type-guaranteed by TS union widening).

### 1.3 Gap (G7)

The Phase 4.1 Admin Questions audit (D-148) catalogued **G7 — `TextArea` has no `management` variant**. A fully-management `QuestionForm`/`JsonTab`/`PromptEditor` (the Admin Questions migration, M-list) is impossible without it. Per D-145/D-149, the gap is resolved here — in a **dedicated Foundation phase** — never inside the page migration.

---

## 2. Design (Step 2)

Mirrors the **certified `Input variant="management"` recipe** (`AntigravityForm.tsx:37-44`) exactly:

| Recipe part | Input management (certified) | TextArea management (new) |
|---|---|---|
| Surface | `bg-[var(--management-surface)] border border-[var(--management-border)] rounded-xl text-text-primary` | **identical** |
| Focus | `focus:border-[var(--management-accent)]` | **identical** |
| Ancient material | `management ? '' : 'ancient-input'` | `management ? '' : 'ancient-textarea'` |

- **Additive-only:** `'management'` added to the variant union; `default`/`compact` render paths unchanged (see §3.4).
- **Token namespace:** consumes the certified Phase 3.9 `--management-*` tokens only (`--management-surface`, `--management-border`, `--management-accent`; themes.css:1197-1207 dark, 1276-1286 light). **No new tokens, no `:root` mutation, no amber.**
- **No new utilities:** the management class list is identical to the already-compiled Input management utilities (`management-surface` ×21 occurrences in `dist/assets/*.css`). Nothing new to purge/emit.
- **`resize-none` retained** on all branches (existing TextArea behaviour; not a management-specific change).
- **Padding:** management uses the default `px-4 py-3` (matches Input management's default-field padding).

### 2.1 Final implementation (`AntigravityForm.tsx`)

```tsx
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** DS-003 variant API. `default` (unchanged) | `compact` (denser field) |
   *  `management` (Phase 4.1A/D-149 — neutral Management Surface Family field;
   *  excludes `.ancient-textarea` so the light gold textarea material cannot override it). */
  variant?: 'default' | 'compact' | 'management'
}

export const TextArea: React.FC<TextAreaProps> = ({
  variant = 'default',
  className = '',
  ...props
}) => {
  const compact = variant === 'compact'
  const management = variant === 'management'
  const paddingCls = compact ? 'p-3' : 'px-4 py-3'
  const surfaceCls = management
    ? 'bg-[var(--management-surface)] border border-[var(--management-border)] rounded-xl text-text-primary'
    : FIELD_SURFACE
  const focusCls = management
    ? 'focus:border-[var(--management-accent)]'
    : FIELD_FOCUS

  return (
    <textarea
      className={`
        w-full ${management ? '' : 'ancient-textarea'} resize-none ${surfaceCls}
        text-[14px] font-bold placeholder:text-text-placeholder placeholder:opacity-40 placeholder:font-medium
        focus:outline-none ${focusCls} transition-all leading-relaxed
        ${paddingCls}
        ${className}
      `}
      {...props}
    />
  )
}
```

---

## 3. Verification (Step 3)

### 3.1 TypeScript

`npx tsc -b` → **exit 0**.

### 3.2 Lint

- Changed files (`AntigravityForm.tsx`, `ds003-runtime-audit.test.tsx`): **0 findings**.
- Full-repo frozen baseline: **405 (352E/53W), unchanged — zero new**.

### 3.3 Build

`npm run build` → **exit 0** (pre-existing chunk-size warnings only).

### 3.4 Backward compatibility — render parity (default/compact)

| Branch | Original render | New render (management=false) | Parity |
|---|---|---|---|
| `default` | `w-full ancient-textarea resize-none ${FIELD_SURFACE}` + `focus:outline-none ${FIELD_FOCUS}` + `px-4 py-3` | `management ? '' : 'ancient-textarea'` → `ancient-textarea`; `surfaceCls` → `FIELD_SURFACE`; `focusCls` → `FIELD_FOCUS`; same padding | **byte-identical** |
| `compact` | same as default with `p-3` | same branch logic; `p-3` | **byte-identical** |

The `default`/`compact` consumers (10 sites) are untouched and render exactly as before. TypeScript guarantees the union widening cannot introduce a mis-typed variant at a consumer.

### 3.5 Tests

- Runnable pure-TS suites (`src/validations/*`, unaffected by this change): **5 files / 165 tests PASS**.
- **Environmental caveat (pre-existing, not caused by this phase):** the React/jsdom component suites (`ds003`-`ds014`) **cannot run** in this environment — vitest fails at worker startup with `ERR_REQUIRE_ESM` (`@csstools/css-calc` ESM being `require()`d by `@asamuzakjp/css-color` CJS). Proven pre-existing: the **untouched** `ds007-runtime-audit.test.tsx` fails identically. The same failure hits `src/utils/examStateCalculator.test.ts` (imports CSS). Pure-TS suites are unaffected.
- New regression coverage added to `ds003-runtime-audit.test.tsx` (line 100) for the management variant — asserts neutral Management Surface material + **no** `ancient-textarea`. Type-checks clean; will execute when the jsdom environment issue is resolved.

### 3.6 Compiled utilities

The management class list reuses the certified Input management utilities — `management-surface` present ×21 in `dist/assets/index-*.css`. No new CSS emitted.

---

## 4. Scope adherence

- ✅ **Additive-only** — one new union member + two additive branches; no existing variant/token/class modified.
- ✅ **TextArea-only** — `questions/**`, `LangInputPanel`, and every other consumer untouched (grep: no consumer edited).
- ✅ **`--management-*` namespace only** — no new tokens; amber/gold family untouched.
- ✅ **Zero consumer migration** — this is Foundation evolution; no page consumes the new variant yet (grep: zero `TextArea variant="management"` consumers — by design).
- ✅ **Deferred exactly as documented:** G1/G2/G4/G5/G8/G9/G10 are NOT part of this phase.

## 5. Files changed (this phase)

| File | Change |
|---|---|
| `src/components/common/AntigravityForm.tsx` | additive `TextArea variant="management"` |
| `src/ds003-runtime-audit.test.tsx` | additive regression test for the management variant |
| Governance/docs | D-149 (decision log), freeze register Phase 4.1A entry, execution log, page index, this report, certification |

## 6. Freeze recommendation

`TextArea` remains a frozen Forms System (DS-003) component. This change is a **permitted non-breaking new variant** under the PERMANENT FREEZE RULE (freeze register). Recommend certifying the additive `variant="management"` and freezing the new surface.
