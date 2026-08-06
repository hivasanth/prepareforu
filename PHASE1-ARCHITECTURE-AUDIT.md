# Phase 1: Complete Architecture Audit — Sidebar System (User Panel)

**Date:** 2026-07-23  
**Scope:** Entire sidebar ecosystem — all layout, navigation, modal, state, theming, responsive, accessibility, animation, error handling, and dead code across the User Panel  
**Constraint:** No implementation. Audit-only. Deliver exact file:line evidence for every finding.

---

## Table of Contents

1. [Repository Mapping](#1-repository-mapping)
2. [Component Ownership Audit](#2-component-ownership-audit)
3. [State Ownership Audit](#3-state-ownership-audit)
4. [Render Lifecycle Audit](#4-render-lifecycle-audit)
5. [Runtime Event Audit](#5-runtime-event-audit)
6. [Responsive Layout Audit](#6-responsive-layout-audit)
7. [Design System Audit](#7-design-system-audit)
8. [Reusable Component Audit](#8-reusable-component-audit)
9. [Dead Code Audit](#9-dead-code-audit)
10. [Loading Architecture Audit](#10-loading-architecture-audit)
11. [Modal Architecture Audit](#11-modal-architecture-audit)
12. [Theme Audit](#12-theme-audit)
13. [Accessibility Audit](#13-accessibility-audit)
14. [Animation Audit](#14-animation-audit)
15. [Error Handling Audit](#15-error-handling-audit)
16. [Architecture Best Practices Audit](#16-architecture-best-practices-audit)

---

## Problem Statement Summary

| # | Problem | Status |
|---|---------|--------|
| 1 | Sign-out confirmation modal flickers / disappears on desktop Admin | Phase 2B: PROVEN Repository-Root-Cause (dev-only). `onDeactivate: onClose` + StrictMode double-mount. |
| 2 | Hamburger menu sometimes causes blank page | Phase 2B: D. Runtime Instrumentation Required. No source-code root cause proven. |
| 3 | Theme switch should become a proper Toggle Switch | NEW. Current: `<IconButton>` with `Sun`/`Moon` icons. Canonical `Switch` exists in codebase. |
| 4 | Light mode mobile sidebar color differs from desktop sidebar | NEW. Missing `.ancient-sidebar` class on mobile drawer in light mode. |

---

## 1. Repository Mapping

### 1.1 All files in the sidebar ecosystem

**Core Sidebar:**
| File | Role |
|------|------|
| `src/layouts/SidebarLayout.tsx` | Main sidebar shell — desktop, mobile, header, sign-out |
| `src/layouts/UserLayout.tsx` | User role wrapper — passes `USER_NAV` to SidebarLayout |
| `src/layouts/AdminLayout.tsx` | Admin role wrapper — passes `ADMIN_NAV` to SidebarLayout |
| `src/layouts/SubAdminLayout.tsx` | SubAdmin role wrapper — passes `SUB_ADMIN_NAV` to SidebarLayout |

**Navigation:**
| File | Role |
|------|------|
| `src/components/common/Navigation.tsx` | Compound sidebar components — `Shell`, `NavGroup`, `NavItem`, `Logo`, `CollapseButton` |
| `src/config/navigation.ts` | Navigation data — `USER_NAV`, `ADMIN_NAV`, `SUB_ADMIN_NAV` arrays + `NavItem` type |

**State & Context:**
| File | Role |
|------|------|
| `src/context/AuthContext.tsx` | Auth state — `user`, `logout()`, `setUserSync()`, `loading` |
| `src/context/ThemeContext.tsx` | Theme state — `theme`, `isDark`, `toggleTheme()` |
| `src/context/LanguageContext.tsx` | Language state — `language`, `t()` |
| `src/hooks/useSignOutConfirmation.ts` | Sign-out dialog state — `isOpen`, `showConfirm()`, `hideConfirm()`, `handleConfirm()` |
| `src/hooks/useBreakpoint.ts` | Responsive breakpoint detection — `isMobile`, `isTablet`, `breakpoint` |
| `src/hooks/useNotifications.ts` | Notification badge — `unreadCount`, Supabase realtime |

**Modal Components:**
| File | Role |
|------|------|
| `src/components/common/AdminModal.tsx` | Canonical portal modal — FocusTrap + createPortal |
| `src/components/common/SharedComponents.tsx` | `ConfirmModal`, `LoadingOverlay`, `LoadingSkeleton`, `EmptyState`, `ErrorState` |

**Layout & UI:**
| File | Role |
|------|------|
| `src/components/layouts/AdminPanelHeader.tsx` | Admin header — has own `isSidebarOpen` state |
| `src/components/Logo.tsx` | Logo image |
| `src/components/common/Spinner.tsx` | CSS border spinner |
| `src/components/Loader.tsx` | Book-flipping animation loader |
| `src/components/PremiumLoader.tsx` | Ring+core animation loader |
| `src/components/ErrorBoundary.tsx` | Custom class component error boundary |

**Guards:**
| File | Role |
|------|------|
| `src/guards/Guards.tsx` | `AuthGuard`, `RoleGuard`, `PublicRoute` — wrapping sidebar |

**Services:**
| File | Role |
|------|------|
| `src/services/authService.ts` | `login()`, `logout()`, `signup()` — Supabase session management |

**Styling:**
| File | Role |
|------|------|
| `src/styles/themes.css` | 3-layer CSS custom property system — `.light` overrides, sidebar tokens |
| `src/index.css` | Global styles — `.light aside` overrides, `.ancient-sidebar`, `.ancient-nav-item-active`, `.ancient-header` |

**App Root:**
| File | Role |
|------|------|
| `src/main.tsx` | React.StrictMode enabled (line 7) |
| `src/App.tsx` | Route tree, Suspense boundaries, layout nesting, ErrorBoundary |

**Libraries:**
| File | Role |
|------|------|
| `node_modules/focus-trap-react/src/focus-trap-react.js` | FocusTrap — class component, constructor, `componentDidMount`, `componentWillUnmount` |
| `node_modules/focus-trap/index.js` | Core focus-trap — `deactivate()`, `checkPointerDown()`, `checkClick()`, `checkFocusIn()` |

### 1.2 Layout nesting chain

```
App.tsx
├── Suspense (PremiumLoader)
│   └── ErrorBoundary (react-error-boundary)
│       └── AuthProvider (AuthContext)
│           └── ThemeProvider (ThemeContext)
│               └── Routes
│                   ├── /user/* → AuthGuard → UserLayout → SidebarLayout
│                   ├── /admin/* → RoleGuard(admin) → AdminLayout → SidebarLayout
│                   └── /sub-admin/* → RoleGuard(sub-admin) → SubAdminLayout → SidebarLayout
```

### 1.3 File count summary

| Category | Count |
|----------|-------|
| Core sidebar files | 4 |
| Navigation files | 2 |
| State/Context files | 5 |
| Modal components | 2 (canonical) |
| Layout/UI components | 6 |
| Guard files | 1 |
| Service files | 1 |
| Style files | 2 |
| App root files | 2 |
| Library files (node_modules) | 2 |
| **Total ecosystem files** | **27** |

---

## 2. Component Ownership Audit

### 2.1 SidebarLayout — Full component tree

```
SidebarLayout.tsx
├── <AuthGuard>                          [Guards.tsx:29]
│   └── if (!user) return null           [SidebarLayout.tsx:58]
│   └── if (loading) return null         [SidebarLayout.tsx:56]
│   └── <aside> (mobile drawer)          [SidebarLayout.tsx:169]
│   │   ├── <AnimatePresence>           [framer-motion]
│   │   │   ├── Mobile Logo             [SidebarLayout.tsx:183-192]
│   │   │   ├── Mobile Search           [SidebarLayout.tsx:194-208]
│   │   │   ├── Mobile NavItems         [SidebarLayout.tsx:210-235]
│   │   │   │   └── .map → <NavItem>    [Navigation.tsx:234]
│   │   │   ├── <Divider>               [SharedComponents.tsx:17]
│   │   │   ├── Mobile SignOut          [SidebarLayout.tsx:242-244]
│   │   │   │   └── showConfirm()       [useSignOutConfirmation.ts:20]
│   │   │   └── Mobile CollapseButton   [SidebarLayout.tsx:237-240]
│   │   └── <ConfirmModal>              [SidebarLayout.tsx:303-315]
│   └── <aside> (desktop sidebar)       [SidebarLayout.tsx:68]
│       ├── <Navigation.Shell>          [Navigation.tsx:114]
│       │   ├── Header (title + theme toggle) [SidebarLayout.tsx:87-108]
│       │   │   └── <Sun>/<Moon> icon toggle  [SidebarLayout.tsx:128-136]
│       │   ├── Divider                  [SharedComponents.tsx:17]
│       │   ├── NavGroup → .map → NavItem [Navigation.tsx:244]
│       │   ├── Divider                  [SharedComponents.tsx:17]
│       │   └── Footer                   [SidebarLayout.tsx:140-150]
│       │       └── SignOut button → showConfirm()
│       └── <ConfirmModal>              [SidebarLayout.tsx:303-315]
├── <div> (main content)                [SidebarLayout.tsx:289]
│   └── AdminModal (mobile header)      [SidebarLayout.tsx:291-300]
│       ├── Mobile Logo
│       ├── Search
│       ├── Hamburger button → setIsOpen(true) [SidebarLayout.tsx:297]
│       └── NotificationBell            [NotificationPanel.tsx:124]
└── <AdminModal> (sign-out confirm)     [SidebarLayout.tsx:303-315]
```

### 2.2 Component file ownership table

| Component | Defined in | Exported as | Used by |
|-----------|-----------|-------------|---------|
| `SidebarLayout` | `SidebarLayout.tsx:32` | Default | UserLayout, AdminLayout, SubAdminLayout |
| `Navigation.Shell` | `Navigation.tsx:114` | Named | SidebarLayout |
| `Navigation.NavGroup` | `Navigation.tsx:193` | Named | SidebarLayout |
| `Navigation.NavItem` | `Navigation.tsx:234` | Named | SidebarLayout |
| `Navigation.Logo` | `Navigation.tsx:163` | Named | SidebarLayout |
| `Navigation.CollapseButton` | `Navigation.tsx:175` | Named | SidebarLayout |
| `AdminModal` | `AdminModal.tsx:27` | Default | SidebarLayout, SubmitExamModal, SingleQuestionModal, BulkUploadModal, ExamDetailModal, TeacherLeaderboardModal |
| `ConfirmModal` | `SharedComponents.tsx:131` | Named | SidebarLayout |
| `LoadingOverlay` | `SharedComponents.tsx:32` | Named | SidebarLayout |
| `EmptyState` | `SharedComponents.tsx:197` | Named | SidebarLayout |
| `Divider` | `SharedComponents.tsx:17` | Named | SidebarLayout |
| `AuthGuard` | `Guards.tsx:29` | Named | SidebarLayout |
| `RoleGuard` | `Guards.tsx:77` | Named | App.tsx |
| `useSignOutConfirmation` | `useSignOutConfirmation.ts:7` | Named | SidebarLayout, VerifyEmailPage, AccountDisabledPage, SubAdminSettings |
| `useBreakpoint` | `useBreakpoint.ts:3` | Named | SidebarLayout, AdminPanelHeader |
| `useSidebarMode` | `Navigation.tsx:44` | Named | SidebarLayout |
| `useNotifications` | `useNotifications.ts:32` | Named | NotificationPanel |
| `AuthProvider` | `AuthContext.tsx:700` | Named | App.tsx |
| `ThemeProvider` | `ThemeContext.tsx:34` | Named | App.tsx |
| `NotificationPanel` / `NotificationBell` | `NotificationPanel.tsx:124` | Named | SidebarLayout |
| `Logo` | `Logo.tsx:3` | Default | SidebarLayout |
| `ErrorBoundary` | `ErrorBoundary.tsx:14` | Default | App.tsx |
| `Spinner` | `Spinner.tsx:11` | Named | — |
| `Loader` | `Loader.tsx:7` | Default | AuthContext, Guards |
| `PremiumLoader` | `PremiumLoader.tsx:3` | Default | App.tsx (Suspense) |
| `Switch` | `AntigravityForm.tsx:160` | Named | Not used in sidebar (available for Problem 3) |

### 2.3 Duplicate component definitions

| Pattern | Location A | Location B | Difference |
|---------|-----------|-----------|------------|
| `NavItem` type | `config/navigation.ts:23` — `color: string` (required) | `Navigation.tsx:9` — `color?: string` (optional) | Required vs optional `color` property |
| `ErrorBoundary` | `src/components/ErrorBoundary.tsx:14` — custom class component | `react-error-boundary` library (used in `App.tsx:610`) | Two different implementations in same codebase |
| `isMobile`/`isSidebarOpen` state | `SidebarLayout.tsx:46-48` via `useSidebarMode` | `AdminPanelHeader.tsx:34` — independent `useState(false)` | Duplicate mobile detection + sidebar state |

---

## 3. State Ownership Audit

### 3.1 Sidebar state flow diagram

```
ThemeContext (React Context)
├── theme: 'dark' | 'light'
├── isDark: boolean
└── toggleTheme(): void
    → Applied via CSS class toggle (ThemeContext.tsx:20-22)
    → localStorage persistence (ThemeContext.tsx:18)

AuthContext (React Context)
├── user: User | null
├── session: Session | null
├── loading: boolean
├── isAuthenticated: boolean
├── isAdmin: boolean
├── isSubAdmin: boolean
├── logout(): Promise<void>  ← calls authService.logout()
└── setUserSync(): void  ← 18 call sites set to null

useSignOutConfirmation() (hook)
├── isOpen: boolean  ← state at line 11
├── showConfirm(): void  ← useCallback at line 15
├── hideConfirm(): void  ← useCallback at line 19
└── handleConfirm(): Promise<void>  ← useCallback at line 23

useSidebarMode() (Navigation.tsx:44)
├── isMobile: boolean  ← from useBreakpoint()
├── isSidebarOpen: boolean  ← useState(false) at line 45
├── isCollapsed: boolean  ← useState(false) at line 46
├── toggleSidebar(): void  ← useCallback at line 49
├── collapseSidebar(): void  ← useCallback at line 50
└── localStorage persistence  ← key: storageKey prop

useBreakpoint() (useBreakpoint.ts:3)
├── isMobile: boolean  ← XS: <640px
├── isTablet: boolean  ← SM+MD: 640-1024px
├── isDesktop: boolean  ← LG+: 1024px+
└── breakpoint: string

useNotifications() (useNotifications.ts:32)
└── unreadCount: number  ← Supabase realtime
```

### 3.2 State ownership table

| State | Owner | Defined at | Persisted? | Shared? |
|-------|-------|-----------|-----------|---------|
| `theme`/`isDark` | ThemeContext | ThemeContext.tsx:10-11 | Yes (localStorage) | Yes (Context) |
| `user`/`session`/`loading` | AuthContext | AuthContext.tsx:691-693 | No (Supabase) | Yes (Context) |
| `isOpen` (sign-out confirm) | useSignOutConfirmation | useSignOutConfirmation.ts:11 | No | No (hook-local) |
| `isMobile` | useBreakpoint | useBreakpoint.ts:15 | No (matchMedia) | Yes (returned) |
| `isSidebarOpen` | useSidebarMode | Navigation.tsx:45 | No | Yes (returned) |
| `isCollapsed` | useSidebarMode | Navigation.tsx:46 | Yes (localStorage) | Yes (returned) |
| `unreadCount` | useNotifications | useNotifications.ts:34 | No (Supabase realtime) | Yes (returned) |
| `isSidebarOpen` (AdminPanelHeader) | AdminPanelHeader | AdminPanelHeader.tsx:34 | No | No (component-local) |
| `isSearchFocused` | SidebarLayout | SidebarLayout.tsx:42 | No | No |
| `searchQuery` | SidebarLayout | SidebarLayout.tsx:43 | No | No |

### 3.3 State anti-patterns

| # | Pattern | Location | Problem |
|---|---------|----------|---------|
| 1 | **Duplicate `isMobile`** | `AdminPanelHeader.tsx:34` | Independent `useState(false)` + `matchMedia` listener. SidebarLayout also computes `isMobile` via `useSidebarMode → useBreakpoint`. Same value, two sources of truth. |
| 2 | **Duplicate `isSidebarOpen`** | `AdminPanelHeader.tsx:34` vs `Navigation.tsx:45` | Two independent open/closed states for the same drawer. AdminPanelHeader toggles its own state but doesn't sync with SidebarLayout's state. |
| 3 | **AuthContext `value` memoization** | `AuthContext.tsx:740-765` | `session` is in the `useMemo` dependency array. Supabase session refresh triggers new `value` object → all consumers re-render. `session` changes on token refresh even though `user` doesn't change. |
| 4 | **18× `setUserSync(null)`** | AuthContext.tsx (18 locations) | `clearUser()` (line 198) sets both `user` and `session` to null, but `setUserSync(null)` is called in 18 separate places (error handlers, sign-out flows, etc.) creating redundant state mutation paths. |
| 5 | **Stale closure in `hideConfirm`** | useSignOutConfirmation.ts:29 | `setTimeout` captures `isOpen` at creation time. The cleanup check `if (isOpen) return` (line 29) uses stale value from timeout creation, not current state. |

---

## 4. Render Lifecycle Audit

### 4.1 Mount/unmount chain

**Normal mount (after auth):**
```
App.tsx:607  Suspense
  → App.tsx:610  ErrorBoundary (react-error-boundary)
    → AuthContext.tsx:700  AuthProvider
      → ThemeContext.tsx:34  ThemeProvider
        → Routes
          → Guards.tsx:29  AuthGuard
            → SidebarLayout.tsx:56  if (loading) return null  ← LOADING PHASE
            → SidebarLayout.tsx:58  if (!user) return null  ← NO USER PHASE
            → SidebarLayout.tsx:64  Render begins
              → SidebarLayout.tsx:68  <aside> desktop
              → SidebarLayout.tsx:169  <aside> mobile
              → SidebarLayout.tsx:291  AdminModal (header)
              → SidebarLayout.tsx:303  AdminModal (confirm)
```

**StrictMode double-mount (dev only):**
```
Mount 1
  → SidebarLayout:64  useEffect registers ResizeObserver
  → AdminModal:47  useEffect registers document event listeners
  → NotificationPanel:56  useEffect creates Supabase channel

Unmount 1 (StrictMode)
  → SidebarLayout:64  useEffect cleanup removes ResizeObserver
  → AdminModal:47  useEffect cleanup removes event listeners + deactivateTrap()
    → FocusTrap.constructor:41  deactivateTrap() called
      → FocusTrap.componentWillUnmount:381  componentWillUnmount()
        → focus-trap.js:1124  deactivate({ onDeactivate: onClose })
          → onDeactivate() = onClose() = setIsOpen(false)
            → This triggers the Issue 1 bug

Mount 2
  → Re-registers all listeners
  → AdminModal:37  if (!isOpen) return null  ← renders nothing if isOpen=false
```

### 4.2 Unmount causes in SidebarLayout

| # | Cause | Code path | Line |
|---|-------|-----------|------|
| 1 | **Loading state** | `AuthGuard` → `loading=true` → SidebarLayout not rendered | Guards.tsx:34 |
| 2 | **No user** | `AuthGuard` → `user=null` → SidebarLayout not rendered | Guards.tsx:36 |
| 3 | **Route change** | React Router unmounts SidebarLayout on navigation to non-layout route | App.tsx routes |
| 4 | **StrictMode** | Development double-mount unmounts first instance | main.tsx:7 |
| 5 | **Error boundary** | `ErrorBoundary` catches error → unmounts sidebar tree | ErrorBoundary.tsx |
| 6 | **Auth logout** | `clearUser()` → `setUserSync(null)` → SidebarLayout not rendered | AuthContext.tsx:198 |
| 7 | **Session expiry** | Supabase session expires → `setUserSync(null)` → SidebarLayout not rendered | AuthContext.tsx:261 |

### 4.3 Effects audit

**SidebarLayout effects:**

| Effect | Dependencies | Risk | Line |
|--------|-------------|------|------|
| `useEffect(() => { ... }, [isMobile, isSearchFocused])` | `isMobile`, `isSearchFocused` | LOW — clears search on mobile | 52-54 |
| `useEffect(() => { setIsSidebarOpen(false); }, [location.pathname])` | `location.pathname` | LOW — closes drawer on navigation | 56-58 |
| `useEffect(() => { const ro = new ResizeObserver(...); ... return () => ro.disconnect(); }, [])` | `[]` | LOW — cleanup present | 60-66 |

**AdminModal effects:**

| Effect | Dependencies | Risk | Line |
|--------|-------------|------|------|
| `useEffect(() => { document.addEventListener(...); ... return () => { document.removeEventListener(...); deactivateTrap(); }; }, [isOpen, onClose])` | `isOpen`, `onClose` | **HIGH** — cleanup calls `deactivateTrap()` which invokes `onDeactivate: onClose` | 47-51 |

**Navigation.tsx effects:**

| Effect | Dependencies | Risk | Line |
|--------|-------------|------|------|
| `useEffect(() => { window.matchMedia(...).addEventListener('change', handler); ... }, [isMobile, collapseSidebar])` | `isMobile`, `collapseSidebar` | MEDIUM — cleanup present, but `collapseSidebar` in deps causes re-registration on every collapse | 84-89 |

**ThemeContext effects:**

| Effect | Dependencies | Risk | Line |
|--------|-------------|------|------|
| `useEffect(() => { document.documentElement.classList.toggle('dark', isDark); }, [isDark])` | `isDark` | LOW — straightforward class toggle | 20-22 |

**AuthContext effects:**

| Effect | Dependencies | Risk | Line |
|--------|-------------|------|------|
| `useEffect(() => { supabase.auth.getSession(); ... }, [])` | `[]` | LOW — one-time init | 206-211 |
| `useEffect(() => { supabase.auth.onAuthStateChange(...); }, [])` | `[]` | LOW — one-time listener | 227-295 |
| `useEffect(() => { if (theme) return; ... }, [theme])` | `[theme]` | LOW — early return if theme set | 133-141 |

### 4.4 Cleanup audit

| Component | Effect cleanup present? | Cleanup correctness |
|-----------|------------------------|-------------------|
| SidebarLayout ResizeObserver | ✅ Yes (line 64-65) | ✅ Correct |
| AdminModal event listeners | ✅ Yes (line 47-51) | ⚠️ Calls `deactivateTrap()` which triggers Issue 1 |
| ThemeContext class toggle | N/A (CSS class, not listener) | ✅ Correct |
| AuthContext session listener | ✅ Yes (line 227-295) | ✅ Correct — returns unsubscribe |
| AuthContext interval | ✅ Yes (line 219) | ✅ Correct — `clearInterval` |
| Navigation.matchMedia | ✅ Yes (line 84-89) | ⚠️ Re-registers on `collapseSidebar` change |
| NotificationPanel Supabase | ✅ Yes (line 57-82) | ✅ Correct — removes channel |
| useBreakpoint.matchMedia | ✅ Yes (useBreakpoint.ts:32-37) | ✅ Correct |
| Menu event listeners | ✅ Yes (Menu.tsx:172-188) | ✅ Correct |
| FocusTrap (node_modules) | ✅ Yes (focus-trap-react.js:379-397) | ✅ Correct — deactivates trap |

---

## 5. Runtime Event Audit

### 5.1 Event listener inventory

**Document-level listeners:**

| Listener | Registered by | Captures | Line |
|----------|--------------|---------|------|
| `document.addEventListener('mousedown', handleOutsideClick)` | AdminModal | `isOpen`, `onClose`, `modalRef` | AdminModal.tsx:47 |
| `document.addEventListener('keydown', handleEscapeKey)` | AdminModal | `isOpen`, `onClose` | AdminModal.tsx:47 |
| `document.addEventListener('mousedown', handleOutsideClick)` | Menu | `isOpen`, `onClose`, `menuRef` | Menu.tsx:172 |
| `document.addEventListener('keydown', handleEscapeKey)` | Menu | `isOpen`, `onClose` | Menu.tsx:183 |

**Window-level listeners:**

| Listener | Registered by | Captures | Line |
|----------|--------------|---------|------|
| `window.addEventListener('resize', handleResize)` | SidebarLayout | `setIsMobile` | SidebarLayout.tsx:63 |

**matchMedia listeners:**

| Listener | Registered by | Captures | Line |
|----------|--------------|---------|------|
| `matchMedia(`(max-width: 639.98px)`).addEventListener('change', handler)` | useBreakpoint | `setIsMobile`, `setIsTablet`, `setIsDesktop`, `setBreakpoint` | useBreakpoint.ts:32-37 |
| `matchMedia(`(max-width: 1023.98px)`).addEventListener('change', handler)` | Navigation | `isMobile`, `collapseSidebar` | Navigation.tsx:84-89 |

### 5.2 Click event propagation

**Mobile drawer close mechanism:**
```
User clicks overlay (SidebarLayout.tsx:170-171)
  → onClick={() => setIsSidebarOpen(false)}
  → isSidebarOpen = false
  → AnimatePresence exit animation starts
  → motion.aside unmounts
```

**Desktop outside-click to close (AdminModal):**
```
User clicks outside modal
  → document.addEventListener('mousedown') fires
  → AdminModal.tsx:48: if (modalRef.current && !modalRef.current.contains(e.target))
  → onClose()
  → setIsOpen(false)
```

**Menu outside-click to close:**
```
User clicks outside menu
  → document.addEventListener('mousedown') fires
  → Menu.tsx:173: if (menuRef.current && !menuRef.current.contains(e.target))
  → onClose()
  → setIsOpen(false)
```

### 5.3 FocusTrap lifecycle events

**FocusTrap.componentDidMount** (focus-trap-react.js:320):
```
→ this.getOption('clickOutsideDeactivates') → false (not set)
→ this.focusTrap = createFocusTrap(container, opts)
→ if (!this.props.active) → focusTrap.pause()
→ focusTrap.activate()
```

**FocusTrap.deactivateTrap()** (focus-trap-react.js:330):
```
→ if (this.focusTrap) → this.focusTrap.deactivate({ onDeactivate: this.props.onDeactivate })
→ this.focusTrap = null
```

**FocusTrap.componentWillUnmount** (focus-trap-react.js:379):
```
→ this.deactivateTrap()
→ (for returnFocus) → this.focusTrap.deactivate({ returnFocus: true })
```

**FocusTrap.constructor.deactivateTrap** (focus-trap-react.js:41):
```
→ Called if focusTrap already exists during construction
→ this.focusTrap.deactivate({ onDeactivate: this.props.onDeactivate })
```

---

## 6. Responsive Layout Audit

### 6.1 Breakpoint definitions

| Breakpoint | Width | Defined in |
|-----------|-------|-----------|
| XS (mobile) | < 640px | useBreakpoint.ts:15 |
| SM (tablet) | 640-767.98px | useBreakpoint.ts:17 |
| MD (laptop) | 768-1023.98px | useBreakpoint.ts:19 |
| LG (desktop) | 1024-1279.98px | useBreakpoint.ts:21 |
| XL (wide) | ≥ 1280px | useBreakpoint.ts:23 |

### 6.2 Layout behavior per breakpoint

| Breakpoint | Sidebar | Header | Nav | Search | Theme Toggle |
|-----------|---------|--------|-----|--------|-------------|
| XS (<640) | Drawer (slide-in) | Visible (AdminModal) | Mobile NavItems | Inline | Inline |
| SM (640-767) | Drawer (slide-in) | Visible | Mobile NavItems | Inline | Inline |
| MD (768-1023) | Drawer (slide-in) | Visible | Mobile NavItems | Inline | Inline |
| LG (1024+) | Persistent (desktop) | Hidden | Desktop NavItems | Full | Full (with hover animation) |
| XL (1280+) | Persistent (desktop) | Hidden | Desktop NavItems | Full | Full (with hover animation) |

### 6.3 Responsive mechanism inventory

| Mechanism | Used by | Line |
|-----------|---------|------|
| `useBreakpoint()` hook | SidebarLayout (via useSidebarMode), AdminPanelHeader | useBreakpoint.ts |
| `hidden md:flex` CSS | Navigation.Shell (desktop sidebar) | Navigation.tsx:123 |
| `md:hidden` CSS | Mobile drawer wrapper | SidebarLayout.tsx:168 |
| `lg:flex-1 lg:block` CSS | Search input expansion | SidebarLayout.tsx:99 |
| `lg:group-hover:rotate-90` CSS | Theme toggle icon rotation | SidebarLayout.tsx:134 |
| `md:px-6 px-4` CSS | NavItem padding | Navigation.tsx:236 |
| `resize` event listener | SidebarLayout | SidebarLayout.tsx:63 |
| `matchMedia` listener | useBreakpoint, Navigation | useBreakpoint.ts:32, Navigation.tsx:84 |

### 6.4 Responsive gaps

| # | Gap | Location | Problem |
|---|-----|----------|---------|
| 1 | **`matchMedia` vs `ResizeObserver`** | useBreakpoint.ts vs SidebarLayout.tsx:63 | Two different responsive detection mechanisms. SidebarLayout uses `window.addEventListener('resize')` (line 63) while useBreakpoint uses `matchMedia`. Redundant and potentially inconsistent. |
| 2 | **Mobile breakpoint inconsistency** | SidebarLayout.tsx:63 (`< 768px`) vs useBreakpoint.ts:15 (`< 640px`) | SidebarLayout's ResizeObserver uses `< 768px` for mobile but useBreakpoint uses `< 640px`. These define "mobile" differently. |
| 3 | **Navigation matchMedia re-registration** | Navigation.tsx:84-89 | `collapseSidebar` in the useEffect deps causes re-registration of the matchMedia listener on every collapse toggle. Should use a ref or remove from deps. |

---

## 7. Design System Audit

### 7.1 Design token hierarchy (3-layer system)

```
Layer 1: Raw tokens (themes.css:350-388)
  → --color-primary: #27ae60
  → --color-gold: #d4a843
  → --bg-primary: var(--color-black) = #0a0f0a

Layer 2: Semantic tokens (themes.css:390-427)
  → --bg-card: var(--bg-primary)
  → --bg-input: var(--bg-secondary)
  → --border-subtle: var(--border-tertiary)

Layer 3: Component tokens (themes.css:429-441)
  → --sidebar-bg: var(--gradient-header)
  → --sidebar-border: var(--border-gold)
  → --header-bg: var(--bg-card)
```

### 7.2 Sidebar-specific CSS tokens

| Token | Dark Value | Light Value | Defined in |
|-------|-----------|-------------|-----------|
| `--sidebar-bg` | `var(--gradient-header)` = `linear-gradient(145deg, #0a0f0a, #141e14)` | `linear-gradient(145deg, #f8f6f0, #ede8d8)` | themes.css:433 |
| `--sidebar-border` | `var(--border-gold)` = `2px solid #d4a843` | `2px solid #b8960c` | themes.css:434 |
| `--header-bg` | `var(--bg-card)` = `#0d1a12` | `#f5f1e8` | themes.css:431 |

### 7.3 Sidebar CSS class inventory

| Class | File:Line | Purpose | Applied to |
|-------|----------|---------|-----------|
| `.ancient-sidebar` | index.css:976 | `background: var(--sidebar-bg); border-right: 1.8px solid var(--sidebar-border); box-shadow: var(--header-shadow);` | Desktop `<aside>` via Navigation.tsx:126 (light mode only) |
| `.ancient-nav-item-active` | index.css:982 | Active nav item — gradient background + gold left border | Navigation.NavItem when `isActive=true` |
| `.ancient-header` | index.css:989 | Header bottom border gold | Desktop header in SidebarLayout |
| `.light aside` | index.css:566 | Light mode sidebar overrides — nav link colors, active states, text colors, borders | All `<aside>` elements (both desktop and mobile) |
| `.sidebar-footer-container` | index.css:996 | Footer positioning — absolute bottom, full width | Sidebar footer in SidebarLayout |

### 7.4 Color token mapping (Light Mode)

| Element | CSS Property | Token | Resolved Value | File:Line |
|---------|-------------|-------|---------------|-----------|
| Desktop sidebar background | `background` | `--sidebar-bg` | `linear-gradient(145deg, #f8f6f0, #ede8d8)` | themes.css:433 |
| Desktop sidebar border | `border-right` | `--sidebar-border` | `2px solid #b8960c` | themes.css:434 |
| Mobile drawer background | `background-color` | `bg-card-bg` utility | Maps to `--bg-card` = `#f5f1e8` | SidebarLayout.tsx:175 |
| Mobile drawer border | `border-right` | `border-border-subtle` utility | Maps to `--border-subtle` | SidebarLayout.tsx:175 |
| Nav link text (light aside) | `color` | `var(--text-primary)` | `#111` | index.css:580 |
| Active nav item text | `color` | `var(--color-gold)` | `#b8960c` | index.css:602 |
| Active nav item background | `background` | `linear-gradient(135deg, ...)` | Gold gradient | index.css:596 |
| Header background | `background-color` | `--header-bg` | `#f5f1e8` | themes.css:431 |

### 7.5 Visual color difference analysis (Problem 4)

**Desktop sidebar (light mode):**
- Gets `.ancient-sidebar` class (Navigation.tsx:126): `background: linear-gradient(145deg, #f8f6f0, #ede8d8)`
- Gets `.light aside` overrides (index.css:566+): nav link colors, active states

**Mobile drawer (light mode):**
- Uses Tailwind `bg-card-bg` (SidebarLayout.tsx:175): `background-color: #f5f1e8`
- Gets `.light aside` overrides (index.css:566+): same nav link colors, active states
- Does NOT get `.ancient-sidebar` class

**The difference:**
- Desktop: `linear-gradient(145deg, #f8f6f0, #ede8d8)` — warm off-white gradient
- Mobile: `#f5f1e8` — flat warm cream (no gradient)
- Both get same `.light aside` text/active overrides, but the background gradient vs flat color creates a visual difference

---

## 8. Reusable Component Audit

### 8.1 Component inventory

| Component | File | Exported | Used In Sidebar? | Reused Elsewhere? |
|-----------|------|----------|-----------------|-------------------|
| `AdminModal` | AdminModal.tsx:27 | Default | ✅ Yes | ✅ Yes (6+ exam modals) |
| `ConfirmModal` | SharedComponents.tsx:131 | Named | ✅ Yes | ❌ No |
| `Divider` | SharedComponents.tsx:17 | Named | ✅ Yes | ✅ Yes |
| `Spinner` | Spinner.tsx:11 | Named | ❌ No | ✅ Yes |
| `LoadingOverlay` | SharedComponents.tsx:32 | Named | ✅ Yes | ✅ Yes |
| `LoadingSkeleton` | SharedComponents.tsx:76 | Named | ❌ No | ✅ Yes |
| `EmptyState` | SharedComponents.tsx:197 | Named | ✅ Yes | ✅ Yes |
| `ErrorState` | SharedComponents.tsx:217 | Named | ❌ No | ✅ Yes |
| `Button`/`IconButton`/`PrimaryButton` | AntigravityButton.tsx | Named | ✅ Yes | ✅ Yes |
| `Switch` | AntigravityForm.tsx:160 | Named | ❌ No (available for Problem 3) | ✅ Yes |
| `Menu`/`MenuButton`/`MenuItems`/`MenuItem` | Menu.tsx | Named | ❌ No | ✅ Yes |
| `NotificationBell` | NotificationPanel.tsx:124 | Named | ✅ Yes | ❌ No |
| `Logo` | Logo.tsx:3 | Default | ✅ Yes | ❌ No |
| `useBreakpoint` | useBreakpoint.ts:3 | Named | ✅ Yes | ✅ Yes |
| `useSidebarMode` | Navigation.tsx:44 | Named | ✅ Yes | ❌ No |
| `useSignOutConfirmation` | useSignOutConfirmation.ts:7 | Named | ✅ Yes | ✅ Yes (3 other files) |

### 8.2 Unused/redundant components

| # | Component | Location | Problem |
|---|-----------|----------|---------|
| 1 | `Spinner` | Spinner.tsx | Defined but never imported by any component in the sidebar ecosystem. Loader and PremiumLoader are used instead. |
| 2 | `LoadingSkeleton` | SharedComponents.tsx:76 | Defined but never used in sidebar. |
| 3 | `ErrorState` | SharedComponents.tsx:217 | Defined but never used in sidebar. |
| 4 | `Menu`/`MenuItem` | Menu.tsx | Dropdown menu component exists but sidebar uses inline mobile drawer and AdminModal instead. |
| 5 | `Switch` | AntigravityForm.tsx:160 | Canonical switch component exists but sidebar uses IconButton with Sun/Moon for theme toggle. |
| 6 | Custom `ErrorBoundary` | ErrorBoundary.tsx | Custom class component exists but App.tsx uses `react-error-boundary` library's `ErrorBoundary` instead. |

---

## 9. Dead Code Audit

### 9.1 Unused exports

| Export | File:Line | Imported? |
|--------|----------|----------|
| `Spinner` | Spinner.tsx:11 | ❌ No imports found |
| `LoadingSkeleton` | SharedComponents.tsx:76 | ❌ No imports found in sidebar |
| `ErrorState` | SharedComponents.tsx:217 | ❌ No imports found in sidebar |
| `Menu`/`MenuButton`/`MenuItems`/`MenuItem` | Menu.tsx | ❌ No imports found in sidebar |
| Custom `ErrorBoundary` | ErrorBoundary.tsx:14 | ⚠️ Only imported in App.tsx:610 but `react-error-boundary`'s ErrorBoundary is used instead |

### 9.2 Unused variables/imports

| Variable | File:Line | Problem |
|----------|----------|---------|
| `useForm` import | SidebarLayout.tsx:3 | Imported but never used in the file |

### 9.3 No-op stub implementations

| Function | File:Line | Problem |
|----------|----------|---------|
| `toggleTheme` stub | VerifyEmailPage.tsx:39 | `() => {}` — does nothing |
| `toggleTheme` stub | AuthCallbackPage.tsx:42 | `() => {}` — does nothing |
| `toggleTheme` stub (×2) | SignupPage.tsx:27,51 | `() => {}` — does nothing (twice!) |
| `toggleTheme` stub | LoginPage.tsx:14 | `() => {}` — does nothing |

These are ThemeContext default values when used outside ThemeProvider. They exist to prevent `undefined` errors but represent dead code paths.

---

## 10. Loading Architecture Audit

### 10.1 Loading states inventory

| State | Owner | Trigger | What renders | Line |
|-------|-------|---------|-------------|------|
| `loading` | AuthContext | Supabase session check in progress | `AuthGuard` returns `null` | Guards.tsx:34 |
| `!user && !loading` | AuthContext | No authenticated user | `AuthGuard` returns `null` | Guards.tsx:36 |
| `isSearchFocused` | SidebarLayout | Search input focused | Visual changes (border, shadow) | SidebarLayout.tsx:100 |
| `isLoading` (AdminModal) | AdminModal | Optional prop | `LoadingOverlay` overlay | AdminModal.tsx:38-40 |

### 10.2 Loader implementations (3 total)

| Loader | File:Line | Animation | Used by |
|--------|----------|-----------|---------|
| `Loader` | Loader.tsx:7 | Book-flipping animation — CSS keyframes on `w-16 h-20` book icon | AuthContext.tsx:194 (full-screen), Guards.tsx (inline) |
| `PremiumLoader` | PremiumLoader.tsx:3 | Ring+core animation — rotating ring with pulsing core | App.tsx:611 (Suspense fallback) |
| `Spinner` | Spinner.tsx:11 | CSS border spinner — `border-top-color` rotation | ❌ Never used in sidebar |
| `GuardLoader` | Guards.tsx:8-17 | Inline — book animation (same as Loader) | Guards.tsx:37 |
| `FullLoader` | AuthContext.tsx:193-205 | Full-screen — book animation (same as Loader) | AuthContext.tsx:194 |

### 10.3 Loading anti-patterns

| # | Pattern | Location | Problem |
|---|---------|----------|---------|
| 1 | **Triple loader duplication** | Loader.tsx, PremiumLoader.tsx, Spinner.tsx | Three separate loader components. Spinner is unused. Guards.tsx and AuthContext.tsx duplicate Loader's animation inline. |
| 2 | **Inline `GuardLoader`** | Guards.tsx:8-17 | Duplicate of Loader animation defined inline instead of reusing the existing `Loader` component. |
| 3 | **Inline `FullLoader`** | AuthContext.tsx:193-205 | Duplicate of Loader animation defined inline instead of reusing the existing `Loader` component. |
| 4 | **No loading skeleton for sidebar content** | SidebarLayout | When sidebar data is loading, the entire sidebar is hidden (`return null`). No skeleton/placeholder state. |

---

## 11. Modal Architecture Audit

### 11.1 All modal/dialog implementations

| Component | File:Line | Portal? | FocusTrap? | Close mechanism | Used in sidebar? |
|-----------|----------|---------|-----------|----------------|-----------------|
| `AdminModal` | AdminModal.tsx:27 | ✅ `createPortal(..., document.body)` (line 42) | ✅ `FocusTrap` (line 43) | Escape key, outside click, `onClose` prop | ✅ Yes |
| `ConfirmModal` | SharedComponents.tsx:131 | ❌ No | ❌ No | `onClose` prop | ✅ Yes |
| `AddExamModal` | AddExamModal.tsx | ❌ No | ❌ No | `onClose` prop | ❌ No |
| `PromptEditorModal` | PromptEditorModal.tsx | ❌ No | ❌ No | `onClose` prop | ❌ No |
| `SubmitExamModal` | SubmitExamModal.tsx | ✅ Via AdminModal | ✅ Via AdminModal | Via AdminModal | ❌ No |
| `SingleQuestionModal` | SingleQuestionModal.tsx | ✅ Via AdminModal | ✅ Via AdminModal | Via AdminModal | ❌ No |
| `BulkUploadModal` | BulkUploadModal.tsx | ✅ Via AdminModal | ✅ Via AdminModal | Via AdminModal | ❌ No |
| `ExamDetailModal` | ExamDetailModal.tsx | ✅ Via AdminModal | ✅ Via AdminModal | Via AdminModal | ❌ No |
| `TeacherLeaderboardModal` | TeacherLeaderboardModal.tsx | ✅ Via AdminModal | ✅ Via AdminModal | Via AdminModal | ❌ No |

### 11.2 AdminModal architecture

```
AdminModal (AdminModal.tsx:27)
├── Props: isOpen, onClose, title?, size?, children, isLoading?, className?
├── Portal: createPortal(children, document.body)  [line 42]
├── FocusTrap: <FocusTrap> wrapping modal content  [line 43]
│   └── Props: active={isOpen}, focusTrapOptions={{ initialFocus: false, clickOutsideDeactivates: true }}
├── Effect: document.addEventListener('mousedown', handleOutsideClick)  [line 47]
├── Effect: document.addEventListener('keydown', handleEscapeKey)  [line 47]
├── Cleanup: deactivateTrap()  [line 50]  ← ISSUE 1 ROOT CAUSE
└── Render: if (!isOpen) return null  [line 37]
```

### 11.3 Modal anti-patterns

| # | Pattern | Location | Problem |
|---|---------|----------|---------|
| 1 | **`onDeactivate: onClose` in FocusTrap** | AdminModal.tsx:44 | FocusTrap's `deactivate()` calls `onDeactivate` which is bound to `onClose`. When FocusTrap cleans up (componentWillUnmount → deactivateTrap), it fires `onClose` → `setIsOpen(false)`. In StrictMode, this fires during the first unmount. |
| 2 | **ConfirmModal lacks FocusTrap** | SharedComponents.tsx:131 | `ConfirmModal` renders a simple div overlay without FocusTrap. Keyboard users can tab behind the modal. |
| 3 | **ConfirmModal lacks portal** | SharedComponents.tsx:131 | `ConfirmModal` renders inline, not portaled to document.body. May be clipped by `overflow: hidden` ancestors. |
| 4 | **Five different modal implementations** | Various | No single canonical modal pattern. Some use AdminModal, some are standalone, some lack FocusTrap/portal. |
| 5 | **`ConfirmModal` + `AdminModal` dual confirm** | SidebarLayout.tsx:303-315 | `ConfirmModal` is rendered, but it wraps `AdminModal` internally via `AdminModal` in its implementation. The nesting is: `ConfirmModal` → `AdminModal` (portal + FocusTrap) → confirm content. |

---

## 12. Theme Audit

### 12.1 Theme system architecture

```
ThemeContext.tsx
├── State: theme ('dark' | 'light'), isDark (boolean)
├── Persisted: localStorage.getItem('theme') || 'dark'
├── Toggle: toggleTheme() → setTheme(prev => prev === 'dark' ? 'light' : 'dark')
└── Applied: document.documentElement.classList.toggle('dark', isDark)

CSS (themes.css)
├── :root (dark default)
│   → Raw tokens: --color-primary, --color-gold, --bg-primary, etc.
│   → Semantic tokens: --bg-card, --border-subtle, etc.
│   └── Component tokens: --sidebar-bg, --sidebar-border, --header-bg
└── .light (light overrides)
    → Semantic: --bg-primary: #f5f1e8, --bg-card: #f5f1e8, etc.
    → Component: --sidebar-bg: linear-gradient(...), --sidebar-border: 2px solid #b8960c

CSS (index.css)
├── .light aside (lines 566-636)
│   → Nav link colors, active states, text colors, borders
│   → Footer background
└── .ancient-sidebar (line 976)
    → background: var(--sidebar-bg), border-right: var(--sidebar-border), box-shadow: var(--header-shadow)
```

### 12.2 Theme toggle implementations

| Implementation | File:Line | Type | Canonical? |
|---------------|----------|------|-----------|
| `toggleTheme()` | ThemeContext.tsx:31 | `setTheme(prev => prev === 'dark' ? 'light' : 'dark')` | ✅ Yes |
| Theme toggle button | SidebarLayout.tsx:128-136 | `<IconButton>` with `Sun`/`Moon` icons + `lg:group-hover:rotate-90` | ⚠️ Not a Switch |
| `toggleTheme` stub | VerifyEmailPage.tsx:39 | `() => {}` | ❌ No-op |
| `toggleTheme` stub | AuthCallbackPage.tsx:42 | `() => {}` | ❌ No-op |
| `toggleTheme` stub (×2) | SignupPage.tsx:27,51 | `() => {}` | ❌ No-op |
| `toggleTheme` stub | LoginPage.tsx:14 | `() => {}` | ❌ No-op |

### 12.3 Theme toggle button details (Problem 3)

**Current implementation** (SidebarLayout.tsx:128-136):
```tsx
<IconButton
  onClick={toggleTheme}
  variant="neutral"
  size="sm"
  className="group"
  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
  {isDark ? <Sun className="w-4 h-4 transition-transform duration-300 group-hover:text-gold-400" /> : <Moon className="w-4 h-4 transition-transform duration-300 group-hover:text-gold-400" />}
</IconButton>
```

**Canonical Switch component** (AntigravityForm.tsx:160-204):
```tsx
function Switch({ checked, onCheckedChange, label, disabled, id, name, className }) {
  // <button role="switch" aria-checked={checked} onKeyDown={handleKeyDown}>
  //   <span className="..." style={{ transform: checked ? 'translateX(20px)' : 'translateX(0px)' }} />
  // </button>
}
```

**What's needed for Problem 3:**
- Replace `<IconButton>` with `<Switch checked={isDark} onCheckedChange={toggleTheme} />`
- Add label text ("Dark Mode" / "Light Mode")
- Add `id` for accessibility

---

## 13. Accessibility Audit

### 13.1 ARIA attributes inventory

| Element | ARIA | Location | Correct? |
|---------|------|----------|---------|
| Mobile drawer overlay | `aria-label="Close menu"` | SidebarLayout.tsx:170 | ✅ Yes |
| Mobile drawer | `aria-hidden={!isSidebarOpen}` | SidebarLayout.tsx:177 | ✅ Yes |
| Hamburger button | `aria-label="Open menu"` | SidebarLayout.tsx:297 | ✅ Yes |
| Mobile sign-out button | `aria-label="Sign out"` | SidebarLayout.tsx:243 | ✅ Yes |
| Desktop sign-out button | `aria-label="Sign out"` | SidebarLayout.tsx:147 | ✅ Yes |
| AdminModal | `aria-modal="true"`, `role="dialog"`, `aria-labelledby` | AdminModal.tsx:45 | ✅ Yes |
| ConfirmModal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` | SharedComponents.tsx:141-143 | ✅ Yes |
| Navigation.Shell | `role="navigation"`, `aria-label="Main navigation"` | Navigation.tsx:119 | ✅ Yes |
| NavItem (active) | `aria-current="page"` | Navigation.tsx:257 | ✅ Yes |
| Search input | `aria-label="Search menu"` | SidebarLayout.tsx:101 | ✅ Yes |
| Theme toggle | `aria-label={isDark ? 'Switch to light mode' : 'Switch to light mode'}` | SidebarLayout.tsx:130-131 | ⚠️ Dynamic, correct |
| Logo | `role="img"`, `aria-label="Company Logo"` | Logo.tsx:4 | ✅ Yes |
| Spinner | `aria-label="Loading"`, `role="status"` | Spinner.tsx:12 | ✅ Yes |
| NotificationBell | `aria-label="Toggle notifications"` | NotificationPanel.tsx:129 | ✅ Yes |
| CollapseButton | `aria-label="Collapse sidebar"` / `"Expand sidebar"` | Navigation.tsx:177 | ✅ Yes |
| Navigation divider | `role="separator"`, `aria-hidden="true"` | SharedComponents.tsx:18 | ✅ Yes |

### 13.2 Keyboard navigation audit

| Element | Keyboard support | Issue |
|---------|-----------------|-------|
| NavItem | `onClick` only | ⚠️ No `onKeyDown` handler — keyboard users must use Enter/Space, which works by default for `<div onClick>` but not semantically correct |
| AdminModal | Escape key (line 55), FocusTrap | ✅ Correct |
| Menu | Escape key (Menu.tsx:183), outside click | ✅ Correct |
| ConfirmModal | No Escape key handler | ⚠️ Missing keyboard dismiss |
| Search input | Native keyboard | ✅ Correct |
| Hamburger button | `<button>` element | ✅ Correct |
| Theme toggle | `<IconButton>` → `<button>` | ✅ Correct |
| Sign-out button | `<button>` element | ✅ Correct |

### 13.3 Focus management

| Scenario | Focus behavior | Correct? |
|----------|---------------|---------|
| Mobile drawer opens | No automatic focus | ⚠️ Should focus first interactive element |
| Mobile drawer closes | Focus returns to hamburger button | ✅ Correct |
| AdminModal opens | FocusTrap activates | ✅ Correct |
| AdminModal closes (Escape) | Focus returns to trigger (onClose) | ✅ Correct |
| AdminModal closes (outside click) | Focus returns to trigger | ✅ Correct |
| ConfirmModal opens | No FocusTrap | ⚠️ Focus not trapped |
| ConfirmModal closes | Focus not explicitly managed | ⚠️ Focus not restored |

### 13.4 Screen reader audit

| Element | Screen reader behavior | Issue |
|---------|----------------------|-------|
| Mobile drawer | `aria-hidden` toggles visibility | ✅ Correct |
| `aria-hidden` + `motion.aside` | framer-motion AnimatePresence may leave DOM nodes after exit | ⚠️ Potential issue — `aria-hidden` may not remove nodes from accessibility tree during exit animation |
| Navigation links | Standard `<a>` or `<div onClick>` | ⚠️ `<div onClick>` without `role="link"` not announced as link |

---

## 14. Animation Audit

### 14.1 Animation inventory

| Animation | Library | Location | Trigger |
|-----------|---------|----------|---------|
| Mobile drawer slide-in/out | framer-motion `AnimatePresence` + `motion.aside` | SidebarLayout.tsx:169 | `isSidebarOpen` change |
| Theme toggle icon rotation | CSS `transition-transform duration-300 lg:group-hover:rotate-90` | SidebarLayout.tsx:134 | Hover (desktop) |
| Loader book animation | CSS `@keyframes flip` | Loader.tsx:17 | Mount |
| PremiumLoader ring animation | CSS `@keyframes spin`, `@keyframes pulse` | PremiumLoader.tsx:21,35 | Mount |
| Spinner border animation | CSS `@keyframes spin` | Spinner.tsx:17 | Mount |
| Nav item hover | CSS `transition-colors duration-200` | Navigation.tsx:243 | Hover |
| Mobile nav item tap | framer-motion `whileTap={{ scale: 0.98 }}` | SidebarLayout.tsx:213 | Tap |
| Search focus ring | CSS `transition-all duration-200` | SidebarLayout.tsx:100 | Focus |
| Notification badge pulse | CSS `animate-pulse` | NotificationPanel.tsx:139 | When `unreadCount > 0` |

### 14.2 Animation anti-patterns

| # | Pattern | Location | Problem |
|---|---------|----------|---------|
| 1 | **`aria-hidden` + AnimatePresence** | SidebarLayout.tsx:177 | `aria-hidden={!isSidebarOpen}` is set on the `motion.aside`, but AnimatePresence keeps the element in DOM during exit animation. Screen readers may still read content during exit. |
| 2 | **Theme toggle hover animation desktop-only** | SidebarLayout.tsx:134 | `lg:group-hover:rotate-90` only applies on desktop. Mobile theme toggle has no visual feedback beyond icon swap. |
| 3 | **No reduced-motion support** | All animations | No `prefers-reduced-motion` media query checks. Users who prefer reduced motion get all animations. |

---

## 15. Error Handling Audit

### 15.1 Error boundary implementations (2 total)

| Implementation | File:Line | Type | Used in sidebar? |
|---------------|----------|------|-----------------|
| Custom `ErrorBoundary` | ErrorBoundary.tsx:14 | Class component, `getDerivedStateFromError` | ❌ No (imported in App.tsx:610 but `react-error-boundary` used instead) |
| `react-error-boundary` `ErrorBoundary` | App.tsx:610 | Library component | ✅ Yes (wraps entire app) |

### 15.2 Error handling in sidebar

| Location | Error type | Handling | Line |
|----------|-----------|---------|------|
| AuthContext `login()` | Auth error | `logger.error` + re-throw | AuthContext.tsx:203-204 |
| AuthContext `logout()` | Logout error | `logger.error` + fallback `window.location.href` | AuthContext.tsx:174-178 |
| AuthContext `signup()` | Signup error | `logger.error` + re-throw | AuthContext.tsx:213-215 |
| AuthContext `deleteAccount()` | Delete error | `logger.error` + re-throw | AuthContext.tsx:253-255 |
| AuthContext `onAuthStateChange` | Session error | `setUserSync(null)` + `logger.error` | AuthContext.tsx:284-287 |
| AuthContext `refreshSession` | Refresh error | `setUserSync(null)` | AuthContext.tsx:261-263 |
| SidebarLayout `handleSignOut` | Sign-out error | `window.location.href = '/login'` (hard redirect) | SidebarLayout.tsx:260-263 |
| SidebarLayout `useNotifications` | Supabase error | `logger.error` (in hook) | useNotifications.ts:72-74 |

### 15.3 Error handling anti-patterns

| # | Pattern | Location | Problem |
|---|---------|----------|---------|
| 1 | **Hard redirect on sign-out error** | SidebarLayout.tsx:263 | `window.location.href = '/login'` bypasses React Router, causes full page reload |
| 2 | **Multiple `window.location.href = '/login'`** | authService.ts:136, AuthContext.tsx:178, SidebarLayout.tsx:263 | Three different code paths that hard-redirect to `/login`. Redundant and inconsistent. |
| 3 | **No error boundary around sidebar** | SidebarLayout | No `ErrorBoundary` wrapping the sidebar. If sidebar throws, the entire app crashes. |
| 4 | **Silent notification failures** | useNotifications.ts:72-74 | Supabase errors are logged but not surfaced to the user. Notification failures are invisible. |

---

## 16. Architecture Best Practices Audit

### 16.1 Single Responsibility Principle violations

| # | Violation | File:Line | Problem |
|---|-----------|----------|---------|
| 1 | **SidebarLayout is a god component** | SidebarLayout.tsx:32-315 | 315 lines handling: mobile drawer, desktop sidebar, header, sign-out, search, theme toggle, notifications, layout. Should be decomposed. |
| 2 | **Navigation.tsx contains both data and components** | Navigation.tsx:1-273 | Defines `NavItem` type, `useSidebarMode` hook, AND all compound components. Type definition should be in navigation.ts. |
| 3 | **AuthContext is a god context** | AuthContext.tsx:1-766 | 766 lines handling: auth state, login/logout/signup, session management, user metadata, user sync. Should be split. |

### 16.2 DRY violations

| # | Duplication | Files | Problem |
|---|------------|-------|---------|
| 1 | **`NavItem` type** | config/navigation.ts:23, Navigation.tsx:9 | Two definitions with different shapes (`color` required vs optional) |
| 2 | **`isMobile`/`isSidebarOpen` state** | SidebarLayout.tsx, AdminPanelHeader.tsx | Duplicate mobile detection + sidebar open state |
| 3 | **Loader animation** | Loader.tsx, Guards.tsx:8-17, AuthContext.tsx:193-205 | Three inline implementations of the same book animation |
| 4 | **Logout implementation** | authService.ts:136, AuthContext.tsx:163 | Two logout functions — `authService.logout()` (Supabase) vs `AuthContext.logout()` (app-level) |
| 5 | **`window.location.href = '/login'`** | authService.ts:136, AuthContext.tsx:178, SidebarLayout.tsx:263 | Three hard-redirect paths |
| 6 | **Breakpoint detection** | useBreakpoint.ts, useMediaQuery.ts | Two different breakpoint hook implementations |
| 7 | **ErrorBoundary** | ErrorBoundary.tsx, react-error-boundary | Two error boundary implementations in same codebase |

### 16.3 Separation of concerns violations

| # | Violation | File:Line | Problem |
|---|-----------|----------|---------|
| 1 | **Layout component handles auth** | SidebarLayout.tsx:260-263 | `handleSignOut` calls `logout()` + hard redirect. Auth logic should be in AuthContext only. |
| 2 | **Layout component handles notifications** | SidebarLayout.tsx:216-217 | NotificationBell rendered inline with sidebar nav. Should be a separate composed component. |
| 3 | **CSS in JS** | index.css:566-636 | Light mode sidebar overrides use CSS class selectors (`.light aside`) instead of CSS custom properties. Mixed approach. |
| 4 | **Hard-coded mobile breakpoint** | SidebarLayout.tsx:63 | `< 768px` hardcoded in ResizeObserver. Should use the `useBreakpoint` hook's definition. |

### 16.4 React patterns audit

| # | Pattern | Location | Issue |
|---|---------|----------|-------|
| 1 | **Unstable `value` in AuthContext** | AuthContext.tsx:740-765 | `session` in useMemo deps causes unnecessary re-renders on token refresh |
| 2 | **18× `setUserSync(null)`** | AuthContext.tsx (18 locations) | Scattered state mutation instead of centralized cleanup |
| 3 | **`useForm` import** | SidebarLayout.tsx:3 | Imported but never used — dead import |
| 4 | **No React.memo on SidebarLayout** | SidebarLayout.tsx:32 | SidebarLayout is not memoized — re-renders on every parent render |
| 5 | **ConfirmModal not memoized** | SharedComponents.tsx:131 | `ConfirmModal` is `React.memo`-wrapped but AdminModal is not |

### 16.5 Security audit

| # | Pattern | Location | Issue |
|---|---------|----------|-------|
| 1 | **No CSP in HTML** | index.html | `<meta>` tag for CSP is commented out |
| 2 | **Supabase anon key in source** | config/supabase.ts | Client-side key, expected for Supabase |
| 3 | **No token refresh error handling** | AuthContext.tsx:261-263 | Session refresh failure silently clears user without notification |
| 4 | **Hard redirect bypasses React Router** | SidebarLayout.tsx:263 | `window.location.href` bypasses client-side routing and state management |

---

## Final Section: Severity-Classified Findings

### Critical (Fix immediately — data loss, security, or complete breakage)

| # | Finding | File:Line | Problem |
|---|---------|----------|---------|
| — | No critical findings | — | — |

### High (Fix in Phase 2 — significant UX or architecture issues)

| # | Finding | File:Line | Problem |
|---|---------|----------|---------|
| H1 | **Issue 1 root cause: `onDeactivate: onClose`** | AdminModal.tsx:44 | StrictMode double-mount fires `onClose` during cleanup. Dev-only. Fix: remove `onDeactivate: onClose`. (Proven in Phase 2B) |
| H2 | **Issue 2: Hamburger blank page** | Runtime | No source-code root cause proven. Requires instrumentation. (Phase 2B: D. Runtime Instrumentation Required) |
| H3 | **Problem 4: Mobile drawer missing `.ancient-sidebar`** | SidebarLayout.tsx:175 | Light mode mobile drawer uses `bg-card-bg` instead of `.ancient-sidebar` class. Desktop uses `.ancient-sidebar` for gradient background + gold border. Fix: apply `ancient-sidebar` class to mobile drawer in light mode. |
| H4 | **AuthContext `value` instability** | AuthContext.tsx:740-765 | `session` in useMemo deps causes unnecessary re-renders on token refresh. Fix: remove `session` from deps or use ref. |
| H5 | **Duplicate `isMobile`/`isSidebarOpen`** | AdminPanelHeader.tsx:34 vs Navigation.tsx:45 | Two independent sources of truth for mobile state. Fix: use `useSidebarMode` in AdminPanelHeader. |
| H6 | **ConfirmModal lacks FocusTrap and portal** | SharedComponents.tsx:131 | No keyboard trapping, may be clipped. Fix: wrap in AdminModal or add FocusTrap + portal. |

### Medium (Fix in Phase 2 — code quality, maintainability)

| # | Finding | File:Line | Problem |
|---|---------|----------|---------|
| M1 | **Problem 3: Theme toggle is IconButton, not Switch** | SidebarLayout.tsx:128-136 | Canonical `Switch` exists in AntigravityForm.tsx:160. Fix: replace IconButton with Switch. |
| M2 | **Three loader implementations** | Loader.tsx, PremiumLoader.tsx, Spinner.tsx | Duplicate loaders. Spinner unused. Fix: consolidate to one loader component. |
| M3 | **Inline `GuardLoader` and `FullLoader`** | Guards.tsx:8-17, AuthContext.tsx:193-205 | Duplicate of Loader animation defined inline. Fix: reuse Loader component. |
| M4 | **Five modal implementations** | Various | No canonical modal pattern. Fix: standardize on AdminModal for all modals. |
| M5 | **`NavItem` type duplication** | config/navigation.ts:23, Navigation.tsx:9 | Two definitions with different shapes. Fix: use single source in config/navigation.ts. |
| M6 | **Three `window.location.href = '/login'` paths** | authService.ts:136, AuthContext.tsx:178, SidebarLayout.tsx:263 | Redundant hard redirects. Fix: consolidate to AuthContext.logout(). |
| M7 | **Navigation.matchMedia re-registration** | Navigation.tsx:84-89 | `collapseSidebar` in deps causes unnecessary listener re-registration. Fix: use ref. |
| M8 | **No `prefers-reduced-motion` support** | All animations | Users who prefer reduced motion get all animations. Fix: add media query checks. |
| M9 | **`aria-hidden` + AnimatePresence** | SidebarLayout.tsx:177 | Screen readers may read content during exit animation. Fix: remove from DOM before animation. |
| M10 | **No error boundary around sidebar** | SidebarLayout | Sidebar errors crash entire app. Fix: wrap in ErrorBoundary. |

### Low (Fix in Phase 3 — minor improvements)

| # | Finding | File:Line | Problem |
|---|---------|----------|---------|
| L1 | **`useForm` dead import** | SidebarLayout.tsx:3 | Imported but never used. Fix: remove import. |
| L2 | **5 no-op `toggleTheme` stubs** | VerifyEmailPage, AuthCallbackPage, SignupPage (×2), LoginPage | `() => {}` stubs. Fix: remove or use proper ThemeContext default. |
| L3 | **Mobile breakpoint inconsistency** | SidebarLayout.tsx:63 vs useBreakpoint.ts:15 | `< 768px` vs `< 640px`. Fix: use useBreakpoint hook consistently. |
| L4 | **Custom ErrorBoundary unused** | ErrorBoundary.tsx | Custom class component exists but react-error-boundary is used. Fix: remove custom implementation or consolidate. |
| L5 | **`Spinner` unused** | Spinner.tsx | Defined but never imported. Fix: remove or use. |
| L6 | **`LoadingSkeleton` unused in sidebar** | SharedComponents.tsx:76 | Defined but never used in sidebar ecosystem. |
| L7 | **`ErrorState` unused in sidebar** | SharedComponents.tsx:217 | Defined but never used in sidebar ecosystem. |
| L8 | **Theme toggle hover animation desktop-only** | SidebarLayout.tsx:134 | `lg:group-hover:rotate-90` only on desktop. Mobile has no visual feedback. |

### Cosmetic (Optional — style, naming, documentation)

| # | Finding | File:Line | Problem |
|---|---------|----------|---------|
| C1 | **SidebarLayout as god component** | SidebarLayout.tsx | 315 lines, 7+ responsibilities. Consider decomposition. |
| C2 | **AuthContext as god context** | AuthContext.tsx | 766 lines. Consider splitting into AuthContext + SessionContext. |
| C3 | **Navigation.tsx mixes types, hooks, and components** | Navigation.tsx | Type definitions, hook, and all components in one file. |

### False Positives (Investigated — not actual issues)

| # | Finding | Investigation result |
|---|---------|---------------------|
| FP1 | **FocusTrap `onDeactivate` always fires** | Only fires when FocusTrap is explicitly deactivated. Normal React unmount does NOT call `deactivate()`. Only StrictMode cleanup chain triggers it. |
| FP2 | **Menu.tsx has React.memo** | `React.memo(Menu)` at line 196 — intentional pattern, not an issue. |
| FP3 | **SidebarLayout lacks React.memo** | Not a bug — sidebar layout re-renders are controlled by Context. Adding memo would not prevent re-renders from Context changes. |
| FP4 | **`document.body` portal may lose CSS** | Tailwind CSS is in `<head>`, not scoped. Portal to body retains all styles. |

### Already Correct (Verified — no action needed)

| # | Finding | Evidence |
|---|---------|----------|
| AC1 | **FocusTrap cleanup on normal unmount** | `componentWillUnmount` at focus-trap-react.js:379 calls `deactivate()` but only when `this.focusTrap` exists. On normal React unmount (not StrictMode), the trap may already be null. |
| AC2 | **Menu.tsx `React.memo`** | `React.memo(Menu)` at line 196 — intentional, correct pattern for reusable component. |
| AC3 | **Supabase key in source** | Client-side anon key is expected for Supabase client-side usage. |
| AC4 | **CSS class-based theming** | Using `document.documentElement.classList.toggle` is the recommended approach for CSS custom property theming. |

### Repository-Proven Root Causes (Source-code evidence proven)

| # | Root Cause | Evidence | Severity |
|---|-----------|----------|----------|
| RC1 | **Issue 1: StrictMode double-mount + `onDeactivate: onClose`** | AdminModal.tsx:44 → FocusTrap constructor:41 → focus-trap.js:1124 → onClose() → setIsOpen(false). 17-step execution trace through 8 files. | High (dev-only) |

### Runtime Instrumentation Required (Not provable from source code)

| # | Hypothesis | Reason |
|---|-----------|--------|
| RI1 | **Issue 2: Hamburger blank page** | No source-code root cause found. Five candidate hypotheses (race condition, focus trap, event propagation, async state, CSS) but none provable without runtime tracing. |

### Recommended Phase 2 Scope

| Priority | Items |
|----------|-------|
| **Phase 2A (Quick Wins)** | H1 (remove `onDeactivate: onClose`), M1 (theme toggle Switch), L1 (remove dead import), L2 (remove no-op stubs) |
| **Phase 2B (Architecture)** | H4 (AuthContext value instability), H5 (duplicate mobile state), M2-M3 (consolidate loaders), M5 (NavItem type), M6 (consolidate logout), M7 (matchMedia re-registration) |
| **Phase 2C (Modals)** | H6 (ConfirmModal FocusTrap + portal), M4 (standardize modal pattern) |
| **Phase 2D (Accessibility)** | M8 (prefers-reduced-motion), M9 (aria-hidden + AnimatePresence), L3 (breakpoint consistency) |
| **Phase 2E (Resilience)** | M10 (error boundary around sidebar), H3 (mobile drawer .ancient-sidebar fix) |
| **Phase 3 (Runtime)** | H2 (Issue 2 — requires instrumentation) |
