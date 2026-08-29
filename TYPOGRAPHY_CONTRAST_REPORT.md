# Typography Contrast Report

**Phase 5.4C — Typography Language (planning / audit only)**
**Status:** ⏳ AUDIT ONLY — no code changes; contrast findings are inputs to a render-affecting decision that is gated separately.
**Date:** 2026-08-06
**Role:** Lead Foundation Architect
**12-part structure:** this file carries **Part 6 (Accessibility Audit)** and **Part 7 (Contrast Audit)**.
**Method:** WCAG 2.1 relative-luminance ratios computed exactly (to 2dp) from the resolved token hex values in `themes.css` (dark `:root` lines 196-221, light `.light` lines 428-455). Surfaces = the certified 5.4A ladder: dark app `#111827` / surface `#1F2937` / elevated `#374151`; light canvas `#F8FAFC` / surface `#FFFFFF` / elevated `#F1F5F9`. AA = 4.5:1 normal text, 3:1 large (≥18.66px bold / ≥24px), 7:1 AAA.

---

## Part 6 — Accessibility Audit

### 6.1 Neutral text ladder — Dark theme

| Token | Value | on app `#111827` | on surface `#1F2937` | on elevated `#374151` | AA (small) |
|---|---|---|---|---|---|
| `--text-primary` | `#F9FAFB` | 16.98 ✅ AAA | 14.05 ✅ AAA | 9.86 ✅ AAA | PASS all |
| `--text-title` | `#F9FAFB` (=primary) | 16.98 ✅ | 14.05 ✅ | 9.86 ✅ | PASS all |
| `--text-secondary` | `#D1D5DB` | 12.04 ✅ AAA | 9.96 ✅ AAA | 7.00 ✅ AAA | PASS all |
| `--text-muted` | `#9CA3AF` | 6.99 ✅ AA | 5.78 ✅ AA | **4.06 ⚠** | **FAIL on elevated** |
| `--text-hint` | `#6B7280` | **3.67 ❌** | **3.04 ❌** | **2.13 ❌** | **FAIL everywhere** |
| `--text-disabled` | `#9CA3AF` | 6.99 (decorative) | 5.78 (decorative) | 4.06 (decorative) | exempt |
| `--text-link` | `#3B82F6` | 4.82 ✅ AA | **3.99 ❌** | **2.80 ❌** | **FAIL surface/elevated** |
| `--text-nav-active` | `#3B82F6` (=accent) | 4.82 ✅ AA | **3.99 ❌** | **2.80 ❌** | **FAIL surface/elevated** |

### 6.2 Neutral text ladder — Light theme

| Token | Value | on canvas `#F8FAFC` | on surface `#FFFFFF` | on elevated `#F1F5F9` | AA (small) |
|---|---|---|---|---|---|
| `--text-primary` | `#111827` | 16.96 ✅ AAA | 17.74 ✅ AAA | 16.19 ✅ AAA | PASS all |
| `--text-title` | `#111827` (=primary) | 16.96 ✅ | 17.74 ✅ | 16.19 ✅ | PASS all |
| `--text-secondary` | `#4B5563` | 7.22 ✅ AAA | 7.56 ✅ AAA | 6.90 ✅ AA | PASS all |
| `--text-muted` | `#6B7280` | 4.62 ✅ AA | 4.83 ✅ AA | **4.41 ⚠** | **FAIL on elevated** |
| `--text-hint` | `#9CA3AF` | **2.43 ❌** | **2.54 ❌** | **2.32 ❌** | **FAIL everywhere** |
| `--text-disabled` | `#9CA3AF` | 2.43 (decorative) | 2.54 (decorative) | 2.32 (decorative) | exempt for inactive controls |
| `--text-link` | `#166534` | 6.81 ✅ AA | 7.13 ✅ AAA | 6.51 ✅ AA | PASS all |
| `--text-nav-active` | `#166534` (=accent) | 6.81 ✅ | 7.13 ✅ | 6.51 ✅ | PASS all |

### 6.3 On-accent / on-danger / on-dark (foreground fills)

| Pair | Value | Ratio | Verdict |
|---|---|---|---|
| Light `--text-on-accent` on accent `#166534` | `#FFFFFF` | 7.13 | ✅ AAA |
| Light `--text-on-danger` on danger `#DC2626` | `#FFFFFF` | 4.83 | ✅ AA |
| Dark `--text-on-accent` on accent `#3B82F6` | `#FFFFFF` | **3.68** | ⚠ large/bold only (≥3:1); **FAIL small text** |
| Dark `--text-on-danger` on danger `#F87171` | `#FFFFFF` | **2.77** | ❌ **FAIL (even large)** |
| `--text-on-dark` (both themes) | `#F9FAFB` on fixed-dark | ≈14:1 on `#111827` | ✅ AAA |

### 6.4 Status colors as body text

| Token | Light on white | Light on canvas | Dark on app | Dark on surface | Verdict for small text |
|---|---|---|---|---|---|
| `--color-success` | `#16A34A` 3.30 | 3.15 | `#22C55E` 7.79 | 6.44 | **FAIL light** / PASS dark |
| `--color-warning` | `#D97706` 3.19 | 3.04 | `#FBBF24` 10.63 | 8.79 | **FAIL light** / PASS dark |
| `--color-danger` | `#DC2626` 4.83 | 4.62 | `#F87171` 6.41 | 5.31 | PASS both |

### 6.5 Placeholder / disabled light-mode issue

`--placeholder-color` light = `#9CA3AF` (= light `--text-hint` / `--text-disabled`): **2.43:1 on canvas, 2.54:1 on white** — fails WCAG 1.4.3 (placeholder text is subject content, not exempt). Dark `--placeholder-color` resolves to `--text-muted` `#9CA3AF` = 5.78:1 on surface ✅.

### 6.6 Micro-size note

All micro sizes (7-13px) are **small text** under WCAG (below the 18.66px bold / 24px large-text thresholds). Therefore:
- 10px label / 11px caption / 9px badge carry the **full 4.5:1 requirement** on their surface — so `--text-hint` at 7-9px (DiagramRenderer:352/413, LeaderboardUserCard:18) compounds the §6.1 failure.
- Contrast classes: `Label` (10px/700) must sit on `--text-secondary` (≥7:1 target); `Caption` (11px/500) on `--text-muted` (≥4.5); `Badge` (9px/700) never on `--text-hint`/`--text-muted`-on-elevated.

---

## Part 7 — Contrast Audit (findings and decisions)

| ID | Finding | Severity | Direction (render-affecting, gated separately) |
|---|---|---|---|
| X-1 | `--text-hint` **fails AA on every surface in both themes** (2.13–3.67:1) yet is consumed as content 14× (`text-text-hint`). | **High** | (a) raise value to a passing neutral (shifts the hint ladder), or (b) keep token, ban it from content roles (C-1 remap). Own decision. |
| X-2 | `--text-muted` fails on elevated in both themes (dark 4.06 / light 4.41). | Medium | use `--text-secondary` on elevated surfaces (T-2 of prior audit, unchanged). |
| X-3 | Dark `--text-link` fails on surface (3.99) and elevated (2.80). Links are small text in dense tables. | High | raise dark link value (render-affecting) or render links in `--text-secondary` + underline in tables. |
| X-4 | Dark `--text-on-accent` = 3.68 (small-text fail), dark `--text-on-danger` = 2.77 (fail). White-on-blue/white-on-rose buttons fail AA for normal text. | High | dark accent/danger need darker fills or bold/large-only usage (5.4B button contract review). |
| X-5 | Light placeholder `#9CA3AF` = 2.43:1 — WCAG 1.4.3 failure for placeholder content. | Medium | light `--placeholder-color` raised (or placeholder styled `--text-muted`). |
| X-6 | Light status colors as body text fail AA (success 3.30 / warning 3.19). | Medium | status colors restricted to status roles; content uses neutral ladder (V-7/C-2). |
| X-7 | Nav-active = accent fails on dark surface (3.99). | Low | dark nav active state uses a lighter accent for text or a fill indicator. |

**Contrast contract for the language spec (§3):** pass pair set = primary/title/secondary everywhere (AAA on most), muted on canvas/surface (AA), link light (AA/AAA), on-accent light (AAA), on-danger light (AA), status dark (AA). Non-passing pairs are explicitly gated in the approved-surface table and must be resolved before certification.

---

*End of Typography Contrast Report. No code changes are authorized by this document.*
