import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MemoryGamesLanding } from './MemoryGamesLanding'
import { MEMORY_GAME_CATALOG } from '../../../config/memoryGames'

afterEach(cleanup)

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/memory-games']}>
      <Routes>
        <Route path="/memory-games" element={<MemoryGamesLanding />} />
        <Route path="/memory-games/number-memory-rush" element={<div>RUSH-LOCATION</div>} />
        <Route path="/memory-games/visual-memory-matrix" element={<div>MATRIX-LOCATION</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MemoryGamesLanding', () => {
  it('lists every catalog title as a playable card', () => {
    renderLanding()

    expect(screen.getByRole('heading', { name: 'Memory Games' })).toBeTruthy()
    MEMORY_GAME_CATALOG.forEach((entry) => {
      expect(screen.getByRole('button', { name: `Play ${entry.title}` })).toBeTruthy()
      expect(screen.getByText(entry.title)).toBeTruthy()
    })
  })

  it('navigates to Number Memory Rush', () => {
    renderLanding()
    fireEvent.click(screen.getByRole('button', { name: 'Play Number Memory Rush' }))
    expect(screen.getByText('RUSH-LOCATION')).toBeTruthy()
  })

  it('navigates to Visual Memory Matrix', () => {
    renderLanding()
    fireEvent.click(screen.getByRole('button', { name: 'Play Visual Memory Matrix' }))
    expect(screen.getByText('MATRIX-LOCATION')).toBeTruthy()
  })
})
