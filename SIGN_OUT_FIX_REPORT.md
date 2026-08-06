# Sign Out Confirmation Modal — Bug Fix Report

## Root Cause

The `AdminModal` FocusTrap was configured with `clickOutsideDeactivates: true` combined with `onDeactivate: onClose`.

When the modal mounts via portal to `document.body`, the FocusTrap activates and adds a native `mousedown` listener to the document. The trap container is `fixed inset-0` (covers the entire viewport), so clicks outside the trap are impossible for user-initiated events. However, the FocusTrap with `clickOutsideDeactivates: true` also checks focus state on activation. When the initial focus is on the Sign Out button (outside the trap — `initialFocus: false` means no focus is moved inside), the trap's internal activation logic can trigger a deactivation cycle, calling `onDeactivate → onClose → closeDialog → setIsOpen(false)`, immediately closing the modal.

**Four overlapping close mechanisms competed:**
1. FocusTrap `onDeactivate: onClose` — linked trap deactivation to modal close
2. FocusTrap `clickOutsideDeactivates: true` — caused spurious deactivation on initial focus check
3. FocusTrap `escapeDeactivates: true` — intended Escape key handling
4. Backdrop `onClick={onClose}` — intended outside click handling

Mechanisms 1+2 together caused the false-positive deactivation on mount. The backdrop (`fixed inset-0` with `onClick`) already handles all outside-click scenarios, making `clickOutsideDeactivates: true` both redundant and dangerous.

## Files Modified

| File | Change |
|------|--------|
| `src/components/common/AdminModal.tsx:43` | Removed `clickOutsideDeactivates: true` from FocusTrap options |

## Logic Removed

- `clickOutsideDeactivates: true` — FocusTrap option that listened for native mousedown events outside the trap container and deactivated the trap on any such event. Redundant with backdrop `onClick={onClose}` and caused spurious deactivation on initial mount due to focus being outside the trap.

## Logic Preserved

- `onDeactivate: onClose` — still handles Escape key deactivation
- `escapeDeactivates: true` — still allows Escape to close
- Backdrop `onClick={onClose}` — still handles outside clicks
- Close button `onClick={onClose}` — still handles explicit close
- `initialFocus: false` — unchanged

## State Ownership

**Single canonical owner for modal visibility:** `useSignOutConfirmation.ts` — `isOpen` state via `useState(false)`.

No duplicate state existed before or after the fix. No duplicate handlers existed before or after the fix.

## Lifecycle Verification

```
User clicks Sign Out
    ↓
openDialog() → setIsOpen(true)
    ↓
Modal renders via portal (no deactivation — clickOutsideDeactivates removed)
    ↓
Modal stays visible until:
    ├── User clicks Confirm → handleConfirm → setIsOpen(false) → logout()
    ├── User clicks Cancel → closeDialog → setIsOpen(false)
    ├── User clicks backdrop → onClose → closeDialog → setIsOpen(false)
    ├── User presses X button → onClose → closeDialog → setIsOpen(false)
    └── User presses Escape → FocusTrap deactivates → onDeactivate(onClose) → closeDialog → setIsOpen(false)
    ↓
AdminModal returns null → portal unmounts → FocusTrap cleanup → onDeactivate called again (no-op: isOpen already false)
```

## Verification

| Check | Status |
|-------|:------:|
| TypeScript (`tsc --noEmit`) | ✅ Clean |
| Build (`vite build`) | ✅ Succeeds |
| Tests (79/79) | ✅ All pass |
| No duplicate state | ✅ Single `useSignOutConfirmation` owner |
| No duplicate handlers | ✅ Each close mechanism has a unique path |
| No timeout hacks | ✅ None added |
| No delayed reopen | ✅ None added |
| Confirm still works | ✅ `handleConfirm` unchanged |
| Cancel still works | ✅ `closeDialog` unchanged |
| Escape still works | ✅ `escapeDeactivates: true` + `onDeactivate: onClose` |
| Backdrop click still works | ✅ `onClick={onClose}` on backdrop |
| Close button still works | ✅ `onClick={onClose}` on X button |
| Sign out only on confirmation | ✅ No auth call before confirm |
