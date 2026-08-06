# Phase 2B — Hamburger Menu Blank Screen Root Cause Audit

**Date:** 2026-07-23  
**Scope:** Complete mobile sidebar workflow — hamburger click to potential blank screen  
**Constraint:** Audit-only. No implementation.

---

## 1. Executive Summary

**Root Cause: PROVEN — Repository-Proven (Classification A)**

The mobile drawer uses `Navigation.Items` (line 204 of `SidebarLayout.tsx`) **outside** of `Navigation.Shell`. The `NavigationItem` component (line 173 of `Navigation.tsx`) calls `useNavigationContext()` (line 174), which throws `Error('Navigation compound components must be used within <Navigation>')` when `NavigationContext` is `null`.

The `NavigationContext` is only provided by `Navigation.Shell` (line 114 of `Navigation.tsx`). The mobile drawer at `SidebarLayout.tsx:158-246` is rendered **outside** the `Navigation.Shell` at `SidebarLayout.tsx:79-155`. Therefore, `NavigationContext` is always `null` inside the drawer.

When the error is thrown, it propagates up to the App-level `ErrorBoundary` (`App.tsx:77`, `ErrorBoundary.tsx:15`), which replaces the entire application with an error page — appearing as a "blank page" to the user.

**This only occurs on mobile** because the drawer only renders when `isMobile && isDrawerOpen` (line 159). On desktop, `Navigation.Items` is always inside `Navigation.Shell`, so context is available.

---

## 2. Repository Mapping — Complete Ownership Graph

```
Hamburger Button
├── File: SidebarLayout.tsx:253-261
├── Component: <IconButton> wrapping <Menu size={20} />
├── Handler: onClick={e => { e.stopPropagation(); setIsDrawerOpen(true) }}
├── Event: click (with stopPropagation)
│
↓
State Owner: isDrawerOpen
├── Owner: SidebarLayout (useState at line 52)
├── Setter: setIsDrawerOpen
├── Initial: false
│
↓
Drawer Owner: AnimatePresence + motion.aside
├── File: SidebarLayout.tsx:158-246
├── Guard: isDrawerOpen && isMobile (line 159)
├── Animation Owner: framer-motion AnimatePresence
│   ├── motion.div (backdrop): lines 161-168
│   └── motion.aside (drawer): lines 169-243
│
↓
Drawer Contents:
├── Close Button: IconButton (line 177-185)
├── Logo: LogoSVG (line 187-192)
├── Role Badge: conditional (line 194-201)
├── Navigation Items: Navigation.Items (line 204) ← THROWS ERROR
│   ├── Component: NavigationItems (Navigation.tsx:239)
│   ├── Renders: NavigationItem (Navigation.tsx:173)
│   ├── Context: useNavigationContext() (Navigation.tsx:31) ← NULL
│   └── Error: throw new Error(...) (Navigation.tsx:33)
├── Footer: theme toggle, notification bell, initials, sign out
│
↓
Error Propagation:
├── Throw: Navigation.tsx:33
├── Caught by: App.tsx:77 (ErrorBoundary)
├── Renders: ErrorBoundary.tsx:29-50 (error page)
└── Result: Entire app replaced with error page
```

---

## 3. Runtime Timeline — Exact Execution Trace

```
User taps Hamburger (SidebarLayout.tsx:256)
│
├── Event: onClick={e => { e.stopPropagation(); setIsDrawerOpen(true) }}
├── e.stopPropagation() — prevents event bubbling
├── setIsDrawerOpen(true) — state update
│
↓
React Re-render (SidebarLayout)
│
├── useAuth() — user is non-null (guard at line 58 passes)
├── useTheme() — isDark is stable
├── useSidebarMode() — isMobile=true (breakpoint < 768px)
├── isDrawerOpen=true (state updated)
│
↓
Render Phase
│
├── Line 58: if (!user) return null — SKIPPED (user exists)
├── Line 63: <div className="flex h-screen w-full ..."> — renders
│   ├── Line 79: <Navigation.Shell> — renders (hidden on mobile via CSS: hidden md:flex)
│   ├── Line 158: <AnimatePresence> — evaluates children
│   │   ├── Line 159: isDrawerOpen && isMobile — TRUE
│   │   └── Lines 160-244: Drawer content renders
│   │       ├── Line 161: <motion.div key="backdrop"> — mounts
│   │       ├── Line 169: <motion.aside key="drawer"> — mounts
│   │       │   ├── Line 177: <IconButton> (close) — mounts
│   │       │   ├── Line 187: Logo — mounts
│   │       │   ├── Line 203: <div> (nav container) — mounts
│   │       │   │   └── Line 204: <Navigation.Items> — mounts
│   │       │   │       └── NavigationItems (Navigation.tsx:239) — renders
│   │       │   │           └── .map → NavigationItem (Navigation.tsx:173)
│   │       │   │               └── useNavigationContext() (Navigation.tsx:31)
│   │       │   │                   └── useContext(NavigationContext) — NULL
│   │       │   │                   └── throw new Error('Navigation compound components must be used within <Navigation>')
│   │       │   │                       ↑ ERROR THROWN
│   │       │   │
│   │       │   │   ↓ Error propagates up through React fiber tree
│   │       │   │
│   │       │   └── motion.aside — unmounts (error during child render)
│   │       │
│   │       └── motion.div (backdrop) — unmounts
│   │
│   └── Line 249: <div className="flex-1 ..."> — never reached (error propagates)
│
↓
Error Propagation
│
├── Error bubbles up through:
│   SidebarLayout → UserLayout/AdminLayout → Route → Routes → Router → AuthProvider → App
│
├── Caught by: ErrorBoundary (App.tsx:77)
│   ├── getDerivedStateFromError (ErrorBoundary.tsx:20) → hasError: true
│   ├── componentDidCatch (ErrorBoundary.tsx:24) → reportError()
│   └── render (ErrorBoundary.tsx:28-54) → error page
│
└── Result: Entire app replaced with error page
    ├── User sees: "An Error Occurred" page
    ├── Sidebar: GONE
    ├── Header: GONE
    ├── Content: GONE
    └── Drawer: GONE
```

---

## 4. Render Timeline

| Step | Component | Action | Reason |
|------|-----------|--------|--------|
| 1 | SidebarLayout | Renders | `isDrawerOpen` changed |
| 2 | Navigation.Shell | Renders | Desktop sidebar (hidden on mobile) |
| 3 | AnimatePresence | Evaluates | `isDrawerOpen && isMobile` = true |
| 4 | motion.div (backdrop) | Mounts | Enter animation starts |
| 5 | motion.aside (drawer) | Mounts | Enter animation starts |
| 6 | Navigation.Items | Mounts | Inside drawer |
| 7 | NavigationItem | Mounts | Inside Navigation.Items |
| 8 | useNavigationContext | Throws | Context is null |
| 9 | motion.aside | Unmounts | Error during render |
| 10 | motion.div | Unmounts | Error propagation |
| 11 | SidebarLayout | Unmounts | Error propagation |
| 12 | ErrorBoundary | Catches | App-level boundary |
| 13 | Error page | Renders | Replaces entire app |

---

## 5. State Ownership Report

| State | Owner | Setter | Line | Consumers |
|-------|-------|--------|------|-----------|
| `user` | AuthContext | `setUserSync` | AuthContext.tsx:83 | SidebarLayout (line 46), AuthGuard (Guards.tsx:30) |
| `loading` | AuthContext | `setLoading` | AuthContext.tsx:74 | AuthGuard (Guards.tsx:30) |
| `isDark` | ThemeContext | `setIsDark` | ThemeContext.tsx:12 | SidebarLayout (line 47), NavigationItem |
| `isDrawerOpen` | SidebarLayout | `setIsDrawerOpen` | SidebarLayout.tsx:52 | SidebarLayout (line 159) |
| `mode` | useSidebarMode | `setMode` | Navigation.tsx:58 | SidebarLayout (line 51) |
| `isMobile` | useBreakpoint | `setBreakpoint` | useBreakpoint.ts:35 | useSidebarMode (line 61), SidebarLayout (line 83) |
| `breakpoint` | useBreakpoint | `setBreakpoint` | useBreakpoint.ts:35 | useSidebarMode (line 59) |
| `isOpen` (Menu) | MenuContext | `setInternalOpen` | Menu.tsx:72 | NotificationBell |

**No race conditions found.** All state updates are synchronous or batched by React.

**No duplicate ownership found.** Each state has a single owner.

---

## 6. Responsive Audit

### Breakpoint Definitions (useBreakpoint.ts)

| Breakpoint | Width | isMobile | isTablet | isDesktop |
|-----------|-------|----------|----------|-----------|
| XS | < 640px | ✅ | ❌ | ❌ |
| SM | 640-767px | ✅ | ❌ | ❌ |
| MD | 768-1023px | ❌ | ✅ | ❌ |
| LG | 1024-1279px | ❌ | ❌ | ✅ |
| XL | ≥ 1280px | ❌ | ❌ | ✅ |

### Drawer Behavior per Breakpoint

| Breakpoint | Drawer visible? | Hamburger visible? | Desktop sidebar visible? |
|-----------|----------------|-------------------|------------------------|
| XS | ✅ (when open) | ✅ `md:hidden` | ❌ `hidden md:flex` |
| SM | ✅ (when open) | ✅ `md:hidden` | ❌ `hidden md:flex` |
| MD | ❌ (isMobile=false) | ❌ `md:hidden` | ✅ `hidden md:flex` |
| LG | ❌ (isMobile=false) | ❌ `md:hidden` | ✅ `hidden md:flex` |
| XL | ❌ (isMobile=false) | ❌ `md:hidden` | ✅ `hidden md:flex` |

### CSS Properties

| Element | Position | z-index | Width | Overflow |
|---------|----------|---------|-------|----------|
| Desktop sidebar | relative | z-40 | w-64 or w-20 | overflow-visible |
| Backdrop | fixed inset-0 | z-[60] | full screen | N/A |
| Drawer | fixed top-0 left-0 bottom-0 | z-[70] | w-72 | flex-col |
| Main content | relative | z-10 | flex-1 | overflow-hidden |
| Hamburger button | relative | z-[100] | N/A | N/A |

**No overflow issues found.** All z-index values are correctly layered.

---

## 7. Layout Audit

### Component Tree

```
App.tsx:77 ErrorBoundary
└── BrowserRouter
    └── AuthProvider
        └── ThemeProvider
            └── LanguageProvider
                └── Routes
                    └── AuthGuard + AdminLayout/UserLayout/SubAdminLayout
                        └── SidebarLayout
                            ├── Navigation.Shell (desktop, hidden on mobile)
                            ├── AnimatePresence (mobile drawer)
                            ├── Main content (always rendered)
                            └── ConfirmModal
```

### Conditional Rendering

| Component | Condition | Line | Returns |
|-----------|-----------|------|---------|
| AuthGuard | `loading` | Guards.tsx:33 | `<GuardLoader />` |
| AuthGuard | `!user` | Guards.tsx:35 | `<Navigate to="/login">` |
| AuthGuard | `user.is_active === false` | Guards.tsx:42 | `<Navigate to="/login?error=disabled">` |
| SidebarLayout | `!user` | SidebarLayout.tsx:58 | `null` |
| AnimatePresence child | `isDrawerOpen && isMobile` | SidebarLayout.tsx:159 | `null` (nothing) |
| Navigation.Shell | CSS `hidden md:flex` | Navigation.tsx:125 | Hidden on mobile |
| Mobile drawer | `isDrawerOpen && isMobile` | SidebarLayout.tsx:159 | Renders when true |

**The `if (!user) return null` at line 58 is the only conditional that returns null for the entire layout.** This is evaluated BEFORE the drawer renders. If `user` is null, the drawer never mounts.

**No layout returns null during drawer transitions.** The error is thrown during rendering, not from a conditional return.

---

## 8. Animation Audit

### Animations Involved

| Animation | Library | Location | Trigger |
|-----------|---------|----------|---------|
| Backdrop fade in/out | framer-motion | SidebarLayout.tsx:163-165 | `isDrawerOpen` change |
| Drawer slide in/out | framer-motion | SidebarLayout.tsx:171-173 | `isDrawerOpen` change |
| Drawer spring transition | framer-motion | SidebarLayout.tsx:174 | `type: 'spring', damping: 25, stiffness: 220` |
| NavItem active indicator | framer-motion | Navigation.tsx:222-226 | `isActive` change |
| Menu dropdown scale | framer-motion | Menu.tsx:257-270 | `isOpen` change |

### Animation Analysis

**The error is thrown DURING the initial render of the drawer, BEFORE any animation completes.** Framer-motion's `AnimatePresence` mounts the children first, then starts the animation. The error occurs during the mount phase, so the animation never starts.

**No exit animation causes the blank screen.** The error happens on enter, not exit.

**No `layout` animation on the drawer.** The `motion.aside` uses `initial/animate/exit` but no `layout` prop.

---

## 9. Router Audit

### Route Structure

```
/login → GuestGuard → LoginPage
/signup → GuestGuard → SignupPage
/dashboard → AuthGuard → UserLayout → SidebarLayout → UserDashboard
/admin/overview → AuthGuard + RoleGuard → AdminLayout → SidebarLayout → AdminOverview
/sub-admin/dashboard → AuthGuard + RoleGuard → SubAdminLayout → SidebarLayout → SubAdminDashboard
```

### Router Behavior During Drawer

**Opening the drawer does NOT change routing.** The hamburger button only calls `setIsDrawerOpen(true)` — it does not call `navigate()` or any routing function.

**Navigation items in the drawer call `NavLink`** (Navigation.tsx:177), which navigates on click. The `onItemNavigate` callback (line 204) closes the drawer after navigation.

**No route guards are affected by the drawer.** The drawer is a UI overlay, not a route change.

---

## 10. Error Audit

### Error Boundaries

| Boundary | File | Line | Scope | Catches |
|----------|------|------|-------|---------|
| App-level | `ErrorBoundary.tsx:15` | `App.tsx:77` | Entire app | All errors in Routes |
| Page-level | `react-error-boundary` | `SidebarLayout.tsx:289` | `<Outlet />` only | Errors in page content |

### Error Throw Locations

| File | Line | Throw | Condition |
|------|------|-------|-----------|
| `Navigation.tsx:33` | `useNavigationContext()` | `throw new Error('Navigation compound components must be used within <Navigation>')` | `NavigationContext` is null |
| `Menu.tsx:19` | `useMenuContext()` | `throw new Error('Menu compound components must be used within <Menu>')` | `MenuContext` is null |
| `AuthContext.tsx:431` | `useAuth()` | `throw new Error('useAuth must be used inside <AuthProvider>')` | `AuthContext` is null |
| `ThemeContext.tsx:43` | `useTheme()` | `throw new Error('useTheme must be used within a ThemeProvider')` | `ThemeContext` is null |

### Error Analysis

**The error at `Navigation.tsx:33` is the root cause.** It is thrown when `Navigation.Items` is used outside `Navigation.Shell`.

**The error propagates to the App-level ErrorBoundary** (`App.tsx:77`), which replaces the entire app with an error page.

**The page-level ErrorBoundary** (`SidebarLayout.tsx:289`) does NOT catch this error because it only wraps `<Outlet />`, not the drawer.

### try/catch Audit

| Location | Purpose | Relevance |
|----------|---------|-----------|
| AuthContext.tsx:163-169 | `logout()` — catches Supabase errors | Not relevant |
| AuthContext.tsx:198-246 | `initAuth()` — catches boot errors | Not relevant |
| AuthContext.tsx:334-348 | `handleVisibilityChange()` — catches refresh errors | Not relevant |
| SidebarLayout.tsx:260-263 | `handleSignOut()` — catches logout errors | Not relevant |

**No try/catch in the drawer rendering path.** The error propagates uncaught.

---

## 11. Loading Audit

### Loading States

| State | Owner | What renders | Line |
|-------|-------|-------------|------|
| `loading=true` | AuthContext | `<GuardLoader />` (full-screen) | Guards.tsx:33 |
| `!initialized` | AuthContext | `<FullLoader />` (full-screen) | AuthContext.tsx:420 |
| `!user && !loading` | AuthGuard | `<Navigate to="/login">` | Guards.tsx:35 |
| `isDrawerOpen && !isMobile` | SidebarLayout | Nothing (drawer hidden) | SidebarLayout.tsx:159 |
| `isDrawerOpen && isMobile` | SidebarLayout | Drawer renders | SidebarLayout.tsx:159 |

**The blank page is NOT a loading state.** It is an error state caused by the thrown error.

**The `GuardLoader` and `FullLoader` are NOT involved.** They only render during auth initialization, not during drawer opening.

---

## 12. Dependency Graph

```
SidebarLayout.tsx
├── Imports:
│   ├── react (useState, useEffect, Suspense)
│   ├── react-router-dom (Outlet, useLocation)
│   ├── framer-motion (AnimatePresence, motion)
│   ├── lucide-react (LogOut, Menu, X, Sun, Moon, LayoutDashboard)
│   ├── react-error-boundary (ErrorBoundary, FallbackProps)
│   ├── AuthContext (useAuth)
│   ├── ThemeContext (useTheme)
│   ├── useSignOutConfirmation
│   ├── SharedComponents (ConfirmModal)
│   ├── config/navigation (NavItem type)
│   ├── Logo (LogoSVG)
│   ├── AntigravityUI (AdminPageTitle, IconBadge, IconButton, Button, Navigation, useSidebarMode)
│   ├── Spinner
│   └── NotificationPanel (NotificationBell)
│
├── Uses:
│   ├── Navigation.Shell (desktop sidebar)
│   ├── Navigation.Items (desktop sidebar + MOBILE DRAWER)
│   ├── useSidebarMode (breakpoint detection)
│   ├── useAuth (user, logout)
│   ├── useTheme (isDark, toggleTheme)
│   ├── useSignOutConfirmation (sign-out dialog)
│   ├── NotificationBell (notification badge)
│   └── ConfirmModal (sign-out confirmation)
│
└── Renders:
    ├── Skip to content link
    ├── Navigation.Shell (desktop)
    ├── AnimatePresence (mobile drawer)
    ├── Main content (Outlet)
    └── ConfirmModal
```

### Circular Imports

**None found.** All imports are one-directional.

### Reverse Dependencies

**None found.** No file imports from SidebarLayout.

### Duplicate Ownership

**None found for state.** Each state has a single owner.

---

## 13. Root Cause Analysis

### The Bug

When the hamburger button is clicked on mobile:
1. `isDrawerOpen` becomes `true`
2. The mobile drawer renders
3. `Navigation.Items` renders inside the drawer (line 204)
4. `NavigationItem` calls `useNavigationContext()` (line 174)
5. `NavigationContext` is `null` (drawer is outside `Navigation.Shell`)
6. `useNavigationContext()` throws at line 33
7. Error propagates to App-level ErrorBoundary
8. Entire app is replaced with error page

### Why It Happens

The mobile drawer at `SidebarLayout.tsx:158-246` is rendered **outside** the `Navigation.Shell` at `SidebarLayout.tsx:79-155`. The `Navigation.Shell` provides `NavigationContext` (line 114), but the drawer is a sibling, not a child.

`NavigationItem` (line 173) calls `useNavigationContext()` to read `isExpanded`, `isDark`, and `layoutId`. When context is null, it throws.

### Why It Only Happens on Mobile

The desktop sidebar renders `Navigation.Items` **inside** `Navigation.Shell` (line 109), so context is available. The mobile drawer renders `Navigation.Items` **outside** `Navigation.Shell` (line 204), so context is null.

The drawer only renders when `isMobile && isDrawerOpen` (line 159). On desktop, `isMobile` is `false`, so the drawer never mounts.

### Why It Appears as "Blank Page"

The error propagates to the App-level `ErrorBoundary` (`App.tsx:77`), which catches it and renders the error page (`ErrorBoundary.tsx:29-50`). This replaces the entire application — sidebar, header, content, everything — with the error page.

---

## 14. Verification Matrix

| Check | Result | Evidence |
|-------|--------|----------|
| Does `Navigation.Items` use `useNavigationContext()`? | ✅ Yes | Navigation.tsx:174 |
| Does `useNavigationContext()` throw on null? | ✅ Yes | Navigation.tsx:33 |
| Is the drawer outside `Navigation.Shell`? | ✅ Yes | SidebarLayout.tsx:158-246 vs 79-155 |
| Does the drawer use `Navigation.Items`? | ✅ Yes | SidebarLayout.tsx:204 |
| Does the App-level ErrorBoundary catch the error? | ✅ Yes | App.tsx:77, ErrorBoundary.tsx:15 |
| Does the error replace the entire app? | ✅ Yes | ErrorBoundary.tsx:29-50 |
| Does the error only occur on mobile? | ✅ Yes | Drawer guard: `isMobile && isDrawerOpen` (line 159) |
| Does the error occur on every hamburger click? | ✅ Yes | Every render of NavigationItem throws |

---

## 15. Files Involved

| File | Role | Relevance |
|------|------|-----------|
| `src/layouts/SidebarLayout.tsx` | Main sidebar shell | Uses Navigation.Items outside Navigation.Shell (line 204) |
| `src/components/common/Navigation.tsx` | Navigation components | NavigationItem uses useNavigationContext() (line 174), throws on null (line 33) |
| `src/components/ErrorBoundary.tsx` | Error boundary | Catches error, renders error page (line 29-50) |
| `src/App.tsx` | App root | Wraps routes in ErrorBoundary (line 77) |
| `src/hooks/useBreakpoint.ts` | Breakpoint detection | Determines isMobile (line 61) |
| `src/context/AuthContext.tsx` | Auth state | Provides user (line 378) |
| `src/context/ThemeContext.tsx` | Theme state | Provides isDark (line 34) |
| `src/guards/Guards.tsx` | Route guards | AuthGuard checks user (line 35) |
| `src/main.tsx` | App entry | StrictMode enabled (line 7) |
| `src/config/navigation.ts` | Nav data | Provides navConfig arrays |
| `src/components/common/NotificationPanel.tsx` | Notifications | Used in drawer (line 216) |
| `src/components/common/SharedComponents.tsx` | Shared components | ConfirmModal (line 131) |
| `src/hooks/useSignOutConfirmation.ts` | Sign-out dialog | Used in drawer (line 236) |
| `src/components/common/Menu.tsx` | Dropdown menu | Used by NotificationBell |
| `src/components/Logo.tsx` | Logo | Used in drawer (line 188) |

---

## 16. Runtime Instrumentation

**NOT REQUIRED.** The root cause is repository-proven.

The exact execution path is:
1. `SidebarLayout.tsx:256` — hamburger click handler
2. `SidebarLayout.tsx:52` — `setIsDrawerOpen(true)`
3. `SidebarLayout.tsx:159` — drawer guard passes
4. `SidebarLayout.tsx:204` — `Navigation.Items` renders
5. `Navigation.tsx:246` — `NavigationItem` renders
6. `Navigation.tsx:174` — `useNavigationContext()` called
7. `Navigation.tsx:32` — `useContext(NavigationContext)` returns null
8. `Navigation.tsx:33` — `throw new Error('Navigation compound components must be used within <Navigation>')`
9. `App.tsx:77` — ErrorBoundary catches
10. `ErrorBoundary.tsx:29` — error page renders

---

## 17. Final Certification

**Classification: A. Repository-Proven Root Cause**

The root cause is fully proven from repository evidence:
- The exact throw location: `Navigation.tsx:33`
- The exact missing context: `NavigationContext` (provided by `Navigation.Shell` at line 114, consumed by `NavigationItem` at line 174)
- The exact misuse: `Navigation.Items` used outside `Navigation.Shell` (SidebarLayout.tsx:204)
- The exact error propagation: to App-level ErrorBoundary (App.tsx:77)
- The exact user-visible effect: entire app replaced with error page (ErrorBoundary.tsx:29-50)

**No runtime instrumentation required.** The issue is deterministic and reproducible on every hamburger click on mobile.

---

## Files Modified

**None.** This is an audit-only report.
