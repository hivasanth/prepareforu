# Phase 5.4A - Surface Language & Elevation: Visual Verification

- **Phase:** 5.4A
- **Status:** Complete (verification evidence below; screenshots not stored in repo — before/after descriptions provided per prior convention) — **ACCEPTED by user 2026-08-06** (light relight verified; dark mode byte-identical)
- **Date:** 2026-08-06

---

## 1. Verification matrix

| Theme | Management surfaces (WS-2 relight) | Elevation (WS-3) | Surface ladder (WS-1) |
|---|---|---|---|
| **Dark** | **byte-identical** — dark management block is `var()`-mapped (`--bg-surface`/`--bg-elevated`/`--bg-active`), backing values unchanged (`#1F2937`/`#374151`/`#374151`); compiled CSS confirms no dark literal changed | additive `--elevation-0:none` only; no consumer → **no render change** | tokens unchanged → **no render change** |
| **Light** | 3 values relight: `#FFFFFF`→`#FCFCFD`, `#F8FAFC`→`#F6F8FA`, `#F1F5F9`→`#EDF1F5` — brighter, cleaner, modern, neutral; NOT white/parchment/amber/yellow/cream/brown | additive; no consumer → **no render change** | tokens unchanged → **no render change** |

---

## 2. Before / After per change

### WS-2 — Management relight (light mode only)

Reference surface: Admin Users management pages (Users table, toolbars, `CollectionCard` management rows).

| Token | Before | After | Perceived delta |
|---|---|---|---|
| `--management-surface` | `#FFFFFF` | `#FCFCFD` | pure white → near-white cool slate; one step away from the `--bg-app` canvas so the page surface reads as a distinct layer; kills the "plain white app" feel |
| `--management-surface-muted` | `#F8FAFC` | `#F6F8FA` | cleaner cool slate; keeps a visible step below the page surface (still L3 vs L1) |
| `--management-surface-hover` | `#F1F5F9` | `#EDF1F5` | brighter modern cool hover; one step below muted — hover remains a distinct, slightly deeper fill |

Borders (`--management-border` `#E2E8F0`, `--management-border-strong` `#CBD5E1`), shadows, active (`var(--bg-accent-subtle)`) and accent (`var(--color-accent)`) **unchanged**. No warm/gold/amber appears anywhere in the management namespace.

**Explicit non-targets (must NOT have changed, confirmed unchanged):** white `#FFFFFF` (page surface premium family, untouched), parchment/cream `#FBFAF7`-family, amber/yellow, and all dark-mode surfaces.

### WS-3 — Elevation ladder

`--elevation-0: none` added to both scopes + `--shadow-elevation-0` registered. Zero consumers exist yet → **no visible change anywhere**. The canonical E0-E3 map is now available for later consumer adoption:

| Level | Name | Canonical shadow |
|---|---|---|
| E0 | Flat | `--elevation-0: none` |
| E1 | Card / default | `--elevation-2` (`--card-shadow`, `--management-shadow`) |
| E2 | Hover / raised | `--elevation-3` (`--card-hover-shadow`, `--management-shadow-hover`) |
| E3 | Modal / floating | `--elevation-4` |

### WS-1 — Surface hierarchy

Documentation-only canonicalization. All 7 ladder levels already resolved to existing tokens (verified in `themes.css`), so **no visual change**. The certified ladder is now the single reference: any surface must map to L0–L6.

---

## 3. Verification evidence

| Check | Evidence |
|---|---|
| Build | `npm run build` exit 0 (tsc -b clean; only pre-existing warnings) |
| Compiled CSS relight | `--management-surface:#fcfcfd`, `--management-surface-muted:#f6f8fa`, `--management-surface-hover:#edf1f5` present in `dist/assets/index-*.css` |
| Compiled CSS dark scope | dark `:root` still `--management-surface:var(--bg-surface)` etc.; backing `--bg-surface:#1f2937`, `--bg-elevated:#374151`, `--bg-active:#374151` — original dark values, unchanged |
| Compiled CSS elevation | `--elevation-0:none` in both scopes; `--shadow-elevation-0:var(--elevation-0)` registered |
| Scope | new hex values exist ONLY in `themes.css:944-946`; `elevation-0` ONLY in `themes.css:261/499` + `index.css:97` — no component/page file touched |
| Lint baseline | `npx eslint .` = 397 problems (344 E + 53 W), exact pre-existing baseline, 0 introduced |
| Audit baseline | `vitest.audit.config.ts` unchanged scope (ds003/ds005/ds014 drift pre-existing, documented in `FOUNDATION_VISUAL_CERTIFICATION.md`) |
| Contrast | all relight pairs ≥ AA (spec §4.2) |

---

## 4. Manual verification checklist (post-approval, no screenshots in repo)

- [ ] Light: Admin Users pages render the brighter neutral management surface (`#FCFCFD`) — no white, no amber/gold tint
- [ ] Light: nested/toolbar management containers read `#F6F8FA` (L3 step) and hover fills `#EDF1F5`
- [ ] Light: premium (non-management) pages unchanged (still `#FFFFFF` page surface)
- [ ] Dark: full pass — byte-identical, no visible change anywhere
- [ ] Both: no elevation or shadow visual change (E0 additive, zero consumers)
