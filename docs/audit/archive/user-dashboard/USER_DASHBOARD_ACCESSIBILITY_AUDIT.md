# USER DASHBOARD ACCESSIBILITY AUDIT

> Phase 6.XA — Accessibility/UX certification of `/dashboard`. Coverage: contrast, keyboard, focus, aria, screen readers. READ-ONLY.

## 1. Page Structure & Landmarks

- **No `<h1>`** — page title only via `useDocumentTitle` (`App.tsx:71`). Heading tree begins at `H2` in `WelcomeBanner.tsx:81`. **WCAG 1.3.1 / best-practice heading order violation.** → USR-ARCH-01.

## 2. Keyboard Navigation & Focus

| Element | Focusable | Visible focus | Note |
|---|---|---|---|
| `PrimaryButton` "Launch" | YES (native) | YES (FOCUS_RING) | OK |
| `Button` "Analytics" / "Start an Exam" / "Try Again" | YES | YES (FOCUS_RING) | OK |
| Attempt cards (`role="button" tabIndex=0`) | YES | **NO visible ring** | `AttemptCardBase.tsx:32,35` adds `tabIndex`/`role` but Card adds no `FOCUS_RING`; Space+Enter keydown handled at `:13-18`. |
| Banner | static | n/a | |

**USR-A11Y-01 — Attempt cards lack a visible focus indicator.** Card is a keyboard-focusable, interactive `role="button"` without a focus ring. **WCAG 2.4.7.** Severity: **Medium**, Confidence High. Recommendation: FIX — apply `FOCUS_RING` to the Card class (or an `Outline` fallback). Effort 15 min.

## 3. ARIA & Screen Readers

- Attempt card `aria-label` is rich (exam + paper + score + accuracy + "view full review") — **GOOD** (`:37`).
- `ErrorContainer` sets `role="alert" aria-live="assertive"` — GOOD.
- `EmptyState` sets emoji with `role="img" aria-label` — the emoji `📊` (USR-ICON-01) is announced as a role-img — acceptable, though a lucide icon would be cleaner for SR.
- Loading skeletons: `StatSkeleton`/`LoadingSkeleton` render `role="status"`? — `Skeleton` type `card` sets `role="status"`; the text-mode bars do **not** set a live region. When stats/activity load and swap to content there is no assertive announcement → minor POOR.

**USR-A11Y-02 — Loading is silent.** Neither load path signals `aria-busy`/live region; the previous render disappears and content swaps without SR feedback. Severity: **Medium**, Confidence: Medium. Recommend `role="status"`/`aria-live="polite"` around the loading/skeleton container. Effort 30 min.

## 4. Contrast (VERIFY)

- Banner tagline uses `text-warning/60` over the darker forest gradient (`WelcomeBanner.tsx:94`). Amber at 60% on `#0A1E12`-ish surface is < `text-warning` full — likely fails **WCAG AA** for large/body text.
- **USR-A11Y-03 — banner tagline/subtitle contrast risk.** Severity Medium, Confidence Low–Med (needs pixel measurement). Recommendation: use `text-warning` (full) or `text-warning/90` and re-verify. Effort 30 min.

## 5. Responsive / Zoom

- Grids collapse 4→2→1 correctly; banner uses viewport `clamp` — responsive by construction. No horizontal overflow risk observed in code.

## Summary of findings
- **USR-A11Y-01** (Medium) Attempt-card visible focus. — FIX
- **USR-A11Y-02** (Medium) Loading not announced. — FIX
- **USR-A11Y-03** (Medium) Banner contrast risk. — VERIFY/FIX
- **USR-ARCH-01** (Medium) No H1 — see page audit.