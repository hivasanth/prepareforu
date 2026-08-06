# Management Surface Risk Assessment

**Phase 3.8 — Repository-Level Design Decision (Foundation Before Migration)**
**Status:** RISK ASSESSMENT ONLY — **no code, token, variant, component, or Foundation changes.**
**Purpose:** Step 8 of the brief — for every proposed change, document Risk / Dependencies / Consumer impact / Freeze impact / Certification impact.
**Related:** `MANAGEMENT_SURFACE_FOUNDATION_ARCHITECTURE.md`, `MANAGEMENT_SURFACE_DECISION_MATRIX.md`, `MANAGEMENT_SURFACE_FOUNDATION_PROPOSAL.md`, `MANAGEMENT_SURFACE_MIGRATION_STRATEGY.md`.

---

## 1. Risk Register (proposed changes)

Legend — likelihood/impact: L / M / H.

| # | Proposed change | Risk | Dependencies | Consumer impact | Freeze impact | Certification impact | Mitigation |
|---|---|---|---|---|---|---|---|
| R-1 | New `--management-*` token namespace (light + dark) | **L/M** — additive token block; risk of value drift between themes | Rule 12 amendment decision; D-series approval | New tokens consumed only by management variants; zero existing consumers | **None** — no existing token touched | New tokens must be verified in both themes (build/type gate) | Value table with light+dark in one place; review by freeze register |
| R-2 | `Card` `management` variant (additive) | **M/M** — new surface on a frozen component | R-1 tokens; DS-001 additive rule; ≥3 consumer evidence | Existing Card variants pixel-identical; management pages opt in via the new variant | **None (additive)** — `variantClasses`/`defaultPaddingMap` entries appended; no existing string mutated | Existing certified pages re-verified zero-diff; new variant added to freeze register | Per-component verification (Light/Dark/Hover/Focus/Disabled/Responsive/A11y/Build/TS); zero-diff re-audit of existing variants |
| R-3 | `CollectionCard` `management` variant | **L/M** — mapping only (delegates to R-2) | R-2 | `premium`/other variants unchanged; management pages opt in | **None (additive)** — `VARIANT_MAP` entry appended | Verified via Users (validation page) | Same verification gate; mapping is one line |
| R-4 | Re-anchor `CollectionToolbar` to management surface | **M/M** — shared by every management page | R-1; toolbar surface tokens | All management pages render neutral in light after their migration phase | **None** — toolbar recipe consumes new tokens; existing recipe untouched until pages flip | Users validation first; toolbar per-page flip gated | One-language rule: flip all management pages within the approved phase window |
| R-5 | Re-anchor `CollectionFilter`/search Input borders | **M/M** — Control-family cross-consumers | R-1; D-121 role tokens (`--filter-*`, `--input-*`) | Control-family borders on management pages become neutral; non-management consumers unchanged | **None** — role tokens already exist; management consumption switches | Filter/Input verified via Users | Token-level re-anchor; no component mutation |
| R-6 | Re-anchor `Button` primary/secondary light materials | **M/M** — Control-family global | R-1; `--button-*` role tokens | Management primary/secondary neutral; Exam/premium Button consumers (if any) unchanged | **None** — `--button-*` light values untouched; management consumes via namespace | Buttons verified on Users (modal Confirm/Cancel, Try Again) | Status-hued buttons (success/danger) explicitly unchanged; verify non-management Button consumers unchanged |
| R-7 | Re-anchor `GridSkeleton`/`EmptyState` (gold `GOLD_SURFACE`) | **L/M** — presentation surface | R-1 | Management loading/empty neutral; premium variants (if any) unchanged | **None** — additive neutral variant alongside `GOLD_SURFACE` | Verified on Users loading/empty states | Additive variant; `GOLD_SURFACE` retained |
| R-8 | Management `SelectionContainer`/Tabs neutral selection | **M/H** — Navigation-family cross-consumers (documented D-121 inheritance) | R-1; Navigation ownership | Selection surfaces on management pages neutral; all other Navigation consumers (sidebar, exam selection) unchanged | **None** — Navigation tokens untouched; management-scoped selection | Selection verified on Users context tabs | **Highest-touch risk** — prefer management-scoped selection surface (not mutating `--selection-surface`); keep gold as active-state accent |
| R-9 | Modal panel / Toast neutral management surface | **L/M** — Overlay family | R-1 | Management dialogs neutral; non-management overlays unchanged | **None** | Verified on Users ConfirmModal | Additive consumption; severity hues (Status) unchanged |
| R-10 | Management Page Standard rule 12 amendment | **M/M** — contract change | New D-series decision; this proposal's approval | Every management page's governing contract changes to Management Surface Family | **None** (docs) | Certification Standard references updated; re-certification of pages under the amended rule | Amendment is textual + gated; pages re-certified per migration phase |

---

## 2. Cross-cutting Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Two management languages during migration** | H — violates the one-language rule; creates divergence | One-language rule is permanent; pages flip only within the approved phase window; no page may flip before Foundation certification |
| **Additive variant proliferation** (parallel "third" dialect) | M — scope creep on the frozen Card | Single-sourced management family; no additional variants without D-series decision |
| **Light/dark drift** | M — neutral light but amber dark (or vice versa) | New namespace has a documented light+dark value table; dark values reuse today's certified neutral values |
| **Frozen-component mutation (accidental)** | H — breaks DS-001 / freeze register | Additive-only rule enforced at review; zero-diff re-audit before/after Foundation phase; verification gate per component |
| **Legacy Ancient tokens persisting in management path** | M — leftover `--card-3d-shadow`, `--border-gold`, `stat-card-surface` classes on pages | Per-page grep checklist in Migration Strategy §3; final repository certification greps zero legacy tokens in management path |
| **Questions divergence** (first Standard implementation flips late in P4) | M — interim inconsistency | Users is the validation page (P3); Questions migrates immediately after in P4 to keep one language |
| **Non-management collateral from `--button-*`/border re-anchoring** | M — Control-family globals | Re-anchor is consumption-level (management pages use new values) — never mutates the tokens; non-management consumers verified unchanged |

---

## 3. Dependency Graph

```
D-series decision (management namespace + variants)
    → R-1 tokens
        → R-2 Card variant
            → R-3 CollectionCard variant
            → R-4/R-5/R-6/R-7/R-8/R-9 consumer re-anchoring
                → P3 Users validation
                    → P4 remaining pages
                        → Repository certification
D-series decision (rule 12 amendment) ──→ (contract in place before R-2..R-9)
```

---

## 4. Freeze-Impact Summary

| Frozen entity | Freeze ID | Impact of this direction | Verdict |
|---|---|---|---|
| `Card` | DS-001 | Additive `management` variant only | **Safe** (new variants allowed; existing renders pixel-identical) |
| `CollectionCard` | v1.1 | Additive `management` variant only | **Safe** (mapping only) |
| `Button` | DS-002 | Consumption-level re-anchor only; no variant/token mutation | **Safe** |
| `CollectionToolbar` / `CollectionFilter` | Phase 3.2.2 / 3.2.4 | Consumption-level token switch; no component mutation | **Safe** |
| `themes.css` token block | — | Additive `--management-*` block only; nothing existing mutated | **Safe** |
| `PREMIUM_LIGHT_OVERRIDES` | DS-001 render | **Never touched** | **Forbidden to mutate** (would require re-audit + explicit approval) |

**Overall freeze impact: LOW** — the entire direction is additive by construction.

---

## 5. Certification-Impact Summary

- Phase 3.7 scores 8/9 (neutral management surfaces; amber-to-accent) are the target this direction fixes; scores 1–7 (skeleton, ownership, spacing, one responsive path) must remain passing.
- Each page re-certifies against the 16-point `MANAGEMENT_PAGE_CERTIFICATION_STANDARD.md` after its migration.
- Final repository certification requires zero Legacy Ancient tokens in the management surface path (light) and gold confined to accents.

---

## 6. Risk Conclusion

The direction carries **low freeze risk** (purely additive) and **moderate operational risk** (coordination of one-language roll-out, Navigation-family selection being the highest-touch item R-8). No risk blocks the architecture decision; every risk has a mitigation already embedded in `MANAGEMENT_SURFACE_MIGRATION_STRATEGY.md`. Nothing in this assessment authorizes implementation.
