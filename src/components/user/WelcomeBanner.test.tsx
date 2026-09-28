import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { WelcomeBanner } from './WelcomeBanner'

afterEach(() => cleanup())

// WelcomeBanner is fully presentational (no context, no async, no backend).
// These focused tests cover the USR component that the dashboard composes but
// which previously had no dedicated coverage file.

describe('WelcomeBanner (user variant)', () => {
  it('renders a landmark region with an accessible name', () => {
    render(<WelcomeBanner displayName="Arjun Sharma" />)
    expect(screen.getByRole('region', { name: 'Welcome' })).toBeInTheDocument()
  })

  it('extracts the first name from the display name', () => {
    render(<WelcomeBanner displayName="Arjun Sharma" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Arjun' })).toBeInTheDocument()
  })

  it('falls back to "User" when displayName is empty or whitespace', () => {
    const { rerender } = render(<WelcomeBanner displayName="" />)
    expect(screen.getByRole('heading', { level: 2, name: 'User' })).toBeInTheDocument()
    rerender(<WelcomeBanner displayName="   " />)
    expect(screen.getByRole('heading', { level: 2, name: 'User' })).toBeInTheDocument()
  })

  it('renders the user variant label, tagline, heading and subtitle', () => {
    render(<WelcomeBanner displayName="Arjun Sharma" />)
    expect(screen.getByText(/NAMASTE/i)).toBeInTheDocument()
    expect(screen.getByText(/Keep growing everyday/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Learn. Grow. Achieve.' })).toBeInTheDocument()
    expect(screen.getByText(/Ancient wisdom for modern minds/i)).toBeInTheDocument()
  })

  it('decorative hero image is hidden from assistive technology', () => {
    const { container } = render(<WelcomeBanner displayName="Arjun Sharma" />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('educator variant renders the educator copy', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(10)
    render(<WelcomeBanner displayName="Meera Teacher" variant="educator" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Meera' })).toBeInTheDocument()
    expect(screen.getByText(/Good Morning/i)).toBeInTheDocument()
    expect(screen.getByText(/Instructor/i)).toBeInTheDocument()
    expect(screen.getByText(/Create. Assess. Inspire./i)).toBeInTheDocument()
    vi.restoreAllMocks()
  })
})
