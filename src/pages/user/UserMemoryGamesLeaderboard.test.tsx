import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ThemeProvider } from '../../context/ThemeContext'
import UserMemoryGamesLeaderboard from './UserMemoryGamesLeaderboard'
import type { MemoryLeaderboardEntry } from '../../types/memoryGame.types'

const here = dirname(fileURLToPath(import.meta.url))
const read = (p: string) => readFileSync(join(here, p), 'utf8').replace(/\r\n/g, '\n')

const service = vi.hoisted(() => ({
  MEMORY_GAME_ID: 'number_memory_rush',
  MEMORY_LEADERBOARD_TOP_LIMIT: 50,
  startMemoryGameSession: vi.fn(),
  submitMemoryGameResult: vi.fn(),
  fetchMemoryGameLeaderboard: vi.fn(),
  fetchMemoryGamePersonalBest: vi.fn(),
  subscribeToMemoryGameLeaderboard: vi.fn(),
}))

vi.mock('../../services/memoryGameService', () => service)

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock('../../context/AuthContext', () => auth)

const rows: MemoryLeaderboardEntry[] = [
  {
    rank: 1, userId: 'user-1', displayName: 'Myself', score: 300,
    highestLevel: 8, highestNumber: 10, stagesCompleted: 28, accuracy: 95,
    completedAt: '2026-09-20T10:00:00Z',
  },
  {
    rank: 2, userId: 'other-1', displayName: 'Rival', score: 250,
    highestLevel: 7, highestNumber: 10, stagesCompleted: 24, accuracy: 90,
    completedAt: '2026-09-20T09:00:00Z',
  },
]

function renderPage(initialPath = '/memory-games/leaderboard') {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/memory-games/leaderboard" element={<UserMemoryGamesLeaderboard />} />
          <Route path="/memory-games/number-memory-rush" element={<div>GAME-HOME</div>} />
          <Route path="/memory-games" element={<div>GAMES-LANDING</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.useAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false })
  service.fetchMemoryGameLeaderboard.mockResolvedValue(rows)
  service.fetchMemoryGamePersonalBest.mockResolvedValue(null)
  service.subscribeToMemoryGameLeaderboard.mockReturnValue(vi.fn())
})

afterEach(cleanup)

describe('UserMemoryGamesLeaderboard', () => {
  it('renders the leaderboard page chrome and board from the hook data', async () => {
    renderPage()

    expect(screen.getByRole('button', { name: /Back to Number Memory Rush/ })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Number Memory Rush/ })).toBeTruthy()
    expect(screen.getByText(/Daily Leaderboard/)).toBeTruthy()

    expect(await screen.findByText('Myself')).toBeTruthy()
    expect(screen.getByText('Rival')).toBeTruthy()
    expect(screen.getByText('You')).toBeTruthy()
    expect(screen.getByText('Live')).toBeTruthy()

    // Opens as a real page, never as a dialog/overlay.
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('shows a loading skeleton while the first fetch is in flight', async () => {
    let resolve!: (value: MemoryLeaderboardEntry[]) => void
    service.fetchMemoryGameLeaderboard.mockReturnValue(
      new Promise<MemoryLeaderboardEntry[]>((res) => { resolve = res }),
    )
    renderPage()

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')

    await act(async () => { resolve(rows) })
    expect(await screen.findByText('Myself')).toBeTruthy()
  })

  it('shows the empty state — never an error — when no scores exist today', async () => {
    service.fetchMemoryGameLeaderboard.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('No scores yet today')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Try Again' })).toBeNull()
  })

  it('surfaces the error and recovers via retry', async () => {
    service.fetchMemoryGameLeaderboard
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(rows)
    renderPage()

    expect(await screen.findByText('Unexpected Error')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))

    expect(await screen.findByText('Myself')).toBeTruthy()
    expect(screen.queryByText('Unexpected Error')).toBeNull()
  })

  it('navigates back to the originating game page via the Back button', async () => {
    renderPage()
    expect(await screen.findByText('Myself')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Back to Number Memory Rush/ }))

    expect(await screen.findByText('GAME-HOME')).toBeTruthy()
  })

  it('scopes the board to the ?game= param (title + realtime channel)', async () => {
    renderPage('/memory-games/leaderboard?game=visual_memory_matrix')
    await screen.findByText('Myself')

    expect(screen.getByRole('heading', { name: /Visual Memory Matrix/ })).toBeTruthy()
    expect(service.subscribeToMemoryGameLeaderboard).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      'visual_memory_matrix',
    )
    expect(service.fetchMemoryGameLeaderboard).toHaveBeenCalledWith(
      'visual_memory_matrix',
      service.MEMORY_LEADERBOARD_TOP_LIMIT,
    )
  })

  it('owns exactly ONE realtime subscription while mounted and cleans up on unmount', async () => {
    const unsubscribe = vi.fn()
    service.subscribeToMemoryGameLeaderboard.mockReturnValue(unsubscribe)
    renderPage()
    await screen.findByText('Myself')

    expect(service.subscribeToMemoryGameLeaderboard).toHaveBeenCalledTimes(1)

    cleanup()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('does not subscribe until the auth session is ready, then subscribes exactly once', async () => {
    auth.useAuth.mockReturnValue({ user: null, loading: true })
    const unsubscribe = vi.fn()
    service.subscribeToMemoryGameLeaderboard.mockReturnValue(unsubscribe)

    const { rerender } = renderPage()
    expect(service.subscribeToMemoryGameLeaderboard).not.toHaveBeenCalled()
    expect(service.fetchMemoryGameLeaderboard).not.toHaveBeenCalled()

    auth.useAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false })
    rerender(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/memory-games/leaderboard']}>
          <Routes>
            <Route path="/memory-games/leaderboard" element={<UserMemoryGamesLeaderboard />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    expect(await waitFor(() => expect(service.subscribeToMemoryGameLeaderboard).toHaveBeenCalledTimes(1)))
    expect(service.subscribeToMemoryGameLeaderboard).toHaveBeenCalledTimes(1)
  })
})

/* ─── Route + dead-code regression (source-level, repo idiom) ─────────────────
 * Guards the modal → dedicated page conversion at the wiring layer: the route
 * exists as a lazy, guard-grouped user route, and no modal/dialog remnants
 * survive in the game layer. */
describe('Memory Games leaderboard wiring', () => {
  it('registers /memory-games/leaderboard inside the guarded user route group', () => {
    const app = read('../../App.tsx')

    expect(app).toContain("lazy(() => import('./pages/user/UserMemoryGamesLeaderboard'))")
    expect(app).toMatch(/path="\/memory-games" {2}element=/)
    expect(app).toMatch(/path="\/memory-games\/leaderboard" element={<PageTitle title="Memory Games — Leaderboard">/)

    // Lives inside the user section guarded by AuthGuard + RoleGuard + UserLayout,
    // so direct URL access requires an authenticated user session.
    const userRoutes = app.slice(app.indexOf('<Route path="/dashboard"'))
    const gamesIndex = userRoutes.indexOf('path="/memory-games"')
    const leaderboardIndex = userRoutes.indexOf('path="/memory-games/leaderboard"')
    expect(gamesIndex).toBeGreaterThan(-1)
    expect(leaderboardIndex).toBeGreaterThan(gamesIndex)
  })

  it('removes the obsolete modal dialog from the memory-games layer', () => {
    expect(() => readFileSync(join(here, '..', '..', 'components', 'user', 'memory-games', 'MemoryLeaderboardDialog.tsx'))).toThrow()

    const rush = read('../../components/user/memory-games/NumberMemoryRush.tsx')
    expect(rush).toContain('/memory-games/leaderboard?game=')
    expect(rush).not.toContain('MemoryLeaderboardDialog')
    expect(rush).not.toContain('leaderboardOpen')

    const barrel = read('../../components/user/memory-games/index.ts')
    expect(barrel).not.toContain('MemoryLeaderboardDialog')
    expect(barrel).toContain('MemoryLeaderboard }')
  })
})