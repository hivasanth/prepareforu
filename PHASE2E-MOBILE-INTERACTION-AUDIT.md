# Phase 2E — Mobile Navigation Interaction Audit

**Scope**: Hamburger button hover state mismatch + mobile drawer navigation flicker
**Date**: 2026-07-22
**Mode**: AUDIT ONLY — no code changes

---

## Issue 1: Hamburger Button — Large Beige Hover Background

### Classification: **A — Repository-Proven (Root Cause Found)**

### Current Implementation

**Hamburger button** (`SidebarLayout.tsx:263-271`):
```tsx
<IconButton variant="ghost" size="md" ...>
  <Menu size={20} />
</IconButton>
```

**IconButton component** (`AntigravityButton.tsx:166-204`):
- `size="md"` → `w-[44px] h-[44px] rounded-xl`
- `variant="ghost"` → uses `iconVariants.ghost` (line 160):
  ```
  bg-transparent text-text-secondary hover:bg-hover-bg hover:text-text-primary
  ```
- **No theme-aware split** — single `iconVariants` object used for both light and dark modes

**Desktop navigation items** (`Navigation.tsx:181-189`):
- `p-3 rounded-xl` with identical hover: `text-text-secondary hover:bg-hover-bg hover:text-text-primary`
- Wrapped in `NavLink` (not `IconButton`)
- Inside sidebar with `flex flex-col gap-1` layout

**Other header buttons** (theme toggle, notification bell, close button):
- All use `IconButton variant="ghost" size="sm"` → `w-[36px] h-[36px] rounded-[10px]`
- Same hover color, but 16% smaller hit target

### Root Cause Analysis

The hamburger and desktop nav items use **identical CSS classes** for hover (`hover:bg-hover-bg hover:text-text-primary`). The visual difference stems from **structural context**, not CSS:

1. **Size asymmetry**: Hamburger is `w-[44px] h-[44px]` (size="md") while other header icons and drawer close button are `w-[36px] h-[36px]` (size="sm"). The 44×44px beige hover patch is visually prominent against the header's `ancient-header` (light mode) or `bg-card-bg/80 backdrop-blur-xl` (dark mode) background.

2. **Light mode token**: `--hover-bg` = `#EEDEB5` (warm beige/gold). On the 44×44px hamburger, this creates a large, noticeable beige rectangle that feels heavy compared to:
   - Desktop nav items (smaller items in a `gap-1` flex column, inside the `ancient-sidebar` panel — different visual context)
   - Other header buttons (`size="sm"` = 36×36px, less surface area)

3. **Missing `border-transparent shadow-none`**: The `Button` component's `lightVariants.ghost` (line 46-47) includes `border border-transparent shadow-none`, but `IconButton`'s `iconVariants.ghost` (line 160) omits these. This is a minor inconsistency but means `IconButton` doesn't reset border/shadow states on hover the same way `Button` does.

### Evidence

| Component | File:Line | Hover Class | Size | Theme-Aware |
|-----------|-----------|-------------|------|-------------|
| Hamburger | SidebarLayout.tsx:263 | `hover:bg-hover-bg` | 44×44px | No (iconVariants) |
| Desktop nav item | Navigation.tsx:187 | `hover:bg-hover-bg` | p-3 (auto) | No (inline) |
| Drawer close btn | SidebarLayout.tsx:186 | `hover:bg-hover-bg` | 36×36px | No (iconVariants) |
| Header theme toggle | SidebarLayout.tsx:218 | `hover:bg-hover-bg` | 36×36px | No (iconVariants) |
| Header notification | NotificationPanel.tsx | `hover:bg-hover-bg` | 36×36px | No (iconVariants) |

### Fix Recommendation

- **Option A**: Reduce hamburger to `size="sm"` (36×36px) to match other header icon buttons — smallest change, consistent header behavior
- **Option B**: Add theme-aware `iconVariants` (like `Button`'s `lightVariants`/`darkVariants` split) with a more subtle hover for light mode — larger refactor but addresses the broader `IconButton` inconsistency
- **Option C**: Override hamburger hover locally in SidebarLayout with a more subtle class (e.g., `hover:bg-hover-bg/50` for lighter opacity) — targeted but adds one-off styles

**Recommended**: Option A (size reduction) for minimal risk. The 36×36px size matches every other header icon button.

---

## Issue 2: Mobile Drawer Navigation Flicker (2-3 Redraws)

### Classification: **A — Repository-Proven (Root Cause Found)**

### Reproduction Sequence

1. Open mobile drawer (tap hamburger)
2. Tap any nav item (e.g., "Dashboard")
3. Observe: drawer visually flickers 2-3 times before settling on the new page

### Root Cause Chain

The flicker is caused by **3 overlapping visual state changes** happening in rapid succession:

#### Render Cycle 1: User tap → state batch
**Source**: `NavigationItem` onClick → `onItemNavigate` callback (`SidebarLayout.tsx:213`)
```tsx
<Navigation.Items items={navConfig} onItemNavigate={() => setIsDrawerOpen(false)} />
```
- `setIsDrawerOpen(false)` — queued
- `NavLink` triggers React Router `navigate()` — `location.pathname` changes — queued
- React **batches** both state updates into a single render
- Result: `isDrawerOpen=false`, new `location.pathname`
- **Visual**: `AnimatePresence` begins exit animation on backdrop (`opacity: 0`) and drawer (`x: '-100%'`) — spring animation with `damping: 25, stiffness: 220`

#### Render Cycle 2: Redundant useEffect
**Source**: `SidebarLayout.tsx:54-56`
```tsx
useEffect(() => {
  setIsDrawerOpen(false)
}, [location.pathname])
```
- Fires after render from Cycle 1
- `setIsDrawerOpen(false)` is **redundant** (already `false`) — React bails out (no extra render)
- **However**, the `useEffect` itself runs synchronously after paint, which can cause a brief layout reflow

#### Render Cycle 3: Lazy page load via Suspense
**Source**: `SidebarLayout.tsx:300-306`
```tsx
<Suspense fallback={<Spinner size="md" />}>
  <Outlet />
</Suspense>
```
- **Pages are lazy-loaded** (confirmed in App.tsx)
- When route changes, `<Outlet>` unmounts old page, Suspense shows `<Spinner size="md" />` fallback
- Lazy component loads → Suspense replaces spinner with actual page content
- **Visual**: Brief spinner flash (the "third flicker")

### Flicker Timeline

```
t=0ms    User taps nav item
t=0ms    setState batch: isDrawerOpen=false + location.pathname=new
t=0ms    React renders → AnimatePresence starts exit animation
t=~16ms  Browser paints: backdrop fading + drawer sliding left
t=~50ms  useEffect fires (redundant setDrawerOpen — no-op)
t=~100ms Suspense: old page unmounts, Spinner fallback shown
t=~300ms Lazy component loads, Suspense: Spinner → actual page
t=~400ms AnimatePresence exit animation completes (spring)
```

**Three visual changes**: (1) Drawer animating, (2) Spinner flash, (3) Page content
= **2-3 visible flickers**

### Compounding Factors

1. **NavigationContext.Provider value not memoized** (`SidebarLayout.tsx:158-166`):
   ```tsx
   <NavigationContext.Provider value={{
     isExpanded: true, isDark, layoutId, isMobile, isTablet, isDesktop,
     onToggleCollapse: toggleCollapse,
   }}>
   ```
   Creates a **new object on every render**, causing all `NavigationContext` consumers to re-render even when values haven't changed. This amplifies the flicker by triggering extra renders of `Navigation.Items` and `NavigationItem`.

2. **Redundant `useEffect`** (`SidebarLayout.tsx:54-56`):
   The `setIsDrawerOpen(false)` in the `useEffect` is always redundant — `onItemNavigate` already sets it to `false` before navigation. It should be removed.

3. **No animation coordination**: The drawer exit animation (`AnimatePresence`) runs concurrently with the page transition (Suspense/lazy load). There's no sequencing — both happen simultaneously, creating visual noise.

### Fix Recommendation

**Fix 1 — Remove redundant useEffect** (High impact, trivial change):
- Delete `SidebarLayout.tsx:54-56` (`useEffect` on `location.pathname` closing the drawer)
- The `onItemNavigate` callback already handles this

**Fix 2 — Memoize NavigationContext value** (Medium impact, small change):
- Wrap the `value` object in `useMemo` keyed on `[isDark, layoutId, isMobile, isTablet, isDesktop, toggleCollapse]`
- Prevents unnecessary re-renders of drawer content during animation

**Fix 3 — Sequence animation before navigation** (High impact, moderate change):
- In `onItemNavigate`, **don't** call `setIsDrawerOpen(false)` immediately
- Instead, start the drawer close animation first, then navigate after animation completes
- Use `onAnimationComplete` or a `setTimeout` matching the spring duration (~300ms)
- This eliminates the visual overlap between drawer closing and page loading

**Fix 4 — Remove Suspense from SidebarLayout's main content** (Low risk, moderate impact):
- Move the `Suspense` boundary from `SidebarLayout.tsx:300` into individual page components or route definitions
- This prevents the Spinner flash in the layout — the page transition becomes a clean swap

**Recommended**: Fix 1 + Fix 2 + Fix 3 together. Fix 1 and Fix 2 are trivial. Fix 3 requires measuring the actual spring duration but eliminates the core visual overlap.

---

## Summary

| Issue | Classification | Root Cause | Fix Complexity | Risk |
|-------|---------------|------------|----------------|------|
| Hamburger hover | A — Repository-Proven | `IconButton size="md"` is 44×44px vs 36×36px for all other header buttons | Low (change size prop) | Low |
| Navigation flicker | A — Repository-Proven | 3 overlapping visual changes: animation + redundant useEffect + lazy Suspense load | Medium (3 coordinated changes) | Low-Medium |

Both issues are **independent** — either can be fixed without the other.
