# Admin Users — U-4 Identity Visual Comparison (Phase 3.5 · Page 1 of 11)

**Method:** inspection-based comparison per repo precedent (auth-guarded admin route; no headless
tooling — see `baselines/ADMIN_QUESTIONS_VISUAL_BASELINE.md`). Before = the two duplicated identity
compositions (desktop inline `Stack` block, mobile inline `div` block); after = the single
page-scoped `UserIdentity` composition over the frozen `Avatar` primitive (DS-014).

---

## 1. Attribute-by-attribute comparison

### Desktop identity (AdminUsersView.tsx → `UserIdentity`)

| Attribute | Before (inline block) | After (`<UserIdentity user={u} />`) | Delta |
|---|---|---|---|
| Avatar | `Avatar name/email md circle` | same (inside `UserIdentity`) | none |
| Row arrangement | `Stack direction="row" align="center" gap="sm"` | same (`Stack` row, `gap-sm`) | none |
| Name | `AdminText` garamond `font-bold leading-tight uppercase tracking-tight text-base` | same `AdminText` (carried into `UserIdentity`) | none |
| Name fallback | `{u.full_name \|\| 'Unknown'}` | same — now single location | none |
| Email | `Mail` icon (12px, `aria-hidden`) + `text-xs flex items-center gap-1 text-text-secondary` | same + inner inline `<span>` wrapper + `min-w-0` | **none (visual)** — inline span is invisible; `min-w-0` inert with no width pressure |
| Truncation | none | none (default `truncate=false`) | none |

**Desktop verdict: pixel-identical.** The desktop DOM gains one invisible inline `<span>` around the
email text and layout-neutral `min-w-0` classes; nothing visually observable changes.

### Mobile identity (UserMobileCard.tsx → `UserIdentity`)

| Attribute | Before (raw block) | After (`<UserIdentity user={user} truncate />`) | Delta |
|---|---|---|---|
| Avatar | `Avatar name/email md circle` | same (inside `UserIdentity`) | none |
| Row arrangement | raw `div flex items-center gap-3 min-w-0` | certified `Stack` row `gap-sm` (8px) + `min-w-0` | ✅ **intentional unification** — certified composition primitive; gap 12px → 8px |
| Name | raw `<p>` `font-bold text-sm uppercase tracking-tight truncate text-text-primary` | `AdminText` garamond `text-base` + `truncate` (dark: inherits sans + `text-primary`; light: `font-garamond italic`) | ✅ **accepted U-4 delta** — mobile name joins the canonical desktop look (size 14px → 16px; light mode gains serif italic). The plan's "which look wins?" decision: desktop wins |
| Name fallback | `{user.full_name \|\| 'Unknown'}` | same — now single location | none |
| Email | raw `<p>` `text-xs text-secondary truncate` | `Mail` icon (12px, `aria-hidden`) + `text-xs flex items-center gap-1 text-secondary` + inner `truncate` span | ✅ **intentional unification** — mobile email gains the certified desktop Mail-icon treatment; truncation preserved via inner span |
| Truncation | `<p>` block truncate | flex-item `truncate` (col `min-w-0`) | ✅ equivalent — ellipsis behaviour preserved |

All deltas are the accepted U-4 visual-unification outcome documented in the plan
("Med — mobile name appearance changes"): mobile identity now reads as the canonical desktop
identity block in a narrow (truncating) layout.

---

## 2. Verdict

| Theme | Desktop | Mobile |
|---|---|---|
| Dark | ✅ **identical** — name inherits `--text-primary`, email `text-secondary`, Avatar `bg-primary/10 text-primary` | ✅ **unified** — name inherits `--text-primary` (was explicit `text-text-primary`, same value); Avatar unchanged; email gains Mail icon |
| Light | ✅ **identical** — `AdminText` garamond italic name, `text-secondary` email, Avatar `ancient-icon-badge` | ✅ **unified** — name becomes garamond italic serif (desktop look), size 14→16px; Avatar unchanged |

No colours, typography implementations, or avatar surfaces were introduced by `UserIdentity`; it
composes existing certified material and the existing `AdminText`/`text-secondary` renderings.
Typography ownership re-resolves under U-3 (`AdminText`) / U-2 (Typography) and is **not** frozen
early.

---

## 3. 6-scenario matrix

| Concern | Light · Desktop | Light · Tablet | Light · XS | Dark · Desktop | Dark · Tablet | Dark · XS |
|---|---|---|---|---|---|---|
| Avatar (DS-014, decorative) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Monogram | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Name — desktop look | ✅ | ✅ | ✅ (unified) | ✅ | ✅ | ✅ (unified) |
| Name fallback `'Unknown'` | ✅ single | ✅ | ✅ | ✅ | ✅ | ✅ |
| Email + Mail icon | ✅ | ✅ | ✅ (unified) | ✅ | ✅ | ✅ (unified) |
| Truncation (mobile) | — | — | ✅ | — | — | ✅ |
| Status badge / actions / metadata | ✅ unchanged | ✅ | ✅ | ✅ | ✅ | ✅ |
| SR treatment | ✅ Avatar `aria-hidden`, Mail `aria-hidden` | ✅ | ✅ | ✅ | ✅ | ✅ |

All content outside the identity block (status badge, exam type, attempts, joined date, actions) is
untouched.
