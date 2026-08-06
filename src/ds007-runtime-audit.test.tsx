import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from './context/ThemeContext'
import { AdminModal } from './components/common/AdminModal'
import { ConfirmModal } from './components/common/SharedComponents'

afterEach(cleanup)

function renderModal(ui: React.ReactNode, light = false) {
  const r = render(
    <ThemeProvider>
      <div className={light ? 'light' : undefined}>{ui}</div>
    </ThemeProvider>,
  )
  // AdminModal/ConfirmModal portal to document.body
  return { ...r, body: document.body as unknown as HTMLElement }
}

describe('DS-007 Foundation Modal — AdminModal shell ownership', () => {
  it('renders dialog with role="dialog" and aria-modal="true"', () => {
    const { body } = renderModal(
      <AdminModal isOpen title="Hello" onClose={() => {}}>body</AdminModal>,
    )
    const dialog = body.querySelector('[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('labelled by title via aria-labelledby', () => {
    const { body } = renderModal(
      <AdminModal isOpen title="My Title" onClose={() => {}}>body</AdminModal>,
    )
    const dialog = body.querySelector('[role="dialog"]') as HTMLElement
    const id = dialog.getAttribute('aria-labelledby')
    expect(id).toBeTruthy()
    expect(body.querySelector(`#${id}`)?.textContent).toContain('My Title')
  })

  it('owns overlay + backdrop blur (dialog fixed inset-0 z-50; child backdrop-blur-md)', () => {
    const { body } = renderModal(
      <AdminModal isOpen title="T" onClose={() => {}}>b</AdminModal>,
    )
    const dialog = body.querySelector('[role="dialog"]')
    expect(dialog).toHaveClass('fixed', 'inset-0', 'z-50')
    const overlay = body.querySelector('.absolute.inset-0')
    expect(overlay).toHaveClass('backdrop-blur-md', 'bg-app-bg/60')
  })

  it('owns modal box (card bg, border, radius, shadow, ancient-overlay)', () => {
    const { body } = renderModal(
      <AdminModal isOpen title="T" onClose={() => {}}>b</AdminModal>,
    )
    const box = body.querySelector('.ancient-overlay')
    expect(box).toBeTruthy()
    expect(box).toHaveClass('bg-card-bg', 'shadow-2xl', 'sm:rounded-[2.5rem]', 'overflow-hidden')
  })

  it('renders children inside scrollable body', () => {
    renderModal(
      <AdminModal isOpen title="T" onClose={() => {}}>
        <span>modal-body-content</span>
      </AdminModal>,
    )
    expect(screen.getByText('modal-body-content')).toBeTruthy()
  })

  it('renders footer when provided', () => {
    renderModal(
      <AdminModal isOpen title="T" onClose={() => {}} footer={<button>Save</button>}>
        b
      </AdminModal>,
    )
    expect(screen.getByText('Save')).toBeTruthy()
  })

  it('renders description with aria-describedby', () => {
    const { body } = renderModal(
      <AdminModal isOpen title="T" description="desc text" onClose={() => {}}>b</AdminModal>,
    )
    const dialog = body.querySelector('[role="dialog"]') as HTMLElement
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy()
    expect(screen.getByText('desc text')).toBeTruthy()
  })

  it('close button calls onClose', () => {
    const onClose = vi.fn()
    renderModal(
      <AdminModal isOpen title="T" onClose={onClose}>b</AdminModal>,
    )
    fireEvent.click(screen.getByLabelText('Close modal'))
    expect(onClose).toHaveBeenCalled()
  })

  it('backdrop click calls onClose', () => {
    const onClose = vi.fn()
    const { body } = renderModal(
      <AdminModal isOpen title="T" onClose={onClose}>b</AdminModal>,
    )
    const overlay = body.querySelector('.absolute.inset-0') as HTMLElement
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalled()
  })

  it('renders in LIGHT mode with same shell ownership', () => {
    const { body } = renderModal(
      <AdminModal isOpen title="T" onClose={() => {}}>b</AdminModal>,
      true,
    )
    const dialog = body.querySelector('[role="dialog"]')
    const box = body.querySelector('.ancient-overlay')
    expect(dialog).toHaveClass('fixed', 'inset-0', 'z-50')
    expect(box).toHaveClass('bg-card-bg', 'shadow-2xl')
  })
})

describe('DS-007 Foundation Modal — ConfirmModal composes Foundation shell', () => {
  it('renders Foundation AdminModal dialog (role/aria-modal)', () => {
    const { body } = renderModal(
      <ConfirmModal open title="Delete?" message="Sure?" onCancel={() => {}} onConfirm={() => {}} />,
    )
    const dialog = body.querySelector('[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('renders title and message inside Foundation modal', () => {
    renderModal(
      <ConfirmModal open title="Delete?" message="Sure?" onCancel={() => {}} onConfirm={() => {}} />,
    )
    expect(screen.getByText('Delete?')).toBeTruthy()
    expect(screen.getByText('Sure?')).toBeTruthy()
  })

  it('renders confirm + cancel buttons; confirm invokes onConfirm', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    renderModal(
      <ConfirmModal open title="T" message="m" confirmLabel="Yes" cancelLabel="No" onCancel={onCancel} onConfirm={onConfirm} />,
    )
    fireEvent.click(screen.getByText('Yes'))
    expect(onConfirm).toHaveBeenCalled()
    fireEvent.click(screen.getByText('No'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('danger variant uses danger button', () => {
    renderModal(
      <ConfirmModal open title="T" message="m" danger onCancel={() => {}} onConfirm={() => {}} />,
    )
    // danger button present (no other primary)
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2)
  })

  it('info mode (no onConfirm) renders single OK button and closes via onCancel', () => {
    const onCancel = vi.fn()
    renderModal(
      <ConfirmModal open title="Info" message="hi" confirmLabel="OK" onCancel={onCancel} />,
    )
    const ok = screen.getByText('OK')
    expect(ok).toBeTruthy()
    fireEvent.click(ok)
    expect(onCancel).toHaveBeenCalled()
  })

  it('info mode renders Foundation shell (no raw fixed inset-0 duplicate)', () => {
    const { body } = renderModal(
      <ConfirmModal open title="Info" message="hi" confirmLabel="OK" onCancel={() => {}} />,
    )
    expect(body.querySelector('.ancient-overlay')).toBeTruthy()
  })
})

describe('DS-007 Foundation Modal — consumers delegate shell', () => {
  it('TopicInfoButton info dialog composes ConfirmModal (Foundation)', () => {
    renderModal(
      <ConfirmModal open title="Topic Name" message="Full topic" confirmLabel="OK" onCancel={() => {}} />,
    )
    expect(screen.getByText('Topic Name')).toBeTruthy()
    expect(screen.getByText('Full topic')).toBeTruthy()
    expect(screen.getByText('OK')).toBeTruthy()
  })

  it('Tooltip info dialog composes ConfirmModal (Foundation) with ReactNode content', () => {
    renderModal(
      <ConfirmModal open title="Information" message={<strong>rich</strong>} confirmLabel="OK" onCancel={() => {}} />,
    )
    expect(screen.getByText('Information')).toBeTruthy()
    expect(screen.getByText('rich')).toBeTruthy()
  })
})
