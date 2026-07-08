# Frontend Form Conventions

This document captures the shared conventions established during the refactoring of the authentication pages (`LoginPage` and `SignupPage`). All future forms in this application must adhere to these standards to maintain performance, accessibility, and consistency.

## 1. State Management (`react-hook-form` + `zod`)
- Use `react-hook-form` and `zod` for all form state and validation.
- **NEVER** use `useState` for individual field values. `useState` should only be used for UI toggles (e.g., password visibility, loading spinners) or non-form interactive state.
- Always implement a rigorous schema (e.g., `zod` object).
- Use `watch` from `react-hook-form` when you need a reactive value without triggering root re-renders.

## 2. Error Handling & Toasts
- Use the global `useToast` hook for all submission-level errors, API failures, or successful actions.
- Use the inline `error` prop for all field-level validation errors. Do not rely exclusively on toasts for input validation.

## 3. Accessibility & ARIA Attributes
- **Manual ARIA Wiring**: `AntigravityUI`'s `<Input>` component handles rendering but does NOT automatically manage ARIA connections. You must manually wire `aria-describedby` to link the input to its respective error span ID.
  ```tsx
  <Input 
    id="email"
    aria-describedby={errors.email ? "email-error" : undefined}
    {...register("email")}
  />
  {errors.email && <span id="email-error" aria-live="polite">{errors.email.message}</span>}
  ```
- **Dynamic Messaging**: Any container that receives dynamically injected error text or status messages (e.g., coupon validation feedback) must be wrapped with `aria-live="polite"`.
- **Keyboard Access**: Password visibility toggles (and similar interactive icons) must use `tabIndex={0}`, never `-1`.
- **Focus Management**: On form submission failure, explicitly route focus to the first invalid field using `react-hook-form`'s `setFocus()`.

## 4. Post-Auth Routing
- The `getRouteForRole()` utility is the single source of truth for all post-authentication routing logic. Always rely on it to determine where a user should land based on their assigned role (`admin`, `sub_admin`, student, etc.).
- Use `<RouteGuard>` HOCs or router-level loaders (once implemented globally) instead of inline `useEffect` redirects for protecting routes.

## 5. Security & Debouncing
- **Debouncing**: Extract external API calls that fire during typing (like coupon validation) into custom hooks (e.g., `useCouponValidation`). Always utilize `AbortController` to cancel stale requests and implement a strict debounce (e.g., 600ms) to avoid hammering the backend.
