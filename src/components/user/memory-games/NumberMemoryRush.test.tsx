import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { NumberMemoryRush } from './NumberMemoryRush'

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
  service.fetchMemoryGamePersonalBest.mockResolvedValue(null)
})

afterEach(cleanup)

function renderGame() {
  return render(
    <MemoryRouter initialEntries={['/memory-games']}>
      <Routes>
        <Route path="/memory-games" element={<NumberMemoryRush />} />
        <Route path="/memory-games/leaderboard" element={<div>LEADERBOARD-LOCATION</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NumberMemoryRush leaderboard entry', () => {
  it('renders the game with the trophy button as navigation, not a modal', async () => {
    renderGame()

    const trophy = screen.getByRole('button', { name: "View today's leaderboard" })
    expect(trophy).toBeTruthy()

    // No dialog/overlay architecture remains.
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('navigates to /memory-games/leaderboard when the trophy is clicked', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: "View today's leaderboard" }))

    expect(await screen.findByText('LEADERBOARD-LOCATION')).toBeTruthy()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })
})