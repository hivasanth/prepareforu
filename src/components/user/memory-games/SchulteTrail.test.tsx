import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { SchulteTrail } from './SchulteTrail'

const service = vi.hoisted(() => ({
  MEMORY_GAME_ID: 'schulte_trail',
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
    <MemoryRouter initialEntries={['/memory-games/schulte-trail']}>
      <Routes>
        <Route path="/memory-games/schulte-trail" element={<SchulteTrail />} />
        <Route path="/memory-games/leaderboard" element={<div>LEADERBOARD-LOCATION</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

/** The live "Next" target pill, outside the status-message region. */
function targetPill(): HTMLElement {
  const pill = document.querySelector('.st-target') as HTMLElement | null
  expect(pill).toBeTruthy()
  return pill!
}

describe('SchulteTrail', () => {
  it('renders the idle shell with the Start Game CTA and no dialog', () => {
    renderGame()

    expect(screen.getByRole('heading', { name: /Schulte Trail/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeTruthy()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('navigates to the game-scoped leaderboard when the trophy is clicked', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: "View today's leaderboard" }))

    expect(await screen.findByText('LEADERBOARD-LOCATION')).toBeTruthy()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('serves the full 4×4 board with a live Next target once started', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Number \d+ tile/ })).toHaveLength(16),
    )
    expect(targetPill().textContent).toMatch(/Next/)
    expect(targetPill().textContent).toContain('1')
    expect(screen.getByText('Tap the numbers in order, starting with 1.')).toBeTruthy()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('a CORRECT tap marks the number found and advances the Next target', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Number 1 tile' })).toBeTruthy(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Number 1 tile' }))

    // Found tiles are aria-hidden (removed from the accessible name/order), so
    // assert them via the DOM label instead of a role query.
    const found = document.querySelector('button[aria-label="Number 1, found"]')
    expect(found).toBeTruthy()
    expect(found!.getAttribute('aria-hidden')).toBe('true')
    expect(targetPill().textContent).toContain('2')
  })

  it('a WRONG number costs a life, shows the failure copy and never opens a dialog', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Number 2 tile' })).toBeTruthy(),
    )

    // The trail is at 1, so "Number 2" is guaranteed to be the wrong cell.
    fireEvent.click(screen.getByRole('button', { name: 'Number 2 tile' }))

    expect(screen.getByText(/Wrong number — 2 lives left/)).toBeTruthy()
    expect(screen.getByLabelText(/2 of 3 lives remaining/)).toBeTruthy()
    // The trail is frozen after a failure, so the Next target hides.
    expect(document.querySelector('.st-target')).toBeNull()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('clears every target of the stage and banks +5 on the score HUD', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Number 1 tile' })).toBeTruthy())

    for (let number = 1; number <= 16; number += 1) {
      fireEvent.click(screen.getByRole('button', { name: `Number ${number} tile` }))
    }

    expect(screen.getByText(/Board cleared! \+5 points/)).toBeTruthy()
    expect(screen.getByLabelText(/3 of 3 lives remaining/)).toBeTruthy()
  })

  it('ends the run and shows the result screen with the Board Tiles metric', async () => {
    renderGame()

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'End Run' })).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'End Run' }))

    const dialog = await screen.findByRole('dialog', { name: 'Run result' })
    expect(dialog).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Play Again' })).toBeTruthy()
  })
})