# Error Experience System — Subsystem Documentation

> **Status:** FROZEN — Production-ready. Do not modify frozen APIs without dedicated architecture review.
>
> **Last certified:** 2026-07-26
>
> **Coverage:** 11/11 User Panel top-level pages — 100%

---

## 1. Purpose

The Error Experience System provides a centralized, consistent error handling and display layer for the PrepareForU User Panel. It replaces per-page ad-hoc error handling (manual `useState`, `showToast`, `ErrorState`) with a single state machine, standardized UI components, and specialized capture helpers.

**Goals:**
- Every network/server/auth failure shows a consistent error UI with retry capability
- Pages never manually categorize or normalize errors
- Business states ("No Data", "Locked", validation) remain separate from error states
- Accessibility requirements (`role="alert"`, `aria-live`) are enforced by the foundation

---

## 2. Architecture

```
Page
  └─ usePageError()           ← hook (state machine + capture helpers)
       └─ normalizeError()    ← pure function (input → PageError)
            └─ detectCategory() ← centralized category detection
            └─ resolveCode()    ← centralized code resolution
  └─ ErrorContainer           ← composable UI wrapper (role="alert")
       └─ RetryButton         ← stateless retry action
```

**Data flow:**
1. Page catches error in async operation
2. Page calls `captureNetworkError(err, { retryFn })` (or appropriate helper)
3. `usePageError` normalizes the error into a `PageError` object
4. State transitions to `error`
5. Page renders `<ErrorContainer>` with `<RetryButton>`
6. User clicks retry → `retry()` → state transitions to `retrying` → calls `retryFn`

---

## 3. Public APIs (FROZEN)

### 3.1 Types — `src/types/error.types.ts`

| Export | Type | Values |
|--------|------|--------|
| `ErrorCategory` | string union | `'network' \| 'offline' \| 'timeout' \| 'authentication' \| 'authorization' \| 'server' \| 'validation' \| 'rateLimit' \| 'maintenance' \| 'unknown' \| 'business'` |
| `ErrorCode` | string union | `'NETWORK_OFFLINE' \| 'NETWORK_TIMEOUT' \| 'NETWORK_FETCH_FAILED' \| 'SERVER_ERROR' \| 'SERVER_MAINTENANCE' \| 'AUTH_SESSION_EXPIRED' \| 'AUTH_UNAUTHORIZED' \| 'AUTH_FORBIDDEN' \| 'RATE_LIMIT_EXCEEDED' \| 'VALIDATION_ERROR' \| 'UNKNOWN'` |
| `ErrorSeverity` | string union | `'low' \| 'medium' \| 'high' \| 'critical'` |
| `PageErrorState` | string union | `'idle' \| 'loading' \| 'error' \| 'retrying' \| 'success'` |
| `ErrorContainerVariant` | string union | `'page' \| 'inline' \| 'banner' \| 'modal'` (all render identically today) |
| `PageError` | interface | `{ category, code, severity, title, message, retryable, timestamp, debugMessage?, fingerprint? }` |
| `ErrorInput` | type alias | `unknown` |
| `CaptureOptions` | interface | `{ retryable?, retryFn?, severity?, category?, code?, fallbackMessage? }` |
| `CaptureHelpers` | interface | 6 capture helper function signatures |
| `UsePageErrorReturn` | interface | extends `CaptureHelpers` + `{ state, error, retry, dismiss, reset }` |

### 3.2 Hook — `src/hooks/usePageError.ts`

```typescript
function usePageError(): UsePageErrorReturn
```

Returns:
- `state: PageErrorState` — current state machine state
- `error: PageError | null` — normalized error object (null when idle/success)
- `retry: () => void` — triggers retry using stored `retryFn`
- `dismiss: () => void` — clears error, returns to idle
- `reset: () => void` — clears error, returns to idle
- `captureNetworkError(input?, options?)` — captures with category='network'
- `captureServerError(input?, options?)` — captures with category='server'
- `captureUnknownError(input?, options?)` — captures with category='unknown'
- `captureValidationError(input?, options?)` — captures with category='validation'
- `captureAuthenticationError(input?, options?)` — captures with category='authentication'
- `captureAuthorizationError(input?, options?)` — captures with category='authorization'

### 3.3 Components — via `AntigravityUI` barrel

**ErrorContainer** (`src/components/common/ErrorContainer.tsx`):
```tsx
<ErrorContainer category="network" severity="critical" variant="page">
  <H2>Connection Lost</H2>
  <Body>Please check your internet.</Body>
  <RetryButton onRetry={retry} loading={state === 'retrying'} />
</ErrorContainer>
```

Props: `children`, `category?` (ErrorCategory), `severity?` (ErrorSeverity), `icon?` (LucideIcon), `variant?` (ErrorContainerVariant), `className?`

**RetryButton** (`src/components/common/RetryButton.tsx`):
```tsx
<RetryButton onRetry={handleRetry} loading={isLoading} label="Try Again" />
```

Props: `onRetry`, `loading?`, `disabled?`, `label?`, `className?`

---

## 4. Capture Helper Usage Guidelines

| Scenario | Helper | Example |
|----------|--------|---------|
| `fetch()` failure, network error, offline | `captureNetworkError` | `captureNetworkError(err, { retryFn: loadData })` |
| API returns 5xx, server-side error | `captureServerError` | `captureServerError(err, { retryFn: submitForm })` |
| Auth mutation fails (login, verify, update) | `captureServerError` | `captureServerError(err, { retryFn: handleVerify })` |
| 401 session expired | `captureAuthenticationError` | `captureAuthenticationError(err)` |
| 403 forbidden | `captureAuthorizationError` | `captureAuthorizationError(err)` |
| Form validation failure | `captureValidationError` | Not used at page level (toasts handle these) |
| Unclassified error | `captureUnknownError` | `captureUnknownError(err, { retryFn: reload })` |

**Rules:**
- Pages never pass `category` or `code` in options — helpers pre-fill these
- Pages always provide `retryFn` for retryable errors
- Pages may override `severity` or `fallbackMessage` when needed
- `captureNetworkError` is used for data-fetching operations (GET)
- `captureServerError` is used for mutations/launch operations (POST, server actions)

---

## 5. Business State vs Error State Guidelines

### Business States (NEVER use ErrorContainer)

These are expected application states, not errors:

| State | Correct Component | Example |
|-------|------------------|---------|
| No data available | `EmptyState` | "No Exams", "No History", "No Leaderboard" |
| Access restricted | `ErrorState` (SharedComponents) | "Educator Portal Locked" |
| Selection placeholder | Custom / `EmptyState` | "Select a Subject", "Select a Paper" |
| Validation feedback | `Badge` / `Toast` | Password strength, "Not enough questions" |
| Loading | `LoadingSkeleton` / `GridSkeleton` | Any data loading state |

### Error States (USE ErrorContainer)

These are unexpected failures:

| State | Correct Component | Example |
|-------|------------------|---------|
| Network failure | `ErrorContainer` + `RetryButton` | "Connection Lost" |
| Server error | `ErrorContainer` + `RetryButton` | "Server Error" |
| Session expired | `ErrorContainer` + `RetryButton` | "Session Expired" |
| Unknown failure | `ErrorContainer` + `RetryButton` | "Unexpected Error" |

---

## 6. Retry Pattern

Every retryable error follows this pattern:

```tsx
// 1. Capture error with retry function
captureNetworkError(err, { retryFn: () => loadData(true) })

// 2. Render error UI
if (errorState === 'error' && pageError) {
  return (
    <ErrorContainer category={pageError.category} severity={pageError.severity}>
      <H2>{pageError.title}</H2>
      <Body>{pageError.message}</Body>
      {pageError.retryable && (
        <RetryButton onRetry={retry} loading={errorState === 'retrying'} />
      )}
    </ErrorContainer>
  )
}
```

**State machine:**
```
idle → [capture called] → error → [retry called] → retrying → [retryFn succeeds] → success
                                                                                     ↓
                                                          [retryFn fails] ← ← ← ← ←
```

**Rules:**
- Pages never implement manual retry counters
- Pages never manage retry state manually
- `retryFn` is stored in a ref and called by `usePageError`
- `reset()` clears error state back to idle

---

## 7. Accessibility Requirements

Enforced by the foundation (not by individual pages):

| Requirement | Implementation |
|-------------|---------------|
| Screen reader announcement | `role="alert"` on ErrorContainer root div |
| Live region | `aria-live="assertive"` on ErrorContainer |
| Retry button accessible name | `aria-label` on RetryButton: "Retrying…" (loading) or label text |
| Retry button disabled state | `disabled` prop during loading |
| Focus management | RetryButton receives focus via normal tab order |
| Keyboard navigation | RetryButton is a native `<button>` via Button component |

---

## 8. Future Extension Points

| Extension | Current State | How to Extend |
|-----------|--------------|---------------|
| `variant="inline"` | Renders same as `page` | Add layout logic to `VARIANT_CLASSES` |
| `variant="banner"` | Renders same as `page` | Add layout logic to `VARIANT_CLASSES` |
| `variant="modal"` | Renders same as `page` | Add layout logic + modal wrapper |
| `fingerprint` field | Defined in `PageError`, not populated | Add fingerprint generation in `normalizeError` |
| Toast integration | Not connected | Add `useToast` consumption in `usePageError` or page-level |
| Analytics reporting | Not connected | Add subscriber pattern in `usePageError` |
| Sub-view error boundaries | Not migrated | Wrap lazy-loaded views with ErrorContainer |

---

## 9. Explicit Non-Goals

The Error Experience System deliberately does NOT:

- **Replace business-state UI** — EmptyState, validation badges, selection placeholders are untouched
- **Integrate with toast system** — Toasts remain a separate concern for inline/validation feedback
- **Provide error boundaries** — React error boundaries are a separate concern (not part of this subsystem)
- **Handle authentication flow** — Login/signup flows are outside User Panel scope
- **Modify repositories or services** — The subsystem is purely a presentation-layer concern
- **Provide analytics** — Error reporting/monitoring is a future concern
- **Replace console.error** — Debug logging continues alongside capture helpers

---

## 10. Repository Rules

1. **Never create page-local error systems.** All error handling goes through `usePageError()`.
2. **Never bypass `usePageError()`.** No manual `useState` for error state.
3. **Never manually normalize network/server errors.** Use `captureNetworkError` / `captureServerError`.
4. **Never replace business-state UI with ErrorContainer.** "No Data" is not an error.
5. **Never duplicate retry logic.** Retry is managed by `usePageError` via `retryFn`.
6. **Never modify frozen public APIs** without a dedicated architecture review.
7. **Pages never choose error categories.** Capture helpers pre-fill category and code.
8. **Every retryable error must provide `retryFn`.** Without it, the RetryButton has no action.
9. **`ErrorContainer` renders `role="alert"` + `aria-live="assertive"`.** Never suppress these.
10. **Sub-views inherit parent error state.** Child components do not create their own `usePageError`.
