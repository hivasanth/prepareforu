# USER DASHBOARD VISUAL AUDIT

> Phase 6.XA — Visual/system audit of `/dashboard`. READ-ONLY. Evidence-backed; companion to `USER_DASHBOARD_PAGE_AUDIT.md`.

## Typography

| Element | Rendered | Certified? | Ref |
|---|---|---|---|
| Greeting name | H2 (section-title) | PARTIAL — H2 not H1/page-title | `WelcomeBanner.tsx:81` |
| Name font | `clamp(26px,4.5vw,36px)` font-black | **NO** — bespoke arbitrary | `:81` |
| Tagline | Body italic warning/90 15px | MIXED | `:84` |
| Stats label | `text-[9px] lg:text-[11px]` uppercase tracking | StatCard-owned (certified) | `StatCard.tsx:184` |
| Stat value | `--text-stat-value` tier (StatCard) | YES | `StatCard.tsx:192` |
| Card value (attempts) | `text-[14px]/[18px]/[20px]` raw | NO — below stat tier | `AttemptCardBase.tsx:63,70,76` |
| Labels / Pts | `Label` role | YES | `AttemptCardBase.tsx:69,77` |

## Color System

| Element | Token | OK? |
|---|---|---|
| Banner gradient | `var(--forest-900)` Layer-1 | **NO** — USR-FND-01 |
| Banner border/overlay | `.ancient-card-dark`, hero jpg | **NO** — USR-FND-02 |
| Stat statuses | `text-primary/warning/info/secondary` semantic | YES |
| Success accuracy | `text-success` | YES |
| Warnings | `text-warning/60` on dark banner | VERIFY contrast (see ACCESS) |

## Buttons

| Button | Variant | Notes |
|---|---|---|
| "Analytics" | `Button variant="soft"` + glyph `→` | glyph ≠ lucide (USR-BTN-01) |
| "Launch Practice Session" | `PrimaryButton` | certified |
| "Start an Exam", "Try Again" | Foundation `Button` | certified |

## Icons

- lucide everywhere (Flame, GraduationCap, Target, Trophy, TrendingUp, ChevronRight).
- **USR-ICON-01:** EmptyState uses emoji `📊` — not lucide.

## Hover Language

- StatCard hover = `bg-hover-bg/40` + certified shadow (OK).
- AttemptCard hover uses `shadow-card-premium` + `group-hover` color swap → **USR-HV-01** (deviates from 5.4E hover rule).

## Motion

- `transition-interaction duration-fast ease-standard` (AntigravityMotion) on cards — OK.
- Reduced motion handled globally (`index.css:1114` `prefers-reduced-motion`).

## Responsive

- Stats `Grid cols=2 lg=4` → `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` — good.
- Activity `Grid cols=1 sm=2 lg=3` — good.
- Banner `min-h-[200px]`, overlay `bg-contain` — check mobile cropping (see screenshot when available).

## Findings referenced (details in PAGE/PAGE audits)
- **USR-FND-01** (High) Layer-1 color input.
- **USR-FND-02** (Medium) custom banner surface.
- **USR-TYPO-01** (Medium) raw font sizes in AttemptCardBase.
- **USR-TYPO-02** (Medium) banner clamp fonts.
- **USR-HV-01** (Medium) hover deviation.
- **USR-ICON-01**, **USR-BTN-01** (Low) icon language.
- **USR-LOAD-01** (Low) skeleton count mismatch.
- **USR-ARCH-01** (Medium) no H1.

## Screenshots
- Representative view (light + dark) currently not captured; validation should include mobile 320px banner crop and stat-card text sizes.