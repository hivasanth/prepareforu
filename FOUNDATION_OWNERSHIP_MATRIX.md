# FOUNDATION OWNERSHIP MATRIX — Permanent Architectural Contract

- **Phase:** 5.5 (Foundation Visual Consistency Certification Audit — READ-ONLY)
- **Status:** PERMANENT architectural reference (Phase 5.5 deliverable, D-173)
- **Authority:** Canonical source of truth for WHO owns WHAT in the Foundation. Every future
  component, wrapper, migration, or evolution must conform to this matrix. Any change that creates
  a second owner for a listed responsibility is an architectural defect (governance Rule 2 —
  Ownership First).
- **Certification status of owned languages:** Surface ✅ · Elevation ✅ · Button ✅ · Typography ✅ ·
  Pill & Badge ✅ · Hover & Motion ✅ · Skeleton & Loading ✅ (per the Phase 5.5 directive;
  5.4A–5.4F user-certified).

---

## 1. How to read this matrix

- **Owner** = the single file/primitive (or token namespace) that holds the responsibility.
- **Allowed** = what the owner MAY control; **Forbidden** = what the owner may NEVER do (it belongs
  to another owner).
- **Wrappers** = thin components that only set defaults / geometry / backward compatibility. They
  MUST contain almost no logic and MUST NOT re-render visuals.
- **Consumers** = the certified callers that compose the owner (not exhaustive).

---

## 2. Language / concern ownership (one owner per concern)

| Concern | Owner | Evidence |
|---|---|---|
| Typography language | `Typography.tsx` (18 roles) | roles → `--text-*`/`--lh-*`/`--fw-*`/`--ls-*`/`--tt-*` + neutral text ladder |
| Surface language | `Card` + `--surface-*`/`--card-*`/`--management-*`/`--bg-*` namespaces | WS-1 L0–L6 hierarchy; D-144 management family |
| Elevation language | `--elevation-*` ladder (E0–E4 + surface/raised aliases) | WS-3; used by Card/Button/Menu/Modal/PremiumIconContainer |
| Button language | `AntigravityButton.tsx` (Button/PrimaryButton/IconButton) | semantic variants + ONE interaction model (D-165) |
| Pill & Badge language | `Pill.tsx` (12 roles, 9 variants, 4 sizes, 6 states) | D-168; every badge is a Pill wrapper |
| Skeleton language | `Skeleton.tsx` (variant premium/management, type text/card) | D-172; `--skeleton-*` tokens |
| Loading indicator language | `Spinner.tsx` + `LoadingOverlay` | D-172; `role="status"` announcements |
| Motion (timing/easing) language | `AntigravityMotion.ts` + `--duration-*`/`--ease-*` tokens | D-169/D-170; CSS `@theme` + JS mirror |
| Hover/Interaction language | `transition-interaction` + `FOCUS_RING` + brightness/`--elevation-*` recipe | D-170; no lift/scale/translate |
| Focus language | `FOCUS_RING` (buttons/rows/menus/pills) + `focus:border-*` (input roles) | 47 FOCUS_RING usages; input border-focus contract |
| Color semantics | `--text-*`/`--color-*`/`--bg-*`/`--management-*`/`--skeleton-*` (token namespaces only) | zero amber/parchment; gold = certified accent (D-141) |
| Accessibility language | owned per-component (roles/aria) + Foundation conventions | see §7 |

---

## 3. Component ownership matrix (the permanent contract)

### 3.1 Typography (DS-016)

| | |
|---|---|
| **Owner** | `src/components/common/Typography.tsx` |
| **Responsibilities** | font family, weight, size, line-height, letter-spacing, text-transform, neutral text color (title/primary/secondary/muted/hint/disabled), semantic colors (link/on-accent/on-danger/success/warning/danger/info), semantic heading tag per role |
| **Allowed** | `role`/`as`/`color`/`weight`/`variant`/`className`/`style`; renders ANY of the 18 certified roles |
| **Forbidden** | margins, padding, layout, card/panel surfaces, button chrome, borders, backgrounds (except the certified `variant="cinzel"` gradient via `BrandTitle`), defining new type outside the token scale |
| **Consumers** | H1/H2/H3/Body/Label/Display/Caption, AdminText, Pill text layer, StatusBadge/CounterBadge/FilterPill/SelectionPill/NavigationPill text, form labels |
| **Dependencies** | `--text-*`, `--lh-*`, `--fw-*`, `--ls-*`, `--tt-*`, `--weight-*`, `--text-*` color ladder |
| **Wrappers** | `AntigravityTypography.tsx` (H1/H2/H3/Body/Label/Display/Caption), `AdminText.tsx` — thin, render-identical |
| **Replacement history** | Pre-5.4C: separate per-role primitives → 5.4C: ONE `Typography` + wrappers (D-167) |
| **Certification / Status** | 5.4C (Typography) ✅ · PERMANENT |

### 3.2 Surface (Card) (DS-001 / WS-1 / D-144)

| | |
|---|---|
| **Owner** | `src/components/common/AntigravityCard.tsx` (`Card`) + surface token namespaces |
| **Responsibilities** | surface material (elevated/default/subtle/premium/premium-neutral/premium-dark-neutral/auth-light/management), radius, border, padding map, `--surface-*` hierarchy L0–L6, `GOLD_SURFACE`/`PREMIUM_SURFACE`/`MANAGEMENT_SURFACE` exported recipes |
| **Allowed** | card container visual language; hover = brightness + `--elevation-*` refinement (no lift) |
| **Forbidden** | typography scale, button chrome, pills/badges, layout of page, data-grid chrome |
| **Consumers** | CollectionCard (delegates all surfaces via `VARIANT_MAP`), StatCard, feature pages |
| **Dependencies** | `--bg-*`, `--card-*`, `--border-*`, `--elevation-*`, `--management-*`, `--shadow-*` |
| **Wrappers** | none (Card is the primitive; CollectionCard composes it) |
| **Replacement history** | DS-001 certified; 5.4A added WS-1 hierarchy + WS-2 relight; D-144 added management family |
| **Certification / Status** | 5.4A (Surface) ✅ · PERMANENT |

### 3.3 Elevation (WS-3)

| | |
|---|---|
| **Owner** | `--elevation-0/1/2/3/4` + `--elevation-surface/raised` (dark + light) in `themes.css` |
| **Responsibilities** | the ONE elevation ladder; every shadow consumers use |
| **Allowed** | E0–E4 + semantic aliases |
| **Forbidden** | raw inline shadow recipes (except the certified `--shadow-*`/`--management-shadow-*` token aliases); any hover shadow outside the ladder |
| **Consumers** | Card, Button, IconButton, Menu, AdminModal, PremiumIconContainer, Checkbox, Switch, ProgressBar |
| **Dependencies** | none (root tokens) |
| **Wrappers** | none |
| **Certification / Status** | 5.4A (Elevation) ✅ · PERMANENT |

### 3.4 Button (DS-002 / D-165)

| | |
|---|---|
| **Owner** | `src/components/common/AntigravityButton.tsx` (`Button`, `PrimaryButton`, `IconButton`) |
| **Responsibilities** | the button visual language: variant surfaces (primary/secondary/success/danger/soft/ghost + `management`), sizes xs–xl, radius, focus ring, disabled/loading language, loading → certified `Spinner`, pressed = brightness dim, ONE transition set |
| **Allowed** | `variant`/`size`/`fullWidth`/`loading`/`disabled`/`management`; hover brightness + `--elevation-*` shadow |
| **Forbidden** | whileHover/whileTap scale (empty `BUTTON_HOVER`/`BUTTON_TAP` document the no-scale contract); typography scale (uses `--text-*`); pill/badge roles |
| **Consumers** | pages, ConfirmModal, ErrorState, forms, toolbars, Auth flows |
| **Dependencies** | `--button-*`, `--material-button-*`, `--elevation-*`, `Spinner`, `TRANSITION_INTERACTION`, `FOCUS_RING` |
| **Wrappers** | `PrimaryButton` (defaults only); `RetryButton`/`StartTestButton`/`ErrorActionButtons` compose Button |
| **Replacement history** | 5.4B added semantic roles + ONE interaction model (D-165) |
| **Certification / Status** | 5.4B (Button) ✅ · PERMANENT |

### 3.5 Pill & Badge (DS-005 / D-168)

| | |
|---|---|
| **Owner** | `src/components/common/Pill.tsx` |
| **Responsibilities** | the whole pill/badge visual language: radius, padding, type scale (XS/SM/MD/LG), semantic colors, states (default/selected/active/inactive/disabled/loading), hover/pressed/focus, `aria-*`, interactive `<button>` rendering, text layer via Typography `badge` role |
| **Allowed** | `role`/`variant`/`size`/`state`/`as`/`inline`/`icon`/`pulse`/`disabled`/`loading`/`onClick`/`ariaLabel`/`ariaPressed`/`ariaCurrent`/`title` |
| **Forbidden** | defining its own type (must use Typography); new color material outside the semantic set; scaling/lifting hover |
| **Consumers** | Badge, DifficultyBadge, TagBadge, StatusBadge, CounterBadge, FilterPill, SelectionPill, NavigationPill |
| **Dependencies** | `--color-*`/`--border-*`/`--management-*`, Typography, Spinner, `TRANSITION_INTERACTION`, `FOCUS_RING` |
| **Wrappers** | all 8 above — thin (role + defaults + aria only) |
| **Replacement history** | pre-5.4D: per-role badge renderers → 5.4D: ONE Pill + role wrappers (D-168) |
| **Certification / Status** | 5.4D (Pill & Badge) ✅ · PERMANENT |

### 3.6 Skeleton (D-172)

| | |
|---|---|
| **Owner** | `src/components/common/Skeleton.tsx` |
| **Responsibilities** | the ONE skeleton renderer: surface/block colors (premium = `--skeleton-*`; management = `--management-*`), radius, `animate-pulse`, a11y (`role="status"` + `aria-label`), text/card types |
| **Allowed** | `variant`/`type`/`lines`/`height`/`width`/`borderRadius`/`className`/`ariaLabel`/`children` |
| **Forbidden** | gold/amber/warm placeholder material; raw timing (must use DS-018 tokens); second skeleton engine anywhere |
| **Consumers** | LoadingSkeleton, GridSkeleton, StatSkeleton, PortalLoadingSkeleton, CollectionCard loading, StatCard loading, ExamDetailModal, QuestionsTable, AdminSubAdminsView |
| **Dependencies** | `--skeleton-*`, `--management-*`, `animate-pulse` |
| **Wrappers** | `LoadingSkeleton`/`GridSkeleton`/`StatSkeleton` (SharedComponents.tsx) — geometry/convenience only |
| **Replacement history** | pre-5.4F: hand-rolled pulses + gold skeleton material → 5.4F: ONE primitive + wrappers (D-172) |
| **Certification / Status** | 5.4F (Skeleton) ✅ · PERMANENT |

### 3.7 Spinner (DS-005)

| | |
|---|---|
| **Owner** | `src/components/common/Spinner.tsx` |
| **Responsibilities** | the ONLY loading spinner: sizes sm/md/lg, variants primary/current, `role="status"` + `aria-label="Loading"`, `animate-spin` |
| **Allowed** | `size`/`variant`/`className` |
| **Forbidden** | inline `border-current border-t-transparent` hacks (use `variant="current"`); raw animation timing |
| **Consumers** | Button, IconButton, Pill, Loader, LoadingOverlay, ExamPageLoading, StartTestButton, UploadProgressOverlay |
| **Dependencies** | `animate-spin`, DS-018 tokens |
| **Wrappers** | none |
| **Certification / Status** | 5.4F (Loading) ✅ · PERMANENT |

### 3.8 LoadingOverlay / Loaders (D-172)

| | |
|---|---|
| **Owner** | `LoadingOverlay` (SharedComponents.tsx) |
| **Responsibilities** | the ONLY loading overlay: full-screen/inline, ambient, message, `role="status" aria-live="polite"`, fade + ambient stagger via DS-018 tokens |
| **Allowed** | `fullScreen`/`ambient`/`message`/`ariaLabel` |
| **Forbidden** | gold material; raw `delay-*`; duplicate overlay renderers |
| **Consumers** | LoadingScreen (full-screen+ambient), PremiumLoader (inline), Loader (→ `Spinner lg`); App/AuthContext/Guards/AuthCallbackPage unchanged |
| **Dependencies** | Spinner, `transition-interaction`, `--duration-very-slow` |
| **Wrappers** | `LoadingScreen`, `PremiumLoader`, `Loader` — delegate internally |
| **Certification / Status** | 5.4F (Loading) ✅ · PERMANENT |

### 3.9 Hover / Motion / Interaction (D-169/D-170)

| | |
|---|---|
| **Owner** | `src/components/common/AntigravityMotion.ts` (JS) + `--duration-*`/`--ease-*` (CSS) |
| **Responsibilities** | all durations (fast 150/normal 200/slow 300/very-slow 500ms), easings (standard/enter/exit/emphasized), framer presets (PAGE/SECTION/MENU/SELECT_POPUP/MODAL/TAB_SPRING), `TRANSITION_INTERACTION`, `FOCUS_RING`, `CURSOR_NOT_ALLOWED`, `BUTTON_HOVER`/`BUTTON_TAP` (no-scale contract) |
| **Allowed** | the ONLY source of motion numbers in `src/` |
| **Forbidden** | inline durations/easings, `transition-all`, arbitrary `duration-*`, hover scale/translate lift |
| **Consumers** | ~all interactive components (Button, IconButton, Pill, Card, Menu, Modal, Tabs, Form controls, Pagination, Navigation, PreviewTab, …) |
| **Dependencies** | `index.css` `@theme` registrations + `themes.css` `:root` tokens |
| **Wrappers** | none |
| **Replacement history** | 5.4E tokenized all motion (D-170) |
| **Certification / Status** | 5.4E (Hover & Motion) ✅ · PERMANENT |

### 3.10 Input / Form controls (DS-003)

| | |
|---|---|
| **Owner** | `src/components/common/AntigravityForm.tsx` (`Input`, `TextArea`, `Select`, `Switch`, `Checkbox`, `Radio`, `RadioGroup`) |
| **Responsibilities** | field surface language (`FIELD_SURFACE`/`FIELD_FOCUS`), variants default/compact/management, input focus = border-color, Switch (`role="switch"` + `aria-checked`), Checkbox/Radio (peer-focus ring, `aria-label`), RadioGroup (`role="radiogroup"` segmented pattern) |
| **Allowed** | field chrome, focus border, disabled/loading opacity |
| **Forbidden** | button chrome, card surfaces, pill language, typography scale (labels via Typography `label` role) |
| **Consumers** | all forms (Auth, Admin, Sub-Admin, Profile) |
| **Dependencies** | `--input-*`, `--checkbox-*`, `--radio-*`, `--management-*`, `TRANSITION_INTERACTION` |
| **Wrappers** | none |
| **Certification / Status** | DS-003 · PERMANENT (management variant D-149) |

### 3.11 Modal (DS Admin Modal)

| | |
|---|---|
| **Owner** | `src/components/common/AdminModal.tsx` |
| **Responsibilities** | ONE modal animation (200ms `MODAL_TRANSITION`, same-timing scrim+panel), focus trap (FocusTrap), ESC, focus restore to trigger, `role="dialog"` `aria-modal="true"` + labelled/described-by, premium/management variants |
| **Allowed** | modal chrome, scrim, panel surface, focus behavior |
| **Forbidden** | second modal animation; page-owned modal styling |
| **Consumers** | ConfirmModal, SuccessModal, AddExamModal, ExamDetailModal, PromptEditorModal, QuestionForm, … |
| **Dependencies** | `MODAL_TRANSITION`, Card/Surface tokens, IconButton |
| **Wrappers** | `ConfirmModal` (SharedComponents), `SuccessModal` |
| **Certification / Status** | 5.4E (one modal animation) ✅ · PERMANENT |

### 3.12 Menu / Dropdown (DS-008)

| | |
|---|---|
| **Owner** | `src/components/common/Menu.tsx` (compound: Trigger/Content/Item/Separator) |
| **Responsibilities** | menu/dropdown behavior + panel surface (default/ancient + management), keyboard nav (arrows/Home/End), ESC/outside-click close, `role="menu"`/`menuitem`, `MENU_TRANSITION` |
| **Allowed** | panel chrome, menu behavior, item hover/pressed/focus |
| **Forbidden** | second dropdown system; inline animation |
| **Consumers** | premium select trigger, admin actions, sub-admin menus |
| **Dependencies** | `MENU_TRANSITION`, `FOCUS_RING`, `--surface-floating`/`--management-*` |
| **Wrappers** | none |
| **Certification / Status** | DS-008 · PERMANENT |

### 3.13 Navigation (DS-009)

| | |
|---|---|
| **Owner** | `src/components/common/Navigation.tsx` |
| **Responsibilities** | sidebar/nav language, modes, `NavigationContext`, `useSidebarMode`, nav item states, focus |
| **Allowed** | nav chrome + nav behavior |
| **Forbidden** | page layout outside the nav surface; nav typography outside the `--text-nav-*` tokens |
| **Consumers** | SidebarLayout, all dashboards |
| **Certification / Status** | DS-009 · PERMANENT |

### 3.14 Alert (DS-004)

| | |
|---|---|
| **Owner** | `src/components/common/Alert.tsx` |
| **Responsibilities** | status/error messaging; `role={error ? 'alert' : 'status'}`; semantic colors (info/success/error/warning) |
| **Allowed** | alert surface + text |
| **Forbidden** | toast system (useToast is separate, certified); card surfaces |
| **Certification / Status** | DS-004 · PERMANENT |

### 3.15 Pagination (DS-007)

| | |
|---|---|
| **Owner** | `src/components/common/Pagination.tsx` |
| **Certification / Status** | DS-007 · PERMANENT |

### 3.16 Tabs / Segments

| | |
|---|---|
| **Owner** | `Tabs` (AntigravityData.tsx) + `SegmentedFilter` + `RadioGroup` segmented pattern |
| **Responsibilities** | tab/segment language incl. `TAB_SPRING`; selected/active states |
| **Forbidden** | per-page tab styling |
| **Certification / Status** | 5.4E (TAB_SPRING) ✅ · PERMANENT |

### 3.17 CollectionCard (Phase 3.2 composite)

| | |
|---|---|
| **Owner** | `src/components/common/CollectionCard.tsx` |
| **Responsibilities** | grid/row card composition (leading/header/title/subtitle/metadata/content/footer/actions/trailing), selection highlight, keyboard-activatable card, loading → certified `LoadingSkeleton`; **delegates 100% of surface to `Card`** (`VARIANT_MAP`) |
| **Allowed** | composition slots + content arrangement |
| **Forbidden** | hand-rolled surfaces, hand-rolled skeletons, typography scale |
| **Consumers** | Questions, Exams, Topics, Study Cards, Leaderboard, Students, History, Search |
| **Certification / Status** | Phase 3.2 · PERMANENT |

### 3.18 CollectionToolbar / CollectionFilter / CollectionHeader

| | |
|---|---|
| **Owner** | `AntigravityLayout.tsx` (`CollectionToolbar`, `FilterBar`, `PageContainer`, `Stack`, `Grid`, `SectionHeader`) + `CollectionFilter.tsx` + `CollectionHeader.tsx` |
| **Certification / Status** | Phase 3.2/3.2.4 · PERMANENT |

### 3.19 StatCard / MetricBlock

| | |
|---|---|
| **Owner** | `AntigravityCard.tsx` (`StatCard`), `AntigravityData.tsx` (`MetricBlock`) |
| **Responsibilities** | stat metric card: semantic `status` icon tint (preferred), label/value type, loading → `Skeleton` |
| **Forbidden (forward)** | the legacy raw `color` prop (F-3) — to be retired during 5.6 once consumers use `status` |
| **Certification / Status** | 5.4F (loading → Skeleton) ✅ · PERMANENT |

### 3.20 Avatar / IconBadge / PremiumIconContainer / ProgressBar / DataGrid

| | |
|---|---|
| **Owner** | `Avatar.tsx` (DS-014), `IconBadge.tsx`, `PremiumIconContainer.tsx` (gold accent, D-141), `AntigravityData.tsx` (`ProgressBar` `role="progressbar"` + aria-valuenow/min/max; `DataGrid`) |
| **Certification / Status** | each one owner · PERMANENT |

### 3.21 BrandTitle (documented exception)

| | |
|---|---|
| **Owner** | `AntigravityTypography.tsx` (`BrandTitle`) |
| **Responsibilities** | brand/gradient display title (Cinzel + certified gold gradient clip, D-141). The ONE documented exception to Typography role recipes (arbitrary responsive size + gradient clip). |
| **Status** | DS-006 · PERMANENT · single-purpose, no duplication |

---

## 4. Theme / token ownership

| Namespace | Owner | Purpose |
|---|---|---|
| `--bg-*` / `--surface-*` | themes.css | canvas/surface hierarchy (L0–L6) |
| `--elevation-*` | themes.css | the ONE elevation ladder (E0–E4) |
| `--text-*` / `--lh-*` / `--fw-*` / `--ls-*` / `--tt-*` | themes.css | typography scale |
| `--color-*` | themes.css | semantic status colors |
| `--management-*` | themes.css | neutral Management Surface Family (D-144) |
| `--skeleton-*` | themes.css | the ONLY skeleton tokens (D-172) |
| `--duration-*` / `--ease-*` | themes.css + index.css `@theme` | the ONLY motion tokens (D-169) |
| `--gold-*` / `--premium-*` / `--forest-*` | themes.css | certified gold accent family (D-141) + forest light primary |
| `light:` variant | index.css | light-mode override mechanism (`@custom-variant light`) |

---

## 5. Conclusion

Every Foundation concern has exactly one owner; every reusable component has exactly one owner;
every wrapper is thin (defaults/geometry/back-compat only). This matrix is the permanent contract:
**any future code that takes a responsibility listed here away from its owner is an architectural
defect and must be refused.**
