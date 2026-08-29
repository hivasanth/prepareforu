# Loading Language Specification

**Status:** ✅ **APPROVED** (2026-08-06 — Phase 5.4F, D-171 planning / D-172 implementation)
**Parent audit:** `FOUNDATION_LOADING_AUDIT.md`
**Builds on:** DS-018 Motion language (`--duration-*`/`--ease-*`), DS-016 Typography, the certified
Surface language (incl. D-144 Management Surface), and the ONE `Spinner` component.

---

## 1. Purpose

Define the **ONE** loading language — spinner, overlay, timing, and color — so every loading
indicator (inline buttons, full-surface overlays, page-load fallbacks, upload progress) speaks the
same grammar. One spinner. One overlay. One timing language (the certified Motion tokens). One color
language (certified tokens — zero amber/gold/warm).

---

## 2. Components

### 2.1 `Spinner` — the ONE inline spinner

`src/components/common/Spinner.tsx` is the single owner of spinning-loading appearance.

| Prop | Values |
|---|---|
| `size` | `sm` (16px), `md` (32px), `lg` (48px) |
| `variant` | `primary` — `border-primary/20 border-t-primary` (default); `current` — `border-current border-t-transparent` (inherits the text/foreground color, e.g. inside buttons) |
| `className` | passthrough only |

Contract:
- `role="status"` + `aria-label="Loading"` always.
- Motion = `animate-spin` (the ONE spinner motion).
- Colors = accent token (`--color-accent`) or `currentColor` — never a hardcoded hex, never gold.
- Consumers never inline their own `animate-spin` ring. Button/Pill/TestConfigView spinner hacks
  (`className="border-current border-t-transparent"`) were migrated to `variant="current"` in 5.4F.

### 2.2 `LoadingOverlay` — the ONE overlay

`src/components/common/SharedComponents.tsx` `LoadingOverlay` is the single owner of full-surface /
inline loading-overlay rendering. Built on `Spinner` + the certified Motion tokens.

| Prop | Values | Effect |
|---|---|---|
| `fullScreen` | `true` (default) | `fixed inset-0 z-[100] bg-app-bg overflow-hidden` overlay |
| `ambient` | `false` (default) | adds the two decorative certified-accent pulses (`bg-primary/10` + `bg-secondary/10`) |
| `message` | string | optional caption under the spinner (`text-text-secondary`) |
| `ariaLabel` | string (default `Loading`) | `aria-label` on the `role="status" aria-live="polite"` container |

Contract:
- Container = `role="status" aria-live="polite"`, `transition-interaction duration-very-slow
  ease-standard` (the ONE overlay fade — Motion language).
- Ambient stagger uses `[animation-delay:var(--duration-very-slow)]` — token-based, never `delay-*`.
- `fullScreen={false}` renders the inline variant (spinner + optional caption) used by page
  fallbacks (e.g. `PremiumLoader` inside a route wrapper). No background when inline.

**Deprecated aliases (5.4G deletion candidates):**
- `PremiumLoader` → thin wrapper over `<LoadingOverlay fullScreen={false} message="Loading" />`
  (was the gold duplicate spinner — LG-1). `App.tsx` consumer unchanged.
- `Loader` → thin wrapper over `<Spinner size="lg" />` (was the unstyled book loader — LG-2).
  `AuthContext`/`Guards` consumers unchanged (out of scope, 5.4G rewires them).

### 2.3 The ONE timing language

Every loading transition/animation uses the certified Motion tokens (DS-018):

| Motion | Token |
|---|---|
| Overlay fade | `transition-interaction duration-very-slow ease-standard` (500ms / standard) |
| Progress-ring sweep | `stroke-dashoffset var(--duration-normal) var(--ease-standard)` (200ms / standard) |
| Spinner spin | `animate-spin` (the ONE spinner keyframe) |
| Pulse | `animate-pulse` (the ONE pulse keyframe, shared with skeletons) |

Raw durations (`0.4s`, `delay-700`, …) are prohibited in the loading language (LG-3/LG-4 closed in
5.4F). `prefers-reduced-motion` is honored by the global 0.01ms block (`index.css:1114`).

### 2.4 The ONE color language

| Element | Token |
|---|---|
| Overlay background | `bg-app-bg` (`--bg-app`) full-screen / `bg-card-bg/95 backdrop-blur-md` inline surface overlay |
| Ambient blobs | `bg-primary/10`, `bg-secondary/10` (certified accents) |
| Spinner | `border-primary/20 border-t-primary` or `border-current border-t-transparent` |
| Caption text | `text-text-secondary` (DS-016 secondary) |
| Progress ring | `text-border-subtle` track + `text-primary` fill |

Zero amber/gold/warm in the loading language. `#d4af37`/`#2c4c3b`/`#f4ebd8`/`--premium-green`
removed (LG-1).

---

## 3. Rules

1. **One spinner:** every inline loading indicator renders through `Spinner`. No duplicate rings,
   no inline `animate-spin`.
2. **One overlay:** every full-surface loading state renders through `LoadingOverlay`. `LoadingScreen`
   is a thin wrapper (ambient + message) so its page consumer (`AuthCallbackPage`) is untouched.
3. **One timing:** every loading transition uses the certified Motion tokens. No raw durations.
4. **One color:** certified tokens only. No gold, no warm hex, no `--premium-green`.
5. **A11y:** every loading surface carries `role="status"` (`aria-live="polite"`); progress carries
   `role="progressbar"` + `aria-valuenow/min/max`. Spinner is `aria-label="Loading"`.
6. **Reduced motion:** the global `prefers-reduced-motion` block neutralizes all loading animation.

---

## 4. Adoption map (5.4F state)

| Surface | Loading used | Status |
|---|---|---|
| Buttons / Pills / TestConfig launch | `Spinner size="sm" variant="current"` | ✅ ONE spinner |
| Exam pages | `Spinner lg` + message (`ExamPageLoading`) | ✅ ONE spinner |
| Auth callback page | `LoadingScreen` → `LoadingOverlay` (ambient) | ✅ ONE overlay |
| Route lazy fallback (`App.tsx`) | `PremiumLoader` → `LoadingOverlay` (inline) | ✅ ONE overlay |
| Boot guards (`AuthContext`/`Guards`) | `Loader` → `Spinner lg` | ✅ ONE spinner |
| Upload progress | `UploadProgressOverlay` (tokenized sweep) | ✅ ONE timing |
| Sidebar/sub-admin pages (out of scope) | `Spinner md` | ✅ ONE spinner |

---

## 5. Issue list (LG-*) — resolution

| ID | Issue | Resolution |
|---|---|---|
| LG-1 | Duplicate gold spinner (`PremiumLoader`) + hardcoded warm hex | 5.4F: internals → `LoadingOverlay`; zero gold; consumer untouched |
| LG-2 | Dead/unstyled duplicate loader (`Loader`, book markup, no CSS) | 5.4F: internals → `Spinner lg`; role/aria restored; consumers untouched |
| LG-3 | Raw `0.4s ease` in the progress ring | 5.4F: → `var(--duration-normal) var(--ease-standard)` |
| LG-4 | Raw `delay-700` ambient stagger | 5.4F: → `[animation-delay:var(--duration-very-slow)]` |
| LG-5 | Overlay not explicitly owned | 5.4F: `LoadingOverlay` promoted as the ONE overlay; `LoadingScreen` delegates |

---

## 6. Frozen (DS-019)

- `Spinner` (variants `primary`/`current`) — the single inline spinner.
- `LoadingOverlay` — the single overlay.
- Loading timing = certified Motion tokens only; loading color = certified tokens only (zero gold).
- `animate-spin` / `animate-pulse` — the two certified loading keyframes.
