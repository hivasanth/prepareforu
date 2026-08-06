# Foundation Management Surface — Visual Verification

**Phase 3.9 (D-144) — additive Foundation evolution. No page uses these surfaces yet; the state tables below document the **management-dialect** recipes that future management pages will consume.**
**Status:** ✅ VERIFIED (2026-08-03)

> Verification method note: no page consumes the management variants in this phase, so visual state tables document the **recipe → token → value** chain for every management surface (computed from the token definitions in `themes.css` and the class strings in the Foundation components). Dark mode values alias certified dark tokens and are therefore pixel-identical to the certified dark state; light mode values are the new neutral family.

---

## 1. Token value table

| Token | Light | Dark (= certified) |
|---|---|---|
| `--management-surface` | `#FFFFFF` | `#1F2937` (`--bg-surface`) |
| `--management-surface-muted` | `#F8FAFC` | `#374151` (`--bg-elevated`) |
| `--management-surface-hover` | `#F1F5F9` | `--bg-active` |
| `--management-surface-active` | `--bg-accent-subtle` | `--bg-accent-subtle` |
| `--management-border` | `#E2E8F0` | `--border-subtle` |
| `--management-border-strong` | `#CBD5E1` | `--card-border` |
| `--management-border-hover` | `#94A3B8` | `--border-hover` |
| `--management-border-active` | `--color-accent` | `--color-accent` |
| `--management-shadow` | `0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.06)` | `--elevation-2` |
| `--management-shadow-hover` | `0 2px 4px rgba(15,23,42,.06), 0 8px 16px -4px rgba(15,23,42,.10)` | `--elevation-3` |
| `--management-accent` | `--color-accent` | `--color-accent` |

---

## 2. Surface state tables

### 2.1 Card `variant="management"` / CollectionCard `variant="management"`
Recipe: `rounded-2xl` + `MANAGEMENT_SURFACE` + `MANAGEMENT_SURFACE_HOVER`, padding `p-4 md:p-5`.

| State | Light | Dark |
|---|---|---|
| Rest | surface `#FFFFFF`, border `#CBD5E1` 1.8px, shadow soft neutral | surface `#1F2937`, border `--card-border`, shadow `--elevation-2` |
| Hover | `-translate-y-0.5`, shadow `--management-shadow-hover`, border-color transition | same motion; shadow `--elevation-3` |
| Focus | inherited focus ring (component-level; unchanged) | unchanged |
| Disabled | inherited Card disabled handling (unchanged) | unchanged |
| Responsive | padding `p-4 → md:p-5` | unchanged |

Amber present: **none**. Gold present: **none** (no `PREMIUM_LIGHT_OVERRIDES`, no `border-gold`, no `shadow-premium-*`, no `--card-3d-shadow`).

### 2.2 CollectionToolbar `variant="management"`
Recipe: `MANAGEMENT_SURFACE` + `MANAGEMENT_SURFACE_HOVER` (same family as Card; container padding unchanged).

| State | Light | Dark |
|---|---|---|
| Rest | surface `#FFFFFF`, border `#CBD5E1`, neutral shadow | surface `#1F2937`, border `--card-border`, `--elevation-2` |
| Hover | lift + neutral shadow-hover | lift + `--elevation-3` |

### 2.3 Input `variant="management"` (DS-003)
Recipe: `bg-[var(--management-surface)] border border-[var(--management-border)] rounded-xl text-text-primary`, focus `focus:border-[var(--management-accent)]`; excludes `ancient-input`.

| State | Light | Dark |
|---|---|---|
| Rest | surface `#FFFFFF`, border `#E2E8F0`, 1px | surface `#1F2937`, border `--border-subtle` |
| Hover | `--management-border-hover` (#94A3B8) | `--border-hover` |
| Focus | `--management-border-active` = accent | accent |
| Disabled | inherited Input disabled (unchanged) | unchanged |

### 2.4 Button `management` (primary / secondary, DS-002)

| Variant | State | Light | Dark |
|---|---|---|---|
| primary | Rest | `bg-[var(--management-accent)] text-white` + neutral shadow | accent + white |
| primary | Hover | shadow-hover, lift | shadow-hover, lift |
| secondary | Rest | `bg-[var(--management-surface-muted)] text-text-primary border-[1.8px] border-[var(--management-border-strong)]` (#F8FAFC surface, #CBD5E1 border) | `#374151` surface, `--card-border` border |
| secondary | Hover | `bg-[var(--management-surface-hover)]` (#F1F5F9), shadow-hover, `-translate-y-0.5` | `--bg-active`, shadow-hover, lift |

Status-hued `success`/`danger`/`warning` buttons: **unchanged** (Status family, already amber-free).

### 2.5 CollectionFilter `variant="management"` (3.2.4)
Trigger: `bg-[var(--management-surface)] text-text-primary border-[var(--management-border)] hover:border-[var(--management-border-hover)] shadow-[var(--management-shadow)] hover:shadow-[var(--management-shadow-hover)]`; active `bg-[var(--management-surface-active)] text-[var(--management-accent)] border-[var(--management-border-active)]`. Panel: `Menu` management panel.

| State | Light | Dark |
|---|---|---|
| Trigger rest | `#FFFFFF` surface, `#E2E8F0` border | `#1F2937`, `--border-subtle` |
| Trigger hover | border `#94A3B8`, shadow-hover | `--border-hover`, shadow-hover |
| Trigger active/selected | `--bg-accent-subtle` bg, accent text/border | `--bg-accent-subtle`, accent |
| Panel | Menu management panel (§2.9) | same |

### 2.6 LoadingSkeleton / GridSkeleton / EmptyState `variant="management"`
Skeleton blocks: `MANAGEMENT_SKELETON_BLOCK` / neutral surfaces (surface-muted family). Empty state: neutral surface + border + shadow family.

| State | Light | Dark |
|---|---|---|
| Rest | `--management-surface` / `--management-surface-muted` tones | certified dark neutrals |
| Pulse | `animate-pulse` (unchanged motion) | unchanged |

`GOLD_SURFACE` + `shadow-premium-card`/`shadow-premium-carved` **retained** for premium consumers (F7 gate).

### 2.7 AdminModal `variant="management"` (2A.8)
Panel: `bg-[var(--management-surface)]` + `sm:border border-[var(--management-border)]`; **no `ancient-overlay`**. Section borders `border-[var(--management-border)]`; footer `bg-[var(--management-surface)]/95`.

| State | Light | Dark |
|---|---|---|
| Overlay/backdrop | unchanged | unchanged |
| Panel rest | `#FFFFFF`, `#E2E8F0` 1px border | `#1F2937`, `--border-subtle` |
| Focus trap / ESC / restore | unchanged behavior | unchanged |

### 2.8 ToastContainer `variant="management"`
Panel: `bg-[var(--management-surface)]`. Status hue borders (`success`/`danger`/`warning`) and behavior unchanged.

### 2.9 Menu `variant="management"` (DS-009)
Panel: `bg-[var(--management-surface)] border-[var(--management-border)] shadow-[var(--management-shadow)]`; **no `ancient-overlay`**.

| State | Light | Dark |
|---|---|---|
| Panel rest | `#FFFFFF`, `#E2E8F0` border, neutral shadow | `#1F2937`, `--border-subtle`, `--elevation-2` |
| Item hover/focus | inherited `Menu.Item` hover (unchanged) | unchanged |
| Selected item | inherited `selected` styling (`bg-primary/20` tint — premium accent, not gold) | unchanged |
| Keyboard / focus management | unchanged | unchanged |

### 2.10 SelectionContainer `variant="management"` (DS-012 / Navigation family, R-8)
Recipe: `bg-[var(--management-surface)] border-[1.8px] border-[var(--management-border-strong)] shadow-[var(--management-shadow)]`. **Gold removed from the management branch only**; premium branch retains the gold active-state accent. Navigation-family consumers unchanged.

---

## 3. Cross-state a11y notes

- All management surfaces use the existing Foundation focus/interaction behavior (no changes to keyboard, ARIA, focus trap, or screen-reader handling in any frozen component).
- Text colors on management surfaces remain `text-text-primary` / token-driven — no contrast regression (surfaces are `#FFFFFF`/`#1F2937` neutral; text tokens unchanged).
- Selected states use the app accent (`--management-accent` = `--color-accent`), not gold.

---

## 4. Zero-diff statements

| Surface | Statement |
|---|---|
| Card / CollectionCard / Toolbar / Filter / Input / Button / Skeleton / Empty / Modal / Toast / Menu / SelectionContainer | Every **non-management** (default/premium) render is byte-identical to the certified pre-phase state. The only behavioural relocation is `Menu` panel `shadow-elevation-4` moved inside the default branch (same classes, same result). |
| Dark mode (all) | Every management token aliases a certified dark token → **pixel-identical** to the certified dark state. |
| Existing consumers | Zero consumers changed; zero pages migrated (grep gate G3). |

---

## 5. Responsive / interaction coverage

| Check | Result |
|---|---|
| Card responsive padding `p-4 → md:p-5` | ✅ documented |
| Toolbar responsive container (unchanged `p-3 md:p-4` density) | ✅ |
| Modal responsive (`sm:rounded-*`, `sm:max-h-[92vh]`, mobile full-height) | ✅ unchanged |
| Hover states (lift + shadow-hover) on Card/Toolbar/Button/Filter | ✅ |
| Focus states on Input/Button/Filter/Trigger | ✅ |
| Disabled states inherited from frozen components | ✅ |
| Motion (`animate-pulse`, transitions) unchanged | ✅ |

---

## 6. Visual regression evidence

- **Build:** `tsc -b` exit 0 · `vite build` exit 0 (pre-existing warnings only).
- **Compiled CSS:** management utilities present in `dist` (§7.2 of the implementation report).
- **No page render can change:** the management API is opt-in and consumed by zero pages in this phase; all default paths preserved.
- **Grep gate:** zero amber tokens inside any management recipe (`FOUNDATION_MANAGEMENT_SURFACE_IMPLEMENTATION_REPORT.md` §7.3).
