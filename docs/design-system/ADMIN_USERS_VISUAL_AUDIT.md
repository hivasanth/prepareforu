# Admin Users — Visual Audit (Family Classification, CollectionCard, Card, Toolbar, Button, Badge)

**Phase 3.7 — Admin Users Visual Language Audit (Discovery only)**
**Status:** DOCUMENTATION ONLY — no code, token, variant, or Foundation changes.
**Scope:** `src/pages/admin/AdminUsers.tsx` + `src/components/admin/users/**` + every Foundation component the page renders.
**Related:** `ADMIN_USERS_SURFACE_AUDIT.md`, `ADMIN_USERS_COLOR_AUDIT.md`, `ADMIN_USERS_MANAGEMENT_SURFACE_PROPOSAL.md`, `ADMIN_USERS_VISUAL_MIGRATION_PLAN.md`.

---

## 1. Method

Steps 3–8 of the brief: classify every component by visual family, audit CollectionCard, Card,
Toolbar, Button, and Badge, then score the page (Step 10). Every finding is evidence-based
(Component · File · Line · Token · Owner · Consumer). Recommendations are marked either
**Current State** or **Future Proposal (Not Implemented)** — never mixed.

---

## 2. Family Taxonomy (used for classification)

From the brief + `FOUNDATION_VISUAL_FAMILIES.md`:

`Management Surface` (aspirational, does not exist yet) · `Control` · `Navigation` · `Status` ·
`Typography` · `Overlay` · `Legacy Ancient` · `Exam` · `Neutral`

---

## 3. Step 3 — Visual Family Classification

| Component | File:Line | Current family (as built) | Light-mode appearance | Classification | Should Stay / Candidate |
|---|---|---|---|---|---|
| Page canvas | `themes.css:692` | Theme | Legacy Ancient cream | **Legacy Ancient (L)** / Neutral (D) | Candidate for migration |
| PageContainer | `AntigravityLayout.tsx` | Layout | neutral | **Neutral** | Stay |
| Stack / SectionReveal | `AntigravityLayout.tsx` / `AntigravityAnimation.tsx` | Layout/Motion | neutral | **Neutral** | Stay |
| SelectionContainer | `AntigravityLayout.tsx` | Navigation | gold surface + gold border | **Navigation (amber in L)** | Candidate |
| Tabs (exam selection) | `AntigravityData.tsx` | Navigation | gold track/pill (L) | **Navigation (amber in L)** | Candidate |
| CollectionToolbar | `AntigravityLayout.tsx` (frozen 3.2.2) | Surface | parchment + gold | **Legacy Ancient (L)** | Candidate |
| Search Input | `AntigravityForm.tsx` (DS-013) | Control | gold-tint border (L) | **Control (correct family; amber token)** | Candidate (token) |
| CollectionFilter | `CollectionFilter.tsx` (frozen 3.2.4) | Control | parchment + gold border + carved shadow | **Control (amber via Surface tokens)** | Candidate |
| CollectionHeader | `CollectionHeader.tsx` | — | neutral (no surface) | **Neutral** | Stay |
| CollectionCard row | `CollectionCard.tsx` (`UsersTable.tsx:68`) | Surface | parchment + gold | **Legacy Ancient (L)** | Candidate |
| Avatar | `AdminIconWrap.tsx:34` | Icon/Display | ancient gold/forest material | **Legacy Ancient (L)** | Candidate |
| Badge (exam/status) | `Alert.tsx` (Phase 2A.5) | Status | status tints correct; default frame gold-tint | **Status (correct)** | Stay (token note) |
| Row Buttons (success/danger) | `AntigravityButton.tsx:47-50` | Control+Status | green/red status | **Status-hued (outside amber)** | Stay |
| Primary/Secondary Buttons | `AntigravityButton.tsx:37-46` | Control | gold/brown/parchment | **Control (amber in L)** | Candidate |
| GridSkeleton / EmptyState | `SharedComponents.tsx:14-53,126-155` | Surface | gold gradient + gold border | **Legacy Ancient (L)** | Candidate |
| ConfirmModal / AdminModal | `SharedComponents.tsx:170-225` / `AdminModal.tsx` | Overlay | parchment panel + amber buttons | **Overlay (amber in L)** | Candidate |
| Toast | `Toast.tsx` | Overlay+Status | parchment panel; status hues | **Overlay (amber panel in L)** | Candidate |
| Pagination | `Pagination.tsx` | — | neutral | **Neutral** | Stay |
| Alert (error) | `Alert.tsx:17` | Status | danger tint | **Status (correct)** | Stay |
| AdminText / H1 / Label | `AdminText.tsx`, `AntigravityTypography.tsx` | Typography | text tokens | **Typography (correct)** | Stay |

**Classification result:** of the 20 rendered component groups, **9 carry the Legacy Ancient amber
language in light mode** (page canvas, SelectionContainer, Tabs, CollectionToolbar, CollectionFilter,
CollectionCard, Avatar, Skeleton/EmptyState, primary/secondary buttons, modal panel). **5 are
Status/Typography/Layout and correct as-is.** All amber arrives through frozen Foundation surfaces.

---

## 4. Step 4 — CollectionCard Audit

**Question:** does CollectionCard own an Ancient material language, or does it support a neutral
management language?

| Item | Finding |
|---|---|
| Current variant mapping | `premium → premium-dark-neutral` (`CollectionCard.tsx:64`); also `default→default`, `subtle→subtle`, `outlined→default`, `compact→default` |
| Surface language today | Delegates 100% to frozen `Card`. Every mapped Card surface (`default`, `subtle`, `premium-dark-neutral`) applies `PREMIUM_LIGHT_OVERRIDES` (`light:stat-card-surface light:shadow-premium-card`, `AntigravityCard.tsx:25,30,33-34`) → **parchment + gold gradient + carved gold shadow in light**. |
| Does it support neutral management? | **No.** No CollectionCard variant resolves neutral in light mode today. |
| Page usage | `UsersTable.tsx:65-116` — `layout="row" variant="premium" padding={16}`, 3.6D six-column anatomy (`:14-19`) |

**Future Proposal (Not Implemented):**

```
Current      CollectionCard premium → Card premium-dark-neutral → parchment/gold (L)
                ↓
Future       CollectionCard management (additive) → Card management (additive) → neutral (L)
                ↓
Risk         • Additive-only required (Card frozen DS-001 — new variant allowed, mutating existing
                variants forbidden).
              • New neutral light token namespace required (none exists: `--management-*` absent).
              • Must be adopted by ALL management pages at once (Management Page Standard rule 12 —
                one surface language; never two simultaneously).
              • CollectionCard frozen v1.1 — a new variant is a non-breaking additive (allowed by
                freeze rule) but must be introduced in the Foundation phase (P2), not the page phase.
```

---

## 5. Step 5 — Card Audit

| Variant | `AntigravityCard.tsx` | Light | Dark | Classification |
|---|---|---|---|---|
| `default` | `:30` | parchment + gold border + gold overrides | neutral `bg-card-bg` | **Ancient in L / Neutral in D** |
| `elevated` | `:29` | `light:stat-card-surface light:shadow-premium-card light:border-card-premium-border` → amber | neutral | **Ancient in L / Neutral in D** |
| `subtle` | `:31` | `bg-card-bg/60` parchment + `border-border-subtle/30` gold-tint | neutral | **Ancient in L / Neutral in D** |
| `premium` | `:32` | forest `--material-card-premium-surface` (`themes.css:1076`) | forest | **Exam family (both themes)** |
| `premium-neutral` | `:33` | parchment + gold (identical string to `premium-dark-neutral` — L-4 / D-122) | neutral | **Ancient in L / Neutral in D** |
| `premium-dark-neutral` | `:34` | parchment + gold (identical to `premium-neutral`) | neutral | **Ancient in L / Neutral in D** |
| `auth-light` | `:35` | auth surface | auth surface | **Auth family** |

**Finding:** **no Card variant is neutral in light mode** except `premium` (forest, Exam family) and
`auth-light` (auth family). Every management-facing variant (`default`, `elevated`, `subtle`,
`premium-neutral`, `premium-dark-neutral`) renders the Legacy Ancient amber language in light via
`PREMIUM_LIGHT_OVERRIDES`.

**Future Proposal (Not Implemented):** an additive `management` Card variant (neutral light + neutral
dark) sharing the frozen surface recipe family but with a new neutral light token namespace
(`--management-*`), so existing variants stay pixel-identical. See `ADMIN_USERS_MANAGEMENT_SURFACE_PROPOSAL.md`.

---

## 6. Step 6 — Toolbar Audit (CollectionToolbar, Search, Filter, Header, Pagination)

| Component | File | Surface | Amber in L? | Verdict |
|---|---|---|---|---|
| CollectionToolbar | `AntigravityLayout.tsx` (frozen 3.2.2) | premium Card surface (`bg-card-bg` + premium border + card shadow + light overrides) | **Yes** | **Surface family; amber** — the primary toolbar strip. Correctly owned; language is Legacy Ancient |
| Search Input | `AntigravityForm.tsx` (DS-013) | control surface; `--input-border = --border-subtle` | Yes (border token) | **Control family; correct ownership; amber via token** |
| CollectionFilter | `CollectionFilter.tsx` (frozen 3.2.4) | trigger `bg-card-bg` + `shadow-card-shadow` (Surface tokens); panel `bg-card-bg` | **Yes** | **Control (Filter role); documented cross-family inheritance (M-2); amber via Surface tokens** |
| CollectionHeader | `CollectionHeader.tsx` | none (range-only) | No | **Neutral; correct** |
| Pagination | `Pagination.tsx` | none | No | **Neutral; correct** |

**Verdict:** the toolbar layer is **not yet a neutral Control family** — it is a Surface-family amber
strip hosting Control-family children. The Controls inherit amber borders via `--border-subtle` and,
for the filter, via Surface tokens.

---

## 7. Step 7 — Button Audit

| Button (on page) | File:Line | Variant | Light appearance | Color family | Hierarchy | Ownership |
|---|---|---|---|---|---|---|
| Deactivate (row) | `UsersTable.tsx:106` | `danger` | `bg-danger text-white` | Status (red) | row action | Control+Status |
| Activate (row) | `UsersTable.tsx:106` | `success` | `bg-success text-white` | Status (green) | row action | Control+Status |
| Confirm — Deactivate | `SharedComponents.tsx:211` (`AdminUsers.tsx:132`) | `danger` | `bg-danger text-white` | Status (red) | modal confirm | Control+Status |
| Confirm — Activate | `SharedComponents.tsx:211` | `primary` | forest gradient + gold border + brown text (`themes.css:1099-1102`) | **Amber (gold/brown)** | modal confirm | Control |
| Cancel | `SharedComponents.tsx:202` | `secondary` | parchment + gold 1.8px border + carved shadow (`themes.css:1232-1237`) | **Amber** | modal secondary | Control |
| Try Again / Retry | `SharedComponents.tsx:104` (ErrorState) | `primary` | amber primary material | **Amber** | empty/error action | Control |

**Finding:** the **row action buttons are already status-hued and amber-free** (Activate/Deactivate).
The **amber buttons are the modal + empty/error actions** — Cancel (secondary) and Confirm/Try Again
(primary) — which inherit the gold/brown/parchment primary and secondary light materials.

**Future Proposal (Not Implemented):** neutral secondary/primary light materials for the management
Control role (see proposal), while status-hued success/danger buttons stay unchanged.

---

## 8. Step 8 — Badge Audit

| Badge | File:Line | Variant | Family | Cross-family? |
|---|---|---|---|---|
| Status — Active | `UsersTable.tsx:97` | `success` (icon ShieldCheck) | Status | No — correct |
| Status — Banned | `UsersTable.tsx:97` | `danger` (icon ShieldAlert) | Status | No — correct |
| Exam badge | `UsersTable.tsx:79` | `default` | Status container + Surface frame | Border frame uses `--border-subtle` → gold-tint in L (token-level) |

**Finding:** status badges are pure Status family (correct). The exam `default` badge carries a
Surface-family frame whose `--border-subtle` token is gold-tinted in light — a **token-level** amber
leak, not a family violation. Documented alpha inconsistency between Badge/Alert surfaces exists
(FOUNDATION_CROSS_FAMILY_AUDIT X-6) but is out of scope.

---

## 9. Step 10 — Visual Consistency Score

Scored against the **Management Page Standard** (D-133) and the phase brief's amber criterion.
Scale: ✅ Pass / ⚠️ Partial / ❌ Fail.

| # | Criterion | Score | Evidence |
|---|---|---|---|
| 1 | Standard skeleton & hierarchy | ✅ | Full Standard skeleton (D-134 certified) |
| 2 | One surface per owner | ✅ | §4 Surface Audit |
| 3 | No page-owned visuals | ✅ | §1 Color Audit — zero page-owned amber |
| 4 | No nested/wrapper cards | ✅ | Standard §4 |
| 5 | 24/12/8 spacing | ✅ | Standard §7 |
| 6 | One responsive path | ✅ | Single CollectionCard row path |
| 7 | Foundation owns all visuals | ✅ | All amber via Foundation + theme |
| 8 | **Neutral management surfaces (light)** | ❌ | Amber in light via Legacy Ancient tokens (proposal target) |
| 9 | **Amber confined to accents** | ❌ | Amber is the primary management surface language in light |
| 10 | Status/Control families independent | ⚠️ | Status correct; Control borders amber via tokens |

**Priority list (Future Proposal — Not Implemented):**

| Priority | Item |
|---|---|
| **Critical** | No neutral management surface exists in light; the entire card/toolbar/selection family is parchment+gold (Card `PREMIUM_LIGHT_OVERRIDES` + light theme tokens) |
| **High** | Primary/secondary Button light materials are gold/brown/parchment; modal + empty/error actions inherit amber |
| **High** | `--border-subtle` is gold-tinted in light → Input, Checkbox, Badge frame, panel borders amber |
| **Medium** | Skeleton/EmptyState use the gold `GOLD_SURFACE` dialect |
| **Medium** | SelectionContainer/Tabs navigation surfaces are gold in light |
| **Low** | Avatar `ancient-icon-badge` material; legacy `--ancient-*` aliases (documented for removal) |

---

## 10. Summary

- The Users page is a **certified Management Page Standard implementation** (D-134) with perfect
  skeleton/spacing/ownership compliance (scores 1–7 pass).
- It **fails the amber criterion** (scores 8–9): in light mode every management surface renders the
  Legacy Ancient parchment/gold language because the certified premium family **is** that language.
- **None of this is a page defect** — it is inherited from frozen Foundation (`Card` light overrides,
  light theme tokens) and mandated by Management Page Standard rule 12 ("all surfaces belong to the
  certified premium family").
- The neutral Management Surface Family is a **Future Proposal (Not Implemented)** — see
  `ADMIN_USERS_MANAGEMENT_SURFACE_PROPOSAL.md` and `ADMIN_USERS_VISUAL_MIGRATION_PLAN.md`.
