# AR-023 Audit Report — Foundation Input Accessibility

**Date:** 2026-07-22
**Scope:** Repository-wide Foundation input component accessibility audit

---

## Foundation Component Inventory

| Component | File | Lines | Extends Native? | `...props` spread | ARIA Forwarding |
|---|---|---|---|---|---|
| Input | `AntigravityForm.tsx:14-61` | 48 | `React.InputHTMLAttributes<HTMLInputElement>` | ✓ | **Fully compliant** |
| TextArea | `AntigravityForm.tsx:68-88` | 21 | `React.TextareaHTMLAttributes<HTMLTextAreaElement>` | ✓ | **Fully compliant** |
| Select | `AntigravityForm.tsx:90-155` | 66 | Custom `SelectProps` (before) | **NO** | **Fixed (AR-023)** |
| Checkbox | `AntigravityForm.tsx:203-252` | 50 | Custom `CheckboxProps` | NO | Partial (label nesting) |
| Radio | `AntigravityForm.tsx:254-303` | 50 | Custom `RadioProps` | NO | Partial (label nesting) |
| Switch | `AntigravityForm.tsx:157-201` | 45 | Custom `SwitchProps` | NO | Partial (label nesting) |
| RadioGroup | `AntigravityForm.tsx:305-365` | 61 | Custom `RadioGroupProps` | NO | Has `role="radiogroup"` + `aria-label` |

## Input Component — Props Forwarding (Verified)

| Prop | Forwarded? | Mechanism |
|---|---|---|
| `aria-label` | ✓ | `...props` spread |
| `aria-labelledby` | ✓ | `...props` spread |
| `aria-describedby` | ✓ | `...props` spread |
| `aria-invalid` | ✓ | `...props` spread (tested line 59) |
| `id` | ✓ | `...props` spread |
| `name` | ✓ | `...props` spread |
| `required` | ✓ | `...props` spread |
| `disabled` | ✓ | `...props` spread |
| `placeholder` | ✓ | `...props` spread |
| `type` | ✓ | `...props` spread |
| `value` | ✓ | `...props` spread |
| `onChange` | ✓ | `...props` spread |
| `inputMode` | ✓ | `...props` spread |
| `autoComplete` | ✓ | `...props` spread |
| `className` | Merged | Appended to base classes |

## Consumer Audit — Accessibility Attributes Passed

| File | `<Input>` Count | aria-* Used | id Used | Notes |
|---|---|---|---|---|
| SignupPage.tsx | 5 | `aria-describedby` ✓ | `id` ✓ | **Best practice** |
| LoginPage.tsx | 3 | None | None | Placeholder-only |
| FinishSignInPage.tsx | 1 | None | None | Placeholder-only |
| UpdatePasswordPage.tsx | 2 | None | None | Placeholder-only |
| UserProfile.tsx | 3 | None | None | `inputMode`, `autoComplete` only |
| SubAdminSettings.tsx | 3 | None | None | Placeholder-only |
| AdminSettings.tsx | 4 | None | None | No labels |
| AdminTopics.tsx | 2 | None | None | No labels |
| AdminUsersView.tsx | 1 | None | None | Search input |
| QuestionsActions.tsx | 1 | None | None | Search input |
| AdminSubAdminsView.tsx | 4 | None | None | Placeholder-only |
| AddExamModal.tsx | 11 | None | None | `required` only |
| Other files | 5 | None | None | Various |

**Summary:** Of 45+ `<Input>` usages, only 5 (all in SignupPage) pass accessibility attributes. The remaining 40+ rely on placeholder text only.

## Native Input Audit

| File | Lines | Type | Accessibility |
|---|---|---|---|
| CreateStepSetup.tsx | 41-98 | text, number | None — labels not associated |
| CreateStepPrompt.tsx | 50-65 | number | None |
| CompactDateTimePicker.tsx | 99-131 | date, text | None |
| QuestionCard.tsx | 97-100 | text | None — inline edit |

## Dead Code Audit

| Finding | Status |
|---|---|
| Duplicate input wrappers | None |
| Duplicate accessibility helpers | None |
| Unused form utilities | None |

## Architecture Verification

| Check | Status |
|---|---|
| Single owner of Foundation Input | ✓ AntigravityForm.tsx |
| Single owner of accessibility forwarding | ✓ `...props` spread pattern |
| No circular dependencies | ✓ |
| No duplicated form primitives | ✓ |

## Metrics

| Metric | Before | After |
|---|---|---|
| Components audited | 7 | 7 |
| Foundation components | 7 | 7 |
| Consumers audited | 45+ | 45+ |
| Missing forwarded props (Select) | 8 (aria-label, aria-labelledby, aria-describedby, id, name, required, role, autoComplete) | 0 |
| Components modified | 0 | 1 (Select) |
| Files modified | 0 | 2 (incl. ARCHITECTURE_BACKLOG.md) |
| Files created | 0 | 1 (this report) |
| Files deleted | 0 | 0 |
