# AR-016 Audit Completion Report
## Phase 6.16 — Replace Raw Inputs with Foundation Input

**Date:** 2026-07-22
**Status:** AUDIT COMPLETE — RECOMMENDATION: PARTIAL MIGRATION (5 of 17 controls)
**ADR-006:** Associated

---

## 1. Foundation Component Audit

### Foundation Input (`AntigravityForm.tsx:5-62`)
- **Variants:** `default` (48px), `compact` (CSS var), `violet` (branded focus ring)
- **Props:** `leftIcon`, `rightIcon`, `onRightIconClick`, `variant`, `className` (appended)
- **Pass-through:** `...props` accepts all `<input>` HTML attributes (`type`, `style`, `step`, `min`, etc.)
- **Styling:** `bg-hover-bg border border-border-subtle rounded-xl text-[14px] font-bold`
- **Focus:** `focus:border-primary` (default) or violet ring (violet variant)

### Foundation TextArea (`AntigravityForm.tsx:64-88`)
- **Variants:** `default`, `compact`
- **Props:** `className` (appended), `...props` pass-through
- **Styling:** `bg-hover-bg border border-border-subtle rounded-xl text-[14px] font-bold resize-none`

### Foundation Select (`AntigravityForm.tsx:90-155`)
- **API:** `{ label, icon, value, onChange, options: SelectOption[], placeholder, disabled }`
- **Note:** Custom wrapper API — does NOT accept raw `<select>` props

---

## 2. Raw Input Inventory

| # | File | Line | Type | Context | Migratable? |
|---|------|------|------|---------|-------------|
| 1 | `CreateStepSetup.tsx` | 41 | `<input text>` | Exam title | ✅ Category B |
| 2 | `CreateStepSetup.tsx` | 57 | `<input number>` | Duration (leftIcon: Settings2) | ✅ Category B |
| 3 | `CreateStepSetup.tsx` | 73 | `<input number>` | Marks/question (leftIcon: BarChart3) | ✅ Category B |
| 4 | `CreateStepSetup.tsx` | 91 | `<input number>` | Negative mark (leftIcon: BarChart3) | ✅ Category B |
| 5 | `CreateStepPrompt.tsx` | 50 | `<input number>` | Custom count (conditional border) | ✅ Category B |
| 6 | `QuestionCard.tsx` | 97 | `<input text>` | Inline option edit (bg-transparent) | ❌ Category C |
| 7 | `QuestionCard.tsx` | 48 | `<textarea>` | Question text edit (bg-transparent) | ❌ Category C |
| 8 | `QuestionCard.tsx` | 127 | `<textarea>` | Explanation edit (bg-transparent) | ❌ Category C |
| 9 | `CompactDateTimePicker.tsx` | 99 | `<input date>` | Date picker (responsive font) | ❌ Category C |
| 10 | `CompactDateTimePicker.tsx` | 113 | `<input text>` | Hour (responsive width) | ❌ Category C |
| 11 | `CompactDateTimePicker.tsx` | 123 | `<input text>` | Minute (responsive width) | ❌ Category C |
| 12 | `CompactDateTimePicker.tsx` | 133 | `<select>` | AM/PM (inline, styled) | ❌ Category C |
| 13 | `CreateStepJsonPaste.tsx` | 76 | `<textarea>` | JSON paste (font-mono, dynamic h) | ❌ Category C |

**Total: 13 raw controls** (not 17+ as backlogged — stale claim)

---

## 3. Classification

### Category A (Direct Drop-in): 0
No raw input exactly matches Foundation Input's API and styling.

### Category B (Migratable with overrides): 5
All in `CreateStepSetup.tsx` (4) + `CreateStepPrompt.tsx` (1).

**Gaps to bridge:**
- Height: raw `py-3.5` (~56px) vs Foundation `h-[48px]` → use `className="!h-auto py-3.5"`
- Border: raw `border-2 border-border-subtle/20` vs Foundation `border border-border-subtle` → use `className="!border-2 !border-border-subtle/20"`
- Focus: raw `focus:ring-2 focus:ring-primary/20 focus:border-primary/40` vs Foundation `focus:border-primary` → use `className="focus:!ring-2 focus:!ring-primary/20 focus:!border-primary/40"`
- Background: raw `bg-hover-bg/60` vs Foundation `bg-hover-bg` → use `className="!bg-hover-bg/60"`
- Font: raw responsive `style={{ fontSize: typo('body') }}` → pass via `style` prop (already works via `...props`)

**Risk:** Heavy `className` overrides negate Foundation's value. These inputs already have their own consistent styling.

### Category C (Not migratable): 8
- **QuestionCard inline edits (3):** `bg-transparent border-none` — intentionally different visual context (inline editing within a card). Foundation Input always renders with border and background.
- **CompactDateTimePicker (4):** Specialized composite component with responsive widths (`w-[40px] sm:w-[45px]`), responsive font (`getTypo('body')`), and an inline `<select>` with custom AM/PM styling. Foundation Input's fixed height would break the compact layout.
- **CreateStepJsonPaste (1):** `font-mono`, dynamic height via `getDimension(breakpoint, 'jsonH')`, `resize-y`. Foundation TextArea doesn't support monospace or dynamic height.

---

## 4. Backlog Correction

The backlog claimed:
- "17+ raw HTML `<input>` elements" → **Actual: 13** (12 inputs + 1 select in non-Foundation wrappers)
- "Foundation Input only supports `default` variant" → **FALSE: supports `default`, `compact`, `violet`**
- "No `compact` or `violet` variants exist" → **FALSE: already implemented**
- "Size variant gap" → **Already resolved in current codebase**

---

## 5. Recommendation

### Option A: Migrate 5 Category B inputs (CreateStepSetup + CreateStepPrompt)
- Replace 5 raw `<input>` with Foundation `<Input>`
- Requires `className` overrides to preserve existing visual appearance
- **Net benefit:** Marginal — inputs gain Foundation's `leftIcon`/`rightIcon` props but lose visual consistency with their current design
- **Risk:** Visual regression if overrides don't match exactly

### Option B: Close AR-016 as stale/partial (RECOMMENDED)
- 8 of 13 raw controls are genuinely not suited for Foundation Input
- 5 Category B inputs work correctly with their current styling
- Foundation Input's API doesn't match the specialized contexts (inline editing, date picker, JSON paste)
- **Net benefit:** Zero — migration would add complexity without value
- **Alternative:** Create a `FormInput` wrapper that adds responsive font support if needed in future

### Option C: Migrate only CreateStepSetup (4 inputs) — partial win
- The 4 form inputs in CreateStepSetup are the most "form-like" and could benefit from Foundation's `leftIcon` prop
- Skip QuestionCard, CompactDateTimePicker, CreateStepJsonPaste
- **Net benefit:** Small — 4 files migrated, consistent form styling in create flow

---

## 6. Files in scope

- `src/components/common/AntigravityForm.tsx` — Foundation Input, TextArea, Select (already complete)
- `src/components/sub-admin/create/CreateStepSetup.tsx` — 4 raw inputs (Category B)
- `src/components/sub-admin/create/CreateStepPrompt.tsx` — 1 raw input (Category B)
- `src/components/sub-admin/create/QuestionCard.tsx` — 1 input + 2 textareas (Category C)
- `src/components/sub-admin/create/CompactDateTimePicker.tsx` — 3 inputs + 1 select (Category C)
- `src/components/sub-admin/create/CreateStepJsonPaste.tsx` — 1 textarea (Category C)
