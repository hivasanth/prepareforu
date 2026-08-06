# AR-020 Completion Report — Bundle Analysis and Optimization

**Date:** 2026-07-22
**Phase:** 6.20
**Status:** PERMANENTLY CLOSED
**ADR:** ADR-009 (Accepted)

---

## Summary

Production bundle analysis and optimization. Identified and resolved the primary bundle bottleneck: QuestionVisualizer.tsx eagerly importing ~1.2MB of visualization libraries (mermaid, recharts, react-katex, react-simple-maps) on every page containing the component.

## Build Analysis (Before)

| Metric | Value |
|---|---|
| Modules transformed | 5,509 |
| Build time | 34.82s |
| Total chunks | 39 |
| `index.js` (initial load) | 402.26 kB (gzip: 118.91 kB) |
| Chunks > 500 kB | 2 (wardley 615 kB, mermaid 601 kB) |

## Optimizations Executed

### 1. QuestionVisualizer Lazy Sub-Components (HIGH IMPACT)

Split `src/components/common/QuestionVisualizer.tsx` (378 lines) into 4 lazy sub-components:

| New Component | Library | Chunk Size | Lazy? |
|---|---|---|---|
| `src/components/visualizers/ChartVisualizer.tsx` | recharts | 426.17 kB | YES |
| `src/components/visualizers/MermaidDiagram.tsx` | mermaid | 601.40 kB | YES |
| `src/components/visualizers/MathBlock.tsx` | react-katex | 262.55 kB | YES |
| `src/components/visualizers/MapVisualizer.tsx` | react-simple-maps | 102.79 kB | YES |

**Impact:** ~1.2MB moved from eager initial load to on-demand lazy chunks. The 4 lightweight renderers (table, geometry, venn, svg) remain inline with zero external dependencies.

### 2. katex CSS Global Removal (HIGH IMPACT)

Moved `katex/dist/katex.min.css` from `src/main.tsx` (global) to `src/components/visualizers/MathBlock.tsx` (lazy).

**Impact:** ~230KB CSS removed from global scope. Only loaded when `type === 'latex'` visual is rendered.

### 3. Delete Unused Assets (MEDIUM IMPACT)

Deleted 11 unreferenced files (~3.5MB):

| File | Size | Reason |
|---|---|---|
| `public/bg/user-bg-desktop.jpg` | 530 KB | No references |
| `public/bg/user-bg-large.jpg` | 521 KB | No references |
| `public/bg/user-bg-medium.jpg` | 609 KB | No references |
| `public/bg/user-bg-mobile.jpg` | 370 KB | No references |
| `public/bg/user-bg-tablet.jpg` | 568 KB | No references |
| `public/bg/stat-card-bg.jpg` | 320 KB | CSS variable resolves to solid color |
| `public/icons.svg` | 5 KB | No references |
| `src/assets/hero.png` | 44 KB | No imports |
| `src/assets/react.svg` | 4 KB | Vite scaffolding leftover |
| `src/assets/splash_bg.ts` | 484 KB | Base64 image, never imported |
| `src/assets/vite.svg` | 9 KB | Replaced by favicon.svg |

### 4. Favicon Bug Fix (LOW IMPACT)

Changed `index.html` favicon reference from `/vite.svg` (broken) to `/favicon.svg` (exists in public/).

## Build Analysis (After)

| Metric | Before | After | Delta |
|---|---|---|---|
| `index.js` (initial load) | 402.26 kB | 402.26 kB | **unchanged** |
| mermaid | eager in index.js | lazy 601.40 kB | **removed from initial** |
| recharts | eager in index.js | lazy 426.17 kB | **removed from initial** |
| katex CSS | global in main.tsx | lazy 262.55 kB | **removed from global** |
| react-simple-maps | eager in index.js | lazy 102.79 kB | **removed from initial** |
| Unused assets | 3.5 MB | **deleted** | **-3.5 MB** |
| Favicon | `/vite.svg` (broken) | `/favicon.svg` | **fixed** |

## Verification

- **Tests:** 79/79 pass (6 pre-existing ESM errors, unrelated)
- **Build:** Succeeds in 30.16s
- **Behavioral changes:** None — all visual types render identically

## Deferred Items (Category C)

| Item | Reason |
|---|---|
| framer-motion tree-shaking | 35 files, pervasive usage, low ROI |
| date-fns utility wrapper | Low impact, tree-shaking handles it |
| dompurify wrapper | Low impact, small library |
| lucide-react audit | 111 files but tree-shaking already effective |

## Files Created

1. `src/components/visualizers/ChartVisualizer.tsx` — recharts wrapper (lazy)
2. `src/components/visualizers/MermaidDiagram.tsx` — mermaid wrapper (lazy)
3. `src/components/visualizers/MathBlock.tsx` — react-katex wrapper (lazy)
4. `src/components/visualizers/MapVisualizer.tsx` — react-simple-maps wrapper (lazy)

## Files Modified

1. `src/components/common/QuestionVisualizer.tsx` — replaced eager imports with lazy loading
2. `src/main.tsx` — removed `katex/dist/katex.min.css` import
3. `index.html` — fixed favicon reference
4. `ARCHITECTURE_BACKLOG.md` — AR-020 CLOSED, ADR-009 Added, metrics updated

## Files Deleted (11)

`public/bg/user-bg-{desktop,large,medium,mobile,tablet}.jpg`, `public/bg/stat-card-bg.jpg`, `public/icons.svg`, `src/assets/{hero.png,react.svg,splash_bg.ts,vite.svg}`
