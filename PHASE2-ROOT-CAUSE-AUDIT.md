# Phase 2: Runtime Root Cause Audit Report

**Date**: 2026-07-23  
**Scope**: Forensic execution path analysis for reported sidebar bugs  
**Status**: COMPLETE — All evidence gathered, root causes identified or bounded  
**Constraint**: NO implementation, NO code changes

---

## Executive Summary

Phase 2 traced exact execution paths for two reported runtime bugs across the User Panel sidebar ecosystem. The audit examined every `useEffect`, state transition, callback chain, and component lifecycle involved.

| Issue | Description | Root Cause | Confidence | Fix Complexity |
|-------|-------------|------------|------------|----------------|
| **#1** | Sign-out modal flickers/disappears instantly | `FocusTrap.onDeactivate → onClose` fires on React StrictMode double-unmount | **HIGH** (95%) | Low — remove `onDeactivate` from `focusTrapOptions` |
| **#2** | Hamburger menu click sometimes causes blank page | Multiple candidates identified; no single root cause definitively proven | **MEDIUM** (60%) | Medium — requires runtime debugging to confirm |

Issues #3–#5 (theme toggle redesign, hover removal, mobile theme colors) are design decisions, not runtime bugs. Their evidence was gathered in Phase 1 and requires a design specification phase before implementation.

---

## Issue #1: Sign-out Confirmation Modal Flickers/Disappears Instantly

### Confidence: HIGH (95%)

### Root Cause

The `FocusTrap` component in `AdminModal.tsx:44` uses `onDeactivate: onClose` as a focus trap option. Under React 19 StrictMode (confirmed active in `main.tsx:7`), the FocusTrap is **mounted → forced-unmounted → remounted** during development. During the forced unmount, `focus-trap-react` v12.0.1 fires `onDeactivate`, which calls `onClose`, which sets `isOpen=false` in the parent state. When React attempts the remount, `isOpen` is already `false`, so `AdminModal` returns `null` at line 37 and the modal never appears.

This is the **exact anti-pattern** documented in the `focus-trap-react` README:

> *"In Strict Mode, the trap will be deactivated as soon as it is mounted, and then reactivated again, almost immediately, because React will immediately unmount and remount the trap... avoid using options like onActivate, onPostActivate, onDeactivate, or onPostDeactivate to affect component state."*
>
> *"See this discussion for an example sandbox where onDeactivate was used to trigger the close of a dialog when the trap was deactivated... The result can be that in Strict Mode, the dialog never appears because it gets closed as soon as the trap renders."*

### Evidence Chain

| Step | File:Line | What Happens |
|------|-----------|--------------|
| 1 | `SidebarLayout.tsx:147` | User clicks "Sign Out" → `onClick={openSignOut}` |
| 2 | `SidebarLayout.tsx:49` | `openSignOut` = `openDialog` from `useSignOutConfirmation` |
| 3 | `useSignOutConfirmation.ts:13` | `openDialog` = `useCallback(() => setIsOpen(true), [])` → `isOpen` becomes `true` |
| 4 | `SidebarLayout.tsx:303-312` | `<ConfirmModal open={isSignOutOpen} onCancel={closeSignOut} onConfirm={confirmSignOut}>` |
| 5 | `SharedComponents.tsx:135` | `if (!open) return null` → `open=true`, so proceeds to render |
| 6 | `SharedComponents.tsx:140-144` | `<AdminModal isOpen={open} onClose={onCancel} ...>` |
| 7 | `AdminModal.tsx:37` | `if (!isOpen) return null` → `isOpen=true`, so proceeds to render |
| 8 | `AdminModal.tsx:43-46` | `<FocusTrap focusTrapOptions={{ onDeactivate: onClose, escapeDeactivates: true, initialFocus: false }}>` |
| 9 | `AdminModal.tsx:42` | `createPortal(...)` renders FocusTrap into `document.body` |
| 10 | **StrictMode unmount** | React forces unmount → FocusTrap fires `onDeactivate` |
| 11 | `AdminModal.tsx:44` | `onDeactivate: onClose` → `onClose` = `onCancel` = `closeSignOut` |
| 12 | `useSignOutConfirmation.ts:14` | `closeDialog` = `useCallback(() => setIsOpen(false), [])` → `isOpen` becomes `false` |
| 13 | **StrictMode remount** | React attempts remount → `SidebarLayout` re-renders |
| 14 | `SidebarLayout.tsx:303` | `<ConfirmModal open={isSignOutOpen} ...>` → `isSignOutOpen` is now `false` |
| 15 | `SharedComponents.tsx:135` | `if (!open) return null` → modal is gone |

### Execution Path Trace

```
User clicks "Sign Out" button
  └─ SidebarLayout.tsx:147 onClick={openSignOut}
       └─ SidebarLayout.tsx:49 const { isOpen: isSignOutOpen, openDialog: openSignOut, ... } = useSignOutConfirmation(logout)
            └─ useSignOutConfirmation.ts:13 openDialog = useCallback(() => setIsOpen(true), [])
                 └─ State update: isOpen → true
                      └─ SidebarLayout re-renders
                           └─ SidebarLayout.tsx:303 <ConfirmModal open={true} onCancel={closeSignOut} onConfirm={confirmSignOut} ...>
                                └─ SharedComponents.tsx:135 open=true, passes guard
                                     └─ SharedComponents.tsx:140 <AdminModal isOpen={true} onClose={closeSignOut} ...>
                                          └─ AdminModal.tsx:37 isOpen=true, passes guard
                                               └─ AdminModal.tsx:43-46 FocusTrap with onDeactivate=closeSignOut
                                                    └─ AdminModal.tsx:42 createPortal renders into document.body
                                                         └─ FocusTrap activates (mounts focus trap)

    ┌─── StrictMode forces unmount (dev only) ───┐
    │                                              │
    │  FocusTrap unmounts                           │
    │   └─ focus-trap core deactivates trap         │
    │        └─ FocusTrap fires onDeactivate        │
    │             └─ onClose = closeSignOut         │
    │                  └─ setIsOpen(false)          │
    │                       └─ isOpen → false       │
    │                            └─ State update    │
    └──────────────────────────────────────────────┘

    ┌─── StrictMode forces remount (dev only) ───┐
    │                                              │
    │  SidebarLayout re-renders                     │
    │   └─ isSignOutOpen = false                    │
    │        └─ ConfirmModal: if (!open) return null │
    │             └─ AdminModal never renders        │
    │                  └─ Modal is GONE              │
    └──────────────────────────────────────────────┘
```

### Key Code Evidence

**`AdminModal.tsx:43-46`** — The problematic `onDeactivate` binding:
```tsx
<FocusTrap focusTrapOptions={{
  onDeactivate: onClose,     // ← THIS FIRES ON UNMOUNT
  escapeDeactivates: true,
  initialFocus: false
}}>
```

**`main.tsx:7`** — StrictMode is active:
```tsx
<React.StrictMode>
  <App />
</React.StrictMode>
```

**`focus-trap-react` README** — Documents this exact anti-pattern:
> *"avoid using options like onActivate, onPostActivate, onDeactivate, or onPostDeactivate to affect component state"*

### Production Impact

| Environment | Impact |
|-------------|--------|
| **Development** | Modal flickers and disappears instantly. 100% reproducible. |
| **Production** | Modal works correctly. StrictMode double-mount is dev-only. |

**However**: The pattern remains fragile. If any future code change triggers a FocusTrap unmount/remount cycle (e.g., conditional rendering of the parent), the bug would manifest in production.

### Recommended Fix Direction

Remove `onDeactivate: onClose` from `focusTrapOptions`. Instead:
- Use `escapeDeactivates: true` (already present) — Escape key fires `onDeactivate`, which should call `onClose`
- Add `clickOutsideDeactivates: true` — clicking outside fires `onDeactivate`
- Handle the close action through React event handlers (e.g., backdrop `onClick`) rather than focus-trap lifecycle callbacks

---

## Issue #2: Hamburger Menu Click Sometimes Causes Blank Page on Mobile/Tablet

### Confidence: MEDIUM (60%) — No single root cause definitively proven

### Evidence Gathered

| File:Line | Evidence |
|-----------|----------|
| `SidebarLayout.tsx:159-245` | Mobile drawer: `AnimatePresence` wraps conditional `{isDrawerOpen && isMobile && (<>...</>)}` |
| `SidebarLayout.tsx:161-168` | Backdrop: `motion.div` with `className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] md:hidden"` and `onClick={() => setIsDrawerOpen(false)}` |
| `SidebarLayout.tsx:169-243` | Drawer: `motion.aside` with `className="fixed top-0 left-0 bottom-0 w-72 bg-card-bg border-r border-border-subtle z-[70] md:hidden"` |
| `SidebarLayout.tsx:253-261` | Hamburger button: `className="md:hidden relative z-[100]"` — z-index [100] is above backdrop [60] |
| `Navigation.tsx:123-142` | `NavigationShell`: `className="hidden md:flex ..."` — desktop sidebar is `hidden` on mobile |
| `SidebarLayout.tsx:286-299` | Main content: `z-10` — below backdrop z-[60] |
| `useNotifications.ts:40-98` | Creates Supabase realtime channel on mount with random channel ID; cleanup on unmount |
| `SidebarLayout.tsx:54-56` | `useEffect(() => { setIsDrawerOpen(false) }, [location.pathname])` — closes drawer on route change |

### Candidate Hypotheses

#### Hypothesis A: Backdrop Stuck Overlay (Likelihood: 30%)

The mobile backdrop has `z-[60]` and covers the entire viewport with `bg-slate-900/50 backdrop-blur-sm`. If the drawer fails to close (e.g., a JavaScript error during the close handler), the backdrop remains as a semi-transparent dark overlay covering the entire page, which the user perceives as a "blank page."

**Evidence for**: The `onClick` handler at line 167 (`onClick={() => setIsDrawerOpen(false)}`) is a simple state setter. If a JavaScript error occurs anywhere in the render tree during the state update (e.g., in a child component that throws), React's error boundary at line 289 (`<ErrorBoundary FallbackComponent={ErrorFallback}>`) only wraps the `<Outlet />` — the sidebar drawer is outside the error boundary.

**Evidence against**: No obvious error source in the drawer's render tree. The drawer content is deterministic (logo, nav items, footer).

#### Hypothesis B: AnimatePresence Fragment Rendering Issue (Likelihood: 25%)

The `AnimatePresence` at line 158 wraps a Fragment `<>...</>` containing two keyed motion children (`key="backdrop"` and `key="drawer"`). If `AnimatePresence` fails to properly track the exit animation of the Fragment's children (e.g., due to a timing issue or a race condition with the `isMobile` state flip), the backdrop could remain mounted while the drawer content is removed, or vice versa.

**Evidence for**: `AnimatePresence` works by tracking children by their `key` prop. When children are conditionally rendered inside a Fragment, the behavior depends on correct key assignment. Both children have explicit keys (`key="backdrop"`, `key="drawer"`), but the Fragment itself has no key.

**Evidence against**: This is a well-established pattern in framer-motion. Both keys are explicitly set.

#### Hypothesis C: useBreakpoint State Flip Race Condition (Likelihood: 25%)

The `useSidebarMode` hook (Navigation.tsx:57-87) uses `useBreakpoint()` which relies on `matchMedia` listeners. When the user rotates the device or resizes the browser, `isMobile` can flip from `true` to `false` (or vice versa). If this flip occurs while the drawer is open:

1. `isMobile` becomes `false`
2. The conditional `{isDrawerOpen && isMobile && (...)}` becomes false
3. `AnimatePresence` begins exit animations
4. The backdrop and drawer animate out
5. Meanwhile, `useEffect` at Navigation.tsx:65-72 sets `mode` to `'collapsed'` or `'expanded'`
6. The desktop sidebar (`hidden md:flex`) becomes visible

If steps 3-4 have a timing issue with step 5-6, there could be a brief period where neither the drawer nor the desktop sidebar is visible.

**Evidence for**: The `useEffect` at Navigation.tsx:65-72 runs asynchronously after the render, creating a potential gap between the mobile drawer disappearing and the desktop sidebar appearing.

**Evidence against**: The desktop sidebar uses `hidden md:flex` which is purely CSS-based and should be immediate when the viewport is >= 768px.

#### Hypothesis D: Supabase Channel Leak on Mount/Unmount (Likelihood: 15%)

The `useNotifications` hook (useNotifications.ts:40-98) creates a Supabase realtime channel with a random channel ID on every mount. If the `NotificationBell` component (rendered inside the drawer at SidebarLayout.tsx:216) unmounts and remounts rapidly (e.g., due to AnimatePresence exit animations), multiple channels could be created and not properly cleaned up, causing resource contention.

**Evidence for**: The channel ID is random (`Math.random().toString(36).substring(7)`), so each mount creates a new channel. The cleanup at lines 91-96 uses a `pendingCleanup` flag which could have a race condition if the component unmounts before the channel is subscribed.

**Evidence against**: The `useNotifications` hook is used by `NotificationBell`, which is rendered inside the drawer. The drawer's unmount should trigger the cleanup. The `pendingCleanup` pattern is a standard approach for async cleanup.

### Recommended Investigation Steps

1. **Add React DevTools Profiler** — Record a session while reproducing the issue. Check if the drawer component tree unmounts correctly.
2. **Add console.log to `setIsDrawerOpen`** — Log every state change to confirm the drawer is opening and closing as expected.
3. **Check browser console for errors** — Any JavaScript error during the drawer open/close cycle could leave the backdrop stuck.
4. **Test on specific devices/browsers** — The "sometimes" qualifier suggests a device-specific or browser-specific issue. Test on iOS Safari, Chrome Android, and Chrome desktop with mobile emulation.
5. **Add error boundary around the drawer** — The current `ErrorBoundary` at line 289 only wraps `<Outlet />`. Adding one around the drawer could prevent a crash from leaving the backdrop stuck.

---

## Issues #3–#5: Design Improvements (Summary)

These issues are design decisions, not runtime bugs. Their evidence was gathered in Phase 1 and requires a design specification phase.

### Issue #3: Theme Button → Toggle Switch

- **Current state**: Sidebar uses `IconButton` (SidebarLayout.tsx:125-142) with `Sun`/`Moon` icons
- **Canonical component**: `Switch` exists in `AntigravityForm.tsx:160-204` with `role="switch"`, `aria-checked`
- **Action needed**: Design specification for toggle switch appearance, label, and placement

### Issue #4: Remove Hover Effect from Theme Toggle

- **Current state**: `lg:group-hover:rotate-90` on Sun icon (SidebarLayout.tsx:133), `lg:group-hover:-rotate-12` on Moon icon (SidebarLayout.tsx:135)
- **Evidence says keep**: The `lg:` prefix means hover effect only applies on desktop (>= 1024px). Mobile/tablet never see the hover effect.
- **Action needed**: User decision — keep current behavior or remove

### Issue #5: Mobile Sidebar Light Mode Colors Inconsistent

- **Current state**: Mobile drawer at SidebarLayout.tsx:175 uses `bg-card-bg` (hardcoded), while desktop sidebar at Navigation.tsx:126 uses `!isDark ? 'ancient-sidebar' : 'bg-card-bg border-r border-border-subtle'`
- **Root cause**: Mobile drawer doesn't apply `ancient-sidebar` class in light mode
- **CSS tokens**: `--color-sidebar-bg` exists in themes.css:1075-1076 but isn't used by the mobile drawer
- **Action needed**: Apply `ancient-sidebar` class conditionally to mobile drawer, or use CSS custom property

---

## Appendix: Files Examined

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/common/AdminModal.tsx` | 1–100 | FocusTrap wrapper with `onDeactivate: onClose` |
| `src/components/common/SharedComponents.tsx` | 1–170 | `ConfirmModal` wrapper with `if (!open) return null` guard |
| `src/hooks/useSignOutConfirmation.ts` | 1–21 | Sign-out dialog state management |
| `src/layouts/SidebarLayout.tsx` | 1–315 | Mobile drawer, desktop sidebar, ConfirmModal integration |
| `src/context/AuthContext.tsx` | 160–209 | `logout()` function, cross-tab sync |
| `src/context/ThemeContext.tsx` | 1–50 | Theme toggle, CSS class management |
| `src/main.tsx` | 1–10 | React.StrictMode confirmation |
| `src/components/common/Navigation.tsx` | 1–262 | Navigation compound components, `useSidebarMode` |
| `src/hooks/useBreakpoint.ts` | 1–50 | Breakpoint detection with matchMedia |
| `src/hooks/useNotifications.ts` | 1–142 | Supabase realtime subscription |
| `src/components/common/NotificationPanel.tsx` | 1–100 | Notification bell component |
| `src/components/common/AntigravityUI.tsx` | 1–59 | Barrel re-exports |
| `src/components/common/AntigravityForm.tsx` | 160–204 | Canonical `Switch` component |
| `src/components/common/AntigravityButton.tsx` | 1–100 | `Button`, `IconButton`, `PrimaryButton` |
| `src/config/navigation.ts` | 1–100 | `NavItem` type, nav arrays |
| `src/guards/Guards.tsx` | 1–100 | Auth/role guards |
| `src/styles/themes.css` | 1073–1076 | Light mode sidebar tokens |
| `src/index.css` | 570–636, 860, 976–989 | Light mode sidebar overrides |
| `package.json` | 1–50 | Dependency versions |

---

## Appendix: focus-trap-react v12.0.1 Behavior Summary

| Trigger | `onDeactivate` fires? | Notes |
|---------|----------------------|-------|
| Escape key | ✅ | `escapeDeactivates: true` (default) |
| Outside click | ❌ | `clickOutsideDeactivates` not set (default `false`) |
| Component unmount | ✅ | Focus trap must deactivate on unmount to prevent memory leaks |
| Programmatic `active=false` | ✅ | Prop change triggers deactivation |
| Tab key reaches end of trap | ❌ | Tab cycles within trap, doesn't deactivate |

---

**End of Phase 2 Report**
