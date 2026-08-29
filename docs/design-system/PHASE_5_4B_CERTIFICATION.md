# Phase 5.4B — Button Language: Certification

- **Phase:** 5.4B (Button Language) — Foundation evolution
- **Type:** Certification gate (user-accepted, per D-164 approval protocol)
- **Date prepared:** 2026-08-06
- **Status:** ⏳ **AWAITING USER CERTIFICATION**

---

## 1. What is being certified

That the Button Language is the **one button language** of the application:

1. **Roles, not materials** — the role→variant map is the canonical contract
   (`FOUNDATION_GOVERNANCE.md` v1.22.0 §2); pages choose intent, Foundation chooses material.
2. **Color** — token-only; zero palette classes; status colors through
   `--color-success`/`--danger`/`--color-accent`/`--button-*`.
3. **Elevation** — all button shadows on the certified 5.4A ladder (E0/E1/E2, sanctioned
   `--elevation-1` subtle); no free-form shadows, no new values.
4. **Hover / focus / disabled / loading** — canonical recipes verified; no `transition-all`;
   global `:focus-visible` + `IconButton focusRing`; `getDisabledCls` + `Spinner` on both components.
5. **Consistency** — global sweep (161 usages / 71 files) found 4 material overrides, documented
   and deferred to 5.4G. **No consumer file was edited in 5.4B.**

## 2. Evidence summary

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (36.72s, pre-existing warnings only) |
| `npx eslint .` | ✅ exactly 397 problems (344/53) — baseline, 0 new |
| Compiled CSS artifacts | ✅ `:focus-visible`, `shadow-elevation-0..3`, `--button-*`, `--material-button-primary-shadow`, `--management-shadow`, `--elevation-0..3` all present |
| Palette / hex / `transition-all` in button source | ✅ 0 matches |
| Elevation ladder mapping | ✅ all buttons on E0/E1/E2; no new values |
| B-5 sweep | ✅ 161 usages; 4 findings → 5.4G (documented) |
| Dark mode | ✅ byte-identical (no theme value touched) |
| Manual visual checks M1–M6 | ⏳ to be confirmed by user (light/dark/focus/disabled/loading/hover) |

Full detail: `PHASE_5_4B_VISUAL_VERIFICATION.md`, `PHASE_5_4B_IMPLEMENTATION_REPORT.md`.

## 3. What this certification does NOT cover

- Typography (5.4C), hover language outside buttons (5.4E), motion (5.4D), pills (5.4F) — future gates.
- The 4 B-5 material findings (sub-admin create flow ×3, `BulkActionBar` Cancel) — **5.4G**
  repository migration, separately gated.

## 4. Certification decision

> By certifying Phase 5.4B, I confirm the Button Language is the canonical button language and the
> implementation is complete per the approved plan, with zero production-code change, no regressions,
> and no open items inside 5.4B scope.

- [ ] **CERTIFY — Phase 5.4B CLOSED** (5.4B removed from freeze register; next gate is 5.4C
      Typography, requires separate approval)
- [ ] **REQUEST CHANGES** (reasons + items to address; 5.4B remains OPEN)

**Certified by:** ____________ **Date:** ____________
