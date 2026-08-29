# FOUNDATION LOADING AUDIT

**Phase:** 5.4F (Skeleton & Loading Language Foundation Evolution)
**Date:** 2026-08-06
**Scope:** `src/components/**` only (Foundation + feature). `src/pages/**`, `src/layouts/**`,
`src/context/**`, `src/guards/**`, theme/token values are out of scope and untouched. Consumers in
`AuthContext.tsx`/`Guards.tsx` and page-level route fallbacks render components but are not edited.

---

## 1. Purpose

Inventory every spinner/overlay/page-loader in the Foundation + feature layer, classify each
against the ONE loading language (approved `SKELETON_LANGUAGE_SPECIFICATION.md` + the new
`LOADING_LANGUAGE_SPECIFICATION.md`), and list the LG-* defects 5.4F must close.

---

## 2. Spinner inventory

| Component | Location | Variants | Consumers | Verdict |
|---|---|---|---|---|
| `Spinner` | `components/common/Spinner.tsx` | `size` sm/md/lg; `variant` primary (`border-primary/20 border-t-primary`); `role="status" aria-label="Loading"` | AntigravityButton (loading), Pill (`border-current` hack), LoadingScreen (lg), ExamPageLoading (lg), TestConfigView (`border-current` hack), ExamDetailSection (`text-primary border-primary/20 border-t-primary` inline), SubAdminDashboard (page, out of scope), SidebarLayout (layout, out of scope) | ✅ **THE ONE spinner** — no duplicate spinner markup anywhere except `PremiumLoader` |
| `PremiumLoader` | `components/PremiumLoader.tsx` | gold ring (`border-t-[#d4af37] border-r-[#d4af37]`), forest core (`bg-[#2c4c3b]`), cream dot (`bg-[#f4ebd8]`), `text-[var(--premium-green)]` label | `App.tsx` `PageLoader` (lazy route Suspense fallback) | ❌ **LG-1** duplicate hand-rolled gold spinner + duplicate `animate-spin` + `animate-pulse`; hardcoded warm hex |

**Inline `animate-spin` sweep:** the only `animate-spin` occurrences in `src/components/**` are
`Spinner.tsx:31` (the ONE spinner) and `PremiumLoader.tsx:10` (the gold duplicate). No other
component inlines `animate-spin`.

---

## 3. Overlay / page-loader inventory

| Component | Location | Material / timing | Used by | Verdict |
|---|---|---|---|---|
| `LoadingScreen` | `components/LoadingScreen.tsx` | full-screen `fixed inset-0 z-[100] bg-app-bg`, `transition-interaction duration-very-slow ease-standard` (5.4E-correct), ambient `bg-primary/10` + `bg-secondary/10` pulses, `Spinner lg` + message | `pages/auth/AuthCallbackPage.tsx` (out of scope) | ✅ token-based overlay; **LG-4** raw `delay-700` stagger on the second ambient blob |
| `Loader` (book loader) | `components/Loader.tsx` | markup `book-loader-container`/`book__pg*` — **CSS classes absent repo-wide** (unstyled dead component) | `context/AuthContext.tsx` `FullLoader`, `guards/Guards.tsx` `GuardLoader` (both out of scope) | ❌ **LG-2** dead/unstyled duplicate; no role, no label, renders nothing visible |
| `UploadProgressOverlay` | `components/admin/questions/UploadProgressOverlay.tsx` | `absolute inset-0 z-50 bg-card-bg/95 backdrop-blur-md`, SVG progress ring, inline `style={{ transition: 'stroke-dashoffset 0.4s ease' }}`, `role="status"` + `role="progressbar"` | admin Upload | ✅ token colors + correct roles; **LG-3** raw `0.4s ease` timing bypasses the Motion language |
| `ExamPageLoading` | `components/exam/ExamPageLoading.tsx` | `PageContainer centered` + `Spinner lg` + message, `role="status" aria-live="polite"` | exam pages | ✅ already the ONE language |

**Page/layout loaders (out of scope, recorded for 5.4G):** `SubAdminDashboard` (page, `Spinner md`),
`SidebarLayout` (layout, `Spinner md`), `AdminOverview` page → `GuardLoader`. These already consume
the ONE `Spinner`; only `PremiumLoader`/`Loader` internals are rewritten in 5.4F.

---

## 4. Color audit (amber/gold/warm in the loading language)

| Material | Location | Warm? |
|---|---|---|
| `border-t-[#d4af37] border-r-[#d4af37]` (gold ring) | `PremiumLoader.tsx:10` | ✅ **LG-1** |
| `bg-[#2c4c3b]` (forest core) + `bg-[#f4ebd8]` (cream dot) | `PremiumLoader.tsx:12-13` | ✅ **LG-1** |
| `text-[var(--premium-green)]` (`--premium-green #2c4c3b`, themes.css:93) | `PremiumLoader.tsx:16` | ✅ **LG-1** |
| Ambient `bg-primary/10` / `bg-secondary/10` | `LoadingScreen.tsx:7-8` | ✗ neutral (certified accent tokens) — keep |

---

## 5. Timing audit (raw durations bypassing the Motion tokens)

| Raw value | Location | Defect |
|---|---|---|
| `0.4s ease` (inline `stroke-dashoffset` transition) | `UploadProgressOverlay.tsx:35` | **LG-3** — must be `var(--duration-normal) var(--ease-standard)` |
| `delay-700` (ambient stagger) | `LoadingScreen.tsx:8` | **LG-4** — must be token-based (`var(--duration-very-slow)`) |
| `animate-spin` (1s Tailwind default) | `Spinner.tsx:31` | ✓ the ONE spinner motion (certified) |
| `animate-pulse` (2s Tailwind default) | LoadingScreen, PremiumLoader, skeletons | ✓ the ONE pulse motion (certified) |

---

## 6. A11y audit

| Component | role/aria | Verdict |
|---|---|---|
| `Spinner` | `role="status" aria-label="Loading"` | ✓ |
| `LoadingScreen` | `role="status" aria-live="polite"` | ✓ |
| `ExamPageLoading` | `role="status" aria-live="polite"` | ✓ |
| `UploadProgressOverlay` | `role="status"` + `role="progressbar"` `aria-valuemin/max/now` | ✓ |
| `PremiumLoader` | `role="status" aria-live="polite" aria-label="Loading"` | ✓ (material wrong, roles right) |
| `Loader` | **none** — renders nothing (unstyled) | ✗ **LG-2** |

---

## 7. Issue list (LG-*)

| ID | Issue | Evidence | Action (5.4F) |
|---|---|---|---|
| LG-1 | **Duplicate hand-rolled gold spinner** (`PremiumLoader`) with hardcoded warm hex + a second `animate-spin` in the repo | `PremiumLoader.tsx`; `App.tsx:58-68` (consumer, untouched) | Rewrite `PremiumLoader` internals to the ONE loading language (`Spinner lg` + token caption via `LoadingOverlay`); zero gold. `App.tsx` consumer unchanged. |
| LG-2 | **Dead/unstyled duplicate loader** (`Loader`, book markup with no CSS anywhere) | `Loader.tsx`; zero `book-loader-container`/`book__pg` hits repo-wide | Rewrite `Loader` internals to the ONE spinner (deprecated alias for the out-of-scope `AuthContext`/`Guards` consumers); role/aria restored. |
| LG-3 | **Raw timing bypasses the Motion language** | `UploadProgressOverlay.tsx:35` `0.4s ease` | Tokenize → `stroke-dashoffset var(--duration-normal) var(--ease-standard)`. |
| LG-4 | **Raw stagger timing** | `LoadingScreen.tsx:8` `delay-700` | Tokenize → `[animation-delay:var(--duration-very-slow)]`. |
| LG-5 | **One overlay, explicitly owned** | `LoadingScreen` + inline boot wrappers | Promote `LoadingOverlay` as the ONE overlay in the family (`SharedComponents`); `LoadingScreen` delegates to it. |

---

## 8. Frozen (confirmed by this audit)

- `Spinner` = the single inline spinner (sizes sm/md/lg, `role="status"`).
- `animate-pulse` = the single pulse motion; `animate-spin` = the single spinner motion.
- The Motion language (`--duration-*`/`--ease-*`) governs every loading transition/overlay timing.
- No shimmer anywhere; zero gold/amber/warm after 5.4F closes LG-1.
