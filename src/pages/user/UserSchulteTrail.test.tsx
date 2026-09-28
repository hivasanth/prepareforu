import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import UserSchulteTrail from './UserSchulteTrail'
import { ThemeProvider } from '../../context/ThemeContext'

const service = vi.hoisted(() => ({
  MEMORY_GAME_ID: 'schulte_trail',
  MEMORY_LEADERBOARD_TOP_LIMIT: 50,
  startMemoryGameSession: vi.fn(),
  submitMemoryGameResult: vi.fn(),
  fetchMemoryGameLeaderboard: vi.fn(),
  fetchMemoryGamePersonalBest: vi.fn(),
  subscribeToMemoryGameLeaderboard: vi.fn(),
}))

vi.mock('../../services/memoryGameService', () => service)
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, loading: false }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  service.startMemoryGameSession.mockResolvedValue('session-1')
  service.fetchMemoryGamePersonalBest.mockResolvedValue(null)
})

afterEach(cleanup)

function renderPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/memory-games/schulte-trail']}>
        <Routes>
          <Route path="/memory-games/schulte-trail" element={<UserSchulteTrail />} />
          <Route path="/memory-games" element={<div>MEMORY-GAMES-LOCATION</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('UserSchulteTrail', () => {
  it('renders the wrapped game with a back link to the memory-games landing', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: /Schulte Trail/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'All memory games' })).toBeTruthy()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('navigates back to the memory-games landing when the back link is clicked', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'All memory games' }))

    expect(screen.getByText('MEMORY-GAMES-LOCATION')).toBeTruthy()
  })

  it('plays a full hit-run from Start through the result screen', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'End Run' })).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'End Run' }))

    const dialog = await screen.findByRole('dialog', { name: 'Run result' })
    expect(dialog).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Play Again' })).toBeTruthy()
  })
})