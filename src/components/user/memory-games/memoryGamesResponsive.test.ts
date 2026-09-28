/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* ── MEMORY GAMES RESPONSIVE CONTRACT (static regression) ────────────────────
 * Guards the two width concepts behind the game shell:
 *   1. GAME SHELL  — `.nmr-column` follows the app content-area convention
 *      (`PageContainer` = `max-w-[1280px] mx-auto`, AntigravityLayout.tsx) so
 *      the back link, header card, stats card, playground card and the
 *      leaderboard page expand to the available content width on desktop.
 *   2. BOARD       — `.board-wrapper` stays the ONLY narrow constraint (520px,
 *      centered) so memory tiles never grow unmanageably, and the board is
 *      still 44px+ tap friendly down to a 320px viewport.
 * Regression guards: no `100vw` / `position: fixed` / `transform: scale()`
 * / `zoom` / `!important` rescue patches may re-enter the sheet.
 * Deterministic source reads (repo idiom) — jsdom cannot measure layout.
 * ─────────────────────────────────────────────────────────────────────────── */

const PATH = 'src/components/user/memory-games/memoryGames.css'
const BACK = 'src/pages/user/UserNumberMemoryRush.tsx'
const LEADERBOARD = 'src/pages/user/UserMemoryGamesLeaderboard.tsx'
const LANDING = 'src/components/user/memory-games/MemoryGamesLanding.tsx'

const css = readFileSync(resolve(process.cwd(), PATH), 'utf8').replace(/\r\n/g, '\n')

/**
 * Strip the legitimate `prefers-reduced-motion` accessibility block before
 * scanning for width/layout rescue patches — that block is the only place
 * `!important` is intentionally used (animation/transition overrides).
 */
const reducedMotionBlock = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}\s*\}/g
const cssWithoutMotion = css.replace(reducedMotionBlock, '')

const back = readFileSync(resolve(process.cwd(), BACK), 'utf8').replace(/\r\n/g, '\n')
const leaderboard = readFileSync(resolve(process.cwd(), LEADERBOARD), 'utf8').replace(/\r\n/g, '\n')
const landing = readFileSync(resolve(process.cwd(), LANDING), 'utf8').replace(/\r\n/g, '\n')

describe('Memory Games responsive contract — shell vs board', () => {
  it('the SHELL (.nmr-column) reaches the app content width (1280px), never the board width', () => {
    expect(css).toMatch(/\.nmr-column\s*\{/)
    const block = css.slice(css.indexOf('.nmr-column {'), css.indexOf('.nmr-column {') + 300)
    expect(block).toContain('width: 100%')
    expect(block).toContain('max-width: 1280px')
    expect(block).toContain('margin-inline: auto')
  })

  it('the BOARD (.board-wrapper) stays the single controlled 520px constraint', () => {
    expect(css).toMatch(/\.board-wrapper\s*\{/)
    const block = css.slice(css.indexOf('.board-wrapper {'), css.indexOf('.board-wrapper {') + 300)
    expect(block).toContain('max-width: 520px')
    expect(block).toContain('margin: 0 auto')
  })

  it('the page clips horizontal overflow and lets children expand inside it', () => {
    expect(css).toMatch(/\.nmr-page\s*\{/)
    const page = css.slice(css.indexOf('.nmr-page {'), css.indexOf('.nmr-page {') + 400)
    expect(page).toContain('overflow-x: hidden')
    expect(page).toContain('align-items: center')
    expect(page).toContain('width: 100%')
  })

  it('the shared grid always scales cells fluidly (no fixed tile sizes)', () => {
    expect(css).toMatch(/grid-template-columns: repeat\(var\(--grid-size, 4\), minmax\(0, 1fr\)\)/)
    expect(css).toMatch(/grid-template-rows: repeat\(var\(--grid-size, 4\), minmax\(0, 1fr\)\)/)
  })

  it('small-viewport rules keep the board inside 320px without overflowing', () => {
    expect(css).toContain('@media (max-width: 420px)')
    const mobile = css.slice(css.indexOf('@media (max-width: 420px)'))
    expect(mobile).toMatch(/\.stats-grid\s*\{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
    expect(css).toContain('@media (max-width: 360px)')
    expect(css).toContain('padding-right: 8px')
    expect(css).toContain('padding-left: 8px')
  })

  it('forbids rescue-patch hacks in the game sheet', () => {
    // Outside the (stripped) reduced-motion accessibility block, the sheet must
    // never fall back to one-off layout fixes.
    expect(cssWithoutMotion).not.toMatch(/100vw/)
    expect(cssWithoutMotion).not.toMatch(/position:\s*fixed/)
    expect(cssWithoutMotion).not.toMatch(/transform:\s*scale\(/)
    expect(cssWithoutMotion).not.toMatch(/\bzoom\b/)
    expect(cssWithoutMotion).not.toMatch(/width[^;]*!important/)
    expect(cssWithoutMotion).not.toMatch(/max-width[^;]*!important/)
    expect(cssWithoutMotion).not.toMatch(/transform[^;]*!important/)
    // The result area must never become a nested scroll container, and no fixed
    // height may clip it (resize and scroll belong to the page).
    expect(cssWithoutMotion).not.toMatch(/overflow-y:\s*auto/)
    expect(cssWithoutMotion).not.toMatch(/max-height/)
  })
})

describe('Memory Games responsive contract — shared layout fixes', () => {
  it('the result overlay is an in-flow, content-driven block (no clip, no nested scroll)', () => {
    const modalBlock = css.slice(css.indexOf('.modal-overlay {'), css.indexOf('.modal-overlay.active'))
    expect(modalBlock).not.toContain('position: absolute')
    expect(modalBlock).not.toContain('overflow-y: auto')
    expect(modalBlock).not.toMatch(/max-height/)
    expect(modalBlock).toContain('display: flex')
  })

  it('the idle play area reserves a responsive square (aspect-ratio, never fixed px)', () => {
    expect(css).toMatch(/\.nmr-idle-slot\s*\{/)
    const block = css.slice(css.indexOf('.nmr-idle-slot {'), css.indexOf('.nmr-idle-slot {') + 320)
    expect(block).toContain('aspect-ratio: 1 / 1')
    expect(block).toContain('max-width: 520px')
    expect(block).toContain('margin: 0 auto')
  })

  it('the shell stacks header + ONE playground wrapper (metrics can never leave it)', () => {
    expect(css).toMatch(/\.nmr-game-stack\s*\{/)
    const stack = css.slice(css.indexOf('.nmr-game-stack {'), css.indexOf('.nmr-game-stack {') + 240)
    expect(stack).toMatch(/'header'/)
    expect(stack).toMatch(/'playground'/)
    expect(css).toMatch(/\.nmr-playground\s*\{/)
    const playground = css.slice(css.indexOf('.nmr-playground {'), css.indexOf('.nmr-playground {') + 400)
    expect(playground).toContain('background: var(--nmr-playground-bg)')
    expect(playground).toContain('border: 1px solid var(--nmr-card-border)')
    expect(playground).toMatch(/grid-template-areas:\s*'left'\s*'right'\s*'center'/)
  })

  it('wide layout keeps the 3-column split INSIDE the playground wrapper', () => {
    expect(css).toContain('@media (min-width: 1000px)')
    const wide = css.slice(css.indexOf('@media (min-width: 1000px)'))
    expect(wide).toMatch(/\.nmr-playground\s*\{[\s\S]*grid-template-columns: auto minmax\(0, 1fr\) auto/)
    expect(wide).toMatch(/grid-template-areas:\s*'left center right'/)
    // The three metric cards per side form a COMPACT, VERTICALLY-CENTRED group —
    // top/bottom breathing space comes from `justify-content: center` +
    // padding-block, NEVER `space-between` (which pinned card 1 to the top edge
    // and card 3 to the bottom edge of the playground).
    expect(wide).toMatch(/\.nmr-metric-flank \.stats-grid\s*\{[\s\S]*flex-direction: column/)
    expect(wide).toMatch(/\.nmr-metric-flank \.stats-grid\s*\{[\s\S]*justify-content: center/)
    expect(wide).toMatch(/\.nmr-metric-flank \.stats-grid\s*\{[\s\S]*padding-block/)
    expect(css).toMatch(/\.stats-grid\s*\{[\s\S]*grid-template-columns: repeat\(auto-fit, minmax\(0, 1fr\)\)/)
  })

  it('metric COLUMNS are layout-only: the flank rule carries NO surface', () => {
    const flank = css.slice(css.indexOf('.nmr-metric-flank {'), css.indexOf('.nmr-metric-flank--left'))
    const flankRules = flank.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(flankRules).not.toMatch(/background\s*:/)
    expect(flankRules).not.toMatch(/border\s*:/)
    expect(flankRules).not.toMatch(/box-shadow\s*:/)
  })

  it('every metric is its OWN independent card with its own surface', () => {
    expect(css).toMatch(/\.metric-card\s*\{/)
    const card = css.slice(css.indexOf('.metric-card {'), css.indexOf('.metric-card {') + 380)
    expect(card).toContain('background: var(--nmr-card-bg)')
    expect(card).toMatch(/border:\s*1px solid var\(--nmr-card-border\)/)
    expect(card).toMatch(/border-radius:\s*var\(--nmr-radius-md\)/)
    expect(card).toContain('box-shadow: var(--nmr-card-shadow)')
    expect(card).toContain('padding')
    expect(card).toMatch(/min-height:\s*68px/)
    // Cards must NOT stretch to fill the playground height.
    expect(card).not.toMatch(/flex:\s*1/)
  })

  it('the four game pages render flanks as layout-only divs (no shared Card container)', () => {
    for (const file of [
      'NumberMemoryRush',
      'VisualMemoryMatrix',
      'TileMatching',
      'SchulteTrail',
    ]) {
      const page = readFileSync(
        resolve(process.cwd(), `src/components/user/memory-games/${file}.tsx`),
        'utf8',
      ).replace(/\r\n/g, '\n')
      expect(page).toMatch(/<div className="nmr-metric-flank nmr-metric-flank--left">/)
      expect(page).toMatch(/<div className="nmr-metric-flank nmr-metric-flank--right">/)
      expect(page).not.toMatch(/<Card variant="elevated" className="nmr-metric-flank/)
    }
  })

  it('every game page wraps the two metric columns inside the SAME playground wrapper', () => {
    const rush = readFileSync(
      resolve(process.cwd(), 'src/components/user/memory-games/NumberMemoryRush.tsx'),
      'utf8',
    ).replace(/\r\n/g, '\n')
    const matrix = readFileSync(
      resolve(process.cwd(), 'src/components/user/memory-games/VisualMemoryMatrix.tsx'),
      'utf8',
    ).replace(/\r\n/g, '\n')
    const tileMatching = readFileSync(
      resolve(process.cwd(), 'src/components/user/memory-games/TileMatching.tsx'),
      'utf8',
    ).replace(/\r\n/g, '\n')
    const schulte = readFileSync(
      resolve(process.cwd(), 'src/components/user/memory-games/SchulteTrail.tsx'),
      'utf8',
    ).replace(/\r\n/g, '\n')
    for (const page of [rush, matrix, tileMatching, schulte]) {
      expect(page).toContain('className="nmr-playground"')
      expect(page).toContain('nmr-metric-flank--left')
      expect(page).toContain('nmr-metric-flank--right')
    }
  })
})

describe('Memory Games responsive contract — six metrics with Best as Metric 6', () => {
  const gameStatusBar = readFileSync(
    resolve(process.cwd(), 'src/components/user/memory-games/GameStatusBar.tsx'),
    'utf8',
  ).replace(/\r\n/g, '\n')

  it('the shared HUD exposes exactly six metrics (3 LEFT + 3 RIGHT) with Best sixth', () => {
    for (const needle of [
      'label={metricLabel}',
      '<Stat label="Score"',
      '<Stat label="Level"',
      '<Stat label="Stage"',
      '<span className="stat-label">Lives</span>',
      '<Stat label="Best"',
    ]) {
      expect(gameStatusBar).toContain(needle)
    }
    // Semantic order: Score(2) → Stage(4) → Lives(5) → Best(6).
    const scoreIndex = gameStatusBar.indexOf('<Stat label="Score"')
    const stageIndex = gameStatusBar.indexOf('<Stat label="Stage"')
    const livesIndex = gameStatusBar.indexOf('<span className="stat-label">Lives</span>')
    const bestIndex = gameStatusBar.indexOf('<Stat label="Best"')
    expect(stageIndex).toBeGreaterThan(scoreIndex)
    expect(livesIndex).toBeGreaterThan(stageIndex)
    expect(bestIndex).toBeGreaterThan(livesIndex)
    // Side split: left column carries exactly 3 Stat cards, right column 2 Stat
    // cards + the Lives hearts card (still 3 metric cards per side).
    const leftBlock = gameStatusBar.slice(gameStatusBar.indexOf('const leftStats'), gameStatusBar.indexOf('const rightStats'))
    expect(leftBlock.match(/<Stat /g)?.length).toBe(3)
    const rightBlock = gameStatusBar.slice(gameStatusBar.indexOf('const rightStats'), gameStatusBar.indexOf('const rightStats') + 600)
    expect(rightBlock.match(/<Stat /g)?.length).toBe(2)
    expect(rightBlock).toContain('stat-label">Lives')
  })

  it('all six metrics render as INDEPENDENT .metric-card elements', () => {
    // The Stat component is the single shared card renderer; the Lives metric
    // uses the same .metric-card class explicitly. Combined with the 3+3
    // composition above, all six metrics surface as independent cards.
    const statBlock = gameStatusBar.slice(gameStatusBar.indexOf('const Stat ='), gameStatusBar.indexOf('const Stat =') + 240)
    expect(statBlock).toContain('className="metric-card"')
    expect(gameStatusBar).toContain('<div className="metric-card">')
    expect(gameStatusBar).not.toMatch(/className="stat-item"/)
  })

  it('Best Score consumes the SAME personal best as the result screen (no second state)', () => {
    expect(gameStatusBar).toMatch(/best\?: MemoryPersonalBest \| null/)
    expect(gameStatusBar).toContain('value={best ? best.score : 0}')
  })

  it('the old standalone Best Score strip is fully removed from every game page', () => {
    for (const file of [
      'NumberMemoryRush',
      'VisualMemoryMatrix',
      'TileMatching',
      'SchulteTrail',
    ]) {
      const page = readFileSync(
        resolve(process.cwd(), `src/components/user/memory-games/${file}.tsx`),
        'utf8',
      ).replace(/\r\n/g, '\n')
      expect(page).not.toMatch(/nmr-best-chip/)
      expect(page).not.toMatch(/Your best/)
    }
    expect(css).not.toMatch(/\.nmr-best-chip/)
  })

  it('every game page feeds the SAME personal best into the shared Best metric', () => {
    for (const file of [
      'NumberMemoryRush',
      'VisualMemoryMatrix',
      'TileMatching',
      'SchulteTrail',
    ]) {
      const page = readFileSync(
        resolve(process.cwd(), `src/components/user/memory-games/${file}.tsx`),
        'utf8',
      ).replace(/\r\n/g, '\n')
      expect(page).toContain('side="right"')
      expect(page).toContain('best={personalBest}')
    }
  })
})

describe('Memory Games responsive contract — page plumbing', () => {
  it('both game pages and the leaderboard route share the .nmr-page > .nmr-column shell', () => {
    expect(back).toContain('className="nmr-page"')
    expect(back).toContain('className="nmr-column"')
    expect(leaderboard).toContain('className="nmr-page"')
    expect(leaderboard).toContain('className="nmr-column"')
  })

  it('the board lives in its own .board-wrapper (Game 2) inside the shared shell', () => {
    const matrix = readFileSync(
      resolve(process.cwd(), 'src/components/user/memory-games/VisualMemoryMatrix.tsx'),
      'utf8',
    ).replace(/\r\n/g, '\n')
    expect(matrix).toContain('className="board-wrapper"')
  })

  it('the board lives in its own .board-wrapper (Game 1) inside the shared shell', () => {
    const rush = readFileSync(
      resolve(process.cwd(), 'src/components/user/memory-games/NumberMemoryRush.tsx'),
      'utf8',
    ).replace(/\r\n/g, '\n')
    expect(rush).toContain('className="board-wrapper"')
  })

  it('the two game pages do not impose any per-game width class on the shell', () => {
    expect(back).not.toContain('w-[560px]')
    expect(back).not.toContain('w-[520px]')
    expect(back).not.toContain('style={{ maxWidth')
    expect(leaderboard).not.toContain('w-[560px]')
  })

  it('the landing catalog keeps its own narrower presentation (unchanged)', () => {
    expect(landing).toContain('nmr-landing-column')
  })
})