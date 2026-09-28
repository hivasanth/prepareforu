import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { TileMatching } from './TileMatching'

const service = vi.hoisted(() => ({
  MEMORY_GAME_ID: 'tile_matching',
  MEMORY_LEADERBOARD_TOP_LIMIT: 50,
  startMemoryGameSession: vi.fn(),
  submitMemoryGameResult: vi.fn(),
  fetchMemoryGameLeaderboard: vi.fn(),
  fetchMemoryGamePersonalBest: vi.fn(),
  subscribeToMemoryGameLeaderboard: vi.fn(),
}))

vi.mock('../../../services/memoryGameService', () => service)
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, loading: false }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  service.startMemoryGameSession.mockResolvedValue('session-1')
  service.fetchMemoryGamePersonalBest.mockResolvedValue(null)
})

afterEach(cleanup)

function renderGame() {
  return render(
    <MemoryRouter initialEntries={['/memory-games/tile-matching']}>
      <Routes>
        <Route path="/memory-games/tile-matching" element={<TileMatching />} />
        <Route path="/memory-games/leaderboard" element={<div>LEADERBOARD-LOCATION</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

/** The live "To go" pair-count pill, outside the status-message region. */
function progressPill(): HTMLElement {
  const pill = document.querySelector('.tm-progress') as HTMLElement | null
  expect(pill).toBeTruthy()
  return pill!
}

describe('TileMatching', () => {
  it('renders the idle shell with the Start Game CTA and no dialog', () => {
    renderGame()

    expect(screen.getByRole('heading', { name: /Tile Matching/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeTruthy()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('navigates to the game-scoped leaderboard when the trophy is clicked', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: "View today's leaderboard" }))

    expect(await screen.findByText('LEADERBOARD-LOCATION')).toBeTruthy()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('serves the full 12-tile face-down board with a live "To go" counter once started', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Tile \d+, hidden/ })).toHaveLength(12),
    )
    expect(screen.getByRole('group', { name: 'Tile matching board' })).toBeTruthy()
    expect(progressPill().textContent).toMatch(/To go/)
    expect(progressPill().textContent).toContain('6')
    expect(screen.getByText('Tap any tile to reveal it, then find its matching pair.')).toBeTruthy()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('a first tap reveals the tile, disables it as pending, and spends no life', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Tile 1, hidden/ })).toBeTruthy(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Tile 1, hidden' }))

    // The tile is now face-up with its fruit name (no longer "hidden")…
    expect(screen.queryByRole('button', { name: 'Tile 1, hidden' })).toBeNull()
    const revealed = screen.getByRole('button', { name: /Tile 1, \w+/ })
    // …and locked while awaiting its partner.
    expect((revealed as HTMLButtonElement).disabled).toBe(true)
    expect(progressPill().textContent).toContain('6')
    expect(screen.getByLabelText(/5 of 8 lives remaining/)).toBeTruthy()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('holds the flat 12-tile board shape for the touch-safe grid (4 columns × 3 rows)', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Tile \d+, hidden/ })).toHaveLength(12),
    )

    const grid = document.querySelector('.tm-grid') as HTMLElement | null
    expect(grid).toBeTruthy()
    expect(grid!.style.getPropertyValue('--tm-cols').trim()).toBe('3')
    expect(grid!.style.getPropertyValue('--tm-rows').trim()).toBe('4')
  })

  it('ends the run and shows the result screen with the Pair Count metric', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'End Run' })).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'End Run' }))

    const dialog = await screen.findByRole('dialog', { name: 'Run result' })
    expect(dialog).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Play Again' })).toBeTruthy()
  })
})