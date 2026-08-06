# Admin Users — U-20 Overlay Family Audit (Phase 3.5 · Page 1 of 11)

**Gate:** U-20 (Overlay Family) — approved per-item P2 gate (2026-08-02)
**Status:** ✅ AUDIT COMPLETE — **No Foundation evolution required**
**Page:** `Admin Users` — `/admin/users`
**Method:** implementation evidence only (code reads + DS-007 runtime audit test); no assumptions.

---

## Step 1 — Overlay audit (every overlay used by this page)

| Overlay | Foundation Component | Owner | Status |
|---|---|---|---|
| ConfirmModal (activate/deactivate user) | `AdminModal` (`src/components/common/AdminModal.tsx`, frozen Phase 2A.8 / DS-007) | Foundation | ✅ certified overlay |
| Toast (`ToastContainer` via `useAdminUsers`) | none — L13 unowned globally (`useToast.tsx:41-62`) | **no Foundation owner (global gap)** | ⚠ known global gap (SURFACE_IMPLEMENTATION_PLAN P1-4) — page owns nothing |
| FilterSelect dropdown (status filter, `UsersToolbar.tsx:61`) | `PremiumSelect`/`Menu` (frozen Phase 3.2.2 / DS-008A) | Foundation | ✅ certified dropdown |

Evidence: `AdminUsers.tsx:41` renders `<ConfirmModal>` with content props only; `AdminUsers.tsx:13` renders `<ToastContainer toasts={h.toasts} />` (presentation fully in the hook's container); `UsersToolbar.tsx:61` composes `FilterSelect` (Menu-family). The page never constructs an overlay shell, backdrop, or portal.

---

## Step 2 — ConfirmModal overlay ownership

Chain: **AdminUsers page → `ConfirmModal` (`SharedComponents.tsx:168-207`) → `AdminModal` (`AdminModal.tsx`)**.

| Owner | Attribute | Evidence |
|---|---|---|
| Foundation component | `AdminModal` (frozen, v1.0) | `AdminModal.tsx:22`; freeze register Phase 2A.8 / DS-007 |
| Surface owner | `AdminModal` | `bg-card-bg` + `ancient-overlay` (light material `--surface-floating`/`--border-subtle`/`--elevation-4`, `index.css:965`) + `border-border-subtle` (`AdminModal.tsx:82`) |
| Motion owner | `AdminModal` | `animate-in` = `fadeIn 0.2s ease-out forwards` (`index.css:651-653`, `@keyframes fadeIn :576`) |
| Focus management owner | `AdminModal` | `FocusTrap` from `focus-trap-react` (`AdminModal.tsx:72`, `escapeDeactivates:false`, `initialFocus:false`) |
| Keyboard owner | `AdminModal` | `document.addEventListener('keydown', …)` Escape → `onClose` (`AdminModal.tsx:42-50`) |
| Accessibility owner | `AdminModal` | `role="dialog"` `aria-modal="true"` `aria-labelledby` `aria-describedby` (`AdminModal.tsx:76`); close button `aria-label="Close modal"` |
| Z-index owner | `AdminModal` | `z-50` on the fixed dialog container (`AdminModal.tsx:76`) |
| Backdrop owner | `AdminModal` | `bg-app-bg/60 backdrop-blur-md` + `onClick={onClose}` (`AdminModal.tsx:77-80`) |
| Focus restoration | `AdminModal` | remembers `document.activeElement` on open, restores on close (`AdminModal.tsx:54-64`) |

`ConfirmModal` owns **none** of these — it maps `open→isOpen`, `onCancel→onClose`, composes certified `Button` variants (secondary/danger/primary) in the `footer` slot, and renders the message paragraph (`SharedComponents.tsx:174-205`). The page owns only the confirm content/state (`AdminUsers.tsx:41-49`).

---

## Step 3 — Repository consumers

### `AdminModal` (Foundation shell) — 13 consumers

| Consumer | Shared Overlay | Notes |
|---|---|---|
| `ConfirmModal` (`SharedComponents.tsx:177`) | full | composition layer |
| `PromptEditorModal.tsx:72` | full | |
| `SingleQuestionModal.tsx:181` | full | |
| `BulkUploadModal.tsx:56` | full | |
| `AdminSubAdminsView.tsx:178` | full | |
| `AdminTopics.tsx:109,206` | full | ×2 |
| `LoginPage.tsx:387` | full | |
| `StudentDetailModal.tsx:32` | full | |
| `SubmitExamModal.tsx:28,50` | full | ×2 |
| `ExamDetailModal.tsx:251` | full | |
| `TeacherLeaderboardModal.tsx:61` | full | |
| `SuccessModal.tsx:22` | full | |
| `ds007-runtime-audit.test.tsx` | contract | runtime ownership tests |

### `ConfirmModal` — 11 consumers (each already delegates to `AdminModal`)

`AdminUsers.tsx:41`, `AdminSubAdminsView.tsx:241`, `BulkUploadPanel.tsx:135`, `SidebarLayout.tsx:313`, `AccountDisabledPage.tsx:67`, `SessionSection.tsx:35`, `AdminQuestions.tsx:138`, `AdminTopics.tsx:241`, `SignupPage.tsx:535`, `VerifyEmailPage.tsx:251`, `TopicInfoButton.tsx:122`.

**Any change to the overlay shell affects the repository-wide modal family (13+11 consumers), not one page.**

---

## Step 4 — Overlay comparison vs certified Foundation overlay language

`ConfirmModal` via `AdminModal`:

| Attribute | ConfirmModal today | Certification | Classification |
|---|---|---|---|
| Backdrop | `bg-app-bg/60 backdrop-blur-md` | token + certified alpha + blur, owned by AdminModal | ✅ Certified |
| Surface | `bg-card-bg` (+ `.light .ancient-overlay`) | certified card surface + legacy-documented overlay material | ✅ Certified |
| Border | `border-border-subtle` | certified token | ✅ Certified |
| Radius | `sm:rounded-[2.5rem]` | literal inside AdminModal — known L11 ⚠ (un-tokenized), Foundation-owned | ⚠ Foundation tokenization gap (not page-owned) |
| Elevation / Shadow | `shadow-2xl` | literal inside AdminModal — known L11 ⚠ | ⚠ Foundation tokenization gap (not page-owned) |
| Animation | `animate-in` (fadeIn 0.2s) | registered class + keyframes | ✅ Certified |
| Focus trap | `FocusTrap` | Foundation-owned | ✅ Certified |
| Escape handling | `keydown` Escape → onClose | Foundation-owned, tested | ✅ Certified |
| Scroll locking | modal body `overflow-y-auto`; **no body scroll lock** | Foundation-owned behavior (not page-owned) | ⚠ Foundation enhancement opportunity (not required) |
| Layer ordering | `z-50` | certified stack (below toast `z-[99999]`) | ✅ Certified |

**No `❌ Page-owned implementation` exists on this page.** The only ⚠ items are Foundation-internal (L11 radius/shadow tokenization = planned P1-2; body-scroll lock = optional enhancement) and are not page violations.

---

## Step 5 — Foundation decision

1. **Can ConfirmModal continue using the current AdminModal?** → **YES.** AdminModal is frozen, tested (DS-007), and is the single overlay owner for the modal layer (L11/L12).
2. **Does AdminModal already satisfy Overlay ownership?** → **YES** — surface, motion, focus management, keyboard, accessibility, z-index, and backdrop are all AdminModal-owned (Step 2).
3. **Is a new Overlay variant actually required?** → **NO.** The page owns no overlay visuals; nothing can be "corrected" by a variant because nothing is wrong on the page.
4. **Would another page benefit from the same evolution?** → The only potential refinements (radius/shadow tokenization, body-scroll lock) benefit **all** AdminModal consumers — but they are Foundation tokenization/behavior items already tracked (P1-2, planned), require their own approval gate, and are **not** triggered by this page's U-20.

### Implementation rule gate

> Only evolve the Overlay Foundation if **all** of: (a) current implementation violates Foundation ownership; (b) improvement benefits multiple consumers; (c) page cannot be corrected by reusing an existing certified Foundation component.

| Condition | Result |
|---|---|
| (a) violates Foundation ownership | ❌ **false** — AdminModal owns everything |
| (b) benefits multiple consumers | n/a (a) fails |
| (c) page cannot be corrected by reuse | ❌ **false** — reuse already in effect |

→ **Rule fails ⇒ NO evolution. STOP. Certify the existing implementation.**

**Permanent policy (Reuse → Refine → Create):** **Reuse** satisfies U-20. No Refine, no Create.

---

## Verification (no code change — reconfirmed clean baseline)

- `npx tsc -b` → ✅ exit 0
- `npm run build` → ✅ exit 0 (pre-existing chunk notices only)
- `npm run lint` → ✅ 405 problems (352E/53W) = frozen baseline; zero new findings
- DS-007 runtime audit (`src/ds007-runtime-audit.test.tsx`, 21 tests) → present and code-reviewed; the runner currently fails to load in this environment (`ERR_REQUIRE_ESM` from `@asamuzakjp/css-color`) — a pre-existing toolchain issue, unrelated to U-20 (zero code changed)

## Deliverables

- Visual comparison: `docs/certification/ADMIN_USERS_U20_VISUAL_COMPARISON.md`
- Certification: `docs/certification/ADMIN_USERS_U20_CERTIFICATION.md`
- Implementation report: **not created** (no code change — per gate: "only if code changes")
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-128)
