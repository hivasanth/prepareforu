# Admin Users — U-5 Avatar Visual Comparison (Phase 3.5 · Page 1 of 11)

**Method:** inspection-based comparison per repo precedent (auth-guarded admin route; no headless
tooling — see `baselines/ADMIN_QUESTIONS_VISUAL_BASELINE.md`). Before = the two page-local avatar
implementations; after = the certified `Avatar` primitive (DS-014) composing frozen `AdminIconWrap`.

---

## 1. Attribute-by-attribute comparison

### Desktop avatar (AdminUsersView.tsx)

| Attribute | Before (page-local `AdminIconWrap`) | After (`<Avatar>` → `AdminIconWrap`) | Delta |
|---|---|---|---|
| Surface | `AdminIconWrap size="md" rounded="full"` | `Avatar size="md" shape="circle"` → `AdminIconWrap size="md" rounded="full"` | none |
| Monogram source | `u.full_name` first char | `Avatar` derives from `name` (then `email`, then `'?'`) | none for named rows |
| Light material | `ancient-icon-badge` | `ancient-icon-badge` (delegated) | none |
| Dark material | `bg-primary/10 text-primary` | `bg-primary/10 text-primary` (delegated) | none |
| Size | `w-9 h-9 text-sm` | `w-9 h-9 text-sm` | none |
| SR treatment | page `aria-hidden` span wrapper | `Avatar` `decorative=true` → `aria-hidden` | equivalent (attribute moves into primitive) |

### Mobile avatar (UserMobileCard.tsx)

| Attribute | Before (hand-rolled div) | After (`<Avatar>` → `AdminIconWrap`) | Delta |
|---|---|---|---|
| Surface | raw `w-9 h-9 … bg-primary/10` div | `AdminIconWrap` `w-9 h-9` + `bg-primary/10` | none |
| Light material | `bg-primary/10` (mobile never applied `ancient-icon-badge`) | `ancient-icon-badge` in light theme (delegated) | ✅ **intentional unification** — mobile avatar now matches desktop light material (the plan's accepted delta: "light-mode mobile avatar appearance may unify") |
| Dark material | `bg-primary/10` | `bg-primary/10 text-primary` (delegated) | `text-primary` added — matches desktop; colour value identical |
| Size | `w-9 h-9` | `w-9 h-9` | none |
| Shape | `rounded-full` | `rounded-full` | none |
| SR treatment | page `aria-hidden` div | `Avatar` `decorative=true` → `aria-hidden` | equivalent |

---

## 2. Verdict

| Theme | Verdict |
|---|---|
| Dark | ✅ **identical** — `bg-primary/10` surface, `w-9 h-9`, `rounded-full`; monogram unchanged |
| Light | ✅ **same material, unified** — desktop unchanged (`ancient-icon-badge`); mobile now renders the certified `ancient-icon-badge` medallion instead of the raw `bg-primary/10` div. This is the accepted U-5 delta (mobile light avatar joins the certified light material) and is the same medallion already certified for desktop avatars |

The avatar reads identically in dark mode; in light mode the mobile avatar joins the certified
desktop material (one implementation, one contract). All content (name, email, status badges,
actions) is untouched.

---

## 3. 6-scenario matrix

| Concern | Light · Desktop | Light · Tablet | Light · XS | Dark · Desktop | Dark · Tablet | Dark · XS |
|---|---|---|---|---|---|---|
| Monogram | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Circle medallion | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Light material (`ancient-icon-badge`) | ✅ | ✅ | ✅ (unified) | — | — | — |
| Dark material (`bg-primary/10 text-primary`) | — | — | — | ✅ | ✅ | ✅ |
| Size `md` (`w-9 h-9`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Name/email/status/actions | ✅ unchanged | ✅ | ✅ | ✅ | ✅ | ✅ |
| SR treatment (decorative `aria-hidden`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

All deltas are confined to the avatar rendering; the rest of the page is untouched.
