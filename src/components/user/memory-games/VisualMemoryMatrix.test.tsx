import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { VisualMemoryMatrix } from './VisualMemoryMatrix'

const service = vi.hoisted(() => ({
  MEMORY_GAME_ID: 'number_memory_rush',
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
    <MemoryRouter initialEntries={['/memory-games/visual-memory-matrix']}>
      <Routes>
        <Route path="/memory-games/visual-memory-matrix" element={<VisualMemoryMatrix />} />
        <Route path="/memory-games/leaderboard" element={<div>LEADERBOARD-LOCATION</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('VisualMemoryMatrix', () => {
  it('renders the idle shell with the Start Game CTA and no dialog', () => {
    renderGame()

    expect(screen.getByRole('heading', { name: /Visual Memory Matrix/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeTruthy()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('navigates to the game-scoped leaderboard when the trophy is clicked', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: "View today's leaderboard" }))

    expect(await screen.findByText('LEADERBOARD-LOCATION')).toBeTruthy()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('serves a 4×4 board with exactly four pattern tiles once started', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Pattern tile' })).toHaveLength(4),
    )
    expect(screen.getAllByRole('button', { name: 'Empty tile' })).toHaveLength(12)
    expect(screen.getByRole('group', { name: 'Pattern memory board' })).toBeTruthy()
  })

  it('keeps empty-tile taps during the preview fully inert', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Pattern tile' })).toHaveLength(4),
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Empty tile' })[0])

    // The pattern is still showing — no failure state, no result dialog.
    expect(screen.getAllByRole('button', { name: 'Pattern tile' })).toHaveLength(4)
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('tapping a highlighted tile during the preview hides it immediately as the first found tile', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Pattern tile' })).toHaveLength(4),
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Pattern tile' })[0])

    // The glow is gone instantly: no target is announced as "Pattern tile" any
    // more, the tapped one is the found green tile, and everything else turned
    // into non-revealing "Hidden tile" cells.
    expect(screen.queryAllByRole('button', { name: 'Pattern tile' })).toHaveLength(0)
    expect(document.querySelectorAll('button[aria-label="Pattern tile, found"]')).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Hidden tile' })).toHaveLength(15)
    expect(document.querySelector('[role="dialog"]')).toBeNull()

    // The clicked tile carries the correct (green) treatment.
    const found = document.querySelector('button[aria-label="Pattern tile, found"]')!
    expect(found.className).toMatch(/\bcorrect\b/)
  })

  it('ends the run and shows the result screen with the Pattern Size metric', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'End Run' })).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'End Run' }))

    const dialog = await screen.findByRole('dialog', { name: 'Run result' })
    expect(dialog).toBeTruthy()
    expect(screen.getByText('Pattern Size')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Play Again' })).toBeTruthy()
  })
})
